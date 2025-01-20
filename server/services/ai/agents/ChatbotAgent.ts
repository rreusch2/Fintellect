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
    
    // Enhanced transaction analysis
    const transactionAnalysis = transactions.reduce((acc: {
        byMerchant: Record<string, { total: number; count: number; dates: Date[] }>;
        byCategory: Record<string, { total: number; transactions: Array<{amount: number; date: Date}> }>;
        totalSpent: number;
    }>, t => {
        if (t.amount > 0) { // Only count expenses
            // Merchant analysis
            if (t.merchantName) {
                if (!acc.byMerchant[t.merchantName]) {
                    acc.byMerchant[t.merchantName] = { total: 0, count: 0, dates: [] };
                }
                acc.byMerchant[t.merchantName].total += t.amount;
                acc.byMerchant[t.merchantName].count += 1;
                acc.byMerchant[t.merchantName].dates.push(new Date(t.date));
            }
            
            // Category analysis
            const category = normalizeCategory(t.category);
            if (!acc.byCategory[category]) {
                acc.byCategory[category] = { total: 0, transactions: [] };
            }
            acc.byCategory[category].total += t.amount;
            acc.byCategory[category].transactions.push({
                amount: t.amount,
                date: new Date(t.date)
            });
            
            acc.totalSpent += t.amount;
        }
        return acc;
    }, { byMerchant: {}, byCategory: {}, totalSpent: 0 });

    // Find spending patterns
    const spendingPatterns = Object.entries(transactionAnalysis.byCategory)
        .map(([category, data]) => {
            const percentage = (data.total / transactionAnalysis.totalSpent * 100).toFixed(1);
            const avgTransactionSize = (data.total / data.transactions.length / 100).toFixed(2);
            return {
                category,
                total: data.total,
                percentage,
                avgTransactionSize,
                transactionCount: data.transactions.length
            };
        })
        .sort((a, b) => b.total - a.total);

    // Find frequent merchants
    const frequentMerchants = Object.entries(transactionAnalysis.byMerchant)
        .map(([merchant, data]) => ({
            merchant,
            total: data.total,
            count: data.count,
            avgAmount: data.total / data.count,
            frequency: data.dates.length
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Format the context for the AI
    return `
Transaction Analysis (Last 30 Days):
- Total Spent: $${(transactionAnalysis.totalSpent/100).toFixed(2)}
- Number of Transactions: ${transactions.length}

Top Spending Categories:
${spendingPatterns.map(p => 
    `- ${p.category}: $${(p.total/100).toFixed(2)} (${p.percentage}%)
     • ${p.transactionCount} transactions
     • Average transaction: $${p.avgTransactionSize}`
).join('\n')}

Most Frequent Merchants:
${frequentMerchants.map(m => 
    `- ${m.merchant}:
     • Total spent: $${(m.total/100).toFixed(2)}
     • ${m.count} transactions
     • Average purchase: $${(m.avgAmount/100).toFixed(2)}`
).join('\n')}

Recent Notable Transactions:
${transactions
    .filter(t => t.amount > 5000) // Transactions over $50
    .slice(0, 3)
    .map(t => 
        `- ${t.merchantName || t.description}: $${(t.amount/100).toFixed(2)} on ${new Date(t.date).toLocaleDateString()}`
    ).join('\n')}
`.trim();
}

  public async chat(userId: number, message: string): Promise<string> {
    try {
      const userContext = await this.getUserContext(userId);
      const formattedContext = ChatbotAgent.formatUserContext(userContext);

      const prompt = `You are a concise AI Financial Assistant analyzing real transaction data. Focus on providing specific, personalized insights about spending patterns.

${formattedContext}

User Question: ${message}

Guidelines for your response:
1. Be extremely specific about actual spending amounts and patterns
2. Format as clear sections with bullet points (use "-")
3. Focus on actionable insights based on real transaction data
4. Highlight specific merchants and categories where relevant
5. Compare transaction frequencies and average purchase amounts
6. Identify potential areas of high spending
7. Keep your response under 150 words
8. Use clear section breaks with empty lines

Example format:
Spending Analysis:
- Highest category: Dining ($521.45, 32.5% of total)
- Most frequent merchant: Starbucks (12 visits, avg $4.75)

Key Insights:
- Your grocery spending is 25% higher at Whole Foods vs. other stores
- Weekend entertainment expenses average $85.30 per visit

Recommendations:
- Consider switching grocery stores to save ~$120/month
- Consolidate coffee purchases to use rewards programs

Remember to base your response only on the actual transaction data provided.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return response.trim();
    } catch (error) {
      console.error('Error in AI chat:', error);
      return "I apologize, but I'm having trouble analyzing your transaction data right now. Please try again in a moment.";
    }
  }
}

export const chatbot = new ChatbotAgent(); 