import { Router } from "express";
import plaidRoutes from "./plaid.js";
import investmentRoutes from "./investment.js";
import { authenticateUser } from "../auth/middleware";

export function registerRoutes(app: any) {
  const router = Router();

  // Mount the Plaid routes under /api/plaid and protect them with authentication
  router.use("/plaid", authenticateUser, plaidRoutes);

  // Mount the Investment routes under /api/investment
  router.use("/investment", authenticateUser, investmentRoutes);

  // Mount all routes under /api
  app.use("/api", router);

  return app;
} 