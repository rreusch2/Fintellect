import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { plaidTransactions, users, goals } from "@db/schema.js";
import { normalizeCategory } from '../store/CategoryMap.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
});

export interface DashboardInsight {
  type: "saving" | "spending" | "investment" | "budget";
  title: string;
  description: string;
  impact?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  badge: string;
}

interface UserContextData {
  monthlyIncome: number;
  recentTransactions: typeof plaidTransactions.$inferSelect[];
  activeGoals: typeof goals.$inferSelect[];
}

export class DashboardInsightsAgent {
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

    // Get active goals
    const activeGoals = await db.query.goals.findMany({
      where: and(
        eq(goals.userId, userId),
        eq(goals.status, 'in_progress')
      )
    });

    return {
      monthlyIncome: user.monthlyIncome || 0,
      recentTransactions,
      activeGoals
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

    // Format the context for the AI
    return `
User Financial Profile:
- Monthly Income: $${(monthlyIncome/100).toFixed(2)}
- Total Monthly Expenses: $${(totalExpenses/100).toFixed(2)}
- Savings Rate: ${savingsRate.toFixed(1)}%

Spending by Category:
${Object.entries(spendingByCategory)
  .map(([category, amount]) => `- ${category}: $${(amount/100).toFixed(2)}`)
  .join('\n')}

Active Financial Goals:
${context.activeGoals.map(goal => 
  `- ${goal.name}: $${(goal.currentAmount/100).toFixed(2)}/$${(goal.targetAmount/100).toFixed(2)}`
).join('\n')}

Recent Transactions Trends:
${this.analyzeTransactionTrends(transactions)}
`.trim();
  }

  private static analyzeTransactionTrends(transactions: typeof plaidTransactions.$inferSelect[]): string {
    // Group transactions by date
    const byDate = transactions.reduce((acc: Record<string, typeof transactions>, t) => {
      const date = new Date(t.date).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    }, {});

    // Calculate daily totals
    const dailyTotals = Object.entries(byDate).map(([date, txs]) => ({
      date,
      total: txs.reduce((sum: number, t) => sum + (t.amount || 0), 0)
    }));

    // Sort by date and get the trend
    dailyTotals.sort((a, b) => a.date.localeCompare(b.date));
    
    return dailyTotals
      .map(({ date, total }) => `${date}: $${(total/100).toFixed(2)}`)
      .join('\n');
  }

  public async getInsights(userId: number): Promise<DashboardInsight[]> {
    try {
      const userContext = await this.getUserContext(userId);
      const formattedContext = DashboardInsightsAgent.formatUserContext(userContext);

      const prompt = `As an AI Financial Advisor, analyze this detailed transaction data and provide 3 highly personalized, actionable insights. Consider spending patterns, recurring expenses, and category trends.

${formattedContext}

Provide exactly 3 insights in this JSON format:
{
  "insights": [
    {
      "type": "spending/saving/investment",
      "title": "concise actionable title",
      "description": "detailed explanation based on the specific patterns observed",
      "impact": "quantified potential financial impact",
      "priority": "HIGH/MEDIUM/LOW",
      "badge": "short status label"
    }
  ]
}

Focus on:
1. Most significant patterns or changes in spending behavior
2. Specific opportunities for optimization based on recurring patterns
3. Actionable recommendations tied to actual transaction data
4. Quantifiable potential impact of following the advice

Use proper category names and be specific about amounts and percentages when relevant.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        // Clean up the response text to handle markdown formatting
        const cleanJson = responseText
          .replace(/```json\n?/i, '') // Remove opening markdown (case insensitive)
          .replace(/```/g, '')        // Remove all markdown blocks
          .trim();                    // Remove extra whitespace

        const response = JSON.parse(cleanJson);
        return response.insights;
      } catch (jsonError) {
        console.error('Error parsing AI response:', jsonError);
        console.log('Raw AI response:', responseText);
        
        // Return basic insights based on the data we have
        return this.generateFallbackInsights(userContext);
      }
    } catch (error) {
      console.error('Error generating dashboard insights:', error);
      return this.generateBasicFallbackInsights();
    }
  }

  private generateFallbackInsights(context: UserContextData): DashboardInsight[] {
    const transactions = context.recentTransactions;
    const spendingByCategory = transactions.reduce((acc: Record<string, number>, t) => {
      if (t.amount > 0) {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    const topCategories = Object.entries(spendingByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return [
      {
        type: "spending",
        title: "Top Spending Categories",
        description: `Your highest spending categories are: ${
          topCategories
            .map(([cat, amt]) => `${cat} ($${(amt/100).toFixed(2)})`)
            .join(', ')
        }`,
        priority: "MEDIUM",
        badge: "ANALYSIS"
      },
      {
        type: "saving",
        title: "Monthly Overview",
        description: `Your total spending across all categories is $${
          (Object.values(spendingByCategory).reduce((a: number, b: number) => a + b, 0)/100).toFixed(2)
        }`,
        priority: "HIGH",
        badge: "REVIEW"
      },
      {
        type: "investment",
        title: "Financial Goals",
        description: `You have ${context.activeGoals.length} active financial goals. Consider reviewing your progress regularly.`,
        priority: "MEDIUM",
        badge: "OPPORTUNITY"
      }
    ];
  }

  private generateBasicFallbackInsights(): DashboardInsight[] {
    return [
      {
        type: "spending",
        title: "Transaction Analysis",
        description: "We're analyzing your recent transaction patterns.",
        priority: "MEDIUM",
        badge: "ANALYSIS"
      },
      {
        type: "saving",
        title: "Spending Patterns",
        description: "Review your recent transactions to identify potential savings.",
        priority: "HIGH",
        badge: "REVIEW"
      },
      {
        type: "investment",
        title: "Financial Overview",
        description: "Monitor your spending trends to optimize your financial goals.",
        priority: "MEDIUM",
        badge: "OPPORTUNITY"
      }
    ];
  }
}

export const dashboardInsights = new DashboardInsightsAgent(); 