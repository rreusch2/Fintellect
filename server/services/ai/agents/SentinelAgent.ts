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


  // --- Event Handler for OpenManus Connector ---
  private setupOpenManusEventHandler(): void {
    if (!this.openManusConnector) return;

    const handler: OpenManusEventHandler = (event) => {
      // Reduced verbosity for final_result log
      if (event.type === 'final_result') {
        log(`[OpenManus Event Handler] Received event: type=${event.type}, agentId=${event.agentId}, resultsCount=${event.results?.length}, filesCount=${event.files?.length}, hasFileContents=${!!event.file_contents}`);
      } else {
        log(`[OpenManus Event Handler] Received event:`, event);
      }

      let payload: object | null = null;
      const agentId = event.agentId; // Extract agentId from event

      // Map OpenManus events to frontend WebSocket message types
      switch (event.type) {
        case 'status':
          payload = { type: 'agent_status', message: event.message, agentId };
          break;
        case 'terminal_output':
          // Map to stdout, could potentially differentiate stderr if OpenManus provides it
          payload = { type: 'terminal_stdout', data: event.content, agentId };
          break;
        case 'file_created':
        case 'file_updated':
           const fileMsg = `${event.type === 'file_created' ? 'Created' : 'Updated'} file: ${event.file.name}`;
           // Send as agent_status, potentially include file info if frontend needs it
           payload = { type: 'agent_status', message: fileMsg, agentId, file: event.file };
           break;
        case 'error':
           // Map OpenManus error to task_error for frontend
           payload = { type: 'task_error', data: event.message, agentId };
           break;
        case 'progress':
           // Send progress updates as agent_status
           payload = { type: 'agent_status', message: `Progress: ${event.step} (${event.percentage}%)`, agentId };
           break;
        case 'final_result':
            log(`Processing final results from OpenManus for agent ${agentId}`);
            const fileContents = event.file_contents || {}; // Get file contents if available

            // Map OpenManus results structure to ResearchResult interface
            let results: ResearchResult[] = (event.results || []).map((r: any) => ({
                type: r.type || 'report', // Default to 'report' if type is missing
                title: r.title || `Research Result ${new Date().toISOString()}`,
                summary: r.summary || '', // Use provided summary or default
                content: r.content || {}, // Use provided content or default
                sources: r.sources || [],
                analysisMetadata: r.analysisMetadata || {},
             }));

             // If no structured results from agent, try creating one from report files
             if (results.length === 0 && (fileContents['financial_research_summary.txt'] || fileContents['financial_research_report.txt'])) {
                 log(`No structured results found, creating one from file contents for agent ${agentId}`);
                 results.push({
                     type: 'report',
                     title: `OpenManus Research Report (${agentId})`,
                     summary: fileContents['financial_research_summary.txt'] || 'Summary not available.',
                     content: { report: fileContents['financial_research_report.txt'] || 'Report content not available.' },
                     sources: [], // No sources info in files
                     analysisMetadata: {}
                 });
             }
             // If structured results exist, augment with file contents if available
             else if (results.length > 0) {
                if (fileContents['financial_research_summary.txt']) {
                    results[0].summary = fileContents['financial_research_summary.txt']; // Override/set summary
                }
                if (fileContents['financial_research_report.txt']) {
                    // Add report text to content, preserving existing content
                    results[0].content = { ...(results[0].content || {}), report: fileContents['financial_research_report.txt'] };
                }
             }

            // Handle the processed results (store, check alerts, etc.)
            if (agentId) {
                const researchContext = this.getResearchContext(agentId);
                if (researchContext) {
                    const { userId, preferenceId } = researchContext;
                    // Send summary to frontend via WebSocket
                    const finalSummary = results[0]?.summary || `Agent ${agentId} completed. Insights: ${results.length}`;
                    this.broadcastToWs({ type: 'task_summary', data: finalSummary, files: event.files || [], suggestions: [], agentId });
                    // Process results asynchronously (store, alert check)
                    this.handleFinalResults(userId, preferenceId, results);
                } else {
                    log(`Error: Could not find context for agent ${agentId} to handle final results.`);
                    this.broadcastToWs({ type: 'task_error', data: `Internal Error: Missing context for agent ${agentId}`, agentId });
                }
            } else {
                 log(`Error: Received final_result event with null agentId.`);
                 this.broadcastToWs({ type: 'task_error', data: `Internal Error: Received final_result without agentId`, agentId: null });
            }
             // Don't set payload here; final actions handled by handleFinalResults
             break;

        default:
           // Handle unexpected event types
           const unhandledEvent = event as any;
           log(`Unhandled OpenManus event type: ${unhandledEvent.type}`);
           payload = { type: 'system_info', data: `Received unhandled OpenManus event: ${JSON.stringify(unhandledEvent)}`, agentId };
      }

      // Broadcast mapped event to frontend WebSocket clients
      if (payload) {
        this.broadcastToWs(payload);
      }
    };

    // Register the handler with the connector
    this.openManusConnector.onEvent(handler);
    log("OpenManus event handler set up.");
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

} // End class SentinelAgent

// Export a singleton instance
export const sentinelAgent = new SentinelAgent();