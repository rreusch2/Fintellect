import { db } from "@db";
import { plaidAccounts, plaidItems, plaidTransactions } from "@db/schema";
import { eq } from "drizzle-orm";
import { plaidClient } from "@lib/plaid";
import { isDemoMode } from "@services/demo";

export async function syncPlaidData(userId: number) {
  try {
    // Check if user is in demo mode
    const isDemo = await isDemoMode(userId);
    if (isDemo) {
      return {
        success: true,
        message: "Demo mode - no sync needed",
      };
    }

    // Get all Plaid items for the user
    const items = await db
      .select()
      .from(plaidItems)
      .where(eq(plaidItems.userId, userId));

    for (const item of items) {
      // Skip demo items
      if (item.plaidInstitutionId === "demo") continue;

      // Sync accounts
      const accountsResponse = await plaidClient.accountsGet({
        access_token: item.plaidAccessToken,
      });

      // Update or insert accounts
      for (const account of accountsResponse.data.accounts) {
        await db
          .insert(plaidAccounts)
          .values({
            userId,
            plaidItemId: item.id,
            plaidAccountId: account.account_id,
            name: account.name,
            type: account.type,
            subtype: account.subtype || null,
            mask: account.mask || null,
            currentBalance: Math.round(account.balances.current * 100) || 0,
            availableBalance: Math.round(account.balances.available * 100) || 0,
            plaidInstitutionId: item.plaidInstitutionId,
            plaidInstitutionName: item.plaidInstitutionName,
            status: "active",
          })
          .onConflictDoUpdate({
            target: [plaidAccounts.plaidAccountId],
            set: {
              currentBalance: Math.round(account.balances.current * 100) || 0,
              availableBalance: Math.round(account.balances.available * 100) || 0,
              status: "active",
            },
          });
      }

      // Sync transactions
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: item.plaidAccessToken,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });

      // Get account IDs for this item
      const accounts = await db
        .select()
        .from(plaidAccounts)
        .where(eq(plaidAccounts.plaidItemId, item.id));
      
      const accountIdMap = new Map(
        accounts.map(acc => [acc.plaidAccountId, acc.id])
      );

      // Update or insert transactions
      for (const transaction of transactionsResponse.data.transactions) {
        const accountId = accountIdMap.get(transaction.account_id);
        if (!accountId) continue;

        await db
          .insert(plaidTransactions)
          .values({
            userId,
            accountId,
            plaidItemId: item.id,
            plaidTransactionId: transaction.transaction_id,
            amount: Math.round(transaction.amount * 100),
            category: transaction.category?.[0] || null,
            subcategory: transaction.category?.[1] || null,
            date: new Date(transaction.date),
            description: transaction.name,
            merchantName: transaction.merchant_name || null,
            pending: transaction.pending,
          })
          .onConflictDoUpdate({
            target: [plaidTransactions.plaidTransactionId],
            set: {
              amount: Math.round(transaction.amount * 100),
              pending: transaction.pending,
            },
          });
      }

      // Update last sync time
      await db
        .update(plaidItems)
        .set({ lastSync: new Date() })
        .where(eq(plaidItems.id, item.id));
    }

    return {
      success: true,
      message: "Plaid data synced successfully",
    };
  } catch (error) {
    console.error("Error syncing Plaid data:", error);
    throw error;
  }
} 