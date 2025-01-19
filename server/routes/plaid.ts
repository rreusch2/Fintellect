import { Router } from "express";
import { db } from "@db";
import { eq, and, not, like, or, desc, sql } from "drizzle-orm";
import { 
  users, 
  plaidItems,
  plaidTransactions, 
  plaidAccounts
} from "@db/schema.js";
import { plaidClient, PlaidService } from "../services/plaid.js";
import { CountryCode, Products } from "plaid";
import { suggestCategory } from "../services/categories.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../auth.js";
import { setupDemoMode, isDemoMode } from "../services/demo.js";
import type { JWTPayload } from "../middleware/jwtAuth.js";

interface JWTRequest extends Request {
  jwtPayload: JWTPayload;
}

const router = Router();

function calculateMonthlySpending(transactions: any[]): Record<string, number> {
  const monthlySpending: Record<string, number> = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    // Plaid: positive = expense, negative = income
    monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + transaction.amount;
  });

  return monthlySpending;
}

function calculateMonthOverMonthChange(monthlySpending: Record<string, number>): number {
  const months = Object.keys(monthlySpending).sort();
  if (months.length < 2) return 0;

  const currentMonth = monthlySpending[months[months.length - 1]];
  const previousMonth = monthlySpending[months[months.length - 2]];

  if (!previousMonth) return 0;
  return ((currentMonth - previousMonth) / previousMonth) * 100;
}

function calculateCategoryTrends(transactions: any[]): Array<{
  category: string;
  currentSpend: number;
  previousSpend: number;
  percentageChange: number;
}> {
  // Group transactions by month and category
  const categoryByMonth: Record<string, Record<string, number>> = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    const category = transaction.category || 'Uncategorized';
    
    if (!categoryByMonth[monthKey]) {
      categoryByMonth[monthKey] = {};
    }
    
    categoryByMonth[monthKey][category] = (categoryByMonth[monthKey][category] || 0) + transaction.amount;
  });

  const months = Object.keys(categoryByMonth).sort();
  if (months.length < 2) return [];

  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];

  const trends = Object.keys(categoryByMonth[currentMonth]).map(category => {
    const currentSpend = categoryByMonth[currentMonth][category] || 0;
    const previousSpend = categoryByMonth[previousMonth]?.[category] || 0;
    const percentageChange = previousSpend === 0 
      ? 100 
      : ((currentSpend - previousSpend) / previousSpend) * 100;

    return {
      category,
      currentSpend,
      previousSpend,
      percentageChange: Number(percentageChange.toFixed(1))
    };
  });

  return trends.sort((a, b) => Math.abs(b.currentSpend) - Math.abs(a.currentSpend));
}

router.post("/disconnect", async (req: any, res: any) => {
  if (!req.user?.id) {
    console.error("Disconnect attempt without authentication");
    return res.status(401).json({ 
      error: "Not authenticated",
      hasPlaidConnection: false 
    });
  }

  const userId = req.user.id;
  console.log(`Attempting to disconnect Plaid for user ${userId}`);
  
  try {
    // First verify the user has Plaid connected
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.hasPlaidSetup) {
      console.log(`User ${userId} has no Plaid connection to disconnect`);
      return res.status(400).json({
        error: "No Plaid connection found",
        hasPlaidConnection: false
      });
    }

    // Start a transaction to ensure all operations complete or none do
    await db.transaction(async (trx) => {
      console.log("Starting disconnect transaction...");

      // First clear transactions as they don't have dependencies
      const txResult = await trx.delete(plaidTransactions)
        .where(eq(plaidTransactions.userId, userId))
        .returning();
      console.log(`Deleted ${txResult.length} transactions`);
      
      // Then clear accounts as they depend on plaid_items
      const accountsResult = await trx.delete(plaidAccounts)
        .where(eq(plaidAccounts.userId, userId))
        .returning();
      console.log(`Deleted ${accountsResult.length} accounts`);

      // Now we can safely delete plaid items
      const itemsResult = await trx.delete(plaidItems)
        .where(eq(plaidItems.userId, userId))
        .returning();
      console.log(`Deleted ${itemsResult.length} Plaid items`);
      
      // Finally update user's plaid connection status
      const [updatedUser] = await trx.update(users)
        .set({ hasPlaidSetup: false })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error("Failed to update user Plaid status");
      }
      console.log("Successfully updated user Plaid status");
    });

    console.log(`Successfully disconnected Plaid for user ${userId}`);
    // Return the updated connection status
    res.status(200).json({ 
      message: "Successfully disconnected and cleared all data",
      hasPlaidConnection: false
    });
  } catch (error) {
    console.error("Error disconnecting Plaid:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to disconnect account",
      hasPlaidConnection: true // Maintain current status on error
    });
  }
});

