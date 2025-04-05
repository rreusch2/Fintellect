import { Router } from "express";
import { ChatbotAgent } from "../services/ai/agents/ChatbotAgent.js";
import { DashboardInsightsAgent } from "../services/ai/agents/DashboardInsightsAgent.js";
import { thriveAgent } from "../services/ai/agents/ThriveAgent.js";
import { sentinelAgent } from "../services/ai/agents/SentinelAgent.js";
import { knowledgeStore } from "../services/ai/store/KnowledgeStore.js";
import { anthropic, MODEL_NAMES } from "../services/ai/config/anthropic.js";
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

// Get Thrive Expense Optimizer insights
router.get("/thrive/insights", async (req: AuthenticatedRequest, res) => {
  try {
    // Check for JWT auth first, then session auth
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      console.log("[AI] Thrive insights request without authentication");
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`[AI] Getting Thrive insights for user ${userId}`);
    const insights = await thriveAgent.getExpenseInsights(userId);
    console.log(`[AI] Generated ${insights.length} Thrive insights for user ${userId}`);
    res.json(insights);

  } catch (error: any) {
    console.error(`[AI] Error getting Thrive insights for user ${userId}:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to get expense optimization insights",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Get Sentinel research preferences
router.get("/sentinel/preferences", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`[AI] Getting Sentinel preferences for user ${userId}`);
    const preferences = await sentinelAgent.getUserPreferences(userId);
    res.json(preferences);
  } catch (error: any) {
    console.error(`[AI] Error getting Sentinel preferences:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to get research preferences",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Create or update Sentinel research preferences
router.post("/sentinel/preferences", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`[AI] Updating Sentinel preferences for user ${userId}`);
    const preference = await sentinelAgent.updateUserPreferences(userId, req.body);
    res.json(preference);
  } catch (error: any) {
    console.error(`[AI] Error updating Sentinel preferences:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to update research preferences",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Create or update Sentinel research schedule
router.post("/sentinel/schedules", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { preferenceId, ...scheduleData } = req.body;
    if (!preferenceId) {
      return res.status(400).json({ error: "Preference ID is required" });
    }

    console.log(`[AI] Creating/updating Sentinel schedule for user ${userId}`);
    const schedule = await sentinelAgent.scheduleResearch(userId, preferenceId, scheduleData);
    res.json(schedule);
  } catch (error: any) {
    console.error(`[AI] Error scheduling research:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to schedule research",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Run Sentinel research immediately (on-demand)
router.post("/sentinel/research", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { preferenceId } = req.body;
    if (!preferenceId) {
      return res.status(400).json({ error: "Preference ID is required" });
    }

    console.log(`[AI] Running Sentinel research for user ${userId}, preference ${preferenceId}`);
    const results = await sentinelAgent.performResearch(userId, preferenceId);
    res.json(results);
  } catch (error: any) {
    console.error(`[AI] Error running Sentinel research:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to run research",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Get recent Sentinel research results
router.get("/sentinel/results", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get limit parameter from query string, default to 10
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    console.log(`[AI] Getting recent Sentinel results for user ${userId}`);
    const results = await sentinelAgent.getRecentResults(userId, limit);
    res.json(results);
  } catch (error: any) {
    console.error(`[AI] Error getting Sentinel results:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to get research results",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Get recent Sentinel alerts
router.get("/sentinel/alerts", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get limit parameter from query string, default to 10
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    console.log(`[AI] Getting recent Sentinel alerts for user ${userId}`);
    const alerts = await sentinelAgent.getRecentAlerts(userId, limit);
    res.json(alerts);
  } catch (error: any) {
    console.error(`[AI] Error getting Sentinel alerts:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to get alerts",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Mark result as read
router.post("/sentinel/results/:id/read", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const resultId = parseInt(req.params.id);
    if (isNaN(resultId)) {
      return res.status(400).json({ error: "Invalid result ID" });
    }

    console.log(`[AI] Marking Sentinel result ${resultId} as read for user ${userId}`);
    const result = await sentinelAgent.markResultAsRead(userId, resultId);
    res.json(result);
  } catch (error: any) {
    console.error(`[AI] Error marking result as read:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to mark result as read",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Mark alert as read
router.post("/sentinel/alerts/:id/read", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.jwtPayload?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: "Invalid alert ID" });
    }

    console.log(`[AI] Marking Sentinel alert ${alertId} as read for user ${userId}`);
    const alert = await sentinelAgent.markAlertAsRead(userId, alertId);
    res.json(alert);
  } catch (error: any) {
    console.error(`[AI] Error marking alert as read:`, error?.message || error);
    res.status(500).json({ 
        error: "Failed to mark alert as read",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

export default router; 