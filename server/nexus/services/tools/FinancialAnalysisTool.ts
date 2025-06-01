/**
 * Financial Analysis Tool
 * 
 * CURRENT STATUS: This tool provides real financial data analysis from user's connected accounts
 * 
 * ROADMAP FOR ENHANCED CAPABILITIES:
 * 1. Add web scraping for market data (Playwright integration)
 * 2. Connect to real financial APIs (Alpha Vantage, Yahoo Finance, etc.)
 * 3. Add file generation capabilities (.pdf reports, .csv exports)
 * 4. Implement secure code execution for custom analysis
 * 5. Add browser automation for brokerage account integration
 */

import { Tool, ToolResult, AgentContext } from '../ThreadManager';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@db';
import { eq, desc, and, gte } from 'drizzle-orm';
import { plaidTransactions, users, plaidAccounts } from '@db/schema';

// Initialize Gemini 2.0 Flash for financial analysis
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 6144,
    temperature: 0.5, // Lower temperature for more precise financial analysis
    topP: 0.8,
    topK: 40,
  }
});

export class FinancialAnalysisTool implements Tool {
  name = 'financial-analysis';

  getDescription(): string {
    return 'Analyze user financial data including transactions, spending patterns, and budgets';
  }

  async execute(parameters: Record<string, any>, context: AgentContext): Promise<ToolResult> {
    try {
      const { type, timeframe = '90d', category = 'all' } = parameters;
      
      console.log(`Financial Analysis Tool executing: type=${type}, timeframe=${timeframe}, category=${category}`);

      // Get user financial data
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, parseInt(context.userId))
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          humanReadable: 'Unable to access your financial data at the moment.'
        };
      }

      // Get user's transactions
      const transactions = await db.query.transactions.findMany({
        where: (transactions, { eq, and, gte }) => and(
          eq(transactions.userId, parseInt(context.userId)),
          gte(transactions.date, new Date(Date.now() - this.getTimeframeMs(timeframe)))
        ),
        orderBy: (transactions, { desc }) => [desc(transactions.date)]
      });

      if (transactions.length === 0) {
        return {
          success: false,
          error: 'No transaction data available',
          humanReadable: 'No recent transactions found to analyze. Please connect your financial accounts first.'
        };
      }

      // Perform analysis based on type
      let analysisResult;
      let humanReadable;

      switch (type) {
        case 'spending':
          analysisResult = this.analyzeSpending(transactions);
          humanReadable = this.formatSpendingAnalysis(analysisResult);
          break;
        case 'income':
          analysisResult = this.analyzeIncome(transactions);
          humanReadable = this.formatIncomeAnalysis(analysisResult);
          break;
        case 'trends':
          analysisResult = this.analyzeTrends(transactions);
          humanReadable = this.formatTrendsAnalysis(analysisResult);
          break;
        case 'categories':
          analysisResult = this.analyzeCategories(transactions);
          humanReadable = this.formatCategoriesAnalysis(analysisResult);
          break;
        default:
          analysisResult = this.performComprehensiveAnalysis(transactions);
          humanReadable = this.formatComprehensiveAnalysis(analysisResult);
      }

      return {
        success: true,
        data: analysisResult,
        humanReadable: `**Financial Analysis Complete**\n\n${humanReadable}`
      };

    } catch (error) {
      console.error('Financial Analysis Tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        humanReadable: 'I encountered an error while analyzing your financial data. Please try again.'
      };
    }
  }

  private getTimeframeMs(timeframe: string): number {
    const days = parseInt(timeframe.replace('d', ''));
    return days * 24 * 60 * 60 * 1000;
  }

  private analyzeSpending(transactions: any[]) {
    const expenses = transactions.filter(t => t.amount < 0);
    const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgDailySpending = totalSpent / 90;
    
    const categorySpending = expenses.reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5);

    return {
      totalSpent,
      avgDailySpending,
      categorySpending,
      topCategories,
      transactionCount: expenses.length
    };
  }

  private analyzeIncome(transactions: any[]) {
    const income = transactions.filter(t => t.amount > 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const avgMonthlyIncome = totalIncome / 3; // Assuming 90 days = ~3 months
    
    return {
      totalIncome,
      avgMonthlyIncome,
      incomeTransactions: income.length,
      largestIncome: Math.max(...income.map(t => t.amount))
    };
  }

  private analyzeTrends(transactions: any[]) {
    // Group by week and analyze trends
    const weeklySpending = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const week = this.getWeekNumber(new Date(t.date));
        weeklySpending[week] = (weeklySpending[week] || 0) + Math.abs(t.amount);
      }
    });

    const weeks = Object.keys(weeklySpending).map(Number).sort();
    const isIncreasing = weeks.length > 1 && 
      weeklySpending[weeks[weeks.length - 1]] > weeklySpending[weeks[0]];

    return {
      weeklySpending,
      trend: isIncreasing ? 'increasing' : 'decreasing',
      weeks: weeks.length
    };
  }

  private analyzeCategories(transactions: any[]) {
    const categories = {};
    transactions.forEach(t => {
      const category = t.category || 'Other';
      if (!categories[category]) {
        categories[category] = { total: 0, count: 0, avgAmount: 0 };
      }
      categories[category].total += Math.abs(t.amount);
      categories[category].count += 1;
    });

    Object.keys(categories).forEach(cat => {
      categories[cat].avgAmount = categories[cat].total / categories[cat].count;
    });

    return categories;
  }

  private performComprehensiveAnalysis(transactions: any[]) {
    return {
      spending: this.analyzeSpending(transactions),
      income: this.analyzeIncome(transactions),
      trends: this.analyzeTrends(transactions),
      categories: this.analyzeCategories(transactions)
    };
  }

  private formatSpendingAnalysis(analysis: any): string {
    return `I've analyzed your spending over the last 90 days:

💰 **Total Spent**: $${analysis.totalSpent.toFixed(2)}
📊 **Daily Average**: $${analysis.avgDailySpending.toFixed(2)}
🛍️ **Total Transactions**: ${analysis.transactionCount}

**Top Spending Categories:**
${analysis.topCategories.map(([cat, amount]: [string, number], i: number) => 
  `${i + 1}. ${cat}: $${amount.toFixed(2)}`).join('\n')}`;
  }

  private formatIncomeAnalysis(analysis: any): string {
    return `Here's your income analysis:

💵 **Total Income**: $${analysis.totalIncome.toFixed(2)}
📈 **Monthly Average**: $${analysis.avgMonthlyIncome.toFixed(2)}
🏆 **Largest Income**: $${analysis.largestIncome.toFixed(2)}
📝 **Income Sources**: ${analysis.incomeTransactions} transactions`;
  }

  private formatTrendsAnalysis(analysis: any): string {
    return `Your spending trends over ${analysis.weeks} weeks:

📈 **Trend**: Your spending is ${analysis.trend}
📊 **Weekly Breakdown**: 
${Object.entries(analysis.weeklySpending).map(([week, amount]: [string, number]) => 
  `Week ${week}: $${amount.toFixed(2)}`).join('\n')}`;
  }

  private formatCategoriesAnalysis(analysis: any): string {
    const topCategories = Object.entries(analysis)
      .sort(([,a], [,b]) => (b as any).total - (a as any).total)
      .slice(0, 5);

    return `Category breakdown:

${topCategories.map(([cat, data]: [string, any]) => 
  `📂 **${cat}**: $${data.total.toFixed(2)} (${data.count} transactions, avg: $${data.avgAmount.toFixed(2)})`
).join('\n')}`;
  }

  private formatComprehensiveAnalysis(analysis: any): string {
    return `Complete financial overview:

${this.formatSpendingAnalysis(analysis.spending)}

${this.formatIncomeAnalysis(analysis.income)}

${this.formatTrendsAnalysis(analysis.trends)}`;
  }

  private getWeekNumber(date: Date): number {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil((((date.getTime() - onejan.getTime()) / millisecsInDay) + onejan.getDay() + 1) / 7);
  }
} 