import { ollamaAI } from "../config/gemini.ts";
import { knowledgeStore, type UserContext } from "../store/KnowledgeStore";

// Initialize AI with Ollama
const model = ollamaAI;

export interface BudgetAnalysis {
  overview: {
    totalSpend: number;
    topCategories: Array<{
      category: string;
      amount: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    monthOverMonthChange: number;
  };
  insights: Array<{
    category: string;
    finding: string;
    suggestedAction: string;
    potentialSavings: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    effort: 'easy' | 'medium' | 'hard';
    timeframe: 'immediate' | 'short-term' | 'long-term';
  }>;
}

export class BudgetAnalysisAgent {
  private static formatTransactionData(context: UserContext): string {
    const transactions = context.recentTransactions;
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Split transactions into current and previous month
    const currentMonthTransactions = transactions.filter(t => new Date(t.date) >= lastMonth);
    const previousMonthTransactions = transactions.filter(t => new Date(t.date) < lastMonth);

    // Calculate totals and group by category for both months
    const calculateCategoryTotals = (txs: typeof transactions) => {
      return txs.reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {});
    };

    const currentMonthTotals = calculateCategoryTotals(currentMonthTransactions);
    const previousMonthTotals = calculateCategoryTotals(previousMonthTransactions);

    // Calculate trends
    const trends = Object.keys(currentMonthTotals).map(category => {
      const current = currentMonthTotals[category] || 0;
      const previous = previousMonthTotals[category] || 0;
      const trend = previous === 0 ? 0 : ((current - previous) / previous) * 100;
      return `${category}: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`;
    }).join('\n');

    // Sort categories by spend
    const sortedCategories = Object.entries(currentMonthTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([category, amount]) => `${category}: $${(amount/100).toFixed(2)}`)
      .join('\n');

    // Calculate recurring expenses
    const recurringExpenses = transactions
      .reduce((acc: Record<string, number[]>, t) => {
        const key = `${t.merchantName}-${t.category}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t.amount || 0);
        return acc;
      }, {});

    const potentialRecurring = Object.entries(recurringExpenses)
      .filter(([, amounts]) => amounts.length >= 2)
      .map(([key, amounts]) => {
        const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        return `${key}: $${(avg/100).toFixed(2)} (avg of ${amounts.length} transactions)`;
      })
      .join('\n');

    return `
Transaction Analysis:

Current Month Categories:
${sortedCategories}

Month-over-Month Trends:
${trends}

Potential Recurring Expenses:
${potentialRecurring}

Active Financial Goals:
${context.activeGoals.map(g => `- ${g.name}: $${g.targetAmount/100} target, ${g.category}`).join('\n')}

Additional Context:
- Total Categories: ${Object.keys(currentMonthTotals).length}
- Monthly Income: $${context.monthlyIncome ? (context.monthlyIncome/100).toFixed(2) : 'Not set'}
- Total Monthly Spend: $${(Object.values(currentMonthTotals).reduce((a, b) => a + b, 0)/100).toFixed(2)}
`.trim();
  }

  public async analyzeBudget(userId: number): Promise<BudgetAnalysis> {
    const userContext = await knowledgeStore.getUserContext(userId);
    const transactionData = BudgetAnalysisAgent.formatTransactionData(userContext);

    const prompt = `You are an AI Budget Analyst. Analyze the following financial data and provide detailed actionable insights:

${transactionData}

Return a JSON object (without markdown formatting) following this exact structure:
{
  "overview": {
    "totalSpend": number,
    "topCategories": [
      {
        "category": "string",
        "amount": number,
        "trend": "increasing/decreasing/stable"
      }
    ],
    "monthOverMonthChange": number
  },
  "insights": [
    {
      "category": "string",
      "finding": "specific observation",
      "suggestedAction": "concrete action item",
      "potentialSavings": number
    }
  ],
  "recommendations": [
    {
      "title": "clear actionable title",
      "description": "detailed explanation",
      "impact": "estimated financial impact",
      "effort": "easy/medium/hard",
      "timeframe": "immediate/short-term/long-term"
    }
  ]
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Clean up the response text to get valid JSON
      const jsonStr = text.replace(/^```json\n|\n```$/g, '') // Remove markdown code blocks
                         .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width spaces
      
      const response = JSON.parse(jsonStr);
      
      // Update knowledge store
      await knowledgeStore.updateUserContext(userId, {
        lastInteraction: new Date()
      });

      return response;
    } catch (error) {
      console.error('Error analyzing budget:', error);
      // Return a fallback analysis
      // Calculate basic stats from transactions even if AI analysis fails
      const transactions = userContext.recentTransactions;
      const totalSpend = transactions.reduce((sum, t) => sum + Math.max(0, t.amount), 0);
      
      // Group by category
      const categories = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.max(0, t.amount);
        return acc;
      }, {} as Record<string, number>);
      
      // Get top 3 categories
      const topCategories = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, amount]) => ({
          category,
          amount,
          trend: 'stable'
        }));

      return {
        overview: {
          totalSpend,
          topCategories,
          monthOverMonthChange: 0
        },
        insights: [{
          category: "Spending Analysis",
          finding: "Basic spending analysis available while we prepare detailed insights",
          suggestedAction: "Review your top spending categories and consider setting budget limits",
          potentialSavings: Math.round(totalSpend * 0.1) // Suggest 10% potential savings
        }],
        recommendations: [{
          title: "Review Regular Expenses",
          description: "Start by reviewing your top spending categories and identify potential areas for savings",
          impact: "Could help reduce monthly spending",
          effort: "easy",
          timeframe: "immediate"
        }]
      };
    }
  }
}

export const budgetAnalyst = new BudgetAnalysisAgent();
