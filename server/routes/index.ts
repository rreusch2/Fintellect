import { Router } from "express";
import plaidRoutes from "./plaid.js";
import { authenticateUser } from "../auth/middleware";
import type { Request, Response } from "express";

export function registerRoutes(app: any) {
  const router = Router();

  // Debug middleware for all API routes
  router.use((req: Request, res: Response, next) => {
    console.log('API Request:', {
      path: req.path,
      method: req.method,
      authenticated: req.isAuthenticated(),
      user: req.user,
      sessionID: req.sessionID
    });
    next();
  });

  // User routes
  router.get("/user", authenticateUser, (req: Request, res: Response) => {
    console.log('User route hit:', req.user);
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json(req.user);
  });

  // Mount the Plaid routes under /api/plaid and protect them with authentication
  router.use("/plaid", authenticateUser, plaidRoutes);

  // Mount all routes under /api
  app.use("/api", router);

  return app;
} 