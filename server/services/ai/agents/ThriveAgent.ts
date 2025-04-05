import { generateContent } from '../config/anthropic.js';
import { db } from "@db";
import { eq, desc, and, gte } from "drizzle-orm";
import { plaidTransactions, users, plaidAccounts } from "@db/schema.js";
import { normalizeCategory } from '../store/CategoryMap.js';

// Interface for the insights Thrive will generate
export interface ThriveInsight {
  type: "optimization" | "pattern" | "alert" | "suggestion";
  title: string;
  description: string; // Detailed explanation
  actionable_tip?: string; // Concrete next step
  potential_savings?: string; // Estimated savings if applicable
  priority: "HIGH" | "MEDIUM" | "LOW";
  category_focus?: string; // Specific spending category
}

// Define a structure for user context data needed by this agent
interface UserExpenseContext {
  monthlyIncome: number;
  recentTransactions: (typeof plaidTransactions.$inferSelect)[];
  // Potentially add more context later (e.g., budget goals)
}

export class ThriveAgent {

  constructor() {
    // Dependencies can be injected here if needed later
    console.log("ThriveAgent initialized");
  }

  // Method to fetch and format user context (similar to other agents)
  private async getUserContext(userId: number): Promise<UserExpenseContext> {
    // TODO: Implement context fetching logic
    // For now, return dummy data or throw error
    console.log(`[ThriveAgent] Fetching context for userId: ${userId}`);

    // Example fetching (adapt from other agents):
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new Error("User not found");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await db.query.plaidTransactions.findMany({
      where: and(
        eq(plaidTransactions.userId, userId),
        gte(plaidTransactions.date, thirtyDaysAgo)
      ),
      orderBy: [desc(plaidTransactions.date)]
    });

    return {
      monthlyIncome: user.monthlyIncome || 0,
      recentTransactions,
    };
  }

  // Method to format context for the AI prompt
  private formatUserContextForAI(context: UserExpenseContext): string {
      // TODO: Implement formatting logic focused on spending patterns, categories, merchants etc.
      // Example:
      const spendingByCategory = context.recentTransactions.reduce((acc: Record<string, number>, t) => {
          if (t.amount > 0) { // Expenses
              const category = normalizeCategory(t.category);
              acc[category] = (acc[category] || 0) + t.amount;
          }
          return acc;
      }, {});

      const totalExpenses = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);

      return `
User Expense Context (Last 30 Days):
- Total Expenses: $${(totalExpenses / 100).toFixed(2)}
- Spending by Category:
${Object.entries(spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => `  - ${category}: $${(amount / 100).toFixed(2)}`)
    .slice(0, 5) // Limit for brevity
    .join('\\n')}
- Recent Transactions (Sample):
${context.recentTransactions
    .filter(t => t.amount > 0)
    .slice(0, 5) // Limit for brevity
    .map(t => `  - ${new Date(t.date).toLocaleDateString()}: ${t.merchantName || t.description} - $${(t.amount/100).toFixed(2)} (${normalizeCategory(t.category)})`)
    .join('\\n')}
      `.trim();
  }

  // Main method to get expense optimization insights
  public async getExpenseInsights(userId: number): Promise<ThriveInsight[]> {
    console.log(`[ThriveAgent] Generating insights for userId: ${userId}`);
    try {
      // 1. Get user context
      const userContext = await this.getUserContext(userId);

      // 2. Format context for AI
      const formattedContext = this.formatUserContextForAI(userContext);

      // 3. Craft the prompt for Anthropic incorporating Thrive's persona
      const prompt = `
You are Thrive, a resourceful, practical, and detail-oriented AI Expense Optimizer. Your goal is to help the user flourish by using their resources efficiently. Analyze the following user expense data and provide 3 actionable optimization insights. Be supportive and encouraging, focusing on practical steps and potential savings.

User Expense Context:
${formattedContext}

Provide exactly 3 insights in JSON format within a root "insights" array like this:
{
  "insights": [
    {
      "type": "optimization",
      "title": "Concise insight title (e.g., 'Optimize Subscription Spending')",
      "description": "Detailed explanation of the pattern observed and the optimization opportunity. Be specific based on the data.",
      "actionable_tip": "A clear, practical next step the user can take.",
      "potential_savings": "Estimated monthly savings (e.g., '$15/month') if applicable.",
      "priority": "HIGH/MEDIUM/LOW",
      "category_focus": "The relevant spending category (e.g., 'Subscriptions', 'Dining')"
    }
  ]
}

Focus on:
- Identifying specific areas for potential savings (e.g., high spending categories, recurring charges).
- Suggesting practical optimizations or alternatives.
- Highlighting spending patterns or changes.
- Providing clear, actionable advice. Quantify savings where possible.
Remember to be encouraging and focus on efficiency!
      `;

      // 4. Call the AI
      const responseText = await generateContent(prompt);

      // 5. Parse the response and handle errors
      try {
        const response = JSON.parse(responseText);
        if (response && Array.isArray(response.insights)) {
          // TODO: Add validation for the insight structure if needed
          console.log(`[ThriveAgent] Successfully generated ${response.insights.length} insights for userId: ${userId}`);
          return response.insights as ThriveInsight[];
        } else {
           console.error('[ThriveAgent] AI response missing insights array:', responseText);
           throw new Error('AI response format incorrect');
        }
      } catch (jsonError) {
        console.error('[ThriveAgent] Error parsing AI response JSON:', jsonError, 'Raw response:', responseText);
        // Potentially return fallback insights here
        return this.generateFallbackInsights(userContext); // Add fallback method
      }

    } catch (error: any) {
      console.error(`[ThriveAgent] Error generating expense insights for userId ${userId}:`, error?.message || error);
      // Return empty array or basic fallback on error
      return this.generateBasicFallbackInsights(); // Add basic fallback method
    }
  }

  // Fallback method if AI parsing fails
  private generateFallbackInsights(context: UserExpenseContext): ThriveInsight[] {
      console.warn('[ThriveAgent] Generating fallback insights due to AI parsing error.');
      // Create some basic insights based directly on context
      const spendingByCategory = context.recentTransactions.reduce((acc: Record<string, number>, t) => {
          if (t.amount > 0) {
              const category = normalizeCategory(t.category);
              acc[category] = (acc[category] || 0) + t.amount;
          }
          return acc;
      }, {});
      const topCategory = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a)[0];

      return [
          {
              type: "pattern",
              title: "Review Top Spending Category",
              description: `Your highest spending category recently was ${topCategory ? topCategory[0] : 'N/A'} with a total of $${topCategory ? (topCategory[1]/100).toFixed(2) : '0.00'}. Consider reviewing these expenses for optimization opportunities.`,
              actionable_tip: "Review transactions in your top spending category.",
              priority: "MEDIUM",
              category_focus: topCategory ? topCategory[0] : undefined
          }
      ];
  }

  // Basic fallback if the whole process fails
  private generateBasicFallbackInsights(): ThriveInsight[] {
      console.warn('[ThriveAgent] Generating basic fallback insights due to error.');
      return [
          {
              type: "suggestion",
              title: "Review Spending Patterns",
              description: "Analyze your recent transactions to identify areas where you might be able to save.",
              actionable_tip: "Check your transaction list for recurring or large expenses.",
              priority: "MEDIUM",
          }
      ];
  }
}

// Export an instance for use in API routes
export const thriveAgent = new ThriveAgent(); 