import { db } from "@db";
import { eq, desc, and, gte } from "drizzle-orm";
import { users, researchPreferences, researchSchedules, researchResults, alertConfig, alertHistory } from "@db/schema.js";
import { generateContent } from '../config/anthropic.js';
import { 
  getMarketData, 
  searchFinancialInfo, 
  performDeepResearch, 
  getFinancialNews 
} from '../mcp/sentinel-mcp.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Define the structure for research result data
export interface ResearchResult {
  type: "insight" | "alert" | "digest" | "report";
  title: string;
  summary: string;
  content: any; // Detailed findings
  sources: {
    url?: string | null;
    title?: string;
    author?: string;
    publishedAt?: string;
  }[];
  analysisMetadata?: {
    sentimentScore?: number;
    confidence?: number;
    impactEstimate?: string;
    relatedAssets?: string[];
  };
}

export class SentinelAgent {
  private containerName = 'sentinel-env-container';
  private isEnvironmentEnsured = false;
  private hostSharedDir: string;

  constructor() {
    console.log("SentinelAgent initialized");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.hostSharedDir = path.resolve(__dirname, '../../../sentinel-shared');
    if (!fs.existsSync(this.hostSharedDir)) {
      console.log(`[SentinelAgent] Creating shared directory: ${this.hostSharedDir}`);
      fs.mkdirSync(this.hostSharedDir, { recursive: true });
    }
  }

  /**
   * Checks if the Docker container exists and is running, starts it if not.
   */
  private async _ensureEnvironmentRunning(): Promise<void> {
    if (this.isEnvironmentEnsured) {
      return;
    }

    console.log(`[SentinelAgent] Ensuring environment container '${this.containerName}' is running...`);
    const containerSharedDir = '/app/shared';

    try {
      const { stdout: runningContainer } = await execAsync(`docker ps -q -f name=^/${this.containerName}$`);
      if (runningContainer.trim()) {
        console.log(`[SentinelAgent] Container '${this.containerName}' is already running.`);
        this.isEnvironmentEnsured = true;
        return;
      }

      const { stdout: stoppedContainer } = await execAsync(`docker ps -aq -f status=exited -f name=^/${this.containerName}$`);
      if (stoppedContainer.trim()) {
        console.warn(`[SentinelAgent] Found existing stopped container '${this.containerName}'. Removing and recreating to ensure correct volume/port setup.`);
        await execAsync(`docker rm ${this.containerName}`);
      }

      console.log(`[SentinelAgent] Creating and starting new container '${this.containerName}' with volume mount and VNC port mapping...`);
      const volumeMount = `-v "${this.hostSharedDir}":"${containerSharedDir}"`;
      const portMapping = `-p 127.0.0.1:6080:6080`; // Map host 6080 to container 6080 (websockify)
      const dockerRunCommand = `docker run -d --name ${this.containerName} ${volumeMount} ${portMapping} -t sentinel-env:latest`;
      console.log(`[SentinelAgent] Executing: ${dockerRunCommand}`);
      await execAsync(dockerRunCommand);
      console.log(`[SentinelAgent] Container '${this.containerName}' started with shared volume and port mapping.`);
      this.isEnvironmentEnsured = true;

    } catch (error) {
      const err = error as Error;
      console.error(`[SentinelAgent] Error ensuring environment container '${this.containerName}' is running: ${err.message}`);
      if (err.message.includes('invalid volume specification')) {
         console.error(`[SentinelAgent] Possible issue with volume path: Host='${this.hostSharedDir}', Container='${containerSharedDir}'. Ensure host path exists and permissions are correct.`);
      }
      throw new Error(`Failed to ensure Docker environment is running: ${err.message}`);
    }
  }

