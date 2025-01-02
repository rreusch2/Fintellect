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
    // Group transactions by normalized category with improved categorization
    const categoryTotals = transactions.reduce((acc, t) => {
      const category = normalizeCategory(t.category);
      if (t.amount > 0) { // Only count expenses
        acc[category] = (acc[category] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Enhanced recurring transaction detection with pattern analysis
    const recurringTransactions = transactions.reduce((acc, t) => {
      const merchantName = t.merchantName?.trim() || t.description;
      const category = normalizeCategory(t.category);
      const amount = Math.abs(t.amount);
      // Create a unique key that includes the amount range for better pattern matching
      const amountRange = Math.round(amount / 100) * 100; // Round to nearest 100
      const key = `${merchantName} (${category}) - ~$${(amountRange/100).toFixed(0)}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        ...t,
        date: new Date(t.date)
      });
      return acc;
    }, {} as Record<string, Array<typeof transactions[0] & { date: Date }>>);

    // Improved recurring pattern detection with frequency analysis
    const recurringPatterns = Object.entries(recurringTransactions)
      .map(([key, txs]) => {
        // Sort transactions by date
        const sortedTxs = txs.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Calculate average time between transactions
        const timeDiffs = sortedTxs.slice(1).map((tx, i) => 
          tx.date.getTime() - sortedTxs[i].date.getTime()
        );
        const avgTimeDiff = timeDiffs.length > 0 
          ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length 
          : 0;
        
        // Calculate standard deviation of amounts
        const amounts = txs.map(t => Math.abs(t.amount));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length
        );

        return {
          key,
          transactions: txs,
          averageAmount: avgAmount,
          frequency: txs.length,
          frequencyDays: Math.round(avgTimeDiff / (1000 * 60 * 60 * 24)),
          isConsistent: stdDev / avgAmount < 0.1, // Less than 10% variation
          totalSpent: amounts.reduce((a, b) => a + b, 0),
          category: normalizeCategory(txs[0].category)
        };
      })
      .filter(p => 
        p.frequency >= 2 && // At least 2 occurrences
        p.frequencyDays > 0 && p.frequencyDays <= 45 // Reasonable frequency
      )
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Enhanced spending trend analysis with daily and weekly patterns
    const spendingTrends = transactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const month = date.getMonth();
      const week = Math.floor(date.getDate() / 7);
      const dayOfWeek = date.getDay();

      if (t.amount > 0) { // Only count expenses
        // Monthly totals
        acc.monthly[month] = (acc.monthly[month] || 0) + t.amount;
        
        // Weekly patterns
        acc.weekly[week] = (acc.weekly[week] || 0) + t.amount;
        
        // Day of week patterns
        acc.dayOfWeek[dayOfWeek] = (acc.dayOfWeek[dayOfWeek] || 0) + t.amount;
        
        // Category trends by week
        const category = normalizeCategory(t.category);
        if (!acc.categoryTrends[category]) {
          acc.categoryTrends[category] = {};
        }
        acc.categoryTrends[category][week] = (acc.categoryTrends[category][week] || 0) + t.amount;
      }
      return acc;
    }, {
      monthly: {} as Record<number, number>,
      weekly: {} as Record<number, number>,
      dayOfWeek: {} as Record<number, number>,
      categoryTrends: {} as Record<string, Record<number, number>>
    });

    // Calculate velocity and acceleration of spending
    const weeklyTotals = Object.entries(spendingTrends.weekly)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([, amount]) => amount);
    
    const weeklyChanges = weeklyTotals.slice(1).map((amount, i) => 
      amount - weeklyTotals[i]
    );

    const spendingVelocity = weeklyChanges.length > 0 
      ? weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length 
      : 0;

    return {
      categoryTotals,
      recurringPatterns,
      spendingTrends,
      spendingVelocity,
      highestSpendingDay: Object.entries(spendingTrends.dayOfWeek)
        .sort(([, a], [, b]) => b - a)[0]?.[0],
      categoryAcceleration: Object.entries(spendingTrends.categoryTrends)
        .map(([category, weeklyAmounts]) => {
          const weeks = Object.entries(weeklyAmounts)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([, amount]) => amount);
          const changes = weeks.slice(1).map((amount, i) => amount - weeks[i]);
          return {
            category,
            acceleration: changes.length > 0 
              ? changes.reduce((a, b) => a + b, 0) / changes.length 
              : 0
          };
        })
        .sort((a, b) => Math.abs(b.acceleration) - Math.abs(a.acceleration))
    };
  }

  public async getInsights(userId: number): Promise<DashboardInsight[]> {
    try {
      const userContext = await knowledgeStore.getUserContext(userId);
      const analysis = this.analyzeTransactions(userContext.recentTransactions);

      // Enhanced data formatting for AI prompt
      const analysisData = `
Transaction Analysis:

1. Spending Overview:
- Top spending categories: ${Object.entries(analysis.categoryTotals)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([cat, amt]) => `${cat}: $${(amt/100).toFixed(2)}`)
  .join(', ')}
- Weekly spending velocity: ${analysis.spendingVelocity > 0 ? 'Increasing' : 'Decreasing'} by $${Math.abs(analysis.spendingVelocity/100).toFixed(2)}/week
- Highest spending day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(analysis.highestSpendingDay || '0')]}

2. Recurring Patterns:
${analysis.recurringPatterns.slice(0, 5).map(p => 
  `- ${p.key}: $${(p.averageAmount/100).toFixed(2)} every ${p.frequencyDays} days (${p.isConsistent ? 'consistent' : 'variable'} amount)`
).join('\n')}

3. Category Trends:
${analysis.categoryAcceleration.slice(0, 3).map(c => 
  `- ${c.category}: ${c.acceleration > 0 ? 'Increasing' : 'Decreasing'} by $${Math.abs(c.acceleration/100).toFixed(2)}/week`
).join('\n')}

4. Financial Context:
- Monthly Income: ${userContext.monthlyIncome ? `$${(userContext.monthlyIncome/100).toFixed(2)}` : 'Unknown'}
- Savings Rate: ${userContext.monthlyIncome ? 
  ((userContext.monthlyIncome - Object.values(analysis.categoryTotals).reduce((a,b) => a+b, 0)) / 
   userContext.monthlyIncome * 100).toFixed(1) + '%' : 'Unknown'}
- Active Financial Goals: ${userContext.activeGoals.map(g => g.name).join(', ') || 'None set'}
`;

      const prompt = `As an AI Financial Advisor, analyze this detailed transaction data and provide 3 highly personalized, actionable insights. Consider spending patterns, recurring expenses, and category trends.

${analysisData}

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
              Object.entries(analysis.categoryTotals)
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
            description: `You have ${analysis.recurringPatterns.length} recurring transactions, including ${
              analysis.recurringPatterns
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
              Object.values(analysis.spendingTrends.monthly).reduce((a, b) => b - a, 0) > 0 
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