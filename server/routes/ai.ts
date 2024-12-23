import { Router } from "express";
import { generateFinancialInsights, chatWithAI, generateSavingsTips } from "../services/ai";
import { db } from "@db";
import { plaidTransactions } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import type { AuthenticatedRequest } from "../auth";

const router = Router();

router.post("/chat", async (req: AuthenticatedRequest, res) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const { message } = req.body;
    const response = await chatWithAI(message, req.user.id);
    res.json(response);
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

router.get("/insights", async (req: AuthenticatedRequest, res) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const transactions = await db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.userId, req.user.id))
      .orderBy(desc(plaidTransactions.date))
      .limit(30);

    const insights = await generateFinancialInsights(transactions);
    res.json(insights);
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

router.get("/savings-tips", async (req: AuthenticatedRequest, res) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const tips = await generateSavingsTips(req.user.id);
    res.json(tips);
  } catch (error) {
    console.error("Error generating savings tips:", error);
    res.status(500).json({ 
      error: "Failed to generate savings tips",
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
});

export default router; 