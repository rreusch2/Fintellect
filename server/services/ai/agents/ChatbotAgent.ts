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
      let prompt = '';

      // Match quick actions more accurately
      if (message.toLowerCase().includes("analyze") && message.toLowerCase().includes("spending")) {
        prompt = `You are a financial analyst. Analyze this transaction data concisely:

${formattedContext}

Format your response in 3 short sections:
Spending Analysis
• Top 2-3 categories with percentages and frequent merchants
• Notable spending patterns

Key Insights
• Most significant merchant patterns
• Areas of potential overspending

Recommendations
• 2-3 specific, actionable tips with merchant names
• Focus on immediate savings opportunities

Keep each section brief and focused on the most important insights.`;

      } else if (message.toLowerCase().includes("budget") && message.toLowerCase().includes("help")) {
        prompt = `You are a budget specialist. Create a quick budget plan:

${formattedContext}

Format your response in 3 brief sections:
Current Overview
• Key spending categories and their percentages
• Fixed vs variable expenses breakdown

Budget Suggestions
• 2-3 specific category allocations based on spending
• Highlight areas needing adjustment

Next Steps
• 2-3 immediate actions to implement this budget
• Focus on largest spending categories

Be specific but concise, using real merchant names and amounts.`;

      } else if (message.toLowerCase().includes("saving") && message.toLowerCase().includes("tips")) {
        prompt = `You are a savings advisor. Find specific saving opportunities:

${formattedContext}

Format your response in 3 short sections:
Quick Wins
• 2-3 immediate saving opportunities with specific merchants
• Potential monthly savings amounts

Merchant Comparisons
• Compare prices at frequently visited places
• Suggest specific alternatives

Action Items
• 2-3 specific steps to capture these savings
• Focus on largest potential impact

Use real merchant names and specific dollar amounts.`;

      } else if (message.toLowerCase().includes("recurring") && message.toLowerCase().includes("charges")) {
        prompt = `You are a subscription analyst. Review recurring charges:

${formattedContext}

Format your response in 3 brief sections:
Current Subscriptions
• List identified recurring payments
• Highlight any concerning patterns

Optimization Options
• 2-3 specific opportunities to reduce costs
• Potential duplicate or overlapping services

Action Steps
• 2-3 immediate steps to optimize charges
• Specific savings estimates

Focus on actual recurring transactions found in the data.`;

      } else {
        // Custom message prompt - keep it conversational and specific
        prompt = `You are a friendly financial assistant. The user asks: "${message}"

${formattedContext}

Provide a brief, natural response that:
1. Directly answers their question using their transaction data
2. Mentions specific merchants and amounts
3. Gives 1-2 actionable suggestions
4. Stays friendly and conversational

Keep the response under 100 words and focus on their specific question.
Use bullet points only if it helps clarity.
Reference actual merchants and transactions from their data.`;
      }

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Post-process to ensure consistent formatting
      return response.trim()
        .replace(/\*\*/g, '')  // Remove any asterisks
        .replace(/_/g, '')     // Remove any underscores
        .replace(/\n\n\n+/g, '\n\n'); // Remove excessive line breaks
    } catch (error) {
      console.error('Error in AI chat:', error);
      return "I apologize, but I'm having trouble analyzing your transaction data right now. Please try again in a moment.";
    }
  }
}

export const chatbot = new ChatbotAgent(); 