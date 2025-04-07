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
import { generateContent } from '../config/anthropic.js';
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
// Correct imports based on likely E2B SDK structure
import { Sandbox } from '@e2b/code-interpreter';
import type { ProcessMessage, FilesystemOperation } from '@e2b/code-interpreter'; // Assuming types exist

const log = (message: string, ...args: any[]) => console.log(`[SentinelAgent] ${message}`, ...args);

// --- Interfaces ---
export interface ResearchResult { type: "insight" | "alert" | "digest" | "report"; title: string; summary: string; content: any; sources: { url?: string | null; title?: string; author?: string; publishedAt?: string }[]; analysisMetadata?: { sentimentScore?: number; confidence?: number; impactEstimate?: string; relatedAssets?: string[] }; }
interface ResearchDataBundle { newsArticles: any[]; marketData: any; webSearchResults: any[]; deepResearchFindings: any; sentimentAnalysis: any; }
type AnalyzablePreference = SelectResearchPreference;
interface ResearchTask { id: number; description: string; status: 'pending' | 'running' | 'completed' | 'skipped' | 'error'; pythonCode?: string; output?: string; }
// --- End Interfaces ---

export class SentinelAgent {
  private wss: WebSocketServer | null = null;
  private readonly E2B_SANDBOX_WORKDIR = '/home/user'; // Default E2B workdir

  constructor(wssInstance?: WebSocketServer) {
    log("Initializing SentinelAgent (E2B Mode)...");
    if (wssInstance) this.wss = wssInstance;
    log("SentinelAgent initialized.");
  }

  public setWebSocketServer(wssInstance: WebSocketServer): void { this.wss = wssInstance; log("WebSocketServer instance set."); }

  // --- DB Methods (Stubs - Keep Full Implementations) ---
  async getUserPreferences(userId: number) { /* ... */ return []; }
  async updateUserPreferences(userId: number, prefData: any) { /* ... */ return {}; }
  private async storeResults(userId: number, preferenceId: number, results: ResearchResult[]): Promise<any[]> { log(`Storing ${results.length} results`); return []; }
  private async checkAlertConditions(userId: number, preferenceId: number, results: ResearchResult[]): Promise<void> { log("Checking alerts"); }
  private evaluateAlertConditions(result: ResearchResult, config: any): boolean { return false; }
  private determineAlertType(result: ResearchResult, config: any): string { return "event"; }
  private generateFallbackResults(contextMessage?: string): ResearchResult[] { const r = contextMessage || "Analysis unavailable."; return [{ type: "insight", title: "Analysis Summary (Fallback)", summary: "Generated fallback summary.", content: { analysis: r }, sources: [], analysisMetadata: {} }]; }

