// server/services/ai/agents/SentinelAgent.ts
import { db } from "@db";
import { eq, desc, and } from "drizzle-orm";
import { users } from "@db/schema.js";
import {
  researchPreferences,
  researchSchedules,
  researchResults,
  alertConfig,
  alertHistory,
  SelectResearchPreference
} from "@db/sentinel-schema.js";
// Removed generateContent import as it was E2B specific
// MCP functions are kept in case they are used independently or by OpenManus tools indirectly
import {
  getMarketData,
  searchFinancialInfo,
  performDeepResearch,
  getFinancialNews
} from '../mcp/sentinel-mcp.js';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
// --- E2B Imports Removed ---

// Import the new OpenManus Connector AND the event type
import { OpenManusConnector, OpenManusEventHandler, OpenManusEvent } from '../connectors/OpenManusConnector.js'; // Adjust path if needed
// Placeholder: Import your chosen lightweight LLM client here if needed later
// import { YourLLMClient, SummarizationInput } from 'your-llm-library';

// --- ADDED: Import Anthropic SDK ---
import Anthropic from '@anthropic-ai/sdk';
// ------------------------------------

const log = (message: string, ...args: any[]) => console.log(`[SentinelAgent] ${message}`, ...args);

// --- Interfaces ---
// Added optional id field
export interface ResearchResult {
    id?: number; // Added optional ID, will be present after storing
    type: "insight" | "alert" | "digest" | "report";
    title: string;
    summary: string;
    content: any;
    sources: { url?: string | null; title?: string; author?: string; publishedAt?: string }[];
    analysisMetadata?: { sentimentScore?: number; confidence?: number; impactEstimate?: string; relatedAssets?: string[] };
}
// Type alias for clarity
type AnalyzablePreference = SelectResearchPreference;
// --- End Interfaces ---

export class SentinelAgent {
  private wss: WebSocketServer | null = null;
  // --- E2B Sandbox Workdir Removed ---

  // OpenManus Connector instance
  private openManusConnector: OpenManusConnector | null = null;
  // Flag to check if agent is usable based on config
  private isConfigured: boolean = false;
  // Placeholder: Instantiate LLM client if needed
  // private llmClient = new YourLLMClient({ apiKey: process.env.YOUR_LLM_API_KEY });
  private llmConfigured: boolean = false; // Flag to check if LLM is setup

  // --- ADDED: Anthropic Client ---
  private anthropic: Anthropic | null = null;
  // ----------------------------- 

  constructor(wssInstance?: WebSocketServer) {
    log("Initializing SentinelAgent (OpenManus Mode)...");
    if (wssInstance) this.wss = wssInstance;

    // Check environment variables for OpenManus configuration
    const openManusUrl = process.env.OPENMANUS_URL;

    if (openManusUrl) {
        log(`OpenManus mode enabled. Connecting to: ${openManusUrl}`);
        this.openManusConnector = new OpenManusConnector(openManusUrl);
        // Set up event handling from the connector
        this.setupOpenManusEventHandler();
        this.isConfigured = true; // Mark as configured
    } else {
        log("ERROR: OPENMANUS_URL is not set. SentinelAgent research functionality will be disabled.");
        this.isConfigured = false;
    }

    // --- Initialize Anthropic Client ---
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicApiKey) {
        this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
        this.llmConfigured = true;
        log("Anthropic API Key found, enabling AI summarization features.");
    } else {
         this.llmConfigured = false;
         log("ANTHROPIC_API_KEY not found, AI summarization features disabled.");
    }
    // ---------------------------------