  /**
   * Executes a command inside the persistent Sentinel Docker environment, streaming output.
   * @param command The shell command to execute inside the container.
   * @param onData Optional callback to receive stdout/stderr chunks.
   * @returns A Promise resolving with the exit code when the command completes.
   */
  public executeInEnvironment(
    command: string,
    onData?: (chunk: string, streamType: 'stdout' | 'stderr') => void
  ): Promise<{ exitCode: number | null }> {
    return new Promise(async (resolve, reject) => {
      await this._ensureEnvironmentRunning(); // Ensure container is running first

      console.log(`[SentinelAgent] Spawning in environment '${this.containerName}': ${command}`);
      // Command for spawn: docker exec <containerName> bash -c "<command>"
      // NOTE: The actual command executed by bash -c needs careful quoting if it contains special chars.
      // For simplicity, we assume the passed `command` is ready for bash -c for now.
      const dockerProcess = spawn('docker', ['exec', this.containerName, 'bash', '-c', command], {
          shell: false, // Important: Let spawn handle args, don't run in another shell
          stdio: ['pipe', 'pipe', 'pipe'] // Pipe stdin, stdout, stderr
      });

      dockerProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        // console.log(`[SentinelAgent] stdout: ${chunk}`); // Optional: Log chunks
        if (onData) {
          onData(chunk, 'stdout');
        }
      });

      dockerProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        // console.warn(`[SentinelAgent] stderr: ${chunk}`); // Optional: Log chunks
        if (onData) {
          onData(chunk, 'stderr');
        }
      });

      dockerProcess.on('error', (error) => {
        console.error(`[SentinelAgent] Spawn error executing command: ${error.message}`);
        reject(new Error(`Failed to spawn command in environment: ${error.message}`));
      });

      dockerProcess.on('close', (code) => {
        console.log(`[SentinelAgent] Command exited with code ${code}`);
        if (code === 0) {
          resolve({ exitCode: code });
        } else {
          // Reject on non-zero exit code, providing the code
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Stops and removes the environment container (useful for cleanup).
   */
  public async stopAndRemoveEnvironment(): Promise<void> {
    console.log(`[SentinelAgent] Stopping and removing container '${this.containerName}'...`);
    try {
      await execAsync(`docker stop -t 10 ${this.containerName}`);
      console.log(`[SentinelAgent] Container '${this.containerName}' stopped.`);
      await execAsync(`docker rm ${this.containerName}`);
      console.log(`[SentinelAgent] Container '${this.containerName}' removed.`);
      this.isEnvironmentEnsured = false;
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('No such container')) {
        console.log(`[SentinelAgent] Container '${this.containerName}' not found or already removed.`);
        this.isEnvironmentEnsured = false;
      } else {
        console.error(`[SentinelAgent] Error stopping/removing container '${this.containerName}': ${err.message}`);
      }
    }
  }

  /**
   * Get a user's research preferences
   */
  async getUserPreferences(userId: number) {
    try {
      const userPreferences = await db.query.researchPreferences.findMany({
        where: and(
          eq(researchPreferences.userId, userId),
          eq(researchPreferences.isActive, true)
        ),
        orderBy: [desc(researchPreferences.createdAt)]
      });
      
      return userPreferences;
    } catch (error) {
      console.error(`[SentinelAgent] Error fetching user preferences for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a user's research preferences
   */
  async updateUserPreferences(userId: number, preferenceData: any) {
    try {
      // If updating an existing preference
      if (preferenceData.id) {
        const [updatedPreference] = await db
          .update(researchPreferences)
          .set({
            ...preferenceData,
            updatedAt: new Date()
          })
          .where(and(
            eq(researchPreferences.id, preferenceData.id),
            eq(researchPreferences.userId, userId)
          ))
          .returning();
        
        return updatedPreference;
      } 
      // Creating a new preference
      else {
        const [newPreference] = await db
          .insert(researchPreferences)
          .values({
            userId,
            ...preferenceData,
            isActive: true,
          })
          .returning();
        
        return newPreference;
      }
    } catch (error) {
      console.error(`[SentinelAgent] Error updating user preferences for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule research tasks for a user
   */
  async scheduleResearch(userId: number, preferenceId: number, scheduleData: any) {
    try {
      // Validate that the preference exists and belongs to the user
      const preference = await db.query.researchPreferences.findFirst({
        where: and(
          eq(researchPreferences.id, preferenceId),
          eq(researchPreferences.userId, userId)
        )
      });

      if (!preference) {
        throw new Error("Research preference not found or does not belong to the user");
      }

      // If updating an existing schedule
      if (scheduleData.id) {
        const [updatedSchedule] = await db
          .update(researchSchedules)
          .set({
            ...scheduleData,
            updatedAt: new Date(),
            // Calculate nextRun based on schedule type if needed
            nextRun: this.calculateNextRun(scheduleData)
          })
          .where(and(
            eq(researchSchedules.id, scheduleData.id),
            eq(researchSchedules.userId, userId)
          ))
          .returning();
        
        return updatedSchedule;
      } 
      // Creating a new schedule
      else {
        const [newSchedule] = await db
          .insert(researchSchedules)
          .values({
            userId,
            preferenceId,
            ...scheduleData,
            isActive: true,
            nextRun: this.calculateNextRun(scheduleData)
          })
          .returning();
        
        return newSchedule;
      }
    } catch (error) {
      console.error(`[SentinelAgent] Error scheduling research for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate the next run time based on schedule type
   */
  private calculateNextRun(scheduleData: any): Date | null {
    const now = new Date();
    let nextRun: Date | null = new Date();

    switch (scheduleData.scheduleType) {
      case "hourly":
        nextRun.setHours(now.getHours() + 1);
        break;
      case "daily":
        nextRun.setDate(now.getDate() + 1);
        // Default to 9am if not specified
        nextRun.setHours(9, 0, 0, 0);
        break;
      case "weekly":
        nextRun.setDate(now.getDate() + 7);
        // Default to Monday 9am if not specified
        nextRun.setHours(9, 0, 0, 0);
        break;
      case "event_based":
        // For event-based, we don't set a specific time
        nextRun = null;
        break;
      case "custom":
        // For custom, we would need a cron parser library
        // This is simplified for now
        nextRun.setDate(now.getDate() + 1);
        break;
      default:
        // Default to 24 hours later
        nextRun.setHours(now.getHours() + 24);
    }

    return nextRun instanceof Date ? nextRun : null;
  }

  /**
   * Perform research based on user preferences
   */
  async performResearch(userId: number, preferenceId: number): Promise<ResearchResult[]> {
    try {
      console.log(`[SentinelAgent] Performing research for userId ${userId}, preferenceId ${preferenceId}`);

      // Get the research preference
      const preference = await db.query.researchPreferences.findFirst({
        where: and(
          eq(researchPreferences.id, preferenceId),
          eq(researchPreferences.userId, userId)
        )
      });

      if (!preference) {
        throw new Error("Research preference not found or does not belong to the user");
      }

      // 1. Gather data from various sources based on preferences
      const researchData = await this.gatherResearchData(preference);

      // --- Execute Analysis Script in Environment via Shared Volume ---
      if (researchData.newsArticles && researchData.newsArticles.length > 0) {
        console.log(`[SentinelAgent] Running analysis script in environment via shared volume...`);
        const inputFileName = `input-${Date.now()}.json`;
        const outputFileName = `output-${Date.now()}.json`;
        const inputFilePathHost = path.join(this.hostSharedDir, inputFileName);
        const outputFilePathHost = path.join(this.hostSharedDir, outputFileName);
        const inputFilePathContainer = `/app/shared/${inputFileName}`;
        const outputFilePathContainer = `/app/shared/${outputFileName}`;

        try {
          // a) Write input data to shared host directory
          fs.writeFileSync(inputFilePathHost, JSON.stringify(researchData.newsArticles, null, 2));
          console.log(`[SentinelAgent] Wrote input to ${inputFilePathHost}`);

          // b) Define command to run the actual Python script inside the container
          const scriptPathContainer = '/app/shared/scripts/analyze_news.py';
          const scriptCommand = `python3 ${scriptPathContainer} ${inputFilePathContainer} ${outputFilePathContainer}`;

          // c) Execute the command in the environment
          console.log(`[SentinelAgent] Executing script command in container: ${scriptCommand}`);
          const { exitCode } = await this.executeInEnvironment(scriptCommand /*, onDataCallback */);
          console.log(`[SentinelAgent] Script execution finished with code ${exitCode}.`);

          // d) Read the output file (only if exit code was 0)
          if (exitCode === 0 && fs.existsSync(outputFilePathHost)) {
            const analysisOutputRaw = fs.readFileSync(outputFilePathHost, 'utf8');
            const analysisOutput = JSON.parse(analysisOutputRaw);
            console.log(`[SentinelAgent] Read analysis output from ${outputFilePathHost}:`, analysisOutput);
            researchData.customAnalysis = analysisOutput;
          } else if (exitCode !== 0) {
            console.error(`[SentinelAgent] Script execution failed with exit code ${exitCode}. Cannot read output.`);
            // Optionally read error output if the script produced one
            if (fs.existsSync(outputFilePathHost)) {
              try {
                  const errorOutputRaw = fs.readFileSync(outputFilePathHost, 'utf8');
                  const errorOutput = JSON.parse(errorOutputRaw);
                  console.error(`[SentinelAgent] Script error output from file:`, errorOutput);
              } catch (e) { /* Ignore if output file is not valid error JSON */ }
            }
          } else {
            console.warn(`[SentinelAgent] Analysis output file not found: ${outputFilePathHost}`);
          }
        } catch (scriptError) {
          console.error(`[SentinelAgent] Error during script execution:`, scriptError);
        } finally {
          // e) Clean up temporary files from host shared directory
          try {
            if (fs.existsSync(inputFilePathHost)) fs.unlinkSync(inputFilePathHost);
            if (fs.existsSync(outputFilePathHost)) fs.unlinkSync(outputFilePathHost);
            console.log(`[SentinelAgent] Cleaned up temporary files: ${inputFileName}, ${outputFileName}`);
          } catch (cleanupError) {
            console.warn(`[SentinelAgent] Error cleaning up temporary files:`, cleanupError);
          }
        }
      }
      // --- End Script Execution Example ---

      // 2. Use AI to analyze the data (now potentially including customAnalysis)
      const analysisResults = await this.analyzeData(preference, researchData);

      // 3. Store the results
      const savedResults = await this.storeResults(userId, preferenceId, analysisResults);

      // 4. Check if any alerts should be triggered
      await this.checkAlertConditions(userId, preferenceId, analysisResults);

      return analysisResults;
    } catch (error) {
      console.error(`[SentinelAgent] Error performing research for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gather research data from various sources
   */
  private async gatherResearchData(preference: any): Promise<any> { // Return type should be more specific
    console.log(`[SentinelAgent] Gathering research data for topics: ${preference.topics}`);

    type NewsArticle = { title: string; content?: string; source?: string; url?: string; publishedAt?: string };
    type WebSearchResult = { title: string; url?: string; snippet?: string };

    // Define a more specific type for the return value
    interface ResearchDataBundle {
        newsArticles: NewsArticle[];
        marketData: any; 
        webSearchResults: WebSearchResult[];
        deepResearchFindings: any; 
        sentimentAnalysis: any; 
        customAnalysis?: any; // Include the optional custom analysis field
    }

    const researchData: ResearchDataBundle = {
      newsArticles: [],
      marketData: { indices: {}, trending: [], stocks: {} },
      webSearchResults: [],
      deepResearchFindings: {},
      sentimentAnalysis: {}
      // customAnalysis is initially undefined
    };

    try {
      const [marketData, newsArticles, webSearchResults, deepResearchFindings] = await Promise.allSettled([
        preference.dataSources?.marketData ?
          getMarketData(preference.specificAssets?.tickers || []) :
          Promise.resolve({ indices: {}, trending: [], stocks: {} }),

        preference.dataSources?.newsApis ?
          getFinancialNews(preference.topics || [], preference.keywords || []) :
          Promise.resolve([] as NewsArticle[]),

        searchFinancialInfo(
          `${preference.topics?.join(' ')} ${preference.keywords?.join(' ')}`.trim()
        ),

        performDeepResearch(
          preference.topics || [],
          preference.keywords || []
        )
      ]);

      if (marketData.status === 'fulfilled' && marketData.value) {
        researchData.marketData = marketData.value;
      }

      if (newsArticles.status === 'fulfilled' && newsArticles.value) {
        researchData.newsArticles = newsArticles.value as NewsArticle[];
      }

      if (webSearchResults.status === 'fulfilled' && webSearchResults.value) {
        researchData.webSearchResults = webSearchResults.value as WebSearchResult[];
      }

      if (deepResearchFindings.status === 'fulfilled' && deepResearchFindings.value) {
        researchData.deepResearchFindings = deepResearchFindings.value;
      }

      if (preference.analysisTypes?.sentiment) {
        researchData.sentimentAnalysis = await this.analyzeSentiment(preference);
      }

      return researchData;
    } catch (error) {
      console.error("[SentinelAgent] Error gathering research data:", error);
      // Return minimal data matching the ResearchDataBundle type
      const fallbackData: ResearchDataBundle = {
        newsArticles: [{
          title: "Sample financial news",
          content: "This is a sample financial news article.",
          source: "Financial Times",
          url: "https://example.com/article1",
          publishedAt: new Date().toISOString()
        }],
        marketData: {
          indices: { "S&P500": 4200.00, "NASDAQ": 14500.00 },
          trending: ["AAPL", "MSFT", "GOOGL"],
          stocks: {}
        },
        webSearchResults: [],
        deepResearchFindings: {},
        sentimentAnalysis: {}
      };
      return fallbackData;
    }
  }

  // Mock sentiment analysis implementation
  private async analyzeSentiment(preference: any): Promise<Record<string, any>> {
    // In a real implementation, this would call a sentiment analysis service
    return {
      marketSentiment: (Math.random() * 2 - 1).toFixed(2), // -1.0 to 1.0
      newsSentiment: (Math.random() * 2 - 1).toFixed(2),
      topicSentiment: preference.topics?.reduce((acc: Record<string, string>, topic: string) => {
        acc[topic] = (Math.random() * 2 - 1).toFixed(2);
        return acc;
      }, {})
    };
  }

  /**
   * Analyze the gathered data using AI
   */
  private async analyzeData(preference: any, data: any): Promise<ResearchResult[]> { // data type should be ResearchDataBundle
    console.log(`[SentinelAgent] Analyzing research data for preference: ${preference.id}`);

    try {
      // Format the data including any custom analysis
      const formattedData = JSON.stringify(data, null, 2);
      const topics = preference.topics ? preference.topics.join(", ") : 'general finance topics';
      const keywords = preference.keywords ? preference.keywords.join(", ") : '';

      // Update prompt if customAnalysis exists
      let customAnalysisSection = '';
      if (data.customAnalysis) {
        customAnalysisSection = `\n\nCUSTOM SCRIPT ANALYSIS:\n${JSON.stringify(data.customAnalysis, null, 2)}`;
      }


      const prompt = `
You are ARIA (Autonomous Research Intelligence Agent), a financial research expert. Analyze the financial data and generate insights.

RESEARCH PREFERENCES:
- Topics: ${topics}
- Keywords: ${keywords}

DATA TO ANALYZE:
${formattedData}${customAnalysisSection}

Generate 2 research insights based on this data. Format each insight as JSON with these fields:
{
  "type": "insight",
  "title": "Clear, concise title",
  "summary": "Brief summary (1-2 sentences)",
  "content": {
    "analysis": "Key findings and analysis (incorporate custom script analysis if provided)",
    "implications": "Financial implications",
    "recommendations": "Action recommendations"
  },
  "sources": [{"title": "Source name", "url": "URL (could be from data or custom script)"}],
  "analysisMetadata": {
    "sentimentScore": 0.7, // -1.0 to 1.0
    "confidence": 0.85, // 0.0 to 1.0
    "impactEstimate": "Description of impact",
    "relatedAssets": ["Asset1", "Asset2"]
  }
}

Return valid JSON only, wrapped in an array: [insight1, insight2]`;

      const responseText = await generateContent(prompt);
      
      try {
        // More robust JSON extraction and parsing
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.warn("[SentinelAgent] Could not find JSON array in response");
          return this.generateFallbackResults();
        }
        
        const jsonText = jsonMatch[0];
        
        // Try to parse the JSON, with backup plan
        try {
          const results = JSON.parse(jsonText);
          
          // Validate that it's an array with the right structure
          if (Array.isArray(results) && results.length > 0) {
            return results;
          } else {
            console.warn("[SentinelAgent] Parsed JSON is not an array or is empty");
            return this.generateFallbackResults();
          }
        } catch (jsonError) {
          console.error("[SentinelAgent] Error parsing extracted JSON:", jsonError);
          return this.generateFallbackResults();
        }
      } catch (parseError) {
        console.error("[SentinelAgent] Error parsing AI response:", parseError);
        console.log("Raw AI response:", responseText);
        
        return this.generateFallbackResults();
      }
    } catch (error) {
      console.error("[SentinelAgent] Error in AI analysis:", error);
      return this.generateFallbackResults();
    }
  }

  /**
   * Store research results in the database
   */
  private async storeResults(userId: number, preferenceId: number, results: ResearchResult[]): Promise<any[]> {
    console.log(`[SentinelAgent] Storing ${results.length} research results for userId ${userId}`);
    
    try {
      const savedResults = [];
      
      for (const result of results) {
        // Map sources to ensure URL is string | undefined (convert null to undefined)
        const cleanedSources = result.sources?.map(source => ({
          ...source,
          url: source.url === null ? undefined : source.url,
        })) || []; // Default to empty array if sources is null/undefined

        const [savedResult] = await db
          .insert(researchResults)
          .values({
            userId,
            preferenceId,
            resultType: result.type,
            title: result.title,
            summary: result.summary,
            content: result.content,
            sources: cleanedSources, // Use the cleaned sources
            analysisMetadata: result.analysisMetadata,
            isRead: false,
            isSaved: false,
            relevantDate: new Date()
          })
          .returning();
        
        savedResults.push(savedResult);
      }
      
      return savedResults;
    } catch (error) {
      console.error(`[SentinelAgent] Error storing research results for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if any alert conditions are met and create alerts if needed
   */
  private async checkAlertConditions(userId: number, preferenceId: number, results: ResearchResult[]): Promise<void> {
    console.log(`[SentinelAgent] Checking alert conditions for userId ${userId}`);
    
    try {
      // Get all alert configurations for this user and preference
      const alertConfigs = await db.query.alertConfig.findMany({
        where: and(
          eq(alertConfig.userId, userId),
          eq(alertConfig.preferenceId, preferenceId),
          eq(alertConfig.isActive, true)
        )
      });
      
      if (!alertConfigs || alertConfigs.length === 0) {
        console.log(`[SentinelAgent] No alert configurations found for userId ${userId}, preferenceId ${preferenceId}`);
        return;
      }
      
      // Check each result against all alert configurations
      for (const result of results) {
        for (const config of alertConfigs) {
          const shouldAlert = this.evaluateAlertConditions(result, config);
          
          if (shouldAlert) {
            // Get the DB ID of the stored result
            const storedResult = await db.query.researchResults.findFirst({
              where: and(
                eq(researchResults.userId, userId),
                eq(researchResults.title, result.title)
              ),
              orderBy: [desc(researchResults.createdAt)]
            });
            
            if (!storedResult) {
              console.warn(`[SentinelAgent] Could not find stored result for alert: ${result.title}`);
              continue;
            }
            
            // Create the alert
            await db
              .insert(alertHistory)
              .values({
                userId,
                configId: config.id,
                resultId: storedResult.id,
                alertType: this.determineAlertType(result, config),
                message: `${result.title}: ${result.summary}`,
                deliveredVia: ["inApp"], // Start with in-app, could expand to email, SMS
                isRead: false,
                isActioned: false
              });
            
            console.log(`[SentinelAgent] Created alert for userId ${userId}, result "${result.title}"`);
          }
        }
      }
    } catch (error) {
      console.error(`[SentinelAgent] Error checking alert conditions for userId ${userId}:`, error);
    }
  }

  /**
   * Evaluate if a result should trigger an alert based on configuration
   */
  private evaluateAlertConditions(result: ResearchResult, config: any): boolean {
    // If no conditions set, don't alert
    if (!config.conditions) return false;
    
    const metadata = result.analysisMetadata || {};
    const conditions = config.conditions;
    
    // Check sentiment threshold
    if (conditions.sentimentThreshold && metadata.sentimentScore) {
      // For negative threshold, alert if sentiment is below threshold
      if (conditions.sentimentThreshold < 0 && metadata.sentimentScore <= conditions.sentimentThreshold) {
        return true;
      }
      // For positive threshold, alert if sentiment is above threshold
      if (conditions.sentimentThreshold > 0 && metadata.sentimentScore >= conditions.sentimentThreshold) {
        return true;
      }
    }
    
    // Check for keyword occurrence
    if (conditions.keywordOccurrence && conditions.keywordOccurrence.length > 0) {
      const content = JSON.stringify(result).toLowerCase();
      for (const keyword of conditions.keywordOccurrence) {
        if (content.includes(keyword.toLowerCase())) {
          return true;
        }
      }
    }
    
    // Check for specific events
    if (conditions.specificEvents && conditions.specificEvents.length > 0) {
      const content = JSON.stringify(result).toLowerCase();
      for (const event of conditions.specificEvents) {
        if (content.includes(event.toLowerCase())) {
          return true;
        }
      }
    }
    
    // No conditions were met
    return false;
  }

  /**
   * Determine the type of alert based on what condition triggered it
   */
  private determineAlertType(result: ResearchResult, config: any): string {
    // This is a simplified implementation
    const metadata = result.analysisMetadata || {};
    const conditions = config.conditions || {};
    
    if (metadata.sentimentScore && conditions.sentimentThreshold) {
      return "sentiment";
    }
    
    if (result.content && typeof result.content === 'object' && result.content.analysis) {
      const analysisText = result.content.analysis.toLowerCase();
      if (analysisText.includes("price") || analysisText.includes("valuation")) {
        return "price";
      }
      if (analysisText.includes("volume") || analysisText.includes("trading")) {
        return "volume";
      }
    }
    
    // Default alert type
    return "event";
  }

  /**
   * Generate fallback results when AI analysis fails
   */
  private generateFallbackResults(): ResearchResult[] {
    return [{
      type: "insight",
      title: "Market Analysis Summary",
      summary: "This is a generated summary of recent market activity based on basic data analysis.",
      content: {
        analysis: "Our system was able to collect some basic market data, but detailed AI analysis is currently unavailable. The collected data shows general market trends that may be worth investigating further.",
        implications: "Without detailed analysis, specific implications cannot be determined at this time.",
        recommendations: "Consider reviewing the raw data directly or try again later for AI-enhanced insights."
      },
      sources: [{
        title: "Internal data collection system",
        url: undefined,
        author: "Fintellect Sentinel",
        publishedAt: new Date().toISOString()
      }],
      analysisMetadata: {
        sentimentScore: 0,
        confidence: 0.5,
        impactEstimate: "Unknown - insufficient data for accurate impact assessment",
        relatedAssets: ["General Market"]
      }
    }];
  }

  /**
   * Get recent research results for a user
   */
  async getRecentResults(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const results = await db.query.researchResults.findMany({
        where: eq(researchResults.userId, userId),
        orderBy: [desc(researchResults.createdAt)],
        limit
      });
      
      return results;
    } catch (error) {
      console.error(`[SentinelAgent] Error fetching recent results for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get recent alerts for a user
   */
  async getRecentAlerts(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const alerts = await db.query.alertHistory.findMany({
        where: eq(alertHistory.userId, userId),
        orderBy: [desc(alertHistory.createdAt)],
        limit
      });
      
      return alerts;
    } catch (error) {
      console.error(`[SentinelAgent] Error fetching recent alerts for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mark a research result as read
   */
  async markResultAsRead(userId: number, resultId: number): Promise<any> {
    try {
      const [updatedResult] = await db
        .update(researchResults)
        .set({ isRead: true })
        .where(and(
          eq(researchResults.id, resultId),
          eq(researchResults.userId, userId)
        ))
        .returning();
      
      return updatedResult;
    } catch (error) {
      console.error(`[SentinelAgent] Error marking result as read for userId ${userId}, resultId ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Mark an alert as read
   */
  async markAlertAsRead(userId: number, alertId: number): Promise<any> {
    try {
      const [updatedAlert] = await db
        .update(alertHistory)
        .set({ isRead: true })
        .where(and(
          eq(alertHistory.id, alertId),
          eq(alertHistory.userId, userId)
        ))
        .returning();
      
      return updatedAlert;
    } catch (error) {
      console.error(`[SentinelAgent] Error marking alert as read for userId ${userId}, alertId ${alertId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const sentinelAgent = new SentinelAgent(); 