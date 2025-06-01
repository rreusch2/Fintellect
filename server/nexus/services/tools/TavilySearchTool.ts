import { Tool, ToolResult, AgentContext } from '../ThreadManager';
import { v4 as uuidv4 } from 'uuid';
import { tavilyConfig } from '../../../config/apis';

export class TavilySearchTool implements Tool {
  name = 'web-search';
  description = 'Search the web for real-time information using Tavily API';

  async execute(parameters: any, context: AgentContext): Promise<ToolResult> {
    const { query, searchDepth = 'basic', includeImages = false, includeAnswer = true, maxResults = 5 } = parameters;

    if (!tavilyConfig.apiKey) {
      return {
        id: uuidv4(),
        content: 'Tavily API key not configured. Please set TAVILY_API_KEY environment variable.',
        isSuccess: false,
        timestamp: new Date()
      };
    }

    try {
      const response = await fetch(`${tavilyConfig.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyConfig.apiKey}`
        },
        body: JSON.stringify({
          query,
          search_depth: searchDepth,
          include_images: includeImages,
          include_answer: includeAnswer,
          max_results: maxResults,
          include_domains: [],
          exclude_domains: []
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Format the search results
      let formattedResults = `# Web Search Results for: "${query}"\n\n`;
      
      if (data.answer) {
        formattedResults += `## Quick Answer\n${data.answer}\n\n`;
      }

      if (data.results && data.results.length > 0) {
        formattedResults += `## Search Results\n\n`;
        data.results.forEach((result: any, index: number) => {
          formattedResults += `### ${index + 1}. ${result.title}\n`;
          formattedResults += `**URL:** ${result.url}\n`;
          formattedResults += `**Content:** ${result.content}\n`;
          if (result.score) {
            formattedResults += `**Relevance Score:** ${result.score}\n`;
          }
          formattedResults += '\n---\n\n';
        });
      }

      if (data.images && data.images.length > 0) {
        formattedResults += `## Related Images\n\n`;
        data.images.forEach((image: any, index: number) => {
          formattedResults += `${index + 1}. ![${image.description || 'Image'}](${image.url})\n`;
        });
      }

      return {
        id: uuidv4(),
        content: formattedResults,
        isSuccess: true,
        timestamp: new Date(),
        metadata: {
          query,
          resultsCount: data.results?.length || 0,
          hasAnswer: !!data.answer
        }
      };
    } catch (error) {
      return {
        id: uuidv4(),
        content: `Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        timestamp: new Date()
      };
    }
  }
} 