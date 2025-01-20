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
        byMerchant: Record<string, { 
            total: number; 
            count: number; 
            dates: Date[]; 
            transactions: Array<{amount: number; date: Date}> 
        }>;
        byCategory: Record<string, { 
            total: number; 
            transactions: Array<{amount: number; date: Date; merchantName?: string}> 
        }>;
        totalSpent: number;
        lastWeekTotal: number;
    }>, t => {
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
- Total Spent: $${(transactionAnalysis.totalSpent/100).toFixed(2)}
- Last 7 Days Spent: $${(transactionAnalysis.lastWeekTotal/100).toFixed(2)}
- Number of Transactions: ${transactions.length}

Top Spending Categories:
${Object.entries(transactionAnalysis.byCategory)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 3)
    .map(([category, data]) => {
        const percentage = (data.total / transactionAnalysis.totalSpent * 100).toFixed(1);
        const avgPerTransaction = data.total / data.transactions.length;
        const commonMerchants = data.transactions
            .reduce((acc: Record<string, number>, t) => {
                if (t.merchantName) {
                    acc[t.merchantName] = (acc[t.merchantName] || 0) + 1;
                }
                return acc;
            }, {});
        const topMerchants = Object.entries(commonMerchants)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 2)
            .map(([name]) => name)
            .join(", ");
        
        return `- ${category}: $${(data.total/100).toFixed(2)} (${percentage}%)
  • ${data.transactions.length} transactions, avg $${(avgPerTransaction/100).toFixed(2)}
  • Most frequent: ${topMerchants}`;
    })
    .join('\n')}

Frequent Merchants (Last 30 Days):
${Object.entries(transactionAnalysis.byMerchant)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 3)
    .map(([merchant, data]) => {
        const avgAmount = data.total / data.count;
        const recentTrend = data.transactions
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 3)
            .map(t => (t.amount/100).toFixed(2));
        
        return `- ${merchant}:
  • ${data.count} visits, total $${(data.total/100).toFixed(2)}
  • Average purchase: $${(avgAmount/100).toFixed(2)}
  • Recent amounts: $${recentTrend.join(', $')}`;
    })
    .join('\n')}

Recent Large Transactions:
${transactions
    .filter(t => t.amount > 5000) // Transactions over $50
    .slice(0, 3)
    .map(t => 
        `- ${t.merchantName || t.description}: $${(t.amount/100).toFixed(2)} on ${new Date(t.date).toLocaleDateString()}`
    )
    .join('\n')}
`.trim();
}

  public async chat(userId: number, message: string): Promise<string> {
    try {
      const userContext = await this.getUserContext(userId);
      const formattedContext = ChatbotAgent.formatUserContext(userContext);

      const prompt = `You are a concise AI Financial Assistant analyzing real transaction data. Focus on providing specific, personalized insights about spending patterns and merchant-specific recommendations.

${formattedContext}

User Question: ${message}

Guidelines for your response:
1. Focus on specific merchants and actual spending amounts
2. Compare prices between different merchants in the same category
3. Identify potential duplicate or unnecessary charges
4. Suggest specific ways to reduce spending at frequently visited merchants
5. Point out unusual spending patterns or large transactions
6. Format with bullet points (use "-") and clear sections
7. Keep response under 150 words

Example format:
Spending Patterns:
- You visited Starbucks 12 times ($57.40 total, avg $4.78)
- Grocery spending split between Whole Foods ($285.30) and Trader Joe's ($175.45)

Key Insights:
- Trader Joe's purchases are 35% cheaper than Whole Foods for similar items
- Weekend food delivery charges average $25.40 per order

Recommendations:
- Switch more grocery shopping to Trader Joe's to save ~$110/month
- Consider Starbucks rewards program for frequent purchases
- Combine food delivery orders to reduce service fees

Remember to base recommendations only on actual transaction patterns shown in the data.`;

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