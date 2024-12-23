import { GoogleGenerativeAI } from "@google/generative-ai";
import { knowledgeStore, type UserContext } from "../store/KnowledgeStore";
import { normalizeCategory } from '../store/CategoryMap';

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

export class DashboardInsightsAgent {
  private static formatUserContext(context: UserContext): string {
    const transactions = context.recentTransactions;
    const monthlyIncome = context.monthlyIncome || 0;
    
    // Calculate spending patterns
    const spendingByCategory = transactions.reduce((acc, t) => {
      if (t.amount > 0) { // Only count expenses
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate savings rate
    const totalExpenses = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);
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
${context.activeGoals.map(g => 
  `- ${g.name}: $${(g.currentAmount/100).toFixed(2)}/$${(g.targetAmount/100).toFixed(2)}`
).join('\n')}

Recent Transactions Trends:
${this.analyzeTransactionTrends(transactions)}
`.trim();
  }

  private static analyzeTransactionTrends(transactions: UserContext['recentTransactions']): string {
    // Group transactions by date
    const byDate = transactions.reduce((acc, t) => {
      const date = new Date(t.date).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    }, {} as Record<string, typeof transactions>);

    // Calculate daily totals
    const dailyTotals = Object.entries(byDate).map(([date, txs]) => ({
      date,
      total: txs.reduce((sum, t) => sum + (t.amount || 0), 0)
    }));

    // Sort by date and get the trend
    dailyTotals.sort((a, b) => a.date.localeCompare(b.date));
    
    return dailyTotals
      .map(({ date, total }) => `${date}: $${(total/100).toFixed(2)}`)
      .join('\n');
  }

  private analyzeTransactions(transactions: UserContext['recentTransactions']) {
    // Group transactions by normalized category
    const categoryTotals = transactions.reduce((acc, t) => {
      const category = normalizeCategory(t.category);
      if (t.amount > 0) { // Only count expenses
        acc[category] = (acc[category] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Find recurring transactions with normalized merchant names
    const recurringTransactions = transactions.reduce((acc, t) => {
      const merchantName = t.merchantName?.trim() || t.description;
      const category = normalizeCategory(t.category);
      const key = `${merchantName} (${category})`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {} as Record<string, typeof transactions>);

    // Filter for truly recurring transactions (appear multiple times)
    const recurringPatterns = Object.entries(recurringTransactions)
      .filter(([, txs]) => txs.length > 1)
      .map(([key, txs]) => ({
        key,
        transactions: txs,
        averageAmount: txs.reduce((sum, t) => sum + t.amount, 0) / txs.length,
        frequency: txs.length
      }));

    // Calculate spending trends
    const monthlyTotals = transactions.reduce((acc, t) => {
      const month = new Date(t.date).getMonth();
      if (t.amount > 0) { // Only count expenses
        acc[month] = (acc[month] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<number, number>);

    return {
      categoryTotals,
      recurringPatterns,
      monthlyTotals
    };
  }

  public async getInsights(userId: number): Promise<DashboardInsight[]> {
    try {
      const userContext = await knowledgeStore.getUserContext(userId);
      const { categoryTotals, recurringPatterns, monthlyTotals } = 
        this.analyzeTransactions(userContext.recentTransactions);

      // Format the data for the AI prompt
      const analysisData = `
Transaction Analysis:
- Top spending categories: ${Object.entries(categoryTotals)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([cat, amt]) => `${cat}: $${(amt/100).toFixed(2)}`)
  .join(', ')}

- Recurring transactions: ${recurringPatterns
  .map(p => `${p.key}: $${(p.averageAmount/100).toFixed(2)} (${p.frequency}x)`)
  .join(', ')}

- Monthly spending trend: ${Object.entries(monthlyTotals)
  .map(([month, total]) => `Month ${parseInt(month) + 1}: $${(total/100).toFixed(2)}`)
  .join(', ')}

- Savings rate: ${userContext.monthlyIncome ? 
  ((userContext.monthlyIncome - Object.values(categoryTotals).reduce((a,b) => a+b, 0)) / 
   userContext.monthlyIncome * 100).toFixed(1) + '%' : 'Unknown'}
`;

      const prompt = `As an AI Financial Advisor, analyze this user's actual transaction data and provide 3 key insights:

${analysisData}

Provide exactly 3 insights in this JSON format, using clean category names (no underscores):
{
  "insights": [
    {
      "type": "spending/saving/investment",
      "title": "concise actionable title",
      "description": "detailed explanation based on the actual transaction data",
      "impact": "potential financial impact",
      "priority": "HIGH/MEDIUM/LOW",
      "badge": "short status label"
    }
  ]
}

Focus on clear patterns in the transaction data. Use proper category names (e.g., "Food & Dining" instead of "FOOD_DINING").`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean up the response text to handle markdown formatting
      const cleanJson = responseText
        .replace(/```json\n?/, '') // Remove opening markdown
        .replace(/\n?```$/, '')    // Remove closing markdown
        .trim();                   // Remove extra whitespace

      try {
        const response = JSON.parse(cleanJson);
        return response.insights;
      } catch (jsonError) {
        console.error('Error parsing AI response:', jsonError);
        console.log('Raw AI response:', responseText);
        // Fall back to default insights if parsing fails
        return [
          {
            type: "spending",
            title: "Transaction Analysis",
            description: `Your top spending categories are: ${
              Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([cat, amt]) => `${cat} ($${(amt/100).toFixed(2)})`)
                .join(', ')
            }`,
            priority: "MEDIUM",
            badge: "ANALYSIS"
          },
          {
            type: "saving",
            title: "Recurring Expenses",
            description: `You have ${recurringPatterns.length} recurring transactions, including ${
              recurringPatterns
                .slice(0, 2)
                .map(p => `${p.key} (avg. $${(p.averageAmount/100).toFixed(2)})`)
                .join(' and ')
            }`,
            priority: "HIGH",
            badge: "REVIEW"
          },
          {
            type: "investment",
            title: "Monthly Spending Trend",
            description: `Your monthly spending has ${
              Object.values(monthlyTotals).reduce((a, b) => b - a, 0) > 0 
                ? 'increased' 
                : 'decreased'
            } over time. Consider reviewing your budget to optimize expenses.`,
            priority: "MEDIUM",
            badge: "OPPORTUNITY"
          }
        ];
      }
    } catch (error) {
      console.error('Error generating dashboard insights:', error);
      // Return basic fallback insights
      return [
        {
          type: "spending",
          title: "Recent Transactions",
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
}

export const dashboardInsights = new DashboardInsightsAgent(); 