import { anthropic, MODEL_NAMES, generateContent } from '../config/anthropic.js';
import { db } from "@db";
import { eq, desc, and, gte } from "drizzle-orm";
import { plaidTransactions, users, plaidAccounts } from "@db/schema.js";
import { normalizeCategory } from '../store/CategoryMap.js';

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
  accounts: typeof plaidAccounts.$inferSelect[];
  totalBalance: number;
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

    // Calculate spending trends
    const weeklySpending = transactions.reduce((acc: Record<string, number>, t) => {
      const weekStart = new Date(t.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];
      if (t.amount > 0) {
        acc[weekKey] = (acc[weekKey] || 0) + t.amount;
      }
      return acc;
    }, {});

    const weeklyTrend = Object.entries(weeklySpending)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, amount]) => `Week of ${week}: $${(amount/100).toFixed(2)}`);

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

Weekly Spending Trends:
${weeklyTrend.join('\n')}

Recent Transactions:
${transactions.slice(0, 5).map(t => 
  `- ${new Date(t.date).toLocaleDateString()}: ${t.merchantName || t.description} - $${(t.amount/100).toFixed(2)} (${t.category})`
).join('\n')}
`.trim();
  }

  public async getInsights(userId: number): Promise<DashboardInsight[]> {
    try {
      const userContext = await this.getUserContext(userId);
      const formattedContext = DashboardInsightsAgent.formatUserContext(userContext);

      const prompt = `As an AI Financial Advisor, analyze this detailed transaction data and provide 3 highly personalized, actionable insights. Consider spending patterns, account balances, and weekly trends.

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
2. Specific opportunities for optimization based on spending categories
3. Actionable recommendations tied to actual transaction data
4. Quantifiable potential impact of following the advice

Use proper category names and be specific about amounts and percentages when relevant.`;

      const responseText = await generateContent(prompt);
      
      try {
        const response = JSON.parse(responseText);
        return response.insights;
      } catch (jsonError) {
        console.error('Error parsing AI response:', jsonError);
        console.log('Raw AI response:', responseText);
        
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

    const totalSpending = Object.values(spendingByCategory).reduce((a: number, b: number) => a + b, 0);

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
        title: "Account Overview",
        description: `Your total balance across all accounts is $${(context.totalBalance/100).toFixed(2)}, with monthly spending of $${(totalSpending/100).toFixed(2)}.`,
        priority: "HIGH",
        badge: "REVIEW"
      },
      {
        type: "investment",
        title: "Spending Trends",
        description: `Based on your recent transactions, you're averaging $${((totalSpending/30)/100).toFixed(2)} in daily expenses.`,
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