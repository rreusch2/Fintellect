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
    interface TransactionAnalysis {
        byMerchant: Record<string, {
            total: number;
            count: number;
            dates: Date[];
            transactions: Array<{amount: number; date: Date}>;
        }>;
        byCategory: Record<string, {
            total: number;
            transactions: Array<{amount: number; date: Date; merchantName?: string}>;
        }>;
        totalSpent: number;
        lastWeekTotal: number;
    }

    const transactionAnalysis = transactions.reduce((acc: TransactionAnalysis, t) => {
        if (t.amount > 0) { // Only count expenses
            const transactionDate = new Date(t.date);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            // Merchant analysis
            if (t.merchantName) {
                if (!acc.byMerchant[t.merchantName]) {
                    acc.byMerchant[t.merchantName] = {
                        total: 0,
                        count: 0,
                        dates: [],
                        transactions: []
                    };
                }
                acc.byMerchant[t.merchantName].total += t.amount;
                acc.byMerchant[t.merchantName].count += 1;
                acc.byMerchant[t.merchantName].dates.push(transactionDate);
                acc.byMerchant[t.merchantName].transactions.push({
                    amount: t.amount,
                    date: transactionDate
                });
            }
            
            // Category analysis
            const category = normalizeCategory(t.category);
            if (!acc.byCategory[category]) {
                acc.byCategory[category] = { total: 0, transactions: [] };
            }
            acc.byCategory[category].total += t.amount;
            acc.byCategory[category].transactions.push({
                amount: t.amount,
                date: transactionDate,
                merchantName: t.merchantName
            });
            
            acc.totalSpent += t.amount;
            
            // Track last week's spending
            if (transactionDate >= oneWeekAgo) {
                acc.lastWeekTotal += t.amount;
            }
        }
        return acc;
    }, {
        byMerchant: {},
        byCategory: {},
        totalSpent: 0,
        lastWeekTotal: 0
    });

    // Format the context for the AI
    return `
Transaction Analysis (Last 30 Days):
• Total Spent: $${(transactionAnalysis.totalSpent/100).toFixed(2)}
• Last 7 Days: $${(transactionAnalysis.lastWeekTotal/100).toFixed(2)}
• Transactions: ${transactions.length}

Categories and Merchants:
${Object.entries(transactionAnalysis.byCategory)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 3)
    .map(([category, data]) => {
        const normalizedCategory = normalizeCategory(category);
        const percentage = (data.total / transactionAnalysis.totalSpent * 100).toFixed(1);
        
        // Group merchants under their category
        const merchantAnalysis = Object.entries(data.transactions.reduce((acc: Record<string, {
            count: number,
            total: number
        }>, t) => {
            if (t.merchantName) {
                if (!acc[t.merchantName]) {
                    acc[t.merchantName] = { count: 0, total: 0 };
                }
                acc[t.merchantName].count++;
                acc[t.merchantName].total += t.amount;
            }
            return acc;
        }, {}))
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 2)
        .map(([merchant, stats]) => 
            `  • ${merchant}: ${stats.count} visits, avg $${(stats.total/stats.count/100).toFixed(2)}`
        )
        .join('\n');

        return `• ${normalizedCategory}: $${(data.total/100).toFixed(2)} (${percentage}%)
${merchantAnalysis}`;
    })
    .join('\n\n')}

Frequent Transactions:
${Object.entries(transactionAnalysis.byMerchant)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 3)
    .map(([merchant, data]) => {
        const avgAmount = data.total / data.count;
        return `• ${merchant}
  • ${data.count} visits, total $${(data.total/100).toFixed(2)}
  • Average purchase: $${(avgAmount/100).toFixed(2)}`;
    })
    .join('\n\n')}

Large Transactions:
${transactions
    .filter(t => t.amount > 5000)
    .slice(0, 3)
    .map(t => 
        `• ${t.merchantName || t.description}
  • Amount: $${(t.amount/100).toFixed(2)}
  • Date: ${new Date(t.date).toLocaleDateString()}`
    )
    .join('\n\n')}`.trim();
  }

  public async chat(userId: number, message: string): Promise<string> {
    try {
      const userContext = await this.getUserContext(userId);
      const formattedContext = ChatbotAgent.formatUserContext(userContext);

      const prompt = `You are a concise AI Financial Assistant analyzing real transaction data. Focus on providing specific, personalized insights about spending patterns and merchant-specific recommendations.

${formattedContext}

User Question: ${message}

Guidelines for your response:
1. Use clean sections without asterisks or underscores
2. Group merchant insights with their relevant categories
3. Keep all related information together in the same section
4. Use bullet points with "•" for sub-items
5. Format currency values in green
6. Keep full sentences without truncation
7. Use these section names exactly:
   - Spending Analysis
   - Key Insights
   - Recommendations

Format example:
Spending Analysis
• Food & Dining ($521.45)
  - Dunkin: 12 visits, avg $4.75
  - Starbucks: 8 visits, avg $5.25

Key Insights
• Your coffee purchases average $35/week
• Weekend dining costs 40% more than weekday meals

Recommendations
• Consider Dunkin rewards program to save ~$15/month
• Combine coffee runs to reduce total visits

Remember to group related merchants and insights together in their categories.`;

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