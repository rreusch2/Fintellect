import Anthropic from '@anthropic-ai/sdk';
import { knowledgeStore } from "../store/KnowledgeStore";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TipContext {
  totalBalance: number;
  monthlySpending: number;
  categoryTotals: Record<string, number>;
  previousTips: string[];
}

export class FinancialTipAgent {
  async generateTip(userId: number, context: TipContext) {
    try {
      const userContext = await knowledgeStore.getUserContext(userId);
      
      const prompt = `
      As an AI financial advisor, generate a personalized financial tip based on the following user data:
      
      Current Financial Status:
      - Total Balance: $${(context.totalBalance / 100).toFixed(2)}
      - Monthly Spending: $${(context.monthlySpending / 100).toFixed(2)}
      - Spending Categories: ${JSON.stringify(Object.fromEntries(
        Object.entries(context.categoryTotals).map(([k, v]) => [k, `$${(v / 100).toFixed(2)}`])
      ))}
      
      User Context:
      - Monthly Income: $${(userContext.monthlyIncome / 100).toFixed(2)}
      - Financial Goals: ${userContext.goals?.join(', ') || 'None specified'}
      
      Previously Given Tips: ${context.previousTips.join(', ') || 'None'}
      
      Generate a unique, actionable financial tip that:
      1. Is specific to their spending patterns and financial situation
      2. Hasn't been given before
      3. Is concise and immediately actionable
      4. Includes a clear benefit or potential impact
      
      Return ONLY a valid JSON object with:
      {
        "id": "unique_id",
        "title": "brief attention-grabbing title",
        "description": "detailed explanation",
        "category": "one of: budgeting, saving, investing, debt, general",
        "relevanceScore": number between 0-100,
        "action": "optional call-to-action button text"
      }
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      try {
        // Clean the response to extract just the JSON
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonText = text.slice(jsonStart, jsonEnd);
        
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.error("Raw response:", text);
        throw new Error("Failed to parse financial tip response");
      }
    } catch (error) {
      console.error("Error in FinancialTipAgent:", error);
      throw new Error("Failed to generate financial tip");
    }
  }
}

export const financialTipAgent = new FinancialTipAgent(); 