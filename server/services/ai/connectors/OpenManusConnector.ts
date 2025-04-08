import type { SelectResearchPreference } from "@db/sentinel-schema";
import { WebSocket } from 'ws'; // Assuming usage of ws library
import type { ResearchResult } from "../agents/SentinelAgent"; // Adjust path if necessary

// Define types for WebSocket messages (align with Python service)
type OpenManusEvent =
  | { type: 'status'; message: string }
  | { type: 'terminal_output'; content: string }
  | { type: 'file_created' | 'file_updated'; file: { name: string; content?: string } }
  | { type: 'error'; message: string }
  | { type: 'progress'; percentage: number; step: string } // Example
  | { type: 'browser_state'; data: string; base64_image?: string } // Add this for browser state
  | { type: 'final_result'; results: ResearchResult[]; files?: { name: string; path: string }[]; file_contents?: { [filename: string]: string } };

export type OpenManusEventHandler = (event: OpenManusEvent & { agentId: string | null }) => void;

const log = (message: string, ...args: any[]) => console.log(`[OpenManusConnector] ${message}`, ...args);

export class OpenManusConnector {
  private baseUrl: string;
  private agentId: string | null = null;
  private socket: WebSocket | null = null;
  private eventHandlers: OpenManusEventHandler[] = [];

  constructor(baseUrl: string) {
    // Ensure baseUrl doesn't end with a slash
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    log(`Initialized with base URL: ${this.baseUrl}`);
  }

  // Method to add event listeners
  public onEvent(handler: OpenManusEventHandler): void {
    this.eventHandlers.push(handler);
  }

  // Method to remove event listeners (optional, good practice)
  public offEvent(handler: OpenManusEventHandler): void {
    this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
  }

  // Internal method to emit events to all listeners
  private emitEvent(event: OpenManusEvent): void {
    // Add agentId to the event for context
    const eventWithId = { ...event, agentId: this.agentId };
    log(`Emitting event for agent ${this.agentId}:`, eventWithId);
    this.eventHandlers.forEach(handler => {
        try {
            handler(eventWithId);
        } catch (error) {
            log("[OpenManusConnector] Error in event handler:", error);
        }
    });
  }

