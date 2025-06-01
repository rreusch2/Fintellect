/**
 * Web Search Tool - Real Implementation
 * 
 * This tool provides actual web search capabilities using SerpAPI
 * Replace the mock implementation with real search results
 */

import { Tool, ToolResult } from './base/Tool.js';
import { ToolContext } from './base/types.js';
import { config } from '../../utils/config.js';

interface WebSearchParams {
  query: string;
  searchType?: 'general' | 'news' | 'financial';
  maxResults?: number;
}

export class WebSearchTool extends Tool {
  name = 'web-search';
  description = 'Search the web for current information, market data, financial news, and investment research';

  async execute(params: WebSearchParams, context: ToolContext): Promise<ToolResult> {
    try {
      const { query, searchType = 'general', maxResults = 5 } = params;
      
      if (!config.TAVILY_API_KEY) {
        return {
          success: false,
          error: 'Web search unavailable: TAVILY_API_KEY not configured'
        };
      }

      console.log(`[WebSearchTool] Searching for: "${query}" (type: ${searchType})`);

      // Enhance query based on search type
      const enhancedQuery = this.enhanceQuery(query, searchType);
      
      const searchResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.TAVILY_API_KEY}`
        },
        body: JSON.stringify({
          query: enhancedQuery,
          search_depth: 'advanced',
          include_answer: true,
          include_raw_content: false,
          max_results: maxResults,
          include_domains: this.getRelevantDomains(searchType),
          exclude_domains: ['reddit.com', 'pinterest.com', 'instagram.com']
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Tavily API error: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      
      const results = {
        query: enhancedQuery,
        searchType,
        answer: searchData.answer || '',
        sources: searchData.results?.map((result: any) => ({
          title: result.title,
          url: result.url,
          content: result.content,
          score: result.score,
          published_date: result.published_date
        })) || [],
        totalResults: searchData.results?.length || 0
      };

      console.log(`[WebSearchTool] Found ${results.totalResults} results for "${query}"`);

      return {
        success: true,
        data: results,
        output: this.formatSearchResults(results)
      };

    } catch (error) {
      console.error('[WebSearchTool] Search failed:', error);
      return {
        success: false,
        error: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private enhanceQuery(query: string, searchType: string): string {
    const enhancements = {
      financial: `${query} financial markets investment analysis 2025`,
      news: `${query} latest news recent developments`,
      general: query
    };
    
    return enhancements[searchType as keyof typeof enhancements] || query;
  }

  private getRelevantDomains(searchType: string): string[] {
    const domainSets = {
      financial: [
        'bloomberg.com',
        'reuters.com',
        'marketwatch.com',
        'yahoo.com',
        'investing.com',
        'wsj.com',
        'cnbc.com',
        'seekingalpha.com',
        'morningstar.com',
        'sec.gov',
        'federalreserve.gov'
      ],
      news: [
        'reuters.com',
        'bloomberg.com',
        'cnbc.com',
        'bbc.com',
        'cnn.com',
        'wsj.com',
        'ft.com'
      ],
      general: []
    };
    
    return domainSets[searchType as keyof typeof domainSets] || [];
  }

  private formatSearchResults(results: any): string {
    let output = `# Web Search Results\n\n`;
    output += `**Query:** ${results.query}\n`;
    output += `**Search Type:** ${results.searchType}\n`;
    output += `**Results Found:** ${results.totalResults}\n\n`;

    if (results.answer) {
      output += `## Summary\n${results.answer}\n\n`;
    }

    if (results.sources && results.sources.length > 0) {
      output += `## Sources\n\n`;
      results.sources.forEach((source: any, index: number) => {
        output += `### ${index + 1}. ${source.title}\n`;
        output += `**URL:** ${source.url}\n`;
        if (source.published_date) {
          output += `**Published:** ${source.published_date}\n`;
        }
        output += `**Content:** ${source.content.substring(0, 300)}...\n\n`;
      });
    }

    return output;
  }
}

// Environment setup instructions:
/*
To enable real web search:
1. Sign up for SerpAPI: https://serpapi.com/
2. Get your API key (free tier: 100 searches/month)
3. Add to your .env file: SERP_API_KEY=your_api_key_here
4. Restart the server

Alternative APIs:
- Tavily API: https://tavily.com/ (AI-optimized search)
- Bing Search API: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
- Google Custom Search: https://developers.google.com/custom-search/v1/introduction
*/ 