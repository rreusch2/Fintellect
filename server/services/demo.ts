import { db } from "@db";
import { plaidAccounts, plaidTransactions, users, plaidItems } from "@db/schema";
import { eq } from "drizzle-orm";

// Realistic transaction descriptions and categories
const demoTransactions = [
  // Food & Dining
  { description: "Trader Joe's", amount: 7823, category: "FOOD_AND_DRINK" },
  { description: "Chipotle", amount: 1299, category: "FOOD_AND_DRINK" },
  { description: "Starbucks", amount: 585, category: "FOOD_AND_DRINK" },
  { description: "Uber Eats", amount: 2499, category: "FOOD_AND_DRINK" },
  
  // Transportation
  { description: "Shell Gas Station", amount: 4500, category: "TRANSPORTATION" },
  { description: "Uber", amount: 2199, category: "TRANSPORTATION" },
  { description: "Parking Fee", amount: 1500, category: "TRANSPORTATION" },
  
  // Shopping
  { description: "Amazon", amount: 3299, category: "SHOPPING" },
  { description: "Target", amount: 4599, category: "SHOPPING" },
  { description: "Walmart", amount: 3899, category: "SHOPPING" },
  
  // Entertainment
  { description: "Netflix", amount: 1499, category: "ENTERTAINMENT" },
  { description: "Spotify", amount: 999, category: "ENTERTAINMENT" },
  { description: "Movie Theater", amount: 1799, category: "ENTERTAINMENT" },
  
  // Bills & Utilities
  { description: "Electric Bill", amount: 8500, category: "UTILITIES" },
  { description: "Internet Bill", amount: 7999, category: "UTILITIES" },
  { description: "Phone Bill", amount: 8999, category: "UTILITIES" },
  
  // Income
  { description: "Direct Deposit - Employer", amount: -250000, category: "INCOME" },
  { description: "Venmo Payment", amount: -2500, category: "TRANSFER_IN" },
];

function generateRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function setupDemoMode(userId: number) {
  try {
    // First, clear any existing demo data for this user
    await db.delete(plaidTransactions).where(eq(plaidTransactions.userId, userId));
    await db.delete(plaidAccounts).where(eq(plaidAccounts.userId, userId));
    await db.delete(plaidItems).where(eq(plaidItems.userId, userId));

    // Create a demo Plaid item
    const [demoItem] = await db.insert(plaidItems).values({
      userId,
      plaidItemId: `demo-item-${userId}`,
      plaidAccessToken: "demo-access-token",
      plaidInstitutionId: "demo",
      plaidInstitutionName: "Demo Bank",
      status: "active",
      lastSync: new Date(),
    }).returning();

    // Create demo checking account
    const [checkingAccount] = await db.insert(plaidAccounts).values({
      userId,
      plaidItemId: demoItem.id,
      name: "Demo Checking",
      type: "depository",
      subtype: "checking",
      plaidAccountId: `demo-checking-${userId}`,
      currentBalance: 214376, // $2,143.76
      availableBalance: 198876, // $1,988.76 (some pending transactions)
      mask: "1234",
      plaidInstitutionId: "demo",
      plaidInstitutionName: "Demo Bank",
      status: "active",
    }).returning();

    // Create demo savings account
    const [savingsAccount] = await db.insert(plaidAccounts).values({
      userId,
      plaidItemId: demoItem.id,
      name: "Demo Savings",
      type: "depository",
      subtype: "savings",
      plaidAccountId: `demo-savings-${userId}`,
      currentBalance: 500000, // $5,000.00
      availableBalance: 500000,
      mask: "5678",
      plaidInstitutionId: "demo",
      plaidInstitutionName: "Demo Bank",
      status: "active",
    }).returning();

    // Generate last 30 days of transactions
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Create transactions
    const transactions = demoTransactions.flatMap(template => {
      // Create 2-3 instances of each transaction type
      const instances = Math.floor(Math.random() * 2) + 2;
      const isIncome = template.category === "INCOME" || template.category === "TRANSFER_IN";
      const accountId = isIncome ? savingsAccount.id : checkingAccount.id;

      return Array(instances).fill(null).map(() => ({
        userId,
        accountId,
        plaidItemId: demoItem.id,
        plaidTransactionId: `demo-${Math.random().toString(36).substring(7)}`,
        amount: template.amount,
        category: template.category,
        subcategory: null,
        date: generateRandomDate(startDate, endDate),
        description: template.description,
        merchantName: template.description,
        pending: Math.random() < 0.1, // 10% chance of being pending
      }));
    });

    // Insert all transactions
    await db.insert(plaidTransactions).values(transactions);

    // Update user's Plaid setup status
    await db
      .update(users)
      .set({ 
        hasPlaidSetup: true,
        hasCompletedOnboarding: true 
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: "Demo mode activated successfully",
    };
  } catch (error) {
    console.error("Error setting up demo mode:", error);
    throw error;
  }
}

export async function isDemoMode(userId: number): Promise<boolean> {
  const [account] = await db
    .select({
      plaidInstitutionId: plaidAccounts.plaidInstitutionId,
    })
    .from(plaidAccounts)
    .where(eq(plaidAccounts.userId, userId))
    .limit(1);

  return account?.plaidInstitutionId === "demo";
} 