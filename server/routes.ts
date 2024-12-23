import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { users, goals, budgets, plaidTransactions } from "@db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { insertUserSchema,  plaidAccounts, plaidItems,  type SelectGoal } from "@db/schema";
import { generateFinancialInsights, chatWithAI } from "./services/ai";
import { setupAuth } from "./auth";
import { financialAdvisor } from "./services/ai/agents/FinancialAdvisorAgent";
import { investmentAdvisor } from "./services/ai/agents/InvestmentStrategyAgent";
import { budgetAnalyst } from "./services/ai/agents/BudgetAnalysisAgent";
import passport from "passport";
import { IVerifyOptions } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { PlaidService } from "./services/plaid";
import plaidRouter from "./routes/plaid";
import { dashboardInsights } from "./services/ai/agents/DashboardInsightsAgent";


const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
};

export function registerRoutes(app: Express): Server {
  // Setup authentication middleware and routes
  setupAuth(app);

  // Mount the Plaid router
  app.use("/api/plaid", plaidRouter);

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, result.data.username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Hash the password before storing
      const hashedPassword = await crypto.hash(result.data.password);

      // Create the new user
      const [newUser] = await db
        .insert(users)
        .values({
          username: result.data.username,
          password: hashedPassword,
        })
        .returning();

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            hasCompletedOnboarding: newUser.hasCompletedOnboarding,
            hasPlaidSetup: newUser.hasPlaidSetup,
          },
        });
      });
    } catch (error) {
      if ((error as any)?.code === '23505') {
        return res.status(400).send("Username already exists");
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            hasCompletedOnboarding: user.hasCompletedOnboarding,
            hasPlaidSetup: user.hasPlaidSetup,
            monthlyIncome: user.monthlyIncome,
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });

  // Goals routes
  // Update monthly income and onboarding status
  app.post("/api/user/income", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const { monthlyIncome } = req.body;
      
      if (!monthlyIncome || isNaN(parseFloat(monthlyIncome))) {
        return res.status(400).send("Invalid monthly income");
      }

      const incomeInCents = Math.round(parseFloat(monthlyIncome) * 100);

      // First check if the user has already completed onboarding
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      if (existingUser && existingUser.hasCompletedOnboarding) {
        return res.json({
          message: "User has already completed onboarding",
          user: {
            id: existingUser.id,
            username: existingUser.username,
            monthlyIncome: existingUser.monthlyIncome,
            hasCompletedOnboarding: existingUser.hasCompletedOnboarding,
            hasPlaidSetup: existingUser.hasPlaidSetup,
            onboardingStep: existingUser.onboardingStep
          }
        });
      }

      // If not completed onboarding, update the income
      const [updatedUser] = await db
        .update(users)
        .set({
          monthlyIncome: incomeInCents,
          onboardingStep: 2,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      
      res.json({
        message: "Monthly income updated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          monthlyIncome: updatedUser.monthlyIncome,
          hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
          hasPlaidSetup: updatedUser.hasPlaidSetup,
          onboardingStep: updatedUser.onboardingStep
        }
      });
    } catch (error) {
      console.error("Error updating monthly income:", error);
      res.status(500).json({
        error: "Failed to update monthly income",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      });
    }
  });

  // Add endpoint to complete onboarding after Plaid setup
  app.post("/api/user/complete-onboarding", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          hasCompletedOnboarding: true,
          onboardingStep: 3,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.json({
        message: "Onboarding completed successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          monthlyIncome: updatedUser.monthlyIncome,
          hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
          hasPlaidSetup: updatedUser.hasPlaidSetup,
          onboardingStep: updatedUser.onboardingStep
        }
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({
        error: "Failed to complete onboarding",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });
  app.get("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const userGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, req.user.id))
        .orderBy(desc(goals.createdAt));
      
      res.json(userGoals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).send("Failed to fetch goals");
    }
  });

  app.post("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const goalData = {
        userId: req.user.id,
        name: req.body.name,
        type: req.body.type || "savings",
        targetAmount: Math.round(parseFloat(req.body.targetAmount) * 100), // Convert to cents
        currentAmount: Math.round(parseFloat(req.body.currentAmount || 0) * 100),
        deadline: req.body.deadline ? new Date(req.body.deadline) : null,
        status: "in_progress",
        category: req.body.category || "general",
        description: req.body.description || "",
        aiSuggestions: req.body.aiSuggestions || [],
      };

      const [newGoal] = await db
        .insert(goals)
        .values(goalData)
        .returning();
      
      res.json(newGoal);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      res.status(500).json({ 
        error: "Failed to create goal",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // Update goal progress
  app.post("/api/goals/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const goalId = parseInt(req.params.id);
      const amount = req.body.amount;

      if (isNaN(goalId) || isNaN(amount)) {
        return res.status(400).send("Invalid goal ID or amount");
      }

      
      // Get the current goal
      const [goal] = await db
        .select()
        .from(goals)
        .where(and(
          eq(goals.id, goalId),
          eq(goals.userId, req.user.id)
        ))
        .limit(1);

      if (!goal) {
        return res.status(404).send("Goal not found");
      }

      // Update the goal progress
      const newAmount = goal.currentAmount + amount;
      const [updatedGoal] = await db
        .update(goals)
        .set({ 
          currentAmount: newAmount,
          status: newAmount >= goal.targetAmount ? "completed" : "in_progress",
          updatedAt: new Date()
        })
        .where(eq(goals.id, goalId))
        .returning();
      
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating goal progress:", error);
      res.status(500).send("Failed to update goal progress");
    }
  });

  // Plaid Routes
  app.post("/api/plaid/create-link-token", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not logged in" });
    }

    try {
      const linkToken = await PlaidService.createLinkToken(req.user.id);
      res.json({ link_token: linkToken });
    } catch (error: any) {
      console.error("Error creating link token:", error);
      res.status(500).json({ 
        error: error.message || "Failed to create link token",
        details: process.env.NODE_ENV === "development" ? error.response?.data : undefined
      });
    }
  });

  app.post("/api/plaid/set-access-token", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not logged in" });
    }

    try {
      const { public_token, institution } = req.body;

      if (!public_token || !institution) {
        return res.status(400).json({ 
          error: "Missing required fields",
          details: {
            public_token: !public_token,
            institution: !institution
          }
        });
      }

      const plaidItem = await PlaidService.exchangePublicToken(
        req.user.id,
        public_token,
        institution.institution_id,
        institution.name
      );

      // Update user's Plaid setup status
      await db
        .update(users)
        .set({ hasPlaidSetup: true })
        .where(eq(users.id, req.user.id));

      res.json({ 
        success: true,
        plaidItem: {
          id: plaidItem.id,
          institutionName: plaidItem.plaidInstitutionName
        }
      });
    } catch (error: any) {
      console.error("Error setting access token:", error);
      
      // Check for specific Plaid API errors
      if (error.response?.data) {
        const plaidError = error.response.data;
        console.error("Plaid error details:", plaidError);
        
        return res.status(500).json({
          error: plaidError.error_message || "Failed to connect bank account",
          code: plaidError.error_code,
          type: plaidError.error_type,
          details: process.env.NODE_ENV === "development" ? plaidError : undefined
        });
      }

      res.status(500).json({ 
        error: error.message || "Failed to set access token",
        details: process.env.NODE_ENV === "development" ? error : undefined
      });
    }
  });

  app.get("/api/plaid/accounts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      // Get active accounts with their associated Plaid items
      const accounts = await db
        .select({
          id: plaidAccounts.id,
          name: plaidAccounts.name,
          mask: plaidAccounts.mask,
          type: plaidAccounts.type,
          subtype: plaidAccounts.subtype,
          currentBalance: plaidAccounts.currentBalance,
          institution: plaidItems.plaidInstitutionName,
        })
        .from(plaidAccounts)
        .innerJoin(plaidItems, eq(plaidAccounts.plaidItemId, plaidItems.id))
        .where(
          and(
            eq(plaidAccounts.userId, req.user.id),
            eq(plaidAccounts.status, "active")
          )
        )
        .orderBy(desc(plaidAccounts.createdAt));

      res.json(accounts);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({
        error: "Failed to fetch accounts",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  app.get("/api/plaid/transactions/summary", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      // First check if user has Plaid setup
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      if (!user?.hasPlaidSetup) {
        return res.json({
          hasPlaidConnection: false,
          transactions: [],
          accounts: [],
          totalBalance: 0,
          monthlySpending: 0,
          monthlySavings: 0,
          monthOverMonthChange: 0,
          categoryTotals: {}
        });
      }

      // Get transactions with account details
      const transactions = await db
        .select({
          id: plaidTransactions.id,
          amount: plaidTransactions.amount,
          category: plaidTransactions.category,
          subcategory: plaidTransactions.subcategory,
          description: plaidTransactions.description,
          date: plaidTransactions.date,
          merchantName: plaidTransactions.merchantName,
          accountName: plaidAccounts.name,
          accountType: plaidAccounts.type,
        })
        .from(plaidTransactions)
        .innerJoin(plaidAccounts, eq(plaidTransactions.accountId, plaidAccounts.id))
        .where(eq(plaidTransactions.userId, req.user.id))
        .orderBy(desc(plaidTransactions.date));

      // Get the current date boundaries
      const now = new Date();
      const currentMonth = now.getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const currentYear = now.getFullYear();
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Filter transactions by month
      const currentMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const lastMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      });

      // Calculate totals (amounts are stored in cents)
      const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate month-over-month change
      const monthOverMonthChange = lastMonthTotal === 0 ? 0 :
        ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

      // Calculate savings (negative transactions are income)
      const monthlySavings = currentMonthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Get total balance from active accounts
      const accounts = await db
        .select({
          id: plaidAccounts.id,
          currentBalance: plaidAccounts.currentBalance,
          type: plaidAccounts.type,
          name: plaidAccounts.name,
        })
        .from(plaidAccounts)
        .where(
          and(
            eq(plaidAccounts.userId, req.user.id),
            eq(plaidAccounts.status, "active")
          )
        );

      const totalBalance = accounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0);

      // Group transactions by category for the current month
      const categoryTotals = currentMonthTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      // Add hasPlaidConnection to the response
      res.json({
        hasPlaidConnection: true,
        totalBalance,
        monthlySpending: Math.abs(currentMonthTotal),
        monthlySavings,
        monthOverMonthChange,
        categoryTotals,
        accounts: accounts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.currentBalance || 0
        })),
        transactions: transactions.slice(0, 50).map(t => ({
          id: t.id,
          amount: t.amount,
          category: t.category,
          subcategory: t.subcategory,
          description: t.description,
          date: t.date.toISOString(),
          merchantName: t.merchantName,
          accountName: t.accountName,
          accountType: t.accountType
        }))
      });
    } catch (error: any) {
      console.error("Error fetching transaction summary:", error);
      res.status(500).json({
        error: "Failed to fetch transaction summary",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        hasPlaidConnection: false // Default to false on error
      });
    }
  });

  // AI Chat route
  app.post("/api/ai/chat", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).send("Message is required");
      }

      const response = await chatWithAI(message, req.user.id);
      res.json(response);
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).send("Failed to process AI chat request");
    }
  });

  // AI Insights route
  app.get("/api/ai/insights", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const recentTransactions = await db
        .select()
        .from(plaidTransactions)
        .where(eq(plaidTransactions.userId, req.user.id))
        .orderBy(desc(plaidTransactions.date))
        .limit(20);

      const insights = await generateFinancialInsights(recentTransactions);
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json([
        {
          type: "tip",
          title: "AI Insights Temporarily Unavailable",
          description: "We're working on generating your personalized insights. Please check back soon.",
        },
      ]);
    }
  });
  // New AI Financial Advisor endpoint
  // Budget Management Routes
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const userBudgets = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, req.user.id))
        .orderBy(desc(budgets.createdAt));

      res.json(userBudgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).send("Failed to fetch budgets");
    }
  });

  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const budgetData = {
        userId: req.user.id,
        name: req.body.name,
        period: req.body.period || "monthly",
        startDate: new Date(),
        category: req.body.category,
        limit: Math.round(parseFloat(req.body.limit) * 100), // Convert to cents
        alertThreshold: req.body.alertThreshold || 80,
        isActive: true
      };

      const [newBudget] = await db
        .insert(budgets)
        .values(budgetData)
        .returning();

      res.json(newBudget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(500).send("Failed to create budget");
    }
  });

  app.get("/api/budgets/summary", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      // Get all active budgets
      const userBudgets = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, req.user.id),
            eq(budgets.isActive, true)
          )
        );

      // Get current month's transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const transactions = await db
        .select()
        .from(plaidTransactions)
        .where(
          and(
            eq(plaidTransactions.userId, req.user.id),
            gte(plaidTransactions.date, startOfMonth)
          )
        );

      // Calculate current spending for each budget
      const budgetSummaries = userBudgets.map(budget => {
        const spending = transactions
          .filter(t => t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0);

        const percentUsed = Math.round((spending / budget.limit) * 100);
        const isOverBudget = spending > budget.limit;
        const isNearLimit = percentUsed >= budget.alertThreshold;

        return {
          ...budget,
          currentSpending: spending,
          percentUsed,
          isOverBudget,
          isNearLimit,
        };
      });

      res.json(budgetSummaries);
    } catch (error) {
      console.error("Error fetching budget summary:", error);
      res.status(500).send("Failed to fetch budget summary");
    }
  });
  app.post("/api/ai/financial-advice", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).send("Query is required");
      }

      const advice = await financialAdvisor.getPersonalizedAdvice(req.user.id, query);
      res.json(advice);
    } catch (error) {
      console.error("Error getting financial advice:", error);
      res.status(500).send("Failed to get financial advice");
    }
  });
  // Budget Analysis endpoint
  app.get("/api/ai/budget-analysis", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const analysis = await budgetAnalyst.analyzeBudget(req.user.id);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing budget:", error);
      res.status(500).send("Failed to analyze budget");
    }
  });
  // Investment Strategy endpoint
  app.get("/api/ai/investment-advice", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const advice = await investmentAdvisor.getInvestmentAdvice(req.user.id);
      res.json(advice);
    } catch (error: any) {
      console.error("Error getting investment advice:", error);
      res.status(500).json({
        error: "Failed to get investment advice",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // Add this to your routes.ts
  app.post("/api/user/consent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const { termsVersion, privacyVersion, consentDate } = req.body;

      const [updatedUser] = await db
        .update(users)
        .set({
          legalConsent: {
            termsVersion,
            privacyVersion,
            consentDate,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          },
          consentVersion: termsVersion,
          onboardingStep: 2,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.json({
        message: "Consent saved successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
          hasPlaidSetup: updatedUser.hasPlaidSetup,
          consentVersion: updatedUser.consentVersion,
        },
      });
    } catch (error) {
      console.error("Error saving consent:", error);
      res.status(500).json({
        error: "Failed to save consent",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Error handling middleware

  // Error handling middleware
  // Improved error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server error:', err.stack);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Send detailed error in development, generic in production
    res.status(status).json({
      message: process.env.NODE_ENV === "development" ? message : "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  });

  // Add this to your existing routes
  app.get("/api/ai/dashboard-insights", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const insights = await dashboardInsights.getInsights(req.user.id);
      res.json(insights);
    } catch (error) {
      console.error("Error getting dashboard insights:", error);
      res.status(500).json({
        error: "Failed to get insights",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}