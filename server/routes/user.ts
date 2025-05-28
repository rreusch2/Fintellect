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
      console.log('User consent request received. Auth status:', {
        isAuthenticated: req.isAuthenticated(),
        sessionID: req.sessionID,
        userId: req.user?.id
      });
      
      if (!req.user?.id) {
        console.error('User consent failed: Not authenticated');
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { termsVersion, privacyVersion, consentDate } = req.body;
      console.log('Consent data received:', { termsVersion, privacyVersion, consentDate });

      if (!termsVersion || !privacyVersion) {
        console.error('User consent failed: Missing required fields');
        return res.status(400).json({ 
          message: "Terms version and privacy version are required" 
        });
      }

      // Update user's consent information
      console.log('Updating consent for user:', req.user.id);
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

      console.log('Consent updated successfully for user:', req.user.id);
      
      // Save the session to ensure changes are persisted
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session after consent update:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log('Session saved after consent update. Session ID:', req.sessionID);
        res.json({ user: updatedUser });
      });
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
      console.log('Complete onboarding request received. Auth status:', {
        isAuthenticated: req.isAuthenticated(),
        sessionID: req.sessionID,
        userId: req.user?.id
      });
      
      if (!req.user?.id) {
        console.error('Complete onboarding failed: Not authenticated');
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log('Completing onboarding for user:', req.user.id);
      await db.update(users)
        .set({ hasCompletedOnboarding: true })
        .where(eq(users.id, req.user.id));

      // Get updated user data
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      console.log('Onboarding completed successfully for user:', req.user.id);
      
      // Save the session to ensure changes are persisted
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session after onboarding completion:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log('Session saved after onboarding completion. Session ID:', req.sessionID);
        res.json({ 
          success: true,
          user: updatedUser
        });
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ 
        message: "Failed to complete onboarding" 
      });
    }
  });

  return router;
} 