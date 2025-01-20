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

   //Find the biggest expense category
    let largestCategory = null;
    let largestAmount = 0;
    for (const category in spendingByCategory){
        if (spendingByCategory[category] > largestAmount){
            largestAmount = spendingByCategory[category];
            largestCategory = category;
        }
    }

    // Calculate total expenses
    const totalExpenses = Object.values(spendingByCategory).reduce((a: number, b: number) => a + b, 0);

    // Calculate savings rate
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

    // Find recent transactions (Only 1 per category)
    const recentTransactionByCategory = transactions.reduce((acc: Record<string, typeof plaidTransactions.$inferSelect>, t) => {
        if (!acc[t.category]) {
            acc[t.category] = t;
        }
        return acc;
    }, {});

  const recentTransactionDetails = Object.entries(recentTransactionByCategory).map(([category, t]) => {
    return `- ${category}: ${t.merchantName || t.description} - $${(t.amount/100).toFixed(2)}`
}).join('\n');

    // Format the context for the AI
    return `
User Financial Profile:
- Monthly Income: $${(monthlyIncome/100).toFixed(2)}
- Total Monthly Expenses: $${(totalExpenses/100).toFixed(2)}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Total Balance Across Accounts: $${(context.totalBalance/100).toFixed(2)}
- Largest Spending Category: ${largestCategory}

Spending by Category (Last 30 Days):
${Object.entries(spendingByCategory)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => {
        const percentage = ((amount / totalExpenses) * 100).toFixed(1);
        return `- ${category}: $${(amount/100).toFixed(2)} (${percentage}%)`;
    })
.join('\n')}

Recurring Expenses:
${recurringMerchants.slice(0,3).map(r => // Show max 3 recurring expenses
`- ${r.merchant}: $${(r.averageAmount/100).toFixed(2)} (${r.frequency} times in 30 days)`
).join('\n')}
    
Recent Transactions (1 per category):
${recentTransactionDetails}
`.trim();
}

  public async chat(userId: number, message: string): Promise<string> {
    try {
      const userContext = await this.getUserContext(userId);
      const formattedContext = ChatbotAgent.formatUserContext(userContext);

      const prompt = `You are a concise AI Financial Assistant helping a user understand their finances. Use the following context about their financial situation to provide a helpful, personalized response to their question.

${formattedContext}

User Question: ${message}

Guidelines for your response:
1. Be extremely concise and brief,
2. Provide information directly related to the user's question.
3. Use specific numbers, percentages, and currency from their data.
4. Provide a concise recommendation based on the context.
5. Highlight 2-3 key points in bullet points.
6. Avoid conversational language (no "hello", "sure").
7. Use a friendly, professional tone.
8. Format currency as $XX.XX.
9. Keep your response under 150 words.

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