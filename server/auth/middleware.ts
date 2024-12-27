import { type Request, type Response, type NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    hasCompletedOnboarding: boolean;
    hasPlaidSetup: boolean;
  };
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function requireOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.hasCompletedOnboarding) {
    return res.redirect('/onboarding');
  }
  next();
} 