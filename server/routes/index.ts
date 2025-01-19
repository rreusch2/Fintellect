import { Router } from "express";
import plaidRoutes from "./plaid.js";
import investmentRoutes from "./investment.js";
import { authenticateUser } from "../auth/middleware.js";
import { jwtAuth } from "../middleware/jwtAuth.js";

export function registerRoutes(app: any) {
  const router = Router();

  // Mount the Plaid routes under /api/plaid and protect them with JWT authentication
  router.use("/plaid", jwtAuth, plaidRoutes);

  // Mount the Investment routes under /api/investment
  router.use("/investment", authenticateUser, investmentRoutes);

  // Mount all routes under /api
  app.use("/api", router);

  return app;
} 