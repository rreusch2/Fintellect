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

      // Determine if this is a quick action or custom message
      if (message.includes("analyze my recent spending patterns")) {
        prompt = `You are a financial analyst focusing on spending patterns. Analyze the following transaction data and provide specific insights:

${formattedContext}

Focus on:
• Category breakdown with specific merchant insights
• Month-over-month spending changes
• Unusual spending patterns or large transactions
• Category-specific recommendations

Format your response as:
Spending Analysis
• Show top 3 spending categories with percentages and key merchants
• Highlight any significant changes or patterns

Key Insights
• Focus on specific merchant patterns and frequency
• Identify potential areas of overspending

Recommendations
• Provide category-specific actionable tips
• Suggest specific merchant alternatives or loyalty programs`;

      } else if (message.includes("create a budget")) {
        prompt = `You are a budget planning specialist. Create a personalized budget based on this transaction data:

${formattedContext}

Focus on:
• Actual spending patterns vs recommended allocations
• Category-specific budget suggestions
• Fixed vs variable expenses
• Practical saving opportunities

Format your response as:
Current Spending Overview
• Break down fixed vs variable expenses
• Highlight key spending categories

Suggested Budget Allocation
• Provide specific category budgets based on current spending
• Include practical adjustment recommendations

Action Steps
• List specific steps to implement the budget
• Include category-specific saving strategies`;

      } else if (message.includes("saving tips")) {
        prompt = `You are a savings optimization specialist. Analyze this transaction data for saving opportunities:

${formattedContext}

Focus on:
• Recurring expenses that could be reduced
• Similar merchants with price differences
• Frequency of specific transaction types
• Potential loyalty program benefits

Format your response as:
Savings Opportunities
• List specific merchants and potential savings
• Compare similar merchant prices

Quick Wins
• Immediate actions for saving money
• Specific loyalty programs or rewards to consider

Long-term Strategies
• Sustainable changes for ongoing savings
• Category-specific optimization tips`;

      } else if (message.includes("recurring charges")) {
        prompt = `You are a subscription and recurring payment specialist. Analyze these transactions for recurring charges:

${formattedContext}

Focus on:
• Identifying all recurring payments
• Subscription overlap analysis
• Price changes in recurring charges
• Similar service consolidation opportunities

Format your response as:
Recurring Charges Overview
• List all identified recurring payments
• Highlight any price changes or variations

Optimization Opportunities
• Identify potential subscription overlaps
• Suggest service consolidation options

Action Plan
• Specific steps to optimize recurring charges
• Alternative service recommendations`;

      } else {
        // Custom message prompt
        prompt = `You are a helpful financial assistant. The user asks: "${message}"

${formattedContext}

Provide a natural, conversational response that:
1. Directly addresses their specific question
2. Uses their actual transaction data for context
3. Gives personalized, actionable advice
4. Maintains a friendly, helpful tone

Focus on being specific and relevant to their question while referencing their actual spending patterns and merchants.
Avoid generic advice - use their real transaction data to provide insights.
Format the response in a natural, conversational way rather than using strict sections.`;
      }

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