import { ollamaAI, MODEL_NAMES } from "./ai/config/gemini.ts";
import { db } from "@db";
import { plaidTransactions, insights } from "@db/schema";
import { eq, desc } from "drizzle-orm";

// Initialize Ollama AI with safety limits
const model = ollamaAI;

// Simple in-memory cache for responses
const responseCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key: string) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  return null;
}

function setCachedResponse(key: string, response: any) {
  responseCache.set(key, { response, timestamp: Date.now() });
}

interface AIInsight {
  type: 'action' | 'tip';
  title: string;
  description: string;
  impact?: string;
  priority: 'high' | 'medium' | 'low';
}

interface CategoryStats {
  total: number;
  byCategory: Record<string, number>;
}

interface Transaction {
  amount: number;
  category: string;
  date: Date;
}

interface UserInsight {
  id: number;
  title: string;
  description: string;
  type: string;
  createdAt: Date;
}

interface Recommendation {
  title: string;
  description: string;
  potentialSavings: string;
  difficulty: string;
  timeframe: string;
  category?: string;
}

export async function generateSavingsTips(userId: number) {
  try {
    // Get user's transaction data
    const transactions = await db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.userId, userId))
      .orderBy(desc(plaidTransactions.date))
      .limit(30);

    // Calculate spending patterns
    const stats = transactions.reduce((acc, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseInt(String(t.amount));
      if (!isNaN(amount)) {
        if (amount > 0 && !t.category?.includes('TRANSFER')) {
          acc.total += amount;
          const category = t.category || 'Other';
          acc.byCategory[category] = (acc.byCategory[category] || 0) + amount;

          const merchant = t.merchantName || t.description || 'Unknown';
          if (!acc.merchants[merchant]) {
            acc.merchants[merchant] = {
              total: 0,
              count: 0,
              category: t.category || 'Other'
            };
          }
          acc.merchants[merchant].total += amount;
          acc.merchants[merchant].count++;
        }
      }
      return acc;
    }, { 
      total: 0, 
      byCategory: {} as Record<string, number>,
      merchants: {} as Record<string, { total: number; count: number; category: string; }>
    });

    // Find recurring expenses
    const recurringMerchants = Object.entries(stats.merchants)
      .filter(([, data]) => data.count >= 2)
      .map(([merchant, data]) => ({
        merchant,
        monthlyTotal: data.total,
        category: data.category
      }))
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    // Sort categories by spend amount
    const topCategories = Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({ 
        category: cat, 
        amount,
        percentage: (amount / stats.total * 100).toFixed(1)
      }));

    const prompt = `Analyze this 30-day financial data:
Total spending: $${(stats.total / 100).toFixed(2)}

Top spending categories:
${topCategories.map(c => `- ${c.category}: $${(c.amount / 100).toFixed(2)} (${c.percentage}%)`).join('\n')}

Top recurring expenses:
${recurringMerchants.slice(0, 5).map(m => 
  `- ${m.merchant}: $${(m.monthlyTotal / 100).toFixed(2)}/month (${m.category})`
).join('\n')}

Generate 3 specific, actionable savings recommendations as JSON. Focus on:
1. Highest impact opportunities based on spending patterns
2. Specific recurring expenses that could be reduced
3. Category-specific optimization strategies

Response format:
{
  "recommendations": [
    {
      "title": "Clear, specific recommendation (5-7 words)",
      "description": "Detailed explanation with specific steps and expected impact. Reference specific numbers from the data.",
      "potentialSavings": "Estimated monthly savings in dollars",
      "difficulty": "easy|medium|hard",
      "timeframe": "immediate|short-term|long-term",
      "category": "Specific category this applies to"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed?.recommendations)) {
        throw new Error('Invalid response format');
      }

      return {
        success: true,
        spendingOverview: {
          total: stats.total,
          topCategories: topCategories.slice(0, 3),
          recurringExpenses: recurringMerchants.slice(0, 3)
        },
        recommendations: parsed.recommendations.map(rec => ({
          title: String(rec.title || '').slice(0, 50),
          description: String(rec.description || '').slice(0, 200),
          potentialSavings: String(rec.potentialSavings || '').replace(/[^0-9.]/g, ''),
          difficulty: ['easy', 'medium', 'hard'].includes(rec.difficulty) ? rec.difficulty : 'medium',
          timeframe: ['immediate', 'short-term', 'long-term'].includes(rec.timeframe) ? rec.timeframe : 'short-term',
          category: rec.category || topCategories[0]?.category || 'General'
        }))
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        success: true,
        spendingOverview: {
          total: stats.total,
          topCategories: topCategories.slice(0, 3),
          recurringExpenses: recurringMerchants.slice(0, 3)
        },
        recommendations: [
          {
            title: `Optimize ${topCategories[0]?.category || 'Top'} Spending`,
            description: `Your highest spending category is ${topCategories[0]?.category || 'unknown'}. Review these expenses and identify non-essential items that can be reduced.`,
            potentialSavings: Math.round(stats.total * 0.1 / 100).toString(),
            difficulty: 'medium',
            timeframe: 'immediate',
            category: topCategories[0]?.category || 'General'
          },
          {
            title: 'Review Recurring Subscriptions',
            description: recurringMerchants.length > 0 
              ? `Consider evaluating your subscription to ${recurringMerchants[0].merchant} ($${(recurringMerchants[0].monthlyTotal / 100).toFixed(2)}/month).`
              : 'Review your monthly subscriptions and cancel unused services.',
            potentialSavings: '20',
            difficulty: 'easy',
            timeframe: 'immediate',
            category: 'Subscriptions'
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error generating savings tips:", error);
    throw error;
  }
}

const formatCategory = (category: string): string => {
  // Special case mappings for common categories
  const specialCases: Record<string, string> = {
    'FOOD_AND_DRINK': 'Food & Drink',
    'GENERAL_MERCHANDISE': 'General Merchandise',
    'GENERAL_SERVICES': 'General Services',
    'TRANSPORTATION': 'Transportation',
    'TRAVEL': 'Travel',
    'HOME_IMPROVEMENT': 'Home Improvement',
    'PERSONAL_CARE': 'Personal Care',
    'ENTERTAINMENT': 'Entertainment',
    'HEALTH_FITNESS': 'Health & Fitness',
    'BILLS_UTILITIES': 'Bills & Utilities'
  };

  // Check if we have a special case mapping
  if (specialCases[category]) {
    return specialCases[category];
  }

  // Default formatting for other categories
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export async function chatWithAI(message: string, userId: number) {
  try {
    // Check cache first
    const cacheKey = `chat_${userId}_${message}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user data with more transactions for better analysis
    const [transactions, userInsights] = await Promise.all([
      db
        .select()
        .from(plaidTransactions)
        .where(eq(plaidTransactions.userId, userId))
        .orderBy(desc(plaidTransactions.date))
        .limit(100),  // Increased to get better monthly data
      db
        .select({
          id: insights.id,
          title: insights.title,
          description: insights.description,
          type: insights.type,
          createdAt: insights.createdAt
        })
        .from(insights)
        .where(eq(insights.userId, userId))
        .orderBy(desc(insights.createdAt))
        .limit(3)
    ]);

    // Calculate monthly and recent spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Process transactions by period
    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= sevenDaysAgo);

    // Enhanced spending calculation with proper handling of transaction types
    const calculateSpending = (txs: typeof transactions) => {
      return txs.reduce((acc, t) => {
        const amount = typeof t.amount === 'number' ? t.amount : parseInt(String(t.amount));
        if (!isNaN(amount) && amount > 0) {  // Only count positive amounts (expenses)
          const category = t.category || 'Other';
          // Skip transfer categories
          if (!category.includes('TRANSFER') && category !== 'PAYMENT') {
            acc.total += amount;
            acc.categories[category] = (acc.categories[category] || 0) + amount;
          }
        }
        return acc;
      }, { total: 0, categories: {} as Record<string, number> });
    };

    const monthlyStats = calculateSpending(monthlyTransactions);
    const recentStats = calculateSpending(recentTransactions);

    // Format category breakdowns with enhanced accuracy
    const formatCategoryBreakdown = (stats: typeof monthlyStats) => {
      return Object.entries(stats.categories)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({
          category: formatCategory(category),
          amount,
          percentage: ((amount / stats.total) * 100).toFixed(1),
          formattedAmount: `$${(amount / 100).toFixed(2)}`
        }));
    };

    const monthlyBreakdown = formatCategoryBreakdown(monthlyStats);
    const recentBreakdown = formatCategoryBreakdown(recentStats);

    // Calculate spending trends
    const calculateTrends = (breakdown: ReturnType<typeof formatCategoryBreakdown>) => {
      return breakdown.map(category => ({
        ...category,
        isHighSpending: parseFloat(category.percentage) > 30,
        suggestedReduction: parseFloat(category.percentage) > 30 ? 10 : 5,
        potentialSavings: (category.amount * (parseFloat(category.percentage) > 30 ? 0.1 : 0.05) / 100).toFixed(2)
      }));
    };

    const monthlyTrends = calculateTrends(monthlyBreakdown);
    const recentTrends = calculateTrends(recentBreakdown);

    const getPromptTemplate = (message: string, stats: any) => {
      // Base context with spending data
      const baseContext = `
Monthly Spending (${stats.startDate} - ${stats.endDate}):
Total Monthly Spending: $${(stats.monthlyStats.total / 100).toFixed(2)}
Monthly Breakdown:
${stats.monthlyBreakdown.map(c => 
  `${c.category}: ${c.formattedAmount} (${c.percentage}%)`
).join('\n')}

Recent 7-Day Spending:
Total Recent Spending: $${(stats.recentStats.total / 100).toFixed(2)}
Recent Breakdown:
${stats.recentBreakdown.map(c => 
  `${c.category}: ${c.formattedAmount} (${c.percentage}%)`
).join('\n')}

Spending Insights:
${stats.monthlyTrends
  .filter(t => t.isHighSpending)
  .map(t => `${t.category} spending is high at ${t.percentage}%. Potential savings: $${t.potentialSavings}`)
  .join('\n')}`;

      // Customize prompt based on message type
      if (message.toLowerCase().includes('analyze spending')) {
        return `You are a friendly AI financial advisor. Analyze the user's spending patterns and provide actionable insights.

${baseContext}

Response Format:
{
  "message": "Brief, friendly greeting",
  "sections": [
    {
      "title": "Monthly Overview",
      "content": "Focus on total spending and top 2-3 categories with clear percentage breakdowns"
    },
    {
      "title": "Recent Activity",
      "content": "Highlight significant changes in spending patterns over the last 7 days"
    },
    {
      "title": "Insights & Recommendations",
      "content": "2-3 specific, actionable recommendations with potential savings amounts and clear steps"
    }
  ]
}`;
      }

      if (message.toLowerCase().includes('budget')) {
        return `You are a friendly AI financial advisor. Create a personalized budget based on spending patterns.

${baseContext}

Important Guidelines:
1. Always include specific dollar amounts and percentages
2. Use the 50/30/20 rule as a baseline
3. Provide actionable steps
4. Keep recommendations realistic and achievable

Response Format:
{
  "message": "Hi there! I've analyzed your spending patterns and created a budget to help you manage your finances more effectively.",
  "sections": [
    {
      "title": "Monthly Overview",
      "content": "Your total monthly spending is $${(stats.monthlyStats.total / 100).toFixed(2)}. Food & Drink is your biggest expense at $${(stats.monthlyBreakdown[0]?.amount / 100).toFixed(2)} (${stats.monthlyBreakdown[0]?.percentage}%). Other major categories include ${stats.monthlyBreakdown[1]?.category} ($${(stats.monthlyBreakdown[1]?.amount / 100).toFixed(2)}), ${stats.monthlyBreakdown[2]?.category} ($${(stats.monthlyBreakdown[2]?.amount / 100).toFixed(2)}), and ${stats.monthlyBreakdown[3]?.category} ($${(stats.monthlyBreakdown[3]?.amount / 100).toFixed(2)})."
    },
    {
      "title": "Recommended Budget",
      "content": "Based on the 50/30/20 rule, I recommend allocating your income as follows:\\n* 50% to Needs (e.g., Food & Drink, Housing, Transportation)\\n* 30% to Wants (e.g., Entertainment, Dining Out)\\n* 20% to Savings and Debt Repayment\\nThis would result in a budget of:\\n* Needs: $${(stats.monthlyStats.total * 0.5 / 100).toFixed(2)}\\n* Wants: $${(stats.monthlyStats.total * 0.3 / 100).toFixed(2)}\\n* Savings and Debt Repayment: $${(stats.monthlyStats.total * 0.2 / 100).toFixed(2)}"
    },
    {
      "title": "Action Steps",
      "content": "To implement this budget, consider the following steps:\\n1. Track all expenses using categories\\n2. Set up automatic transfers for savings\\n3. Review and adjust spending in high-cost categories\\n4. Consider meal planning to reduce food costs\\n5. Look for opportunities to reduce non-essential spending"
    }
  ]
}`;
      }

      if (message.toLowerCase().includes('saving tips')) {
        return `You are a friendly AI financial advisor. Provide personalized saving tips based on spending patterns.

${baseContext}

Response Format:
{
  "message": "Brief, friendly greeting",
  "sections": [
    {
      "title": "Top Saving Opportunities",
      "content": "2-3 major areas where significant savings are possible"
    },
    {
      "title": "Quick Wins",
      "content": "2-3 immediate actions that can lead to savings"
    },
    {
      "title": "Long-term Strategies",
      "content": "2-3 sustainable saving strategies with specific steps and potential impact"
    }
  ]
}`;
      }

      if (message.toLowerCase().includes('recurring charges')) {
        return `You are a friendly AI financial advisor. Analyze recurring charges and suggest optimizations.

${baseContext}

Response Format:
{
  "message": "Brief, friendly greeting",
  "sections": [
    {
      "title": "Recurring Charges Overview",
      "content": "List of identified recurring charges with amounts and frequencies"
    },
    {
      "title": "Potential Optimizations",
      "content": "2-3 specific suggestions for reducing or eliminating unnecessary subscriptions"
    },
    {
      "title": "Action Plan",
      "content": "Step-by-step guide to review and optimize recurring charges"
    }
  ]
}`;
      }

      // Default prompt for other queries
      return `You are a friendly AI financial advisor. Help with: "${message}"

${baseContext}

Response Format:
{
  "message": "Brief, friendly greeting",
  "sections": [
    {
      "title": "Monthly Overview",
      "content": "Key monthly spending insights"
    },
    {
      "title": "Recent Activity",
      "content": "Important recent trends"
    },
    {
      "title": "Insights & Recommendations",
      "content": "2-3 specific, actionable recommendations"
    }
  ]
}`;
    };

    const contextPrompt = getPromptTemplate(message, {
      startDate: startOfMonth,
      endDate: now,
      monthlyStats,
      recentStats,
      monthlyBreakdown,
      recentBreakdown,
      monthlyTrends,
      recentTrends
    });

    const result = await model.generateContent(contextPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Format the response to ensure completeness
    const formatResponse = (parsed: any) => {
      const sections = parsed.sections || [];
      const message = [parsed.message || "Here's your detailed financial analysis:"];
      
      sections.forEach((section: any) => {
        message.push(`\n**${section.title}**\n${section.content}`);
      });

      return {
        message: message.join('\n'),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
      };
    };

    const response = formatResponse(parsed);

    // Cache the response
    setCachedResponse(cacheKey, response);
    
    return response;
  } catch (error) {
    console.error("Error in AI chat:", error);
    return {
      message: "I'm here to help! While we're working on connecting your financial data, I can still provide general advice and insights.",
      suggestions: [
        {
          title: "Connect Your Accounts",
          description: "Link your bank accounts to get personalized financial insights and recommendations."
        }
      ]
    };
  }
}

