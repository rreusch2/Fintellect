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
// import { Sandbox } from '@e2b/code-interpreter';
// import type { ProcessMessage, FilesystemOperation } from '@e2b/code-interpreter';

// Import the new OpenManus Connector
import { OpenManusConnector, OpenManusEventHandler } from '../connectors/OpenManusConnector.js'; // Adjust path if needed

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
// Removed ResearchDataBundle and ResearchTask as they were tied to E2B implementation
// interface ResearchDataBundle { newsArticles: any[]; marketData: any; webSearchResults: any[]; deepResearchFindings: any; sentimentAnalysis: any; }
type AnalyzablePreference = SelectResearchPreference;
// interface ResearchTask { id: number; description: string; status: 'pending' | 'running' | 'completed' | 'skipped' | 'error'; pythonCode?: string; output?: string; }
// --- End Interfaces ---

export class SentinelAgent {
  private wss: WebSocketServer | null = null;
  // --- E2B Sandbox Workdir Removed ---
  // private readonly E2B_SANDBOX_WORKDIR = '/home/user';

  // OpenManus Connector instance
  private openManusConnector: OpenManusConnector | null = null;
  // Removed useOpenManus flag
  // private readonly useOpenManus: boolean;
  private isConfigured: boolean = false; // Flag to check if agent is usable

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
    // --- Removed E2B mode logic ---

