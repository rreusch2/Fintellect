import { Tool, ToolResult, AgentContext } from '../ThreadManager';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini 2.0 Flash for market research
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 8192, // Use full output capacity for comprehensive research
    temperature: 0.6,
    topP: 0.8,
    topK: 40,
  }
});

export class MarketResearchTool implements Tool {
  name = 'market-research';
  description = 'Research companies, markets, competitors, and industry trends';

  async execute(parameters: any, context: AgentContext): Promise<ToolResult> {
    const { query, type = 'general', region = 'global' } = parameters;

    try {
      let result = '';
      
      switch (type) {
        case 'company':
          result = await this.researchCompany(query, region);
          break;
        case 'market':
          result = await this.researchMarket(query, region);
          break;
        case 'competitors':
          result = await this.researchCompetitors(query, region);
          break;
        default:
          result = await this.generalResearch(query, region);
      }

      return {
        id: uuidv4(),
        content: result,
        isSuccess: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        id: uuidv4(),
        content: `Error conducting market research: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        timestamp: new Date()
      };
    }
  }

  private async researchCompany(companyName: string, region: string): Promise<string> {
    const prompt = `Conduct comprehensive company research for "${companyName}" in the ${region} market. Provide:
    
1. Company Overview
2. Financial Performance (revenue, growth, profitability)
3. Market Position & Competitive Advantages
4. Key Products/Services
5. Recent News & Developments
6. Investment Potential
7. Risk Factors

Format as a detailed research report with specific data points where available.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async researchMarket(marketQuery: string, region: string): Promise<string> {
    const prompt = `Analyze the ${marketQuery} market in ${region}. Include:
    
1. Market Size & Growth Rate
2. Key Market Segments
3. Major Players & Market Share
4. Growth Drivers & Trends
5. Challenges & Barriers
6. Future Outlook (3-5 years)
7. Investment Opportunities

Provide specific numbers, percentages, and data where possible.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async researchCompetitors(industry: string, region: string): Promise<string> {
    const prompt = `Analyze competitors in the ${industry} industry in ${region}. Provide:
    
1. Top 5-10 Major Competitors
2. Market Share Analysis
3. Competitive Positioning
4. Strengths & Weaknesses of Each
5. Pricing Strategies
6. Innovation & Technology Adoption
7. Competitive Threats & Opportunities

Include specific company names, market positions, and strategic insights.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async generalResearch(query: string, region: string): Promise<string> {
    const prompt = `Conduct comprehensive market research on: "${query}" in the ${region} market. 
    
Provide a detailed analysis covering all relevant aspects including market dynamics, key players, trends, opportunities, and risks. Structure the response as a professional research report with actionable insights.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
} 