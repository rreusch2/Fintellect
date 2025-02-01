import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { plaidTransactions, users, plaidAccounts } from "@db/schema.js";
import { normalizeCategory } from '../store/CategoryMap.js';
import { anthropic, MODEL_NAMES, generateContent } from '../config/anthropic.js';
import { knowledgeStore } from "../store/KnowledgeStore.js";
import { DashboardInsightsAgent } from "./DashboardInsightsAgent.js";

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
  private dashboardAgent: DashboardInsightsAgent;
  private knowledgeStore: typeof knowledgeStore;

  constructor(
    _model: typeof anthropic,
    knowledgeStore: typeof knowledgeStore,
    dashboardAgent: DashboardInsightsAgent
  ) {
    this.knowledgeStore = knowledgeStore;
    this.dashboardAgent = dashboardAgent;
  }

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
      const contextStr = ChatbotAgent.formatUserContext(userContext);

      const prompt = `As an AI Financial Assistant, help this user with their financial query. Use the following context about their finances:

${contextStr}

User Query: "${message}"

Provide a helpful, specific response based on their actual financial data. Include specific numbers and insights when relevant.`;

      const response = await generateContent(prompt);
      return response;

    } catch (error) {
      console.error('Error in chat:', error);
      return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
    }
  }
}

export const chatbot = new ChatbotAgent(model, knowledgeStore, new DashboardInsightsAgent()); 