    log("SentinelAgent initialized.");
  }

  public setWebSocketServer(wssInstance: WebSocketServer): void {
    this.wss = wssInstance;
    log("WebSocketServer instance set.");
  }

  // --- Event Handler for OpenManus Connector --- (Modified to handle file_contents)
  private setupOpenManusEventHandler(): void {
    if (!this.openManusConnector) return;

    const handler: OpenManusEventHandler = (event) => {
      // Reduced verbosity for final_result
      if (event.type === 'final_result') {
        log(`[OpenManus Event Handler] Received event: type=${event.type}, agentId=${event.agentId}, resultsCount=${event.results?.length}, filesCount=${event.files?.length}, hasFileContents=${!!event.file_contents}`);
      } else {
        log(`[OpenManus Event Handler] Received event:`, event);
      }
      let payload: object | null = null;
      const agentId = event.agentId; // Handler type ensures agentId exists (though possibly null)

      switch (event.type) {
        case 'status':
          payload = { type: 'agent_status', message: event.message, agentId };
          break;
        case 'terminal_output':
          payload = { type: 'terminal_stdout', data: event.content, agentId };
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
        case 'browser_state':
           // Forward browser state information if available
           if (event.data) {
             payload = {
               type: 'browser_state',
               data: event.data,
               base64_image: event.base64_image, // Pass along the screenshot if available
               agentId
             };
           }
           break;
        case 'final_result':
            log(`Processing final results from OpenManus for agent ${agentId}`);
            // --- Extract file contents if available --- 
            const fileContents = event.file_contents || {};
            // --- Create results from event, potentially overriding with file contents ---
            let results: ResearchResult[] = (event.results || []).map((r: any) => ({ 
                type: r.type || 'report', // Default type if missing
                title: r.title || `Research Result ${new Date().toISOString()}`,
                summary: r.summary || '', // Placeholder
                content: r.content || {}, // Placeholder
                sources: r.sources || [],
                analysisMetadata: r.analysisMetadata || {},
             }));

             // If no structured results, create one from file contents if available
             if (results.length === 0 && (fileContents['financial_research_summary.txt'] || fileContents['financial_research_report.txt'])) {
                 log(`No structured results found, creating one from file contents for agent ${agentId}`);
                 results.push({
                     type: 'report',
                     title: `OpenManus Research Report (${agentId})`,
                     summary: fileContents['financial_research_summary.txt'] || 'Summary not available.',
                     content: { report: fileContents['financial_research_report.txt'] || 'Report content not available.' },
                     sources: [],
                     analysisMetadata: {}
                 });
             } 
             // If structured results exist, try to populate summary/content from files
             else if (results.length > 0) {
                if (fileContents['financial_research_summary.txt']) {
                    results[0].summary = fileContents['financial_research_summary.txt'];
                }
                if (fileContents['financial_research_report.txt']) {
                    // Store full report in content field (e.g., under a specific key)
                    results[0].content = { ...(results[0].content || {}), report: fileContents['financial_research_report.txt'] };
                }
             }
            // --------------------------------------------------------------------------

            // Ensure agentId is valid before proceeding
            if (agentId) {
                const researchContext = this.getResearchContext(agentId); // Pass string agentId
                if (researchContext) {
                    const { userId, preferenceId } = researchContext;
                    // Use the potentially updated summary from file contents
                    const finalSummary = results[0]?.summary || `Agent ${agentId} completed for Pref ${preferenceId}. Insights: ${results.length}`;
                    this.broadcastToWs({ type: 'task_summary', data: finalSummary, files: event.files || [], suggestions: [], agentId });
                    this.handleFinalResults(userId, preferenceId, results); // Pass potentially updated results
                } else {
                    log(`Error: Could not find context for agent ${agentId} to handle final results.`);
                    this.broadcastToWs({ type: 'task_error', data: `Internal Error: Missing context for agent ${agentId}`, agentId });
                }
            } else {
                 log(`Error: Received final_result event with null agentId.`);
                 this.broadcastToWs({ type: 'task_error', data: `Internal Error: Received final_result without agentId`, agentId: null });
            }
             break;

        default:
           // Handle 'never' type by asserting event type or checking agentId
           const unhandledEvent = event as any; // Use 'any' cautiously or add specific checks
           log(`Unhandled OpenManus event type: ${unhandledEvent.type}`);
           payload = { type: 'system_info', data: `Received unhandled OpenManus event: ${JSON.stringify(unhandledEvent)}`, agentId };
      }

      if (payload) {
        this.broadcastToWs(payload);
      }
    };

    this.openManusConnector.onEvent(handler);
    log("OpenManus event handler set up.");
  }

  // --- DB Methods (Stubs - Keep Full Implementations) ---
  // TODO: Implement these fully
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
              const updated = await db.update(researchPreferences)
                  .set({ ...prefData, updatedAt: new Date() })
                  .where(and(eq(researchPreferences.id, prefData.id), eq(researchPreferences.userId, userId)))
                  .returning();
              return updated[0] || null;
          } else {
              const created = await db.insert(researchPreferences)
                  .values({ ...prefData, userId } as any) // Use 'as any' or fix type if possible
                  .returning();
              return created[0] || null;
          }
      } catch (error) {
          log("Error updating/creating preference:", error);
          return null;
      }
  }
  // Example scheduleResearch (needs full implementation based on schema)
  async scheduleResearch(userId: number, preferenceId: number, scheduleData: any): Promise<any> {
    log(`Scheduling research for user ${userId}, preference ${preferenceId}`);
    // TODO: Implement DB interaction with researchSchedules table
    return { id: Math.floor(Math.random() * 1000), userId, preferenceId, ...scheduleData, status: 'pending' };
  }

   async getRecentResults(userId: number, limit: number = 10): Promise<ResearchResult[]> {
       log(`Fetching last ${limit} results for user ${userId}`);
       try {
            const resultsFromDb = await db.select()
                .from(researchResults)
                .where(eq(researchResults.userId, userId))
                .orderBy(desc(researchResults.createdAt))
                .limit(limit);

            // Map to the expected ResearchResult interface structure, including 'type'
            return resultsFromDb.map(r => ({
                id: r.id,
                type: r.resultType as ResearchResult['type'], // Map resultType to type
                userId: r.userId,
                preferenceId: r.preferenceId,
                scheduleId: r.scheduleId ?? undefined,
                title: r.title,
                summary: r.summary,
                content: r.content,
                sources: r.sources?.map(s => ({ // Ensure sources match expected type (handle null url)
                    url: s.url ?? null,
                    title: s.title,
                    author: s.author,
                    publishedAt: s.publishedAt
                })) ?? [],
                analysisMetadata: r.analysisMetadata ?? undefined,
                isRead: r.isRead,
                isSaved: r.isSaved,
                createdAt: r.createdAt.toISOString(),
                relevantDate: r.relevantDate.toISOString(),
            }));
       } catch (error) {
           log("Error fetching recent results:", error);
           return [];
       }
   }

   async getRecentAlerts(userId: number, limit: number = 10): Promise<any[]> { // Replace 'any' with Alert type if defined
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
          // Check rowCount safely
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
           // Check rowCount safely
           return (updateResult.rowCount ?? 0) > 0;
       } catch (error) {
           log(`Error marking alert ${alertId} as read:`, error);
           return false;
       }
   }


  private async storeResults(userId: number, preferenceId: number, results: ResearchResult[]): Promise<any[]> {
      log(`Storing ${results.length} results for user ${userId}, preference ${preferenceId}`);
      if (results.length === 0) return [];

      try {
          // Ensure the data structure matches Drizzle insert schema, especially nullability
          const inserts = results.map(result => ({
              userId,
              preferenceId,
              resultType: result.type,
              title: result.title,
              summary: result.summary,
              content: result.content,
              sources: result.sources.map(s => ({ // Map to ensure nulls are handled if DB expects non-null
                  url: s.url ?? undefined, // Use undefined if DB schema doesn't allow null strings
                  title: s.title,
                  author: s.author,
                  publishedAt: s.publishedAt
              })),
              analysisMetadata: result.analysisMetadata,
              relevantDate: new Date()
          }));

          // Use `as any` as a temporary workaround for complex type mismatches, ideally refine types
          const insertedResults = await db.insert(researchResults).values(inserts as any).returning();
          log(`Successfully stored ${insertedResults.length} results.`);
          return insertedResults;
      } catch (error) {
          log(`Error storing results for user ${userId}, preference ${preferenceId}:`, error);
          return [];
      }
  }

  private async checkAlertConditions(userId: number, preferenceId: number, results: ResearchResult[]): Promise<void> {
      log(`Checking ${results.length} results for alert conditions for user ${userId}, preference ${preferenceId}`);
      let alertConfigs: any[] = [];
      try {
        alertConfigs = await db.query.alertConfig.findMany({
          where: and(
            eq(alertConfig.userId, userId),
            eq(alertConfig.preferenceId, preferenceId),
            eq(alertConfig.isActive, true)
          )
        });
      } catch (dbError) {
        log(`Error fetching alert configs for pref ${preferenceId}:`, dbError);
        return;
      }

      if (alertConfigs.length === 0) {
        log(`No active alert configs found for preference ${preferenceId}. Skipping check.`);
        return;
      }

      log(`Found ${alertConfigs.length} active alert configs to check against.`);
      const triggeredAlerts: any[] = [];

      for (const result of results) {
          // Skip check if result doesn't have an ID (should have after storing)
          if (result.id === undefined) {
            log(`Skipping alert check for result without ID: ${result.title}`);
            continue;
          }
          for (const config of alertConfigs) {
              if (this.evaluateAlertConditions(result, config)) {
                  const alertType = this.determineAlertType(result, config);
                  const message = `Alert triggered for ${result.title}: ${alertType}`;
                  log(`ALERT TRIGGERED: ${message}`);

                  triggeredAlerts.push({
                      userId,
                      configId: config.id,
                      resultId: result.id, // Use the ID added to result
                      alertType: alertType,
                      message: message,
                      deliveredVia: Object.entries(config.deliveryMethods || {})
                                          .filter(([_, enabled]) => enabled)
                                          .map(([method]) => method),
                  });
                  // TODO: Implement actual delivery
              }
          }
      }

      if (triggeredAlerts.length > 0) {
          try {
              await db.insert(alertHistory).values(triggeredAlerts);
              log(`Successfully stored ${triggeredAlerts.length} triggered alerts.`);
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

  private evaluateAlertConditions(result: ResearchResult, config: any): boolean {
      const conditions = config.conditions;
      if (!conditions) return false;
      if (conditions.sentimentThreshold && result.analysisMetadata?.sentimentScore) {
          if (Math.abs(result.analysisMetadata.sentimentScore) >= Math.abs(conditions.sentimentThreshold)) {
              log(`Sentiment alert triggered for result "${result.title}" (Score: ${result.analysisMetadata.sentimentScore}, Threshold: ${conditions.sentimentThreshold})`);
              return true;
          }
      }
      return false;
  }
  private determineAlertType(result: ResearchResult, config: any): string {
      if (config.conditions?.sentimentThreshold) return "sentiment";
      return "event";
  }
  private generateFallbackResults(contextMessage?: string): ResearchResult[] { const r = contextMessage || "Analysis unavailable."; return [{ type: "insight", title: "Analysis Summary (Fallback)", summary: "Generated fallback summary.", content: { analysis: r }, sources: [], analysisMetadata: {} }]; }

  // --- WebSocket Helper (Keep as is) ---
  private broadcastToWs(payload: object): void { 
    if (!this.wss) return; 
    
    // Ensure agentId is always included
    const payloadWithId = {
      ...payload,
      // Only add agentId if it doesn't already exist
      ...(!(payload as any).agentId && { agentId: null })
    };
    
    const msg = JSON.stringify(payloadWithId); 
    log(`Broadcasting WS message: ${msg.substring(0, 100)}...`);
    
    this.wss.clients.forEach(c => { 
      if (c.readyState === WebSocket.OPEN) { 
        try { 
          c.send(msg); 
        } catch (e) { 
          console.error("WS broadcast err", e); 
        } 
      } 
    }); 
  }
  
  private broadcastStatus(message: string, agentId?: string | null): void { // Allow agentId to be null
    const payload: { type: string; message: string; agentId?: string | null } = {
        type: 'agent_status',
        message
    };
    if (agentId !== undefined) { // Check for undefined, allow null
        payload.agentId = agentId;
    }
    this.broadcastToWs(payload);
  }


  // --- MAIN RESEARCH DISPATCHER (Simplified) ---
  async performResearch(userId: number, preferenceId: number): Promise<{ agentId: string } | null> {
     log(`Dispatching OpenManus research for userId ${userId}, preferenceId ${preferenceId}.`);

     if (!this.isConfigured || !this.openManusConnector) {
         const errorMsg = "SentinelAgent is not configured for OpenManus. Check OPENMANUS_URL.";
         log(`Error: ${errorMsg}`);
         this.broadcastStatus(`ERROR: ${errorMsg}`);
         this.broadcastToWs({ type: 'task_error', data: errorMsg, files: [], suggestions: [] });
         // Return null or throw error to indicate failure
         // Returning null might be better handled by the route
         return null;
     }

    // Renamed from performOpenManusResearch
    this.broadcastStatus(`Initializing OpenManus research for preference ID: ${preferenceId}...`);
    let agentId: string | null = null;

    try {
      log(`Starting OpenManus research request for userId ${userId}, preferenceId ${preferenceId}`);

      // 1. Get Preference
      const preference = await db.query.researchPreferences.findFirst({
          where: and(eq(researchPreferences.id, preferenceId), eq(researchPreferences.userId, userId))
      });
      if (!preference) {
          throw new Error(`Preference ${preferenceId} not found for user ${userId}`);
      }
      log("Preference fetched.");

      // 2. Start Research via Connector
      agentId = await this.openManusConnector.startResearch(preference);

      // --- Store context mapping for result handling ---
      this.storeResearchContext(agentId, { userId, preferenceId });

      this.broadcastStatus(`OpenManus research initiated. Agent ID: ${agentId}. Waiting for updates...`, agentId);

      // --- Important ---
      // Return the agentId obtained from the connector
      return { agentId }; // Return object containing agentId

    } catch (error: unknown) { // Catch as unknown
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`Critical Error in OpenManus research initiation:`, errorMsg);
        this.broadcastStatus(`ERROR: ${errorMsg}`, agentId ?? undefined); // Broadcast error with agentId if available
        this.broadcastToWs({ type: 'task_error', data: errorMsg, agentId: agentId ?? undefined, files: [], suggestions: [] });
        // Clean up context if start failed
        if (agentId) this.clearResearchContext(agentId);
        // Throw the error so the route handler catches it
        throw error; // Re-throw the error
    }
    // Note: No finally block to close the connector here, as it's persistent and handles multiple agents.
    // Connection closure should be managed elsewhere (e.g., on server shutdown or if the agent explicitly finishes)
  }


  // --- Helper to handle final results (Keep as is) ---
  // TODO: Implement storage/retrieval for agent context
  private agentContextMap: Map<string, { userId: number; preferenceId: number }> = new Map();

  private storeResearchContext(agentId: string, context: { userId: number; preferenceId: number }): void {
     log(`Storing context for agent ${agentId}:`, context);
     this.agentContextMap.set(agentId, context);
  }

  private getResearchContext(agentId: string): { userId: number; preferenceId: number } | undefined {
      log(`Retrieving context for agent ${agentId}`);
      // Add check if agentId is null/undefined, though type should prevent it here now
      if (!agentId) return undefined;
      return this.agentContextMap.get(agentId);
  }

  private clearResearchContext(agentId: string): void {
      log(`Clearing context for agent ${agentId}`);
      this.agentContextMap.delete(agentId);
  }

 private async handleFinalResults(userId: number, preferenceId: number, results: ResearchResult[]): Promise<void> {
    try {
        // The results passed in here should now contain content/summary from files if they were read
        log(`Storing ${results.length} final results for user ${userId}, preference ${preferenceId} (Content included: ${results.some(r => !!r.content?.report)})`); 
         const stored = await this.storeResults(userId, preferenceId, results); 
         // Add IDs back to results if needed for alert checking
         const resultsWithIds = stored.map((dbResult, index) => ({
             ...results[index], // Original result data
             id: dbResult.id    // Add the ID from the database
         }));

        log(`Checking alert conditions for user ${userId}, preference ${preferenceId}`);
         await this.checkAlertConditions(userId, preferenceId, resultsWithIds); // Use results with IDs

        log(`Final result processing complete for user ${userId}, preference ${preferenceId}`);
         // Clean up context map after results are processed
         const agentId = [...this.agentContextMap.entries()].find(([id, ctx]) => ctx.userId === userId && ctx.preferenceId === preferenceId)?.[0];
         if (agentId) {
            this.clearResearchContext(agentId);
         } else {
             log(`Warning: Could not find agent ID to clear context after handling results for user ${userId}, pref ${preferenceId}`);
         }

     } catch (error: unknown) { // Catch as unknown
         const errorMsg = error instanceof Error ? error.message : String(error);
         log(`Error processing final results for user ${userId}, preference ${preferenceId}:`, errorMsg);
        // Decide how to handle storage/alert errors - broadcast an error?
         this.broadcastStatus(`ERROR processing final results: ${errorMsg}`);
          // Also try to clean up context map on error
         const agentId = [...this.agentContextMap.entries()].find(([id, ctx]) => ctx.userId === userId && ctx.preferenceId === preferenceId)?.[0];
         if (agentId) this.clearResearchContext(agentId);
    }
 }

} // End class SentinelAgent

export const sentinelAgent = new SentinelAgent();