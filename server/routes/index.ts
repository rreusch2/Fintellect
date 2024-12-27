import { Router } from "express";
import plaidRoutes from "./plaid.js";
import { authenticateUser } from "../auth/middleware";

export function registerRoutes(app: any) {
  const router = Router();

  // Mount the Plaid routes under /api/plaid and protect them with authentication
  router.use("/plaid", authenticateUser, plaidRoutes);

  // Mount all routes under /api
  app.use("/api", router);

  return app;
} 