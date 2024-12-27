import { Router } from "express";
import plaidRoutes from "./plaid.js";
import { authenticateUser } from "../auth/middleware";
import type { Request, Response } from "express";

export function registerRoutes(app: any) {
  const router = Router();

  // User routes
  router.get("/user", authenticateUser, (req: Request, res: Response) => {
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