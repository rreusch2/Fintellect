import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { knowledgeStore, type UserContext, type Insight } from "../store/KnowledgeStore";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 4096,
    temperature: 0.6,
    topP: 0.8,
    topK: 40,
  }
});

export interface InvestmentAdvice {
  riskProfile: {
    score: number;
    label: 'Conservative' | 'Moderate' | 'Aggressive';
    description: string;
  };
  portfolioRecommendations: Array<{
    assetClass: string;
    allocation: number;
    reasoning: string;
    risk: 'Low' | 'Medium' | 'High';
  }>;
  insights: Array<{
    type: 'opportunity' | 'warning' | 'tip';
    title: string;
    description: string;
    impact: string;
    isPremium?: boolean;
  }>;
  marketAnalysis: {
    trends: string[];
    opportunities: string[];
    risks: string[];
  };
}

interface InvestmentProfile {
  riskTolerance: number;
  investmentGoal: string;
  monthlyInvestment: number;
  investmentTimeframe: string;
  existingInvestments: string[];
  preferredSectors: string[];
  emergencyFund: boolean;
  retirementPlan: boolean;
}

export class InvestmentStrategyAgent {
  private static formatUserProfile(context: UserContext, profile?: InvestmentProfile): string {
    try {
      // Get investment profile data
      const investmentProfile = profile || {
        riskTolerance: 5, // Default to moderate
        investmentGoal: "",
        monthlyInvestment: 0,
        investmentTimeframe: "",
        existingInvestments: [],
        preferredSectors: [],
        emergencyFund: false,
        retirementPlan: false
      };

      // Calculate monthly income and spending
      const monthlyIncome = context.userProfile?.monthlyIncome || 0;
      const recentTransactions = context.recentTransactions || [];
      
      // Separate income and expenses
      const { expenses, income } = recentTransactions.reduce((acc, t) => {
        const amount = Math.abs(t.amount || 0);
        if (t.amount < 0) {
          acc.income += amount;
        } else {
          acc.expenses += amount;
        }
        return acc;
      }, { expenses: 0, income: 0 });

      // Calculate savings rate based on actual cash flow
      const monthlySavings = income - expenses;
      const savingsRate = income > 0 ? (monthlySavings / income) : 0;

      // Get investment and retirement goals
      const investmentGoals = (context.activeGoals || []).filter(g => 
        g.category === 'investment' || g.category === 'retirement'
      );

      // Create comprehensive profile summary
      const profileSummary = [
        'Investment Profile:',
        `- Risk Tolerance: ${investmentProfile.riskTolerance}/10`,
        `- Investment Goal: ${investmentProfile.investmentGoal || 'Not specified'}`,
        `- Monthly Investment: $${(investmentProfile.monthlyInvestment/100).toFixed(2)}`,
        `- Investment Timeframe: ${investmentProfile.timeframe || 'Not specified'}`,
        `- Preferred Sectors: ${investmentProfile.preferredSectors.join(', ') || 'None specified'}`,
        `- Has Emergency Fund: ${investmentProfile.emergencyFund ? 'Yes' : 'No'}`,
        `- Has Retirement Plan: ${investmentProfile.retirementPlan ? 'Yes' : 'No'}`,
        '',
        'Financial Profile:',
        `- Monthly Income: $${(monthlyIncome/100).toFixed(2)}`,
        `- Monthly Expenses: $${(expenses/100).toFixed(2)}`,
        `- Monthly Savings: $${(monthlySavings/100).toFixed(2)}`,
        `- Savings Rate: ${(savingsRate * 100).toFixed(1)}%`,
        '',
        'Investment Goals:',
        `${investmentGoals.map(g => 
          `- ${g.name}: $${((g.currentAmount || 0)/100).toFixed(2)}/$${((g.targetAmount || 0)/100).toFixed(2)}`
        ).join('\n') || '- No active investment goals'}`,
        '',
        'Previous AI Insights:',
        `${(context.previousInsights || [])
          .filter(i => i.category === 'investment')
          .map(i => `- ${i.description?.split('.')[0] || ''}`)
          .filter(Boolean)
          .join('\n') || '- No previous investment insights'}`
      ].join('\n');

      return profileSummary.trim();
    } catch (error) {
      console.error('Error formatting investment profile:', error);
      return 'Error formatting investment profile. Using default risk assessment.';
    }
  }

