import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@db";
import { plaidTransactions, insights } from "@db/schema";
import { eq, desc } from "drizzle-orm";

// Initialize Gemini API with safety limits
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

export async function chatWithAI(message: string, userId: number) {
  try {
    // Check cache first
    const cacheKey = `chat_${userId}_${message}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user data
    const [transactions, userInsights] = await Promise.all([
      db
        .select()
        .from(plaidTransactions)
        .where(eq(plaidTransactions.userId, userId))
        .orderBy(desc(plaidTransactions.date))
        .limit(10),
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

    // Safely process transaction data
    const stats = transactions.reduce((acc, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseInt(String(t.amount));
      if (!isNaN(amount)) {
        acc.total += amount;
        const category = t.category || 'Other';
        acc.categories[category] = (acc.categories[category] || 0) + amount;
      }
      return acc;
    }, { total: 0, categories: {} as Record<string, number> });

    const contextPrompt = `As a friendly AI financial assistant, help with: "${message}"

Financial Summary:
- Recent Spending: $${(stats.total / 100).toFixed(2)}
- Top Categories: ${Object.entries(stats.categories)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 2)
  .map(([cat, amount]) => `${cat}: $${(amount / 100).toFixed(2)}`)
  .join(', ')}

${userInsights.length > 0 ? `Recent Insight: ${userInsights[0].title}` : ''}

Respond conversationally as JSON:
{
  "message": "Friendly response with specific numbers",
  "suggestions": [
    {
      "title": "Action item",
      "description": "Specific advice"
    }
  ]
}`;

    const result = await model.generateContent(contextPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    const response = {
      message: parsed.message || "I'm analyzing your financial data to help.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 2) : []
    };

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