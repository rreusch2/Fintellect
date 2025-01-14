import { GoogleGenerativeAI } from "@google/generative-ai";
import { knowledgeStore } from "../store/KnowledgeStore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    maxOutputTokens: 500,
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
});

interface TipContext {
  totalBalance: number;
  monthlySpending: number;
  categoryTotals: Record<string, number>;
  previousTips: string[];
}

export class FinancialTipAgent {
  async generateTip(userId: number, context: TipContext) {
    const userContext = await knowledgeStore.getUserContext(userId);
    
    const prompt = `
    As an AI financial advisor, generate a personalized financial tip based on the following user data:
    
    Current Financial Status:
    - Total Balance: ${context.totalBalance / 100}
    - Monthly Spending: ${context.monthlySpending / 100}
    - Spending Categories: ${JSON.stringify(context.categoryTotals)}
    
    User Context:
    - Monthly Income: ${userContext.monthlyIncome / 100}
    - Financial Goals: ${userContext.goals?.join(', ')}
    
    Previously Given Tips: ${context.previousTips.join(', ')}
    
    Generate a unique, actionable financial tip that:
    1. Is specific to their spending patterns and financial situation
    2. Hasn't been given before
    3. Is concise and immediately actionable
    4. Includes a clear benefit or potential impact
    
    Return the tip in JSON format with:
    {
      "id": "unique_id",
      "title": "brief attention-grabbing title",
      "description": "detailed explanation",
      "category": "one of: budgeting, saving, investing, debt, general",
      "relevanceScore": number between 0-100,
      "action": "optional call-to-action button text"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      throw new Error("Failed to generate financial tip");
    }
  }
}

export const financialTipAgent = new FinancialTipAgent(); 