  // Helper function for fetch with retry
  private async fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        log(`Attempt ${i + 1} to fetch ${url}`);
        const response = await fetch(url, options);
        // Optional: Check for specific server errors to retry on (e.g., 5xx)
        // if (!response.ok && response.status >= 500) throw new Error(`Server error: ${response.status}`);
        return response; // Success
      } catch (error: any) {
        log(`Fetch attempt ${i + 1} failed: ${error.message}`);
        if (i === retries - 1) {
           log(`Fetch failed after ${retries} attempts.`);
           throw error; // Rethrow error after last attempt
        }
        // Check if it's a connection error likely due to service not ready
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            log(`Connection refused, retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        } else {
            throw error; // Rethrow other errors immediately
        }
      }
    }
    // Should not be reached, but satisfies TypeScript
    throw new Error("Fetch retry logic failed unexpectedly");
  }

  public async startResearch(preference: SelectResearchPreference): Promise<string> {
    log(`Starting research for preference ID: ${preference.id}`);
    const prompt = this.buildPromptFromPreference(preference);
    const url = `${this.baseUrl}/api/research/start`;
    const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    };

    try {
      log(`Attempting to start research via POST to ${url}`);
      // Use fetchWithRetry
      const response = await this.fetchWithRetry(url, options);

      if (!response.ok) {
        const errorBody = await response.text();
        log(`Failed to start research. Status: ${response.status}, Body: ${errorBody}`);
        throw new Error(`Failed to start research: ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      if (!data.agent_id) {
        log("No agent_id received from server.");
        throw new Error('No agent_id received from server');
      }
      this.agentId = data.agent_id;
      log(`Research started with agent ID: ${this.agentId}`);

      this.connectWebSocket();

      return this.agentId;
    } catch (error) {
      log("Error in startResearch:", error);
      // Ensure the error is re-thrown so SentinelAgent can catch it
      throw error;
    }
  }

  private connectWebSocket(): void {
    if (!this.agentId) {
      log("[OpenManusConnector] Cannot connect WebSocket without agentId.");
      return;
    }

    // Close existing socket if any
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        log("[OpenManusConnector] Closing existing WebSocket connection.");
        this.socket.close();
    }

    const wsUrl = `${this.baseUrl.replace(/^http/, 'ws')}/ws/agent/${this.agentId}`;
    log(`Connecting WebSocket to: ${wsUrl}`);

    try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          log(`WebSocket connected for agent ID: ${this.agentId}`);
          this.emitEvent({ type: 'status', message: 'Connected to agent stream.' });
        };

        this.socket.onmessage = (event) => {
          try {
            const messageData = typeof event.data === 'string' ? event.data : event.data.toString();
            log(`Raw WebSocket message received:`, messageData);
            const parsedData = JSON.parse(messageData) as OpenManusEvent;
            // Emit the parsed event
            this.emitEvent(parsedData);
          } catch (e) {
            log("[OpenManusConnector] Failed to parse WebSocket message:", e, "Raw data:", event.data);
            this.emitEvent({ type: 'error', message: `Failed to parse message: ${event.data}` });
          }
        };

        this.socket.onerror = (error) => {
          log(`WebSocket error for agent ID ${this.agentId}:`, error);
          this.emitEvent({ type: 'error', message: `WebSocket connection error: ${error.message}` });
          // Attempt to reconnect or notify?
        };

        this.socket.onclose = (event) => {
          log(`WebSocket closed for agent ID ${this.agentId}. Code: ${event.code}, Reason: ${event.reason}`);
          this.emitEvent({ type: 'status', message: `Disconnected from agent stream (Code: ${event.code})` });
          this.socket = null; // Clear the socket reference
          // Maybe attempt reconnection here if needed
        };
    } catch (error) {
        log(`Failed to create WebSocket connection:`, error);
        this.emitEvent({ type: 'error', message: `Failed to establish WebSocket connection: ${error.message}` });
    }
  }

  // Placeholder: Convert Fintellect preference object to a natural language prompt for OpenManus
  // This will likely need significant refinement based on how OpenManus expects prompts.
  private buildPromptFromPreference(preference: SelectResearchPreference): string {
    log("[OpenManusConnector] Building prompt from preference:", preference);
    let prompt = `Perform financial research based on the following preferences:
`;
    if (preference.topics?.length) {
      prompt += `- Topics: ${preference.topics.join(', ')}
`;
    }
    if (preference.keywords?.length) {
      prompt += `- Keywords: ${preference.keywords.join(', ')}
`;
    }
    if (preference.assetClasses?.length) {
      prompt += `- Asset Classes: ${preference.assetClasses.join(', ')}
`;
    }
    if (preference.specificAssets?.tickers?.length) {
      prompt += `- Specific Tickers: ${preference.specificAssets.tickers.join(', ')}
`;
    }
    // Include data sources and analysis types if needed by OpenManus prompt
    if (preference.dataSources) {
        const enabledSources = Object.entries(preference.dataSources)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key);
        if (enabledSources.length > 0) {
            prompt += `- Data Sources: ${enabledSources.join(', ')}
`;
        }
    }
     if (preference.analysisTypes) {
        const enabledAnalyses = Object.entries(preference.analysisTypes)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key);
        if (enabledAnalyses.length > 0) {
            prompt += `- Analysis Types: ${enabledAnalyses.join(', ')}
`;
        }
    }
    if (preference.customInstructions) {
      prompt += `- Custom Instructions: ${preference.customInstructions}
`;
    }
    prompt += `
Please provide detailed findings, including data processing steps, generated files (like charts or reports), and a final summary of insights.`;

    log("[OpenManusConnector] Generated prompt:", prompt);
    return prompt;
  }

  // Method to send commands to the agent via WebSocket (if supported by OpenManus service)
  public sendCommand(command: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      log(`Sending command to agent ${this.agentId}: ${command}`);
      // Structure the command as needed by the OpenManus WebSocket handler
      this.socket.send(JSON.stringify({ type: 'command', payload: command }));
    } else {
      log("[OpenManusConnector] Cannot send command: WebSocket not connected or not open.");
    }
  }

  // Method to explicitly close the connection
  public closeConnection(): void {
    if (this.socket) {
        log(`Explicitly closing WebSocket connection for agent ${this.agentId}`);
        this.socket.close();
        this.socket = null;
    }
    this.agentId = null;
    this.eventHandlers = []; // Clear handlers on close
  }
} 