  // --- WebSocket Helper ---
  private broadcastToWs(payload: object): void { if (!this.wss) return; const msg = JSON.stringify(payload); this.wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) { try { c.send(msg); } catch (e) { console.error("WS broadcast err", e); } } }); }
  private broadcastStatus(message: string): void { this.broadcastToWs({ type: 'agent_status', message }); }

  // --- Data Gathering ---
  private async gatherResearchData(preference: AnalyzablePreference): Promise<ResearchDataBundle> {
      log(`Gathering data for topics: ${preference.topics?.join(', ')}`);
      // Keep existing logic using direct API calls (searchFinancialInfo, getFinancialNews)
      // Ensure placeholder functions are clearly marked or implemented
      const [news, search, market, deep] = await Promise.all([
          getFinancialNews(preference.topics || [], preference.keywords || []),
          searchFinancialInfo(`${preference.topics?.join(' ')} ${preference.keywords?.join(' ')}`.trim()),
          getMarketData(preference.specificAssets?.tickers || []), // Placeholder
          performDeepResearch(preference.topics || [], preference.keywords || []) // Placeholder
      ]);
      const sentiment = await this.analyzeSentiment(preference); // Mock
      log(`Data gathered: ${news.length} news, ${search.length} web results.`);
      return { newsArticles: news, webSearchResults: search, marketData: market, deepResearchFindings: deep, sentimentAnalysis: sentiment };
  }

  // --- Mock Sentiment Analysis ---
  private async analyzeSentiment(preference: any): Promise<Record<string, any>> {
    return { marketSentiment: (Math.random() * 2 - 1).toFixed(2), newsSentiment: (Math.random() * 2 - 1).toFixed(2), topicSentiment: preference.topics?.reduce((a: any, t: string) => (a[t] = (Math.random() * 2 - 1).toFixed(2), a), {}) };
  }

  // --- Helper: Parse Research Plan ---
  private parseResearchPlan(planText: string): ResearchTask[] {
    // Keep existing implementation
    const tasks: ResearchTask[] = []; const lines = planText.split('\n'); let taskCounter = 0;
    for (const line of lines) { const match = line.trim().match(/^(\d+)\.?\s+(.*)/); if (match && match[2]) { taskCounter++; tasks.push({ id: taskCounter, description: match[2].trim(), status: 'pending' }); } }
    if (tasks.length === 0) { log("Warn: Could not parse plan"); lines.forEach((l, i) => { const d = l.trim(); if (d && !d.startsWith('#')) tasks.push({ id: i + 1, description: d, status: 'pending' }); }); }
    log(`Parsed ${tasks.length} tasks.`); return tasks.slice(0, 8);
  }

  // --- Helper: Extract Python Code ---
  private extractPythonCode(responseText: string): string | null {
    // Keep existing implementation
    const match = responseText.match(/```python\s*([\s\S]*?)\s*```/);
    if (match && match[1]) return match[1].trim();
    if (responseText.includes("import ") || responseText.includes("def ") || responseText.includes("print(")) return responseText.trim(); // Basic check
    return null;
  }

  // --- E2B Filesystem Operation Helper ---
  private async performE2bFilesystemOperation(
      sandbox: Sandbox,
      operation: FilesystemOperation, // Use SDK type
      path: string,
      content?: string
  ): Promise<{ success: boolean; output: string }> {
      let output = "";
      try {
          switch (operation) {
              case 'write':
                  if (content === undefined) throw new Error("Content needed for write op");
                  await sandbox.filesystem.write(path, content);
                  output = `[Filesystem] Successfully wrote to ${path}`;
                  log(output);
                  return { success: true, output };
              case 'list':
                  const files = await sandbox.filesystem.list(path);
                  output = `[Filesystem] Contents of ${path}:\n${files.map(f => `${f.isDir ? 'D' : 'F'} ${f.name}`).join('\n')}`;
                  log(output);
                  return { success: true, output };
              case 'read':
                  const fileContent = await sandbox.filesystem.read(path);
                  output = `[Filesystem] Content of ${path}:\n${fileContent}`;
                   log(`[Filesystem] Read ${fileContent.length} chars from ${path}`);
                  return { success: true, output };
               case 'remove':
                    await sandbox.filesystem.remove(path);
                    output = `[Filesystem] Successfully removed ${path}`;
                    log(output);
                    return { success: true, output };
              case 'makeDir':
                    await sandbox.filesystem.makeDir(path);
                    output = `[Filesystem] Successfully created directory ${path}`;
                    log(output);
                    return { success: true, output };
              default:
                  throw new Error(`Unsupported filesystem operation: ${operation}`);
          }
      } catch (error: any) {
          output = `[Filesystem Error] Operation ${operation} on ${path} failed: ${error.message}`;
          log(output);
          return { success: false, output };
      }
  }

  // --- E2B Process Execution Helper ---
  private async executeE2bPythonScript(
      sandbox: Sandbox,
      scriptPath: string
  ): Promise<{ exitCode: number; output: string; error: string }> {
      let stdout = "";
      let stderr = "";
      let exitCode = -1; // Default error code

      try {
          this.broadcastToWs({ type: 'executing_command', data: `python3 ${scriptPath}` });
          const process = await sandbox.process.start(`python3 ${scriptPath}`);

          // Stream output in real-time
          process.onStdout((msg: ProcessMessage) => {
              log(`E2B STDOUT (${scriptPath}): ${msg.line}`);
              this.broadcastToWs({ type: 'terminal_stdout', data: msg.line + '\n' });
              stdout += msg.line + '\n';
          });
          process.onStderr((msg: ProcessMessage) => {
              log(`E2B STDERR (${scriptPath}): ${msg.line}`);
              this.broadcastToWs({ type: 'terminal_stderr', data: `[ERROR] ${msg.line}\n` });
              stderr += msg.line + '\n';
          });

          // Wait for completion
          const result = await process.finished;
          exitCode = result.exitCode;
          log(`E2B script ${scriptPath} finished with exit code ${exitCode}.`);

      } catch (error: any) {
          stderr += `\n[E2B SDK Error] Failed to run script ${scriptPath}: ${error.message}`;
          log(`E2B SDK Error running ${scriptPath}: ${error.message}`);
          exitCode = -1; // Ensure error code if SDK fails
      }

      return { exitCode, output: stdout.trim(), error: stderr.trim() };
  }


  // --- MAIN RESEARCH FUNCTION (E2B Refactored) ---
  async performResearch(userId: number, preferenceId: number): Promise<ResearchResult[]> {
    this.broadcastStatus(`Initializing E2B research for preference ID: ${preferenceId}...`);
    let researchPlan: ResearchTask[] = [];
    let accumulatedOutput = "";
    let generatedFiles: { name: string; path: string }[] = [];
    let rawDataBundle: ResearchDataBundle | null = null;
    let sandbox: Sandbox | null = null;

    const E2B_API_KEY = process.env.E2B_API_KEY;
    if (!E2B_API_KEY) { /* ... error handling ... */ return this.generateFallbackResults("E2B Key missing"); }

    try {
      log(`Starting E2B research for userId ${userId}, preferenceId ${preferenceId}`);
      // --- Create E2B Sandbox ---
      this.broadcastStatus("Creating E2B Sandbox...");
      // Corrected Sandbox.create call
      sandbox = await Sandbox.create('base', { apiKey: E2B_API_KEY });
      this.broadcastStatus("E2B Sandbox created successfully.");
      log("E2B Sandbox created.");

      // --- Get Prefs & Gather Data ---
      this.broadcastStatus(`Fetching preference ${preferenceId}...`);
      const preference = await db.query.researchPreferences.findFirst({where: and(eq(researchPreferences.id, preferenceId), eq(researchPreferences.userId, userId))});
      if (!preference) throw new Error("Pref not found");
      log("Preferences fetched.");
      this.broadcastStatus("Gathering initial data via APIs...");
      rawDataBundle = await this.gatherResearchData(preference);
      this.broadcastStatus(`Data gathered: ${rawDataBundle.newsArticles.length} news, ${rawDataBundle.webSearchResults.length} web results.`);
      accumulatedOutput += `--- Initial Data ---\nNews: ${rawDataBundle.newsArticles.length}, Web: ${rawDataBundle.webSearchResults.length}\n`;

      // --- Generate Plan ---
      this.broadcastStatus("Generating research plan...");
      const planPrompt = this.buildPlanPrompt(preference);
      let planText = await generateContent(planPrompt);
      researchPlan = this.parseResearchPlan(planText.match(/## RESEARCH PLAN\s*([\s\S]*)/)?.[1]?.trim() || planText);
      if (researchPlan.length === 0) throw new Error("Failed plan gen");
      const planString = `## RESEARCH PLAN\n${researchPlan.map(t => `${t.id}. ${t.description}`).join('\n')}`;
      this.broadcastStatus(planString);
      accumulatedOutput += planString + "\n";
      log("Research plan generated.");

      // --- Execute Tasks ---
      log(`Starting E2B task loop (${researchPlan.length} tasks)...`);
      for (const task of researchPlan) {
        task.status = 'running';
        this.broadcastStatus(`Starting Task ${task.id}: ${task.description}`);
        accumulatedOutput += `\n--- Starting Task ${task.id}: ${task.description} ---\n`;

        let taskOutput = "";
        let taskFailed = false;

        try {
          // Determine Action Type based on task description
          if (task.description.toLowerCase().includes("save gathered data")) {
             const marketPath = `${this.E2B_SANDBOX_WORKDIR}/market_data.json`;
             const newsPath = `${this.E2B_SANDBOX_WORKDIR}/news_articles.json`;
             const webPath = `${this.E2B_SANDBOX_WORKDIR}/web_search_results.json`;

             const marketRes = await this.performE2bFilesystemOperation(sandbox, 'write', marketPath, JSON.stringify(rawDataBundle?.marketData || {}, null, 2));
             const newsRes = await this.performE2bFilesystemOperation(sandbox, 'write', newsPath, JSON.stringify(rawDataBundle?.newsArticles || [], null, 2));
             const webRes = await this.performE2bFilesystemOperation(sandbox, 'write', webPath, JSON.stringify(rawDataBundle?.webSearchResults || [], null, 2));

             taskOutput = `${marketRes.output}\n${newsRes.output}\n${webRes.output}`;
             taskFailed = !marketRes.success || !newsRes.success || !webRes.success;

          } else if (task.description.toLowerCase().includes("verify") || task.description.toLowerCase().includes("ls -la")) {
             const lsPath = this.E2B_SANDBOX_WORKDIR;
             this.broadcastToWs({ type: 'executing_command', data: `ls -la ${lsPath}` }); // Show command intent
             const listRes = await this.performE2bFilesystemOperation(sandbox, 'list', lsPath);
             taskOutput = listRes.output;
             taskFailed = !listRes.success;
             // Update generated files
             if(listRes.success){
                const files = await sandbox.filesystem.list(lsPath);
                generatedFiles = files.filter(f => !f.isDir && !f.name.endsWith('.py') && !f.name.startsWith('.'))
                                      .map(f => ({ name: f.name, path: `/download/e2b/${preferenceId}/${f.name}` }));
                if(generatedFiles.length > 0) this.broadcastStatus(`📁 Files found: ${generatedFiles.map(f=>f.name).join(', ')}`);
             }

          } else if (task.description.toLowerCase().includes("create and run") || task.description.toLowerCase().includes("execute python")) {
             // 1. Generate Python Code
             const pythonCodePrompt = this.buildPythonCodePrompt(task, preference, accumulatedOutput);
             log(`Generating Python code for Task ${task.id}...`);
             const pythonCodeResponse = await generateContent(pythonCodePrompt);
             const pythonCode = this.extractPythonCode(pythonCodeResponse);
             task.pythonCode = pythonCode || "# Error: Could not generate Python code";
             accumulatedOutput += `\n--- Task ${task.id} Generated Code ---\n${task.pythonCode}\n---\n`;

             if (!pythonCode) {
                 taskFailed = true;
                 taskOutput = "Error: LLM did not generate valid Python code.";
                 this.broadcastStatus(`Error: No Python code generated for Task ${task.id}. Skipping execution.`);
             } else {
                 // 2. Write Script
                 const scriptName = `task_${task.id}_script.py`;
                 const scriptPath = `${this.E2B_SANDBOX_WORKDIR}/${scriptName}`;
                 const writeRes = await this.performE2bFilesystemOperation(sandbox, 'write', scriptPath, pythonCode);
                 taskOutput += writeRes.output + '\n';
                 taskFailed = !writeRes.success;

                 if (!taskFailed) {
                     // 3. Execute Script
                     this.broadcastStatus(`Executing script: python3 ${scriptPath}`);
                     const execResult = await this.executeE2bPythonScript(sandbox, scriptPath);
                     taskOutput += `\n--- Script Execution ---\nExit Code: ${execResult.exitCode}\nStdout:\n${execResult.output}\nStderr:\n${execResult.error}\n--- End Script ---`;
                     if (execResult.exitCode !== 0 || execResult.error) {
                         taskFailed = true;
                         this.broadcastStatus(`Error: Task ${task.id} script failed (code ${execResult.exitCode}).`);
                     } else {
                        this.broadcastStatus(`Script executed successfully.`);
                     }
                 }
             }
          } else if (task.description.toLowerCase().includes("analyze") || task.description.toLowerCase().includes("report")) {
             task.status = 'skipped';
             taskOutput = 'Analysis/Reporting task - no execution needed at this stage.';
             this.broadcastStatus(`Task ${task.id} skipped (Analysis/Reporting Step)`);
             log(`Task ${task.id} skipped.`);
          } else {
             task.status = 'skipped';
             taskOutput = 'Unrecognized task type for E2B execution.';
             this.broadcastStatus(`Task ${task.id} skipped (Unrecognized type)`);
             log(`Task ${task.id} skipped (Unrecognized type).`);
          }

        } catch (error: any) {
            task.status = 'error';
            taskOutput = `System Error during task ${task.id}: ${error.message}`;
            this.broadcastStatus(`System Error during Task ${task.id}: ${error.message}`);
            log(`Task ${task.id} system error: ${error.message}`);
            taskFailed = true;
        }

        // Finalize task status based on outcome
        if (task.status === 'running') { // If not already skipped or errored
           task.status = taskFailed ? 'error' : 'completed';
        }
        task.output = taskOutput.trim();
        accumulatedOutput += `\n\n--- Final Output for Task ${task.id} (${task.status}) ---\n${task.output}\n--- End Task ${task.id} Output ---\n`;
        if(!taskFailed && task.status !== 'skipped') this.broadcastStatus(`✓ Task ${task.id} completed: ${task.description}`);

        await new Promise(resolve => setTimeout(resolve, 300));
      } // End Task Loop
      log("E2B Task execution loop finished.");

      // --- Final Analysis ---
      this.broadcastStatus("Starting final analysis based on execution outputs...");
      const finalAnalysisPrompt = this.buildFinalAnalysisPrompt(preference, accumulatedOutput);
      const analysisResponse = await generateContent(finalAnalysisPrompt);
      log("Final analysis response received.");
      let analysisResults: ResearchResult[] = [];
       try { /* ... Keep refined JSON parsing logic ... */
            let finalJsonParsed=null;try{finalJsonParsed=JSON.parse(analysisResponse)}catch(e){}
            if(Array.isArray(finalJsonParsed)){analysisResults=finalJsonParsed;log("Parsed final JSON directly")}
            else{const m=analysisResponse.match(/```json\s*(\[[\s\S]*\])\s*```/);if(m&&m[1]){analysisResults=JSON.parse(m[1]);log("Parsed final JSON from markdown")}else{const f=analysisResponse.match(/(\[[\s\S]*\])/);if(f&&f[1]){analysisResults=JSON.parse(f[1]);log("Parsed final JSON via fallback")}else{throw new Error("No JSON array found")}}}
            if(!Array.isArray(analysisResults)){throw new Error("Final result not array")}
            this.broadcastStatus(`🔍 Final analysis generated ${analysisResults.length} insights.`);
            log(`Parsed ${analysisResults.length} final insights.`);
       } catch (parseError: any) { /* ... error handling ... */ log("Error parsing final:",parseError.message); this.broadcastStatus(`Error parsing final. Raw:\n${analysisResponse}`); analysisResults=this.generateFallbackResults("LLM parse failed"); }

      // --- Store Results & Check Alerts ---
      this.broadcastStatus(`Storing ${analysisResults.length} final results...`);
      await this.storeResults(userId, preferenceId, analysisResults);
      this.broadcastStatus(`Checking alert conditions...`);
      await this.checkAlertConditions(userId, preferenceId, analysisResults);
      this.broadcastStatus(`Alert check complete.`);

       // --- Final Cleanup & Broadcast Completion ---
       // List files one last time
       try { if(sandbox){const files=await sandbox.filesystem.list(this.E2B_SANDBOX_WORKDIR);generatedFiles=files.filter(f=>!f.isDir&&!f.name.endsWith('.py')&&!f.name.startsWith('.')).map(f=>({name:f.name,path:`/download/e2b/${preferenceId}/${f.name}`}));if(generatedFiles.length>0)this.broadcastStatus(`📁 Final files: ${generatedFiles.map(f=>f.name).join(', ')}`);}}catch(lsError){log("Err list final files:",lsError);}

      const taskSummaryString = researchPlan.map(t => `- Task ${t.id}: ${t.description} -> ${t.status.toUpperCase()}`).join('\n');
      const finalSummary = `## RESEARCH SUMMARY (E2B)\nProcess completed.\n\n**Task Summary:**\n${taskSummaryString}\n\n**Metrics:**\n- Insights: ${analysisResults.length}\n- Files: ${generatedFiles.length} (${generatedFiles.map(f => f.name).join(', ') || 'None'})`;
      this.broadcastStatus(finalSummary);
      this.broadcastToWs({ type: 'task_summary', data: finalSummary, files: generatedFiles, suggestions: [/* ... */] });
      log("E2B research completed successfully.");
      return analysisResults;

    } catch (error: any) {
        log(`Critical Error in E2B research:`, error);
        const errorMsg = `Error during research process: ${error.message || String(error)}`;
        this.broadcastStatus(`ERROR: ${errorMsg}`);
        this.broadcastToWs({ type: 'task_error', data: errorMsg, files: [], suggestions: [] });
        return this.generateFallbackResults(errorMsg);
    } finally {
       if (sandbox) {
          this.broadcastStatus("Closing E2B Sandbox...");
          await sandbox.close();
          log("E2B Sandbox closed.");
       }
    }
  }


 // --- Prompt Building Functions (Refactored for E2B/Python) ---

 private buildPlanPrompt(preference: AnalyzablePreference): string {
    // Keep existing implementation - Plan should still reference python scripts
     const topics = preference.topics?.join(", ") || 'N/A'; const keywords = preference.keywords?.join(", ") || 'N/A';
     return `# TASK: Generate Research Plan...\n## USER PREFERENCES...\n## OUTPUT FORMAT...\nExample:\n## RESEARCH PLAN\n1. Save market data to /home/user/market_data.json...\n2. Create and execute process_data.py...\n3. Create and execute visualize_data.py...\n4. Analyze script outputs...\n5. Compile final report.\n`;
 }

 private buildPythonCodePrompt(task: ResearchTask, preference: AnalyzablePreference, previousOutput: string): string { // Removed rawData param
    const topics = preference.topics?.join(", ") || 'N/A';
    const keywords = preference.keywords?.join(", ") || 'N/A';
    const recentOutput = previousOutput.slice(-1500);

    // Task-specific Python guidance
    let pythonGuidance = "# Write Python code for this task.";
    if (task.description.toLowerCase().includes("save gathered data")) {
         pythonGuidance = `# Python code to save raw data (passed separately) into JSON files: market_data.json, news_articles.json, web_search_results.json within ${this.E2B_SANDBOX_WORKDIR}. Use the json library. Print confirmation.`;
    } else if (task.description.toLowerCase().includes("process data")) {
        pythonGuidance = `# Python code to load data from JSON files (e.g., market_data.json) in ${this.E2B_SANDBOX_WORKDIR}, process using pandas, save results to ${this.E2B_SANDBOX_WORKDIR}/processed_data.csv. Print status.`;
    } else if (task.description.toLowerCase().includes("visualiz") || task.description.toLowerCase().includes("chart")) {
        pythonGuidance = `# Python code to load ${this.E2B_SANDBOX_WORKDIR}/processed_data.csv using pandas, generate charts with matplotlib, save as PNG (e.g., price_chart.png) in ${this.E2B_SANDBOX_WORKDIR}. Print confirmation.`;
    } else if (task.description.toLowerCase().includes("verify") || task.description.toLowerCase().includes("ls -la")) {
         pythonGuidance = `# Python code using os.listdir('${this.E2B_SANDBOX_WORKDIR}') to list files and print results.`;
    } else if (task.description.toLowerCase().includes("analyze") || task.description.toLowerCase().includes("report")) {
         return "echo 'No Python code needed for analysis/reporting.'"; // Use echo for non-code tasks
    }

    return `
# TASK: Generate Python Code Snippet

Current Task ${task.id}: "${task.description}"

## PREVIOUS OUTPUT (Last 1500 chars)
\`\`\`
${recentOutput || "(No previous output yet)"}
\`\`\`

## INSTRUCTIONS
Generate ONLY the Python 3 code snippet for the Current Task.
- Assume 'os', 'json', 'pandas', 'matplotlib.pyplot as plt' are available.
- Use this working directory for file paths: ${this.E2B_SANDBOX_WORKDIR}
- ${pythonGuidance}
- Include print() statements for progress/confirmation.
- Ensure code is complete and directly executable.

Respond ONLY with raw Python code in a \`\`\`python ... \`\`\` block. No explanations.
`;
}


 private buildFinalAnalysisPrompt(preference: AnalyzablePreference, accumulatedOutput: string): string {
      // Keep existing implementation, instructions already focus on accumulated output
      const topics = preference.topics?.join(", ") || 'N/A'; const keywords = preference.keywords?.join(", ") || 'N/A'; const analysisOutput = accumulatedOutput.slice(-4000);
      return `# TASK: Final Analysis...\n## USER PREFERENCES...\n## ACCUMULATED SCRIPT OUTPUT...\n\`\`\`\n${analysisOutput}\n\`\`\`\n## INSTRUCTIONS\nAnalyze ACCUMULATED SCRIPT OUTPUT...Generate 2-3 insights...Format as JSON array...\n## REQUIRED JSON OUTPUT FORMAT\n\`\`\`json\n[{"type":"insight","title":"Title from Output","summary":"Summary from Output",...sources:[{"title":"Task X Output","url":"internal://..."},{"title":"File: chart.png","url":"e2b:///home/user/chart.png"}],...}]\n\`\`\`\n**IMPORTANT: Respond ONLY with the valid JSON array.**`;
 }

} // End class SentinelAgent

export const sentinelAgent = new SentinelAgent();