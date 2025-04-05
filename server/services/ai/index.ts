import { GoogleGenerativeAI } from "@google/generative-ai";
import { SAVINGS_ANALYSIS_PROMPT } from "./prompts/transaction-insights";
import { knowledgeStore } from "./store/KnowledgeStore";
import { db } from "@db";
import { plaidTransactions } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { normalizeCategory } from "./store/CategoryMap";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function generateSavingsTips(userId: number) {
  try {
    // Get user context and recent transactions
    const context = await knowledgeStore.getUserContext(userId);
    
    // Get last 30 days of transactions
    const recentTransactions = await db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.userId, userId))
      .orderBy(desc(plaidTransactions.date))
      .limit(30);

    // Prepare transaction data for analysis
    const categoryTotals = recentTransactions.reduce((acc, transaction) => {
      const category = normalizeCategory(transaction.category || 'OTHER');
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly stats
    const totalSpending = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const monthlyIncome = context.monthlyIncome || 0;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalSpending) / monthlyIncome) * 100 : 0;

    // Prepare prompt with context
    const prompt = SAVINGS_ANALYSIS_PROMPT
      .replace('{monthlyIncome}', `$${(monthlyIncome/100).toFixed(2)}`)
      .replace('{totalSpending}', `$${(totalSpending/100).toFixed(2)}`)
      .replace('{savingsRate}', `${savingsRate.toFixed(1)}%`)
      .replace('{categoryBreakdown}', Object.entries(categoryTotals)
        .map(([category, amount]) => `${category}: $${(amount/100).toFixed(2)}`)
        .join('\n'));

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Format the response
    const tips = text.split('\n')
      .filter(line => line.trim())
      .map(tip => tip.replace(/^\d+\.\s*/, '').trim());

    return {
      tips: Array.isArray(tips) ? tips : [],
      stats: {
        monthlyIncome,
        totalSpending,
        savingsRate,
        categoryBreakdown: categoryTotals
      }
    };

  } catch (error) {
    console.error('Error in generateSavingsTips:', error);
    throw new Error('Failed to generate savings tips: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// ... other existing functions ... 

// Add SentinelAgent to exports
export * from './agents/ThriveAgent.js';
export * from './agents/SentinelAgent.js'; 