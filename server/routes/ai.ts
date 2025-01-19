import { Router } from "express";
import { ChatbotAgent } from "../services/ai/agents/ChatbotAgent.js";
import { DashboardInsightsAgent } from "../services/ai/agents/DashboardInsightsAgent.js";
import { knowledgeStore } from "../services/ai/store/KnowledgeStore.js";
import { genAI } from "../services/ai/config/gemini.js";
import type { Request } from "express";
import type { JWTPayload } from "../middleware/jwtAuth.js";

// Extend Request type to include both JWT and session auth
interface AuthenticatedRequest extends Request {
  jwtPayload?: JWTPayload;
  user?: {
    id: number;
    [key: string]: any;
  };
}

const router = Router();
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const dashboardAgent = new DashboardInsightsAgent();
const chatbotAgent = new ChatbotAgent(model, knowledgeStore, dashboardAgent);

// Get AI insights for dashboard
router.get("/insights", async (req: AuthenticatedRequest, res) => {
  try {
    // Check for JWT auth first
    if (!req.jwtPayload?.userId) {
      // Fall back to session auth
      if (!req.user?.id) {
        console.log("[AI] Insights request without authentication");
        return res.status(401).json({ error: "Not authenticated" });
      }
    }

    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
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

// Chat with AI assistant
router.post("/chat", async (req: AuthenticatedRequest, res) => {
  try {
    // Check for JWT auth first
    if (!req.jwtPayload?.userId) {
      // Fall back to session auth
      if (!req.user?.id) {
        console.log("[AI] Chat request without authentication");
        return res.status(401).json({ error: "Not authenticated" });
      }
    }

    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
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

export default router; 