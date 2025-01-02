import { Router } from "express";
import { authenticateUser } from "../auth/middleware.js";
import { InvestmentStrategyAgent } from "../services/ai/agents/InvestmentStrategyAgent.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();
const investmentAgent = new InvestmentStrategyAgent();

// Get investment advice
router.get("/advice", authenticateUser, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get user's investment profile from DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    console.log("Fetching advice for user:", req.user.id, "Profile:", user?.investmentProfile);

    const advice = await investmentAgent.getInvestmentAdvice(req.user.id, user?.investmentProfile);
    res.json(advice);
  } catch (error) {
    console.error("Error getting investment advice:", error);
    res.status(500).json({ 
      error: "Failed to get investment advice",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Update investment profile
router.post("/profile", authenticateUser, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const profile = req.body;
    console.log("Updating profile for user:", req.user.id, "New profile:", profile);

    // Validate profile data
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({ error: "Invalid profile data" });
    }

    if (
      typeof profile.riskTolerance !== "number" ||
      profile.riskTolerance < 1 ||
      profile.riskTolerance > 10
    ) {
      return res.status(400).json({ error: "Invalid risk tolerance" });
    }

    if (!profile.investmentGoal || typeof profile.investmentGoal !== "string") {
      return res.status(400).json({ error: "Investment goal is required" });
    }

    if (!profile.investmentTimeframe || typeof profile.investmentTimeframe !== "string") {
      return res.status(400).json({ error: "Investment timeframe is required" });
    }

    if (!Array.isArray(profile.preferredSectors) || profile.preferredSectors.length === 0) {
      return res.status(400).json({ error: "At least one preferred sector is required" });
    }

    // Update user's investment profile in database
    try {
      const result = await db
        .update(users)
        .set({ 
          investmentProfile: profile,
          updatedAt: new Date()
        })
        .where(eq(users.id, req.user.id))
        .returning({ id: users.id, profile: users.investmentProfile });

      console.log("Update result:", result);

      if (!result.length) {
        throw new Error("No rows affected");
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Failed to update profile in database" });
    }

    // Get updated investment advice with the new profile
    try {
      const advice = await investmentAgent.getInvestmentAdvice(req.user.id, profile);
      res.json({
        message: "Profile updated successfully",
        advice
      });
    } catch (aiError) {
      console.error("AI advice error:", aiError);
      // Still return success even if AI advice fails
      res.json({
        message: "Profile updated successfully",
        advice: null
      });
    }
  } catch (error) {
    console.error("Error updating investment profile:", error);
    res.status(500).json({ 
      error: "Failed to update investment profile",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

export default router; 