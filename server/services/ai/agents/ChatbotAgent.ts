import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { plaidTransactions, users, plaidAccounts } from "@db/schema.js";
import { normalizeCategory } from '../store/CategoryMap.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    maxOutputTokens: 2000,
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
});

interface UserContextData {
  monthlyIncome: number;
  recentTransactions: typeof plaidTransactions.$inferSelect[];
  accounts: typeof plaidAccounts.$inferSelect[];
  totalBalance: number;
}

export class ChatbotAgent {
  private async getUserContext(userId: number): Promise<UserContextData> {
    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) throw new Error("User not found");

    // Get recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await db.query.plaidTransactions.findMany({
      where: and(
        eq(plaidTransactions.userId, userId),
        gte(plaidTransactions.date, thirtyDaysAgo)
      ),
      orderBy: [desc(plaidTransactions.date)]
    });

    // Get accounts and balances
    const accounts = await db.query.plaidAccounts.findMany({
      where: eq(plaidAccounts.userId, userId)
    });

    const totalBalance = accounts.reduce((sum: number, account: typeof plaidAccounts.$inferSelect) => 
      sum + account.currentBalance, 0
    );

    return {
      monthlyIncome: user.monthlyIncome || 0,
      recentTransactions,
      accounts,
      totalBalance
    };
  }

  private static formatUserContext(context: UserContextData): string {
    const transactions = context.recentTransactions;
    const monthlyIncome = context.monthlyIncome;
    
    // Calculate spending patterns
    const spendingByCategory = transactions.reduce((acc: Record<string, number>, t) => {
      if (t.amount > 0) { // Only count expenses
        const category = t.category;
        acc[category] = (acc[category] || 0) + t.amount;
      }
      return acc;
    }, {});

    // Calculate savings rate
    const totalExpenses = Object.values(spendingByCategory).reduce((a: number, b: number) => a + b, 0);
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalExpenses) / monthlyIncome) * 100 : 0;

    // Calculate recurring transactions
    const merchantTransactions = transactions.reduce((acc: Record<string, number[]>, t) => {
      if (t.merchantName && t.amount > 0) {
        if (!acc[t.merchantName]) acc[t.merchantName] = [];
        acc[t.merchantName].push(t.amount);
      }
      return acc;
    }, {});

    const recurringMerchants = Object.entries(merchantTransactions)
      .filter(([_, amounts]) => amounts.length >= 2) // At least 2 transactions
      .map(([merchant, amounts]) => {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / amounts.length
        );
        // Consider recurring if standard deviation is less than 10% of average
        if (stdDev / avg < 0.1) {
          return {
            merchant,
            averageAmount: avg,
            frequency: amounts.length
          };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.averageAmount - a.averageAmount);

    // Format the context for the AI
    return `
User Financial Profile:
- Monthly Income: $${(monthlyIncome/100).toFixed(2)}
- Total Monthly Expenses: $${(totalExpenses/100).toFixed(2)}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Total Balance Across Accounts: $${(context.totalBalance/100).toFixed(2)}

Account Overview:
${context.accounts.map(account => 
  `- ${account.name} (${account.type}): $${(account.currentBalance/100).toFixed(2)}`
).join('\n')}

Spending by Category (Last 30 Days):
${Object.entries(spendingByCategory)
  .sort(([,a], [,b]) => b - a)
  .map(([category, amount]) => {
    const percentage = ((amount / totalExpenses) * 100).toFixed(1);
    return `- ${category}: $${(amount/100).toFixed(2)} (${percentage}% of total)`;
  })
  .join('\n')}

Recurring Expenses:
${recurringMerchants.map(r => 
  `- ${r.merchant}: $${(r.averageAmount/100).toFixed(2)} (${r.frequency} times in 30 days)`
).join('\n')}

Recent Transaction History:
${transactions.slice(0, 10).map(t => 
  `- ${new Date(t.date).toLocaleDateString()}: ${t.merchantName || t.description} - $${(t.amount/100).toFixed(2)} (${t.category})`
).join('\n')}
`.trim();
  }

  public async chat(userId: number, message: string): Promise<string> {
    try {
      const userContext = await this.getUserContext(userId);
      const formattedContext = ChatbotAgent.formatUserContext(userContext);

      const prompt = `You are an AI Financial Assistant helping a user understand their finances. Use the following context about their financial situation to provide a helpful, personalized response to their question.

${formattedContext}

User Question: ${message}

Guidelines for your response:
1. Be concise but informative
2. Use specific numbers and percentages from their data
3. Provide actionable advice when relevant
4. Focus on patterns and trends in their spending
5. Reference account balances and recurring expenses when applicable
6. Use a friendly, professional tone
7. Format currency as $XX.XX
8. Keep your response under 250 words

Remember to base your response only on the data provided in the context. If you can't answer something specifically, be honest about it.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return response.trim();
    } catch (error) {
      console.error('Error in AI chat:', error);
      return "I apologize, but I'm having trouble analyzing your financial data right now. Please try again in a moment.";
    }
  }
}

export const chatbot = new ChatbotAgent(); 