export async function generateFinancialInsights(transactions: Transaction[]) {
  try {
    // Calculate statistics
    const stats = transactions.reduce<CategoryStats>((acc, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseInt(String(t.amount));
      if (!isNaN(amount)) {
        acc.total += amount;
        const category = t.category || 'Other';
        acc.byCategory[category] = (acc.byCategory[category] || 0) + amount;
      }
      return acc;
    }, { total: 0, byCategory: {} });

    const topCategories = Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat, amount]) => `${cat}: $${(amount / 100).toFixed(2)}`)
      .join(', ');

    const prompt = `Based on this financial activity:
- Monthly spend: $${(stats.total / 100).toFixed(2)}
- Top spending categories: ${topCategories}

Generate a highly personalized, actionable financial insight as JSON:
{
  "insights": [
    {
      "type": "action",
      "title": "Clear, specific action (5-7 words)",
      "description": "One immediate, measurable action step that directly addresses the spending pattern",
      "impact": "Specific monthly savings estimate based on the data",
      "priority": "high"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const parsed = JSON.parse(text);
      const insights: AIInsight[] = [];
      
      if (Array.isArray(parsed?.insights) && parsed.insights.length > 0) {
        const insight = parsed.insights[0];
        insights.push({
          type: insight?.type === 'action' ? 'action' : 'tip',
          title: String(insight?.title || '').slice(0, 50),
          description: String(insight?.description || '').slice(0, 100),
          impact: insight?.impact ? String(insight.impact).slice(0, 50) : undefined,
          priority: insight?.priority || 'medium'
        });
      }

      if (insights.length === 0) {
        insights.push({
          type: 'action',
          title: transactions.length === 0 ? 'Connect Your Bank Account' : 'Analyze Your Top Expenses',
          description: transactions.length === 0 
            ? 'Link your accounts to receive personalized insights based on your actual spending patterns.'
            : `Focus on your highest spending category: ${Object.keys(stats.byCategory)[0] || 'Uncategorized'}`,
          impact: transactions.length === 0 ? 'Get tailored savings recommendations' : 'Potential 15-20% monthly savings',
          priority: 'high'
        });
      }
      
      return insights;
    } catch (error) {
      console.error('Error parsing AI response:', error, 'Raw response:', text);
      return [{
        type: 'tip',
        title: 'Smart Saving Strategy',
        description: 'Review your recent transactions and look for recurring expenses that could be reduced.',
        priority: 'medium'
      }];
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    return [{
      type: "tip",
      title: "Using Sample Data",
      description: transactions.length === 0 
        ? "We're currently using sample data to demonstrate features. Connect your accounts to get personalized insights."
        : "We're having trouble analyzing your data. Try refreshing or check back soon.",
      priority: "medium"
    }];
  }
}