    log("SentinelAgent initialized.");
  }

  public setWebSocketServer(wssInstance: WebSocketServer): void {
    this.wss = wssInstance;
    log("WebSocketServer instance set.");
  }

  // --- DB Methods ---
  async getUserPreferences(userId: number): Promise<SelectResearchPreference[]> {
      log(`Fetching preferences for user ${userId}`);
      try {
          return await db.query.researchPreferences.findMany({
              where: eq(researchPreferences.userId, userId),
              orderBy: desc(researchPreferences.updatedAt),
          });
      } catch (error) {
          log("Error fetching preferences:", error);
          return [];
      }
  }

  async updateUserPreferences(userId: number, prefData: Partial<SelectResearchPreference>): Promise<SelectResearchPreference | null> {
      log(`Updating preference ${prefData.id || 'new'} for user ${userId}`);
      try {
          if (prefData.id) {
              // Update existing preference
              const updated = await db.update(researchPreferences)
                  .set({ ...prefData, updatedAt: new Date() })
                  .where(and(eq(researchPreferences.id, prefData.id), eq(researchPreferences.userId, userId)))
                  .returning();
              return updated[0] || null;
          } else {
              // Create new preference
              // Ensure userId is included, handle potential type mismatches if necessary
              const created = await db.insert(researchPreferences)
                  .values({ ...prefData, userId } as any) // Using 'as any' for flexibility, refine type if needed
                  .returning();
              return created[0] || null;
          }
      } catch (error) {
          log("Error updating/creating preference:", error);
          return null;
      }
  }

  async getRecentResults(userId: number, limit: number = 10): Promise<ResearchResult[]> {
      log(`Fetching last ${limit} results for user ${userId}`);
      try {
          const resultsFromDb = await db.select()
              .from(researchResults)
              .where(eq(researchResults.userId, userId))
              .orderBy(desc(researchResults.createdAt))
              .limit(limit);

          // Map DB results to the ResearchResult interface
          return resultsFromDb.map(r => ({
              id: r.id,
              type: r.resultType as ResearchResult['type'], // Assert type
              userId: r.userId,
              preferenceId: r.preferenceId,
              scheduleId: r.scheduleId ?? undefined,
              title: r.title,
              summary: r.summary,
              content: r.content,
              sources: r.sources?.map(s => ({
                  url: s.url ?? null, // Handle potential null URL
                  title: s.title,
                  author: s.author,
                  publishedAt: s.publishedAt
              })) ?? [], // Default to empty array if sources is null/undefined
              analysisMetadata: r.analysisMetadata ?? undefined,
              isRead: r.isRead,
              isSaved: r.isSaved,
              createdAt: r.createdAt.toISOString(), // Format date as ISO string
              relevantDate: r.relevantDate.toISOString(),
          }));
      } catch (error) {
          log("Error fetching recent results:", error);
          return [];
      }
  }

  async getRecentAlerts(userId: number, limit: number = 10): Promise<any[]> { // Replace 'any' with specific Alert type if defined
       log(`Fetching last ${limit} alerts for user ${userId}`);
       try {
           return await db.select()
               .from(alertHistory)
               .where(eq(alertHistory.userId, userId))
               .orderBy(desc(alertHistory.createdAt))
               .limit(limit);
       } catch (error) {
           log("Error fetching recent alerts:", error);
           return [];
       }
  }

  async markResultAsRead(userId: number, resultId: number): Promise<boolean> {
    log(`Marking result ${resultId} as read for user ${userId}`);
    try {
        const updateResult = await db.update(researchResults)
            .set({ isRead: true })
            .where(and(eq(researchResults.id, resultId), eq(researchResults.userId, userId)));
        return (updateResult.rowCount ?? 0) > 0;
    } catch (error) {
        log(`Error marking result ${resultId} as read:`, error);
        return false;
    }
  }

  async markAlertAsRead(userId: number, alertId: number): Promise<boolean> {
      log(`Marking alert ${alertId} as read for user ${userId}`);
      try {
          const updateResult = await db.update(alertHistory)
              .set({ isRead: true })
              .where(and(eq(alertHistory.id, alertId), eq(alertHistory.userId, userId)));
          return (updateResult.rowCount ?? 0) > 0;
      } catch (error) {
          log(`Error marking alert ${alertId} as read:`, error);
          return false;
      }
  }

  // StoreResults - Implement based on your schema
  private async storeResults(userId: number, preferenceId: number, results: ResearchResult[]): Promise<any[]> {
      log(`Storing ${results.length} results for user ${userId}, preference ${preferenceId}`);
      if (results.length === 0) return [];

      try {
          // Prepare data for insertion, matching the DB schema
          const inserts = results.map(result => ({
              userId,
              preferenceId,
              resultType: result.type,
              title: result.title,
              summary: result.summary,
              content: result.content, // Assumes content is JSON-compatible
              sources: result.sources.map(s => ({
                  url: s.url ?? undefined, // Use undefined if DB schema requires URL or null
                  title: s.title,
                  author: s.author,
                  publishedAt: s.publishedAt
              })),
              analysisMetadata: result.analysisMetadata, // Assumes metadata is JSON-compatible
              relevantDate: new Date() // Use current date for relevance or extract from content
          }));

          // Insert into the database and return the inserted rows
          const insertedResults = await db.insert(researchResults).values(inserts as any).returning();
          log(`Successfully stored ${insertedResults.length} results.`);
          return insertedResults;
      } catch (error) {
          log(`Error storing results for user ${userId}, preference ${preferenceId}:`, error);
          return []; // Return empty array on error
      }
  }

  // checkAlertConditions - Implement based on your schema/logic
  private async checkAlertConditions(userId: number, preferenceId: number, results: ResearchResult[]): Promise<void> {
      log(`Checking ${results.length} results for alert conditions for user ${userId}, preference ${preferenceId}`);
      let alertConfigs: any[] = []; // Replace 'any' with your AlertConfig type
      try {
        // Fetch active alert configurations for the user and preference
        alertConfigs = await db.query.alertConfig.findMany({
          where: and(
            eq(alertConfig.userId, userId),
            eq(alertConfig.preferenceId, preferenceId),
            eq(alertConfig.isActive, true)
          )
        });
      } catch (dbError) {
        log(`Error fetching alert configs for pref ${preferenceId}:`, dbError);
        return; // Stop if configs can't be fetched
      }

      if (alertConfigs.length === 0) {
        log(`No active alert configs found for preference ${preferenceId}. Skipping check.`);
        return;
      }

      log(`Found ${alertConfigs.length} active alert configs to check against.`);
      const triggeredAlerts: any[] = []; // Replace 'any' with your AlertHistoryInsert type

      for (const result of results) {
          // Ensure result has an ID (should be assigned after storing)
          if (result.id === undefined) {
            log(`Skipping alert check for result without ID: ${result.title}`);
            continue;
          }
          // Check each result against each active config
          for (const config of alertConfigs) {
              if (this.evaluateAlertConditions(result, config)) {
                  const alertType = this.determineAlertType(result, config);
                  const message = `Alert triggered for ${result.title}: ${alertType}`;
                  log(`ALERT TRIGGERED: ${message}`);

                  // Prepare alert history record
                  triggeredAlerts.push({
                      userId,
                      configId: config.id,
                      resultId: result.id, // Link to the result that triggered the alert
                      alertType: alertType,
                      message: message,
                      // Determine delivery methods based on config
                      deliveredVia: Object.entries(config.deliveryMethods || {})
                                          .filter(([_, enabled]) => enabled)
                                          .map(([method]) => method),
                  });
                  // TODO: Implement actual alert delivery logic (email, SMS, etc.)
              }
          }
      }

      // Store triggered alerts in history
      if (triggeredAlerts.length > 0) {
          try {
              await db.insert(alertHistory).values(triggeredAlerts);
              log(`Successfully stored ${triggeredAlerts.length} triggered alerts.`);
              // Broadcast new alerts via WebSocket
              triggeredAlerts.forEach(alert => {
                  this.broadcastToWs({ type: 'new_alert', data: alert });
              });
          } catch (storeError) {
              log(`Error storing triggered alerts:`, storeError);
          }
      } else {
        log("No alerts triggered by these results.");
      }
  }

  // evaluateAlertConditions - Implement based on your schema/logic
  private evaluateAlertConditions(result: ResearchResult, config: any): boolean {
      const conditions = config.conditions;
      if (!conditions) return false; // No conditions defined

      // Example: Sentiment threshold check
      if (conditions.sentimentThreshold !== undefined && result.analysisMetadata?.sentimentScore !== undefined) {
          if (Math.abs(result.analysisMetadata.sentimentScore) >= Math.abs(conditions.sentimentThreshold)) {
              log(`Sentiment alert triggered for result "${result.title}" (Score: ${result.analysisMetadata.sentimentScore}, Threshold: ${conditions.sentimentThreshold})`);
              return true; // Condition met
          }
      }
      // Add more condition checks here (volume, price, keywords, etc.) based on config.conditions
      // Example: Check for specific keywords in summary
      // if (conditions.keywords && conditions.keywords.some(kw => result.summary.toLowerCase().includes(kw.toLowerCase()))) {
      //    log(`Keyword alert triggered for result "${result.title}"`);
      //    return true;
      // }

      return false; // No conditions met
  }

  // determineAlertType - Implement based on your schema/logic
  private determineAlertType(result: ResearchResult, config: any): string {
      // Determine type based on which condition was met
      if (config.conditions?.sentimentThreshold !== undefined && result.analysisMetadata?.sentimentScore !== undefined && Math.abs(result.analysisMetadata.sentimentScore) >= Math.abs(config.conditions.sentimentThreshold)) {
         return "sentiment";
      }
      // Add checks for other types based on conditions
      return "event"; // Default type
  }

  // generateFallbackResults - Keep as is
  private generateFallbackResults(contextMessage?: string): ResearchResult[] {
      const r = contextMessage || "Analysis unavailable.";
      return [{ type: "insight", title: "Analysis Summary (Fallback)", summary: "Generated fallback summary.", content: { analysis: r }, sources: [], analysisMetadata: {} }];
  }

  // --- WebSocket Helper (Keep as is) ---
  private broadcastToWs(payload: object): void {
      if (!this.wss) return;
      const msg = JSON.stringify(payload);
      this.wss.clients.forEach(c => {
          if (c.readyState === WebSocket.OPEN) {
              try { c.send(msg); } catch (e) { console.error("WS broadcast err", e); }
          }
      });
  }

  private broadcastStatus(message: string, agentId?: string | null): void {
    const payload: { type: string; message: string; agentId?: string | null } = {
        type: 'agent_status',
        message
    };
    // Include agentId only if it's provided (not undefined)
    if (agentId !== undefined) {
        payload.agentId = agentId;
    }
    this.broadcastToWs(payload);
  }

  // --- UPDATED: LLM Summarization for Final Result ---
  private async generateEnhancedSummary(results: ResearchResult[], agentId: string): Promise<string> {
      log(`Generating enhanced summary for agent ${agentId}...`);
      const baseSummary = results[0]?.summary || `Agent ${agentId} completed its research task.`;

      if (results.length === 0) return "Agent completed, but no detailed results were generated.";

      if (this.llmConfigured && this.anthropic) { // Check for client instance
          try {
              log(`Attempting Anthropic summarization for final results of agent ${agentId}`);
              const contentToSummarize = results.map(r =>
                  `Title: ${r.title}\nSummary: ${r.summary}\n${r.content ? `Content Snippet: ${JSON.stringify(r.content).substring(0, 300)}...
` : ''}`
              ).join('\n---\n');

              const prompt = `Based on the following research results provided by an automated agent, generate a concise, user-friendly final summary (2-3 sentences) highlighting the main conclusions or findings:\n\n${contentToSummarize}`;

              const msg = await this.anthropic.messages.create({
                  model: "claude-3-5-sonnet-20240620",
                  max_tokens: 150, // Adjust token limit as needed
                  messages: [{ role: "user", content: prompt }],
              });

              // Extract text from the response content block(s)
              let enhancedSummary = "";
              if (msg.content && msg.content.length > 0 && msg.content[0].type === 'text') {
                   enhancedSummary = msg.content[0].text;
              } else {
                  log(`Anthropic response did not contain expected text content for agent ${agentId}.`);
                  enhancedSummary = baseSummary + " (AI summary failed: unexpected format)";
              }

              log(`Anthropic final summarization successful for agent ${agentId}.`);
              return enhancedSummary;

          } catch (llmError: any) {
              log(`Error during Anthropic final summarization for agent ${agentId}: ${llmError.message}`);
              return baseSummary + " (AI summary failed)";
          }
      } else {
           log(`Anthropic client not configured, using default final summary for agent ${agentId}.`);
           return baseSummary;
      }
  }
  // --- END UPDATED ---

  // --- UPDATED: LLM Summarization for Intermediate Steps ---
  private async generateIntermediateSummary(event: OpenManusEvent & { agentId: string | null }): Promise<string | null> {
      log(`Checking for intermediate summary generation for event type: ${event.type}, Agent: ${event.agentId}`);

      if (!this.llmConfigured || !this.anthropic || !event.agentId) {
          if (!this.llmConfigured || !this.anthropic) log("Skipping intermediate summary: LLM not configured.");
          if (!event.agentId) log("Skipping intermediate summary: Event has no agentId.");
          return null;
      }

      let prompt = "";
      let isSignificantEvent = false;

      if (event.type === 'agent_status') {
          const message = String((event as any).message || (event as any).data || ''); // Ensure it's a string
          log(`Intermediate summary check: evaluating status message: "${message}"`);
          const lowerMessage = message.toLowerCase();

          // --- Adjusted Keywords ---
          if (lowerMessage.includes('executing step')) {
              prompt = `The AI agent reported: "${message}". State this concisely (e.g., "Executing step X of Y...").`;
              isSignificantEvent = true;
          } else if (lowerMessage.includes('activating tool:')) {
              const toolMatch = message.match(/activating tool: '([^']+)'/i);
              const toolName = toolMatch ? toolMatch[1] : 'a tool';
              prompt = `The AI agent is now using the ${toolName} tool. Summarize this action for the user (e.g., "Using the ${toolName} tool to...").`;
              isSignificantEvent = true;
          } else if (lowerMessage.includes('search results for')) {
              prompt = `The AI agent reported finding search results related to its query. State this concisely (e.g., "Found search results...").`;
              isSignificantEvent = true;
          } else if (lowerMessage.includes('navigated to')) {
               prompt = `The AI agent reported: "${message}". Summarize this navigation concisely for the user (e.g., "Navigating to [Site Name]...").`;
               isSignificantEvent = true;
           } else if (lowerMessage.includes('analyzing') || lowerMessage.includes('processing data') || lowerMessage.includes('performing analysis')) {
              prompt = `The AI agent reported: "${message}". Summarize this analysis step concisely for the user (e.g., "Analyzing data...", "Performing sentiment analysis...").`;
               isSignificantEvent = true;
          } else if (lowerMessage.includes('generating report') || lowerMessage.includes('creating summary') || lowerMessage.includes('compiling findings')) {
               prompt = `The AI agent reported: "${message}". Summarize this reporting step concisely for the user (e.g., "Compiling report...", "Generating final summary...").`;
               isSignificantEvent = true;
          }
          // --- End Adjusted Keywords ---

      } else if (event.type === 'error') {
           prompt = `The AI agent encountered an error: "${event.message}". Briefly explain this error in a user-friendly way (1 sentence).`;
           isSignificantEvent = true;
      }
      // We might need to add more specific checks based on observing a full successful run's logs

      if (!isSignificantEvent) {
           log(`Intermediate summary check: Event type '${event.type}' with current message not deemed significant.`);
           return null;
      }

      try {
         // ... (LLM call placeholder remains the same) ...
         log(`Attempting Anthropic intermediate summarization for agent ${event.agentId} with prompt: "${prompt}"`);
         // const msg = await this.anthropic.messages.create({ ... }); // Actual call if implemented
          // Placeholder:
          const insight = `[AI Insight Placeholder] ${prompt.substring(0, 100)}...`; // More dynamic placeholder
          log(`LLM intermediate summarization successful (Placeholder) for agent ${event.agentId}.`);
          return insight;
      } catch (llmError: any) {
         log(`Error during Anthropic intermediate summarization for agent ${event.agentId}: ${llmError.message}`);
         return null;
      }
  }
  // --- END UPDATED ---

  // --- Event Handler for OpenManus Connector ---
  private setupOpenManusEventHandler(): void {
    if (!this.openManusConnector) return;

    const handler: OpenManusEventHandler = async (event) => {
      log(`[OpenManus Event Handler] Received event:`, event);

      let payload: object | null = null; // Payload for regular status/errors
      let insightPayload: object | null = null; // Payload for LLM insights
      const agentId = event.agentId;

      // --- Generate Intermediate Summary/Insight using LLM ---
      const insight = await this.generateIntermediateSummary(event);
      if (insight && agentId) {
           insightPayload = { type: 'agent_insight', data: insight, agentId };
      }
      // ---------------------------------------------------------

      switch (event.type) {
        case 'agent_status':
           const statusMessage = String((event as any).message || (event as any).data || 'Status update');
           payload = { type: 'agent_status', message: statusMessage, agentId };
           break;
        case 'terminal_output':
           log(`[Agent ${agentId}] Terminal Output: ${event.content}`);
           payload = null;
           break;
        case 'file_created': 
        case 'file_updated':
            const fileMsg = `${event.type === 'file_created' ? 'Created' : 'Updated'} file: ${event.file.name}`;
            payload = { type: 'agent_status', message: fileMsg, agentId, file: event.file };
            break;
        case 'error':
            payload = { type: 'task_error', data: event.message, agentId };
            break;
        case 'progress': 
            payload = { type: 'agent_status', message: `Progress: ${event.step} (${event.percentage}%)`, agentId };
            break;
        case 'final_result':
             log(`Processing final results from OpenManus for agent ${agentId}`);
             const fileContents = event.file_contents || {};
             let results: ResearchResult[] = (event.results || []).map((r: any) => ({
                 type: r.type || 'report',
                 title: r.title || `Research Result ${new Date().toISOString()}`,
                 summary: r.summary || '',
                 content: r.content || {},
                 sources: r.sources || [],
                 analysisMetadata: r.analysisMetadata || {},
              }));
             if (results.length === 0 && (fileContents['financial_research_summary.txt'] || fileContents['financial_research_report.txt'])) {
                 results.push({
                     type: 'report',
                     title: `OpenManus Research Report (${agentId})`,
                     summary: fileContents['financial_research_summary.txt'] || 'Summary not available.',
                     content: { report: fileContents['financial_research_report.txt'] || 'Report content not available.' },
                     sources: [],
                     analysisMetadata: {}
                 });
             }
             else if (results.length > 0) {
                 if (fileContents['financial_research_summary.txt']) { results[0].summary = fileContents['financial_research_summary.txt']; }
                 if (fileContents['financial_research_report.txt']) { results[0].content = { ...(results[0].content || {}), report: fileContents['financial_research_report.txt'] }; }
             }

             if (agentId) {
                 const researchContext = this.getResearchContext(agentId);
                 if (researchContext) {
                     const { userId, preferenceId } = researchContext;
                     // --- Add Log before final summary call ---
                     log(`Calling generateEnhancedSummary for agent ${agentId}`);
                     // ------------------------------------------
                     const finalSummary = await this.generateEnhancedSummary(results, agentId);
                     this.broadcastToWs({
                         type: 'task_summary',
                         summary: finalSummary, // Broadcast final (potentially AI) summary
                         files: event.files?.map(f => f.name) || [],
                         agentId
                     });
                     this.handleFinalResults(userId, preferenceId, results); // Process in background
                 } else { 
                      log(`Error: Could not find context for agent ${agentId} to handle final results.`);
                      this.broadcastToWs({ type: 'task_error', data: `Internal Error: Missing context for agent ${agentId}`, agentId });
                 } 
             } else { 
                 log(`Error: Received final_result event with null agentId.`);
                 this.broadcastToWs({ type: 'task_error', data: `Internal Error: Received final_result without agentId`, agentId: null });
              }
             payload = null; // Don't send raw final_result as status
             break;

        default:
           const unhandledEvent = event as any;
           log(`Unhandled OpenManus event type: ${(unhandledEvent as any).type}`);
           payload = null;
      }

      // Broadcast regular payload (status, error)
      if (payload) {
        this.broadcastToWs(payload);
      }
      // Broadcast LLM insight payload separately
      if (insightPayload) {
          this.broadcastToWs(insightPayload);
      }
    };

    this.openManusConnector.onEvent(handler);
    log("OpenManus event handler set up (AI Insights Enabled: " + this.llmConfigured + ")");
  }

  // --- MAIN RESEARCH DISPATCHER (Refactored for OpenManus) ---
  async performResearch(userId: number, preferenceId: number): Promise<{ agentId: string } | null> {
     log(`Dispatching OpenManus research for userId ${userId}, preferenceId ${preferenceId}.`);

     // Check if configured and connector exists
     if (!this.isConfigured || !this.openManusConnector) {
         const errorMsg = "SentinelAgent is not configured for OpenManus. Check OPENMANUS_URL.";
         log(`Error: ${errorMsg}`);
         this.broadcastStatus(`ERROR: ${errorMsg}`, null); // Send status error
         this.broadcastToWs({ type: 'task_error', data: errorMsg, agentId: null }); // Send specific task error
         return null; // Indicate failure to start
     }

    // Broadcast initial status
    this.broadcastStatus(`Initializing OpenManus research for preference ID: ${preferenceId}...`, null);
    let agentId: string | null = null; // To store the ID received from the service

    try {
      log(`Starting OpenManus research request for userId ${userId}, preferenceId ${preferenceId}`);

      // 1. Fetch the user's preference from the database
      const preference = await db.query.researchPreferences.findFirst({
          where: and(eq(researchPreferences.id, preferenceId), eq(researchPreferences.userId, userId))
      });
      if (!preference) {
          throw new Error(`Preference ${preferenceId} not found for user ${userId}`);
      }
      log("Preference fetched.");

      // 2. Call the OpenManus connector to start the research process
      // This sends the preference to the openmanus-service via HTTP POST
      agentId = await this.openManusConnector.startResearch(preference);
      // The connector itself handles establishing the WebSocket connection

      // 3. Store the mapping between the agentId and the user/preference context
      // This allows associating incoming WebSocket messages with the correct user/run
      this.storeResearchContext(agentId, { userId, preferenceId });

      // 4. Broadcast that the research has been initiated
      this.broadcastStatus(`OpenManus research initiated. Agent ID: ${agentId}. Waiting for updates...`, agentId);

      // 5. Return the agentId to the calling route handler
      // The route handler will send this back to the frontend
      return { agentId };

    } catch (error: unknown) { // Catch potential errors during initiation
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`Critical Error in OpenManus research initiation:`, errorMsg);
        // Broadcast error status, including agentId if it was assigned before failure
        this.broadcastStatus(`ERROR: ${errorMsg}`, agentId ?? undefined);
        // Use double quotes for the object properties and string literal
        this.broadcastToWs({ "type": "task_error", "data": errorMsg, "agentId": agentId ?? undefined });
        // Clean up context mapping if initiation failed after agentId was assigned
        if (agentId) this.clearResearchContext(agentId);
        // Re-throw the error so the API route handler can catch it and send a 500 response
        throw error;
    }
    // Note: No finally block to close the connector here, as it should remain active
    // to receive messages for potentially multiple ongoing agent runs.
  }

  // --- Helper methods for managing agent context ---
  private agentContextMap: Map<string, { userId: number; preferenceId: number }> = new Map();

  private storeResearchContext(agentId: string, context: { userId: number; preferenceId: number }): void {
     log(`Storing context for agent ${agentId}:`, context);
     this.agentContextMap.set(agentId, context);
  }

  private getResearchContext(agentId: string): { userId: number; preferenceId: number } | undefined {
      log(`Retrieving context for agent ${agentId}`);
      // Ensure agentId is valid before map lookup
      if (!agentId) return undefined;
      return this.agentContextMap.get(agentId);
  }

  private clearResearchContext(agentId: string): void {
      log(`Clearing context for agent ${agentId}`);
      this.agentContextMap.delete(agentId);
  }

  // --- Asynchronous handler for processing final results received via WebSocket ---
 private async handleFinalResults(userId: number, preferenceId: number, results: ResearchResult[]): Promise<void> {
    try {
        log(`Handling final results for user ${userId}, preference ${preferenceId}. Results count: ${results.length}`);
        // Store results in the database
        const stored = await this.storeResults(userId, preferenceId, results);
        // Add database IDs back to the results objects for alert checking
        const resultsWithIds = stored.map((dbResult, index) => ({
            ...results[index],
            id: dbResult.id // Assign the generated ID
        }));

        // Check if any results trigger configured alerts
        log(`Checking alert conditions for user ${userId}, preference ${preferenceId}`);
        await this.checkAlertConditions(userId, preferenceId, resultsWithIds);

        log(`Final result processing complete for user ${userId}, preference ${preferenceId}`);
        // Clean up the context map for this agent run
        // Find the agentId associated with this completed run
        const agentId = [...this.agentContextMap.entries()]
                            .find(([id, ctx]) => ctx.userId === userId && ctx.preferenceId === preferenceId)?.[0];
        if (agentId) {
           this.clearResearchContext(agentId);
        } else {
            // This might happen if context was cleared prematurely or mapping failed
            log(`Warning: Could not find agent ID to clear context after handling results for user ${userId}, pref ${preferenceId}`);
        }

     } catch (error: unknown) { // Catch any errors during final processing
         const errorMsg = error instanceof Error ? error.message : String(error);
         log(`Error processing final results for user ${userId}, preference ${preferenceId}:`, errorMsg);
         // Broadcast an error status if final processing fails
         this.broadcastStatus(`ERROR processing final results: ${errorMsg}`, null); // agentId might be gone
         // Attempt to clean up context map even on error
         const agentId = [...this.agentContextMap.entries()]
                            .find(([id, ctx]) => ctx.userId === userId && ctx.preferenceId === preferenceId)?.[0];
         if (agentId) this.clearResearchContext(agentId);
    }
 }

  // Add this getter method
  public getConnector(): OpenManusConnector | null {
      return this.openManusConnector;
  }

  // --- ADDED: Method to handle commands from WebSocket ---
  public async handleClientCommand(commandData: any, clientWs: WebSocket): Promise<void> {
      log(`Handling command from client:`, commandData);

      const action = commandData?.action;
      const agentId = commandData?.agentId; // May be needed for targeting later

      try {
          switch (action) {
              case 'start_research':
                  const preferenceId = commandData?.preferenceId;
                  const userId = commandData?.userId; // Assuming userId might be passed or retrieved via session/auth later

                  if (typeof preferenceId !== 'number') {
                      throw new Error('Invalid or missing preferenceId for start_research action.');
                  }

                  // TODO: Authenticate/Authorize userId if necessary before proceeding

                  // Call the existing method to perform research
                  // Assuming userId=1 for now, replace with actual user ID retrieval
                  if (!userId) {
                       log("Warning: No userId provided in command, using placeholder 1. Implement proper user retrieval.");
                       // You might want to throw an error here instead if userId is strictly required
                  }
                  const actualUserId = userId || 1; // Replace 1 with proper user ID logic

                  // Perform research returns agentId or null/throws error
                  const researchInfo = await this.performResearch(actualUserId, preferenceId);

                  if (researchInfo && researchInfo.agentId) {
                      // Research started successfully, agentId was broadcasted by performResearch
                      log(`Research initiated successfully by client command. Agent ID: ${researchInfo.agentId}`);
                      // Optionally send a confirmation back to the specific client?
                      // clientWs.send(JSON.stringify({ type: 'status', message: `Research started with Agent ID: ${researchInfo.agentId}`, agentId: researchInfo.agentId }));
                  } else {
                      // performResearch handled broadcasting errors, but we can log here too
                      log(`performResearch did not return a valid agentId.`);
                       // Error should have been broadcasted by performResearch
                  }
                  break;

               default:
                  throw new Error(`Unsupported client command action: ${action}`);
          }
      } catch (error: any) {
          log(`Error handling client command "${action}":`, error.message);
          // Send error back to the specific client who sent the command
          try {
              clientWs.send(JSON.stringify({
                  type: 'task_error', // Use task_error type
                  data: `Failed to process command "${action}": ${error.message}`,
                  agentId: agentId || null // Include agentId if available
              }));
          } catch (sendError) {
              log("Failed to send error message back to client:", sendError);
          }
          // Also broadcast a general error if appropriate? Maybe not needed if performResearch handles it.
          // this.broadcastStatus(`ERROR processing client command: ${error.message}`, agentId || null);
      }
  }
  // --- END ADDED METHOD ---

} // End class SentinelAgent

// Export a singleton instance
export const sentinelAgent = new SentinelAgent();