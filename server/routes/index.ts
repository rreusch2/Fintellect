import { Router } from "express";
import plaidRoutes from "./plaid.js";
import investmentRoutes from "./investment.js";
import aiRoutes from "./ai.js";
import { authenticateUser } from "../auth/middleware.js";
import { jwtAuth } from "../middleware/jwtAuth.js";

export function registerRoutes(app: any) {
  const router = Router();

  // Mount the Plaid routes under /api/plaid and protect them with JWT authentication
  router.use("/plaid", (req, res, next) => {
    // Check if it's a mobile request (has Authorization header)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return jwtAuth(req, res, next);
    }
    // For web requests, continue with session auth
    next();
  }, plaidRoutes);

  // Mount the AI routes under /api/ai with similar auth handling
  router.use("/ai", (req, res, next) => {
    // Check if it's a mobile request (has Authorization header)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return jwtAuth(req, res, next);
    }
    // For web requests, continue with session auth
    next();
  }, aiRoutes);

  // Mount the Investment routes under /api/investment
  router.use("/investment", authenticateUser, investmentRoutes);

  // Mount all routes under /api
  app.use("/api", router);

  return app;
} 