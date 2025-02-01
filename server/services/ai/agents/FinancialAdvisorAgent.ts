import { ollamaAI } from "../config/gemini.ts";
import { knowledgeStore, type UserContext } from "../store/KnowledgeStore";

// Initialize AI with Ollama
const model = ollamaAI;

export interface FinancialAdvice {
  summary: string;
  recommendations: {
    title: string;
    description: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }[];
  riskLevel: 'low' | 'moderate' | 'high';
  nextSteps: string[];
}

export class FinancialAdvisorAgent {
  private static formatUserContext(context: UserContext): string {
    const totalSpend = context.recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const topCategories = context.recentTransactions
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {});

    const sortedCategories = Object.entries(topCategories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat, amount]) => `${cat}: $${(amount/100).toFixed(2)}`)
      .join(', ');

    return `
User Financial Context:
- Monthly Spending: $${(totalSpend/100).toFixed(2)}
- Top Spending Categories: ${sortedCategories}
- Active Goals: ${context.activeGoals.map(g => g.name).join(', ')}
- Recent Insights: ${context.previousInsights.map(i => i.title).join(', ')}
    `.trim();
  }

  public async getPersonalizedAdvice(userId: number, query: string): Promise<FinancialAdvice> {
    const userContext = await knowledgeStore.getUserContext(userId);
    const contextStr = FinancialAdvisorAgent.formatUserContext(userContext);

    const prompt = `As an AI Financial Advisor, provide personalized financial advice based on this context:

${contextStr}

User Query: "${query}"

Respond with detailed financial advice in this JSON format:
{
  "summary": "Brief overview of the financial situation and advice",
  "recommendations": [
    {
      "title": "Clear action-oriented title",
      "description": "Detailed explanation of the recommendation",
      "impact": "Specific potential financial impact",
      "priority": "high/medium/low",
      "timeframe": "Immediate/Short-term/Long-term"
    }
  ],
  "riskLevel": "low/moderate/high",
  "nextSteps": [
    "Specific actionable steps the user should take"
  ]
}`;

    try {
      const result = await model.generateContent(prompt);
      const response = JSON.parse(result.response.text());
      
      // Update the knowledge store with this interaction
      await knowledgeStore.updateUserContext(userId, {
        lastInteraction: new Date()
      });

      return response;
    } catch (error) {
      console.error('Error generating financial advice:', error);
      return {
        summary: "Unable to generate personalized advice at the moment",
        recommendations: [{
          title: "Review Your Financial Goals",
          description: "Take some time to review and adjust your current financial goals based on your recent activity.",
          impact: "Better alignment of financial activities with objectives",
          priority: "high",
          timeframe: "Immediate"
        }],
        riskLevel: "moderate",
        nextSteps: ["Review your current financial goals", "Track your daily expenses"]
      };
    }
  }
}

export const financialAdvisor = new FinancialAdvisorAgent();