  public async getInvestmentAdvice(userId: number, profile?: InvestmentProfile): Promise<InvestmentAdvice> {
    try {
      const userContext = await knowledgeStore.getUserContext(userId);
      const profileStr = InvestmentStrategyAgent.formatUserProfile(userContext, profile);

      const prompt = `You are an expert AI Investment Advisor. Analyze this financial and investment profile to provide sophisticated, personalized investment recommendations. Consider the user's risk tolerance, investment goals, timeframe, and preferred sectors to determine optimal investment strategies.

${profileStr}

Consider current market conditions and provide actionable insights. Include both basic and premium (more sophisticated) recommendations.

Respond with detailed investment advice in this JSON format:
{
  "riskProfile": {
    "score": number between 1-10 (matching user's risk tolerance),
    "label": "Conservative/Moderate/Aggressive",
    "description": "Detailed explanation of risk profile and reasoning"
  },
  "portfolioRecommendations": [
    {
      "assetClass": "specific investment category",
      "allocation": percentage (1-100),
      "reasoning": "detailed explanation of recommendation",
      "risk": "Low/Medium/High"
    }
  ],
  "insights": [
    {
      "type": "opportunity/warning/tip",
      "title": "concise insight title",
      "description": "detailed explanation",
      "impact": "potential financial impact",
      "isPremium": boolean (true for advanced insights)
    }
  ],
  "marketAnalysis": {
    "trends": ["current market trend 1", "trend 2"],
    "opportunities": ["specific opportunity 1", "opportunity 2"],
    "risks": ["potential risk 1", "risk 2"]
  }
}

Ensure recommendations are data-driven and tailored to the user's specific investment profile and goals.`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const parsedResponse = JSON.parse(response);
      
      // Update knowledge store with this interaction
      await knowledgeStore.updateUserContext(userId, {
        lastInteraction: new Date(),
        previousInsights: [
          ...(userContext.previousInsights || []),
          {
            category: 'investment',
            description: parsedResponse.riskProfile.description,
            timestamp: new Date()
          }
        ]
      });

      // Validate and transform the response to match our interface
      return {
        riskProfile: {
          score: Math.min(Math.max(1, parsedResponse.riskProfile.score), 10),
          label: parsedResponse.riskProfile.label as "Conservative" | "Moderate" | "Aggressive",
          description: parsedResponse.riskProfile.description
        },
        portfolioRecommendations: parsedResponse.portfolioRecommendations.map((rec: any) => ({
          assetClass: rec.assetClass,
          allocation: Math.min(Math.max(0, rec.allocation), 100),
          reasoning: rec.reasoning,
          risk: rec.risk as "Low" | "Medium" | "High"
        })),
        insights: parsedResponse.insights.map((insight: any) => ({
          type: insight.type as "opportunity" | "warning" | "tip",
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          isPremium: !!insight.isPremium
        })),
        marketAnalysis: {
          trends: parsedResponse.marketAnalysis.trends,
          opportunities: parsedResponse.marketAnalysis.opportunities,
          risks: parsedResponse.marketAnalysis.risks
        }
      };
    } catch (error) {
      console.error('Error generating investment advice:', error);
      
      // Return a safe fallback response that matches our interface
      return {
        riskProfile: {
          score: 5,
          label: "Moderate",
          description: "A balanced approach to investing that seeks to manage risk while pursuing growth opportunities."
        },
        portfolioRecommendations: [
          {
            assetClass: "Diversified ETFs",
            allocation: 40,
            reasoning: "Provides broad market exposure with moderate risk",
            risk: "Medium"
          },
          {
            assetClass: "Blue-chip Stocks",
            allocation: 30,
            reasoning: "Stable companies with proven track records",
            risk: "Medium"
          },
          {
            assetClass: "Government Bonds",
            allocation: 30,
            reasoning: "Income generation and capital preservation",
            risk: "Low"
          }
        ],
        insights: [
          {
            type: "tip",
            title: "Start with Index Funds",
            description: "Consider beginning your investment journey with low-cost index funds that track major market indices.",
            impact: "Potential for market-matching returns with lower fees",
            isPremium: false
          },
          {
            type: "opportunity",
            title: "Dollar-Cost Averaging",
            description: "Set up automatic monthly investments to take advantage of market fluctuations.",
            impact: "Reduces timing risk and builds consistent investment habits",
            isPremium: false
          }
        ],
        marketAnalysis: {
          trends: ["Market volatility remains elevated", "Interest rates affecting investment decisions"],
          opportunities: ["Technology sector showing potential", "Value stocks presenting opportunities"],
          risks: ["Economic uncertainty", "Inflation concerns"]
        }
      };
    }
  }
}

export const investmentAdvisor = new InvestmentStrategyAgent();
