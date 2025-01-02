import { Router, Request, Response } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { authenticateUser } from "../auth/middleware";

// Extend Express Request to include our user type
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email?: string | null;
      hasPlaidSetup: boolean;
      hasCompletedOnboarding: boolean;
      consentVersion: string | null;
    }
  }
}

export function registerUserRoutes(router: Router) {
  // User consent endpoint
  router.post("/user/consent", authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { termsVersion, privacyVersion, consentDate } = req.body;

      if (!termsVersion || !privacyVersion) {
        return res.status(400).json({ 
          message: "Terms version and privacy version are required" 
        });
      }

      // Update user's consent information
      await db.update(users)
        .set({
          consentVersion: termsVersion,
          legalConsent: {
            termsVersion,
            privacyVersion,
            consentDate
          }
        })
        .where(eq(users.id, req.user.id));

      // Return updated user data
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Error saving consent:", error);
      res.status(500).json({ 
        message: "Failed to save consent" 
      });
    }
  });

  // Complete onboarding endpoint
  router.post("/user/complete-onboarding", authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await db.update(users)
        .set({ hasCompletedOnboarding: true })
        .where(eq(users.id, req.user.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ 
        message: "Failed to complete onboarding" 
      });
    }
  });

  return router;
} 