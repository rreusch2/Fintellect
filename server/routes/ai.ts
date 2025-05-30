import { Router } from "express";
import { ChatbotAgent } from "../services/ai/agents/ChatbotAgent.js";
import { DashboardInsightsAgent } from "../services/ai/agents/DashboardInsightsAgent.js";
import { knowledgeStore } from "../services/ai/store/KnowledgeStore.js";
import { anthropic, MODEL_NAMES } from "../services/ai/config/anthropic.js";
import { mcpAgentManager } from "../services/ai/mcp/agent_manager.js";
import type { Request } from "express";
import type { JWTPayload } from "../middleware/jwtAuth.js";

// Extend Request type to include both JWT and session auth
interface AuthenticatedRequest extends Request {
  jwtPayload?: JWTPayload;
  user?: {
    id: number;
    username?: string;
    hasPlaidSetup?: boolean;
    hasCompletedOnboarding?: boolean;
    [key: string]: any;
  };
}

const router = Router();
const model = anthropic;
const dashboardAgent = new DashboardInsightsAgent();
const chatbotAgent = new ChatbotAgent(model, knowledgeStore, dashboardAgent);

// Get AI insights for dashboard
router.get("/insights", async (req: AuthenticatedRequest, res) => {
  try {
    // Check for JWT auth first
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      console.log("[AI] Insights request without authentication");
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`[AI] Getting insights for user ${userId}`);
    const insights = await dashboardAgent.getInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Error getting AI insights:", error);
    res.status(500).json({ error: "Failed to get AI insights" });
  }
});

// Get dashboard insights
router.get("/dashboard-insights", async (req: AuthenticatedRequest, res) => {
  try {
    // Check for JWT auth first
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      console.log("[AI] Dashboard insights request without authentication");
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`[AI] Getting dashboard insights for user ${userId}`);
    const insights = await dashboardAgent.getInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Error getting dashboard insights:", error);
    res.status(500).json({ error: "Failed to get dashboard insights" });
  }
});

// Chat with AI assistant
router.post("/chat", async (req: AuthenticatedRequest, res) => {
  try {
    // Check for JWT auth first
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      console.log("[AI] Chat request without authentication");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`[AI] Processing chat message for user ${userId}:`, message);
    const response = await chatbotAgent.chat(userId, message);
    console.log(`[AI] Response:`, response);
    
    res.json({ message: response });
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ 
      error: "Failed to process chat message",
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
});

// MCP Agent routes
router.post("/mcp/thrive", async (req: AuthenticatedRequest, res) => {
  try {
    // Initialize MCP Agent Manager if not already initialized
    await mcpAgentManager.initialize();
    
    // Call the Thrive agent handler
    return mcpAgentManager.handleThriveRequest()(req, res);
  } catch (error) {
    console.error("Error in Thrive agent:", error);
    res.status(500).json({ 
      error: "Failed to process expense optimization request",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ messages: conversation.messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get workspace files for a conversation
router.get('/conversations/:conversationId/workspace/files', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    // This would integrate with your sandbox/file system
    // For now, return mock data that would come from the sandbox
    const mockFiles = [
      {
        name: 'market_analysis.py',
        path: '/workspace/market_analysis.py',
        size: 1110,
        modified: new Date().toISOString(),
        content: '# Market Analysis Script\nimport yfinance as yf\nimport pandas as pd\n\n# Fetch market data\nprint("Analyzing market conditions...")\n'
      }
    ];
    
    res.json({ files: mockFiles });
  } catch (error) {
    console.error('Error fetching workspace files:', error);
    res.status(500).json({ error: 'Failed to fetch workspace files' });
  }
});

export default router; 