router.get("/transactions/summary", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    // Get Plaid connection status first
    const [plaidUser] = await db
      .select({
        hasPlaidSetup: users.hasPlaidSetup
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    // Get the latest Plaid item
    const [plaidItem] = await db
      .select({
        id: plaidItems.id,
        plaidAccessToken: plaidItems.plaidAccessToken,
        plaidInstitutionId: plaidItems.plaidInstitutionId,
      })
      .from(plaidItems)
      .where(eq(plaidItems.userId, req.user.id))
      .limit(1);

    // If we have a Plaid connection and it's not demo mode, try to sync the latest data
    if (plaidItem?.plaidAccessToken && plaidItem.plaidInstitutionId !== "demo") {
      const syncResult = await PlaidService.syncTransactions(plaidItem.id, plaidItem.plaidAccessToken, req.user.id);
      if (syncResult?.status === 'pending') {
        return res.status(202).json({
          hasPlaidConnection: true,
          status: 'pending',
          message: syncResult.message,
          totalBalance: 0,
          monthlySpending: 0,
          monthlySavings: 0,
          monthOverMonthChange: 0,
          categoryTotals: {},
          categoryTrends: [],
          transactions: [],
          accounts: [],
          spendingTrends: {
            labels: [],
            data: []
          }
        });
      }
    }

    // Get transactions excluding housing
    const transactions = await db
      .select({
        id: plaidTransactions.id,
        amount: plaidTransactions.amount,
        category: plaidTransactions.category,
        date: plaidTransactions.date,
        description: plaidTransactions.description,
        merchantName: plaidTransactions.merchantName,
        accountId: plaidTransactions.accountId,
      })
      .from(plaidTransactions)
      .where(
        and(
          eq(plaidTransactions.userId, req.user.id),
          not(like(plaidTransactions.category, '%HOUSING%')),
          not(like(plaidTransactions.category, '%HOUSE%'))
        )
      )
      .orderBy(desc(plaidTransactions.date));

    // Calculate spending trends (last 6 months)
    const monthlySpending = calculateMonthlySpending(
      // Only include expenses (positive amounts) and exclude transfers
      transactions.filter(t => t.amount > 0 && !t.category.includes('TRANSFER'))
    );

    // Calculate category trends
    const categoryTrends = calculateCategoryTrends(transactions);

    // Get account information
    const accounts = await db
      .select({
        id: plaidAccounts.id,
        name: plaidAccounts.name,
        type: plaidAccounts.type,
        subtype: plaidAccounts.subtype,
        currentBalance: plaidAccounts.currentBalance,
        availableBalance: plaidAccounts.availableBalance,
        accountId: plaidAccounts.plaidAccountId,
      })
      .from(plaidAccounts)
      .where(eq(plaidAccounts.userId, req.user.id));

    // Remove duplicate accounts by plaidAccountId
    const uniqueAccounts = accounts.reduce((acc, account) => {
      if (!acc[account.accountId]) {
        acc[account.accountId] = account;
      }
      return acc;
    }, {} as Record<string, typeof accounts[0]>);

    // Calculate category totals for actual spending (exclude transfers and credits)
    const spendingByCategory = transactions.reduce((acc, transaction) => {
      // Only include expenses (positive amounts) and exclude transfers and uncategorized
      if (transaction.amount > 0 && 
          !transaction.category.includes('TRANSFER') && 
          transaction.category !== 'UNCATEGORIZED') {
        const category = transaction.category;
        acc[category] = (acc[category] || 0) + transaction.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate transfer totals separately
    const transferTotals = transactions.reduce((acc, transaction) => {
      if (transaction.category.includes('TRANSFER')) {
        const type = transaction.amount > 0 ? 'TRANSFER_OUT' : 'TRANSFER_IN';
        acc[type] = (acc[type] || 0) + Math.abs(transaction.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate total balance (prefer available balance over current balance)
    const totalBalance = Object.values(uniqueAccounts).reduce((sum, account) => {
      // Always prefer available balance when it exists
      if (account.availableBalance != null) {
        return sum + account.availableBalance;
      }
      // Fall back to current balance only if available balance is null
      return sum + (account.currentBalance || 0);
    }, 0);

    const summary = {
      hasPlaidConnection: plaidUser?.hasPlaidSetup || false,
      totalBalance,
      // Monthly spending excludes transfers and credits
      monthlySpending: Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0),
      // Monthly savings is the sum of all credits (negative amounts) excluding transfers
      monthlySavings: transactions.reduce((sum, t) => 
        t.amount < 0 && !t.category.includes('TRANSFER') ? sum + Math.abs(t.amount) : sum, 
        0
      ),
      monthOverMonthChange: calculateMonthOverMonthChange(monthlySpending),
      // Include both spending categories and transfer totals
      categoryTotals: {
        ...spendingByCategory,
        ...transferTotals
      },
      categoryTrends,
      transactions: transactions.map(t => ({
        ...t,
        // For display, we want expenses to be negative and income to be positive
        displayAmount: -t.amount
      })),
      accounts: Object.values(uniqueAccounts).map(account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        currentBalance: account.currentBalance || 0,
        availableBalance: account.availableBalance
      })),
      spendingTrends: {
        labels: Object.keys(monthlySpending).slice(-6),
        data: Object.values(monthlySpending).slice(-6)
      }
    };

    res.json(summary);
  } catch (error) {
    console.error("Error getting transaction summary:", error);
    res.status(500).json({ error: "Failed to get transaction summary" });
  }
});

router.post("/sync", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    // Get all Plaid items for the user
    const userPlaidItems = await db
      .select()
      .from(plaidItems)
      .where(eq(plaidItems.userId, req.user.id));

    if (userPlaidItems.length === 0) {
      return res.status(404).json({ error: "No Plaid connection found" });
    }

    const results = [];
    
    // Sync each Plaid item
    for (const item of userPlaidItems) {
      try {
        // First sync accounts to get latest balances
        await PlaidService.syncAccounts(item.id, item.plaidAccessToken, req.user.id);
        
        // Then sync transactions
        const syncResult = await PlaidService.syncTransactions(item.id, item.plaidAccessToken, req.user.id);
        results.push({
          institutionName: item.plaidInstitutionName,
          ...syncResult
        });
      } catch (error) {
        console.error(`Error syncing item ${item.plaidInstitutionName}:`, error);
        results.push({
          institutionName: item.plaidInstitutionName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log("Sync results:", results);
    res.json({ 
      success: true,
      results
    });

  } catch (error) {
    console.error("Error syncing data:", error);
    res.status(500).json({ 
      error: "Failed to sync data",
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
});

router.post("/fix-categories", async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    // Update all Housing transactions to Shopping
    const result = await db
      .update(plaidTransactions)
      .set({ 
        category: 'SHOPPING',
      })
      .where(
        and(
          eq(plaidTransactions.userId, req.user.id),
          or(
            like(plaidTransactions.category, '%HOUSING%'),
            like(plaidTransactions.category, '%HOUSE%')
          )
        )
      )
      .returning();

    console.log(`Updated ${result.length} transactions`);
    res.json({ 
      success: true, 
      updatedCount: result.length 
    });

  } catch (error) {
    console.error("Error fixing categories:", error);
    res.status(500).json({ 
      error: "Failed to fix categories",
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
});

router.post("/exchange_token", async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const { public_token } = req.body;
    
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get institution info
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id;
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId!,
      country_codes: ['US'],
    });

    // Insert Plaid item
    const [plaidItem] = await db
      .insert(plaidItems)
      .values({
        userId: req.user.id,
        plaidItemId: itemId,
        plaidAccessToken: accessToken,
        plaidInstitutionId: institutionId!,
        plaidInstitutionName: institutionResponse.data.institution.name,
      })
      .returning();

    console.log('Fetching initial transactions...');

    // Initial transaction sync with proper categorization
    const transactions = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: '2023-01-01',
      end_date: new Date().toISOString().split('T')[0],
    });

    console.log(`Processing ${transactions.data.transactions.length} transactions...`);

    // Process transactions with enhanced categorization
    for (const transaction of transactions.data.transactions) {
      const description = transaction.name || '';
      const merchantName = transaction.merchant_name || undefined;
      const amount = Math.round(transaction.amount * 100);

      // Use enhanced categorization
      const { categoryId, subcategoryId } = suggestCategory(
        description,
        amount,
        merchantName
      );

      console.log('Transaction categorization:', {
        description,
        merchantName,
        amount,
        suggestedCategory: categoryId,
        suggestedSubcategory: subcategoryId,
        originalCategory: transaction.category?.[0]
      });

      await db.insert(plaidTransactions).values({
        userId: req.user.id,
        plaidItemId: plaidItem.id,
        plaidAccountId: transaction.account_id,
        plaidTransactionId: transaction.transaction_id,
        amount: amount,
        date: new Date(transaction.date),
        description: description,
        merchantName: merchantName,
        category: categoryId,
        subcategory: subcategoryId,
        pending: transaction.pending,
      });
    }

    // Update user's Plaid setup status
    await db
      .update(users)
      .set({ hasPlaidSetup: true })
      .where(eq(users.id, req.user.id));

    console.log('Successfully processed all transactions');

    res.json({
      success: true,
      plaidItem: {
        id: plaidItem.id,
        institutionName: institutionResponse.data.institution.name,
      },
    });

  } catch (error) {
    console.error("Error exchanging token:", error);
    res.status(500).json({
      error: "Failed to setup Plaid connection",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

router.post("/recategorize", async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Get all transactions for the user
    const transactions = await db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.userId, req.user.id));

    console.log(`Re-categorizing ${transactions.length} transactions for user ${req.user.id}`);

    let successCount = 0;
    let errorCount = 0;

    // Process transactions in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Process each transaction in the current batch
      const updates = await Promise.all(batch.map(async (transaction) => {
        try {
          const { categoryId, subcategoryId } = suggestCategory(
            transaction.description || '',
            transaction.amount,
            transaction.merchantName || undefined
          );

          // Update the transaction with new categories
          await db
            .update(plaidTransactions)
            .set({
              category: categoryId,
              subcategory: subcategoryId
            })
            .where(
              and(
                eq(plaidTransactions.id, transaction.id),
                eq(plaidTransactions.userId, req.user.id)
              )
            );

          successCount++;
          return { success: true, id: transaction.id };
        } catch (error) {
          errorCount++;
          console.error(`Error updating transaction ${transaction.id}:`, error);
          return { success: false, id: transaction.id, error };
        }
      }));

      console.log(`Processed batch of ${batch.length} transactions. Success: ${successCount}, Errors: ${errorCount}`);
    }

    console.log("Successfully re-categorized all transactions");
    res.json({ 
      success: true, 
      total: transactions.length,
      updated: successCount,
      errors: errorCount
    });
  } catch (error) {
    console.error("Error re-categorizing transactions:", error);
    res.status(500).json({
      error: "Failed to re-categorize transactions",
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
});

router.post("/demo", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const result = await setupDemoMode(req.user.id);
    res.json(result);
  } catch (error) {
    console.error("Error setting up demo mode:", error);
    res.status(500).json({ error: "Failed to setup demo mode" });
  }
});

// Create link token
router.post("/create-link-token", async (req: JWTRequest, res: Response) => {
  if (!req.jwtPayload?.userId) {
    console.error("[Plaid] Create link token attempt without authentication");
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.jwtPayload.userId))
      .limit(1);

    if (!user) {
      console.error("[Plaid] User not found:", req.jwtPayload.userId);
      return res.status(401).json({ error: "User not found" });
    }

    const configs = {
      user: {
        client_user_id: user.id.toString()
      },
      client_name: "Fintellect",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: "https://webhook.example.com",
    };

    const createTokenResponse = await plaidClient.linkTokenCreate(configs);
    const linkToken = createTokenResponse.data.link_token;
    console.log("[Plaid] Link token created for user:", user.id);

    res.json({ link_token: linkToken });
  } catch (error) {
    console.error("[Plaid] Error creating link token:", error);
    res.status(500).json({ error: "Failed to create link token" });
  }
});

export default router; 