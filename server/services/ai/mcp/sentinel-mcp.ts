import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

// --- Direct API Call Functions ---

// Function to call Brave Search API directly
export async function searchFinancialInfo(query: string, numResults: number = 5): Promise<any[]> {
  console.log(`[API Wrapper] Searching Brave API for: ${query}`);
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    console.error('[API Wrapper] BRAVE_API_KEY is not set.');
    return [];
  }

  const url = 'https://api.search.brave.com/res/v1/web/search';
  const params = { q: query, count: numResults };
  const headers = { 
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey 
  };

  try {
    const response = await axios.get(url, { params, headers });

    // Check if response has the expected structure 
    if (response.data && response.data.web && Array.isArray(response.data.web.results)) {
      console.log(`[API Wrapper] Received ${response.data.web.results.length} results from Brave API.`);
      // Map Brave results 
      return response.data.web.results.map((item: any) => ({
        title: item.title || 'No Title',
        url: item.url || '#',
        snippet: item.description || 'No Snippet',
      }));
    } else {
      console.warn('[API Wrapper] Unexpected response structure from Brave API:', response.data);
      return [];
    }

  } catch (error: any) {
    console.error(`[API Wrapper] Error calling Brave Search API:`, error.response?.data || error.message);
    if (axios.isAxiosError(error)) {
        console.error('[API Wrapper] Axios error details:', {
            status: error.response?.status,
            data: error.response?.data,
        });
    }
    return [];
  }
}

// Function to call SerpAPI for Google News results
export async function getFinancialNews(topics: string[], keywords: string[]): Promise<any[]> {
  const query = [...topics, ...keywords].join(' ');
  console.log(`[API Wrapper] Getting Google News via SerpAPI for: ${query}`);
  const apiKey = process.env.SERP_API_KEY;

  if (!apiKey) {
    console.error('[API Wrapper] SERP_API_KEY is not set.');
    return [];
  }

  const url = 'https://serpapi.com/search.json';
  const params = {
    q: query,
    engine: 'google_news',
    api_key: apiKey
  };

  try {
    const response = await axios.get(url, { params });

    // Check for the expected structure
    if (response.data && Array.isArray(response.data.news_results)) { 
      console.log(`[API Wrapper] Received ${response.data.news_results.length} results from SerpAPI.`);
      return response.data.news_results.map((item: any) => ({
        title: item.title || 'No Title',
        source: item.source || 'Unknown Source', // SerpAPI might use 'source' directly
        url: item.link || '#',
        snippet: item.snippet || 'No Snippet',
        publishedAt: item.date // Assuming date is available
      }));
    } else {
      console.error('[API Wrapper] Failed to get valid news_results array from SerpAPI.');
      console.warn('[API Wrapper] SerpAPI Response Structure:', response.data);
      return []; 
    }
  } catch (error: any) {
    console.error(`[API Wrapper] Error calling SerpAPI:`, error.response?.data || error.message);
    if (axios.isAxiosError(error)) {
        console.error('[API Wrapper] Axios error details:', {
            status: error.response?.status,
            data: error.response?.data,
        });
    }
    return [];
  }
}

// --- Placeholder Functions (Remain unchanged) ---

// Function for deep research
export async function performDeepResearch(topics: string[], keywords: string[]) {
  console.log(`[MCP Placeholder] Performing deep research on: ${topics.join(', ')}`);
  return {
    summary: `Research summary on topics: ${topics.join(', ')}`,
    findings: keywords.map(keyword => ({
      keyword,
      insight: `Key insight about ${keyword}: Market signals indicate growing interest.`,
      relevance: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2))
    }))
  };
}

// Function for market data
export async function getMarketData(assets: string[] = []) {
  console.log(`[MCP Placeholder] Getting market data for: ${assets.join(', ')}`);
  return {
    indices: { "S&P500": 4200.00, "NASDAQ": 14500.00 },
    stocks: Object.fromEntries(assets.map(ticker => [
      ticker, 
      {
        price: parseFloat((Math.random() * 1000).toFixed(2)),
        change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
        volume: Math.floor(Math.random() * 10000000)
      }
    ])),
    trending: ["AAPL", "MSFT", "GOOGL"]
  };
}