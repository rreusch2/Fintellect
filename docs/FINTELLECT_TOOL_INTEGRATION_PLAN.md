# Fintellect Advanced Tool Integration Plan
## Inspired by @nexus Architecture

### Executive Summary
This plan outlines the integration of enterprise-grade tool execution capabilities into Fintellect's Nexus financial AI, using the same technologies and patterns as @nexus but adapted for financial analysis and market data.

## 🎯 Technologies Integration Roadmap

### Phase 1: Core Infrastructure Setup (Week 1-2)

#### 1.1 Environment Variables Setup
```bash
# .env additions for new tools
# Secure execution environment
DAYTONA_API_KEY=your_daytona_key
DAYTONA_PROJECT_ID=fintellect-sandbox

# Browser automation
PLAYWRIGHT_BROWSER_PATH=/usr/bin/chromium
PLAYWRIGHT_HEADLESS=true

# LLM Providers (existing + enhanced)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Search & Scraping
TAVILY_API_KEY=your_tavily_key
FIRECRAWL_API_KEY=your_firecrawl_key
FIRECRAWL_URL=https://api.firecrawl.dev

# API Services
RAPID_API_KEY=your_rapidapi_key

# Financial Data (NEW - @nexus doesn't have this)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

#### 1.2 Enhanced Tool Base Architecture
Create `server/nexus/services/tools/base/` with @nexus-inspired structure:

```typescript
// ToolBase.ts - Enhanced from @nexus pattern
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  displayName?: string;
  humanReadable?: string;
  metadata?: {
    executionTime?: number;
    cost?: number;
    source?: string;
  };
}

export interface ToolContext {
  userId: string;
  conversationId: string;
  userFinancialData?: any;
  securityLevel: 'sandbox' | 'restricted' | 'full';
}

export abstract class EnhancedToolBase {
  abstract name: string;
  abstract description: string;
  abstract execute(parameters: any, context: ToolContext): Promise<ToolResult>;
  
  protected successResponse(data: any, metadata?: any): ToolResult {
    return { success: true, data, metadata };
  }
  
  protected failResponse(error: string): ToolResult {
    return { success: false, error };
  }
}
```

### Phase 2: Daytona Secure Execution Environment (Week 2-3)

#### 2.1 Daytona Integration
```typescript
// server/nexus/services/tools/DaytonaExecutionTool.ts
import { EnhancedToolBase, ToolResult, ToolContext } from './base/ToolBase';

export class DaytonaExecutionTool extends EnhancedToolBase {
  name = 'daytona-execute';
  description = 'Execute code in secure Daytona sandbox environment';

  async execute(parameters: {
    code: string;
    language: 'python' | 'javascript' | 'bash';
    timeout?: number;
  }, context: ToolContext): Promise<ToolResult> {
    
    // Security check - only allow for authenticated users
    if (context.securityLevel !== 'sandbox') {
      return this.failResponse('Daytona execution requires sandbox security level');
    }

    try {
      const daytonaClient = new DaytonaClient({
        apiKey: process.env.DAYTONA_API_KEY,
        projectId: process.env.DAYTONA_PROJECT_ID
      });

      const result = await daytonaClient.execute({
        code: parameters.code,
        language: parameters.language,
        timeout: parameters.timeout || 30000,
        environment: 'financial-analysis'
      });

      return this.successResponse({
        output: result.stdout,
        errors: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime
      });

    } catch (error) {
      return this.failResponse(`Daytona execution failed: ${error.message}`);
    }
  }
}
```

### Phase 3: Enhanced Web Capabilities (Week 3-4)

#### 3.1 Tavily Search Integration (Mirroring @nexus)
```typescript
// server/nexus/services/tools/TavilySearchTool.ts
export class TavilySearchTool extends EnhancedToolBase {
  name = 'tavily-search';
  description = 'Advanced web search using Tavily API for financial research';

  private tavilyClient: TavilyClient;

  constructor() {
    super();
    this.tavilyClient = new TavilyClient({
      apiKey: process.env.TAVILY_API_KEY
    });
  }

  async execute(parameters: {
    query: string;
    searchDepth?: 'basic' | 'advanced';
    includeImages?: boolean;
    maxResults?: number;
    focusFinancial?: boolean;
  }, context: ToolContext): Promise<ToolResult> {
    
    try {
      // Enhanced query for financial context
      let enhancedQuery = parameters.query;
      if (parameters.focusFinancial) {
        enhancedQuery += ' financial market analysis stock price earnings';
      }

      const searchResponse = await this.tavilyClient.search({
        query: enhancedQuery,
        maxResults: parameters.maxResults || 10,
        includeImages: parameters.includeImages || false,
        includeAnswer: 'advanced',
        searchDepth: parameters.searchDepth || 'advanced',
      });

      return this.successResponse({
        query: enhancedQuery,
        answer: searchResponse.answer,
        results: searchResponse.results,
        images: searchResponse.images || [],
        searchTime: Date.now()
      }, {
        source: 'tavily',
        resultCount: searchResponse.results.length
      });

    } catch (error) {
      return this.failResponse(`Tavily search failed: ${error.message}`);
    }
  }
}
```

#### 3.2 Firecrawl Web Scraping
```typescript
// server/nexus/services/tools/FirecrawlScrapeTool.ts
export class FirecrawlScrapeTool extends EnhancedToolBase {
  name = 'firecrawl-scrape';
  description = 'Advanced web scraping using Firecrawl for financial documents';

  async execute(parameters: {
    urls: string[];
    extractStructured?: boolean;
    financialDataFocus?: boolean;
  }, context: ToolContext): Promise<ToolResult> {
    
    try {
      const firecrawlClient = new FirecrawlClient({
        apiKey: process.env.FIRECRAWL_API_KEY,
        baseUrl: process.env.FIRECRAWL_URL
      });

      const results = await Promise.all(
        parameters.urls.map(async (url) => {
          const scraped = await firecrawlClient.scrapeUrl(url, {
            formats: ['markdown', 'html'],
            extract: parameters.extractStructured ? {
              schema: parameters.financialDataFocus ? {
                type: 'object',
                properties: {
                  companyName: { type: 'string' },
                  stockPrice: { type: 'number' },
                  marketCap: { type: 'string' },
                  revenue: { type: 'string' },
                  earnings: { type: 'string' }
                }
              } : undefined
            } : undefined
          });

          return {
            url,
            content: scraped.markdown,
            metadata: scraped.metadata,
            extracted: scraped.extract
          };
        })
      );

      return this.successResponse({
        scrapedPages: results,
        totalPages: results.length
      }, {
        source: 'firecrawl',
        extractionTime: Date.now()
      });

    } catch (error) {
      return this.failResponse(`Firecrawl scraping failed: ${error.message}`);
    }
  }
}
```

### Phase 4: Playwright Browser Automation (Week 4-5)

#### 4.1 Enhanced Browser Tool (Based on @nexus pattern)
```typescript
// server/nexus/services/tools/PlaywrightBrowserTool.ts
export class PlaywrightBrowserTool extends EnhancedToolBase {
  name = 'playwright-browser';
  description = 'Advanced browser automation for financial site interaction';

  private browser: Browser | null = null;
  private page: Page | null = null;

  async execute(parameters: {
    action: 'navigate' | 'click' | 'input' | 'screenshot' | 'extract-financial-data';
    url?: string;
    selector?: string;
    text?: string;
    coordinates?: { x: number; y: number };
    financialSite?: 'yahoo-finance' | 'bloomberg' | 'sec-edgar';
  }, context: ToolContext): Promise<ToolResult> {
    
    try {
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: process.env.PLAYWRIGHT_HEADLESS === 'true'
        });
        this.page = await this.browser.newPage();
      }

      switch (parameters.action) {
        case 'navigate':
          await this.page.goto(parameters.url!);
          break;
          
        case 'extract-financial-data':
          return await this.extractFinancialData(parameters.financialSite!, context);
          
        case 'screenshot':
          const screenshot = await this.page.screenshot({ 
            fullPage: true, 
            type: 'png' 
          });
          return this.successResponse({
            screenshot: screenshot.toString('base64'),
            url: this.page.url(),
            timestamp: Date.now()
          });
          
        // ... other actions following @nexus pattern
      }

      return this.successResponse({
        action: parameters.action,
        success: true,
        url: this.page.url()
      });

    } catch (error) {
      return this.failResponse(`Browser automation failed: ${error.message}`);
    }
  }

  private async extractFinancialData(site: string, context: ToolContext) {
    // Site-specific financial data extraction logic
    switch (site) {
      case 'yahoo-finance':
        return await this.extractYahooFinanceData();
      case 'bloomberg':
        return await this.extractBloombergData();
      case 'sec-edgar':
        return await this.extractSecEdgarData();
    }
  }
}
```

### Phase 5: RapidAPI Financial Services (Week 5-6)

#### 5.1 RapidAPI Base (Mirroring @nexus structure)
```typescript
// server/nexus/services/tools/providers/RapidApiBase.ts
export interface RapidApiEndpoint {
  route: string;
  method: 'GET' | 'POST';
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export class RapidApiBase {
  constructor(
    private baseUrl: string,
    private endpoints: Record<string, RapidApiEndpoint>
  ) {}

  async callEndpoint(route: string, payload?: any): Promise<any> {
    const endpoint = this.endpoints[route];
    if (!endpoint) {
      throw new Error(`Endpoint ${route} not found`);
    }

    const url = `${this.baseUrl}${endpoint.route}`;
    const headers = {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY!,
      'X-RapidAPI-Host': new URL(this.baseUrl).hostname,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: endpoint.method,
      headers,
      body: endpoint.method === 'POST' ? JSON.stringify(payload) : undefined
    });

    return response.json();
  }

  getEndpoints() {
    return this.endpoints;
  }
}
```

#### 5.2 Financial Data Providers
```typescript
// server/nexus/services/tools/providers/FinancialRapidApiProvider.ts
export class FinancialRapidApiProvider extends RapidApiBase {
  constructor() {
    super('https://alpha-vantage.p.rapidapi.com', {
      'stock-quote': {
        route: '/query',
        method: 'GET',
        name: 'Real-time Stock Quote',
        description: 'Get real-time stock price and basic info',
        parameters: {
          function: 'GLOBAL_QUOTE',
          symbol: 'string'
        }
      },
      'company-overview': {
        route: '/query',
        method: 'GET',
        name: 'Company Overview',
        description: 'Get comprehensive company information',
        parameters: {
          function: 'OVERVIEW',
          symbol: 'string'
        }
      },
      'financial-ratios': {
        route: '/query',
        method: 'GET',
        name: 'Financial Ratios',
        description: 'Get key financial ratios and metrics'
      }
    });
  }
}
```

### Phase 6: Alpha Vantage Market Data Integration (Week 6-7)

#### 6.1 Alpha Vantage Tool (NEW - @nexus doesn't have this)
```typescript
// server/nexus/services/tools/AlphaVantageMarketTool.ts
export class AlphaVantageMarketTool extends EnhancedToolBase {
  name = 'alpha-vantage-market';
  description = 'Real-time market data and financial analysis using Alpha Vantage';

  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY!;
  }

  async execute(parameters: {
    function: 'GLOBAL_QUOTE' | 'OVERVIEW' | 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'EARNINGS';
    symbol: string;
    outputsize?: 'compact' | 'full';
  }, context: ToolContext): Promise<ToolResult> {
    
    try {
      const url = new URL('https://www.alphavantage.co/query');
      url.searchParams.set('function', parameters.function);
      url.searchParams.set('symbol', parameters.symbol);
      url.searchParams.set('apikey', this.apiKey);
      
      if (parameters.outputsize) {
        url.searchParams.set('outputsize', parameters.outputsize);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        return this.failResponse(`Alpha Vantage error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        return this.failResponse(`Alpha Vantage rate limit: ${data['Note']}`);
      }

      // Process different response types
      let processedData;
      switch (parameters.function) {
        case 'GLOBAL_QUOTE':
          processedData = this.processGlobalQuote(data['Global Quote']);
          break;
        case 'OVERVIEW':
          processedData = this.processCompanyOverview(data);
          break;
        default:
          processedData = data;
      }

      return this.successResponse({
        symbol: parameters.symbol,
        function: parameters.function,
        data: processedData,
        timestamp: Date.now()
      }, {
        source: 'alpha-vantage',
        dataAge: this.calculateDataAge(data)
      });

    } catch (error) {
      return this.failResponse(`Alpha Vantage request failed: ${error.message}`);
    }
  }

  private processGlobalQuote(quote: any) {
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      lastUpdated: quote['07. latest trading day']
    };
  }

  private processCompanyOverview(data: any) {
    return {
      name: data['Name'],
      symbol: data['Symbol'],
      exchange: data['Exchange'],
      currency: data['Currency'],
      country: data['Country'],
      sector: data['Sector'],
      industry: data['Industry'],
      marketCap: parseInt(data['MarketCapitalization']),
      peRatio: parseFloat(data['PERatio']),
      pegRatio: parseFloat(data['PEGRatio']),
      bookValue: parseFloat(data['BookValue']),
      dividendYield: parseFloat(data['DividendYield']),
      eps: parseFloat(data['EPS']),
      revenuePerShare: parseFloat(data['RevenuePerShareTTM']),
      profitMargin: parseFloat(data['ProfitMargin']),
      beta: parseFloat(data['Beta'])
    };
  }
}
```

### Phase 7: Enhanced UI Integration (Week 7-8)

#### 7.1 Tool Execution UI Components
```typescript
// client/src/components/nexus/ToolExecutionViewer.tsx
export const ToolExecutionViewer: React.FC<{
  toolResults: ToolResult[];
  isExecuting: boolean;
}> = ({ toolResults, isExecuting }) => {
  return (
    <div className="tool-execution-viewer">
      {toolResults.map((result, index) => (
        <div key={index} className={`tool-result ${result.success ? 'success' : 'error'}`}>
          <div className="tool-header">
            <span className="tool-name">{result.displayName || 'Tool Execution'}</span>
            <span className="tool-time">{result.metadata?.executionTime}ms</span>
          </div>
          
          {result.success ? (
            <ToolResultRenderer result={result} />
          ) : (
            <div className="error-message">{result.error}</div>
          )}
        </div>
      ))}
      
      {isExecuting && (
        <div className="executing-indicator">
          <Loader className="animate-spin" />
          <span>Executing tools...</span>
        </div>
      )}
    </div>
  );
};
```

#### 7.2 Financial Data Visualization
```typescript
// client/src/components/nexus/FinancialDataViewer.tsx
export const FinancialDataViewer: React.FC<{
  data: AlphaVantageData;
}> = ({ data }) => {
  if (data.function === 'GLOBAL_QUOTE') {
    return (
      <div className="financial-quote-card">
        <div className="stock-header">
          <h3>{data.data.symbol}</h3>
          <span className="price">${data.data.price.toFixed(2)}</span>
        </div>
        <div className="stock-change">
          <span className={`change ${data.data.change >= 0 ? 'positive' : 'negative'}`}>
            {data.data.change >= 0 ? '+' : ''}{data.data.change.toFixed(2)} 
            ({data.data.changePercent})
          </span>
        </div>
        <div className="stock-details">
          <div>Volume: {data.data.volume.toLocaleString()}</div>
          <div>Previous Close: ${data.data.previousClose.toFixed(2)}</div>
        </div>
      </div>
    );
  }
  
  // Handle other data types...
};
```

## 🔧 Implementation Steps

### Step 1: Environment Setup
1. Add all environment variables to `.env`
2. Install required packages:
```bash
npm install playwright @daytona/client tavily firecrawl-js
npm install @types/node axios cheerio
```

### Step 2: Create Tool Registry
```typescript
// server/nexus/services/tools/ToolRegistry.ts
export class ToolRegistry {
  private tools: Map<string, EnhancedToolBase> = new Map();

  registerTool(tool: EnhancedToolBase) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): EnhancedToolBase | undefined {
    return this.tools.get(name);
  }

  getAllTools(): EnhancedToolBase[] {
    return Array.from(this.tools.values());
  }
}

// Initialize all tools
export const toolRegistry = new ToolRegistry();
toolRegistry.registerTool(new DaytonaExecutionTool());
toolRegistry.registerTool(new TavilySearchTool());
toolRegistry.registerTool(new FirecrawlScrapeTool());
toolRegistry.registerTool(new PlaywrightBrowserTool());
toolRegistry.registerTool(new AlphaVantageMarketTool());
```

### Step 3: Integrate with ThreadManager
Update existing `ThreadManager.ts` to use the new tools:

```typescript
// In ThreadManager.ts
import { toolRegistry } from './ToolRegistry';

// Add to processStreamingContent method
private async executeToolCall(toolCall: ToolCall, context: AgentContext): Promise<ToolResult> {
  const tool = toolRegistry.getTool(toolCall.name);
  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolCall.name}`
    };
  }

  const toolContext: ToolContext = {
    userId: context.userId,
    conversationId: context.conversationId,
    userFinancialData: context.userFinancialData,
    securityLevel: 'sandbox'
  };

  return await tool.execute(toolCall.parameters, toolContext);
}
```

## 🚀 Benefits Over Current Implementation

1. **Real Tool Execution**: Unlike current mock responses, tools actually perform actions
2. **Enhanced Financial Data**: Alpha Vantage provides real-time market data
3. **Secure Execution**: Daytona sandboxing ensures safe code execution
4. **Advanced Web Capabilities**: Tavily + Firecrawl + Playwright = comprehensive web interaction
5. **Enterprise-Grade Architecture**: Following @nexus proven patterns
6. **Financial-Specific Enhancements**: Specialized tools for financial analysis

## 📊 Expected Outcomes

- **Week 8**: Full tool execution environment operational
- **Real-time market data** integration
- **Advanced financial research** capabilities
- **Secure code execution** for custom analysis
- **Professional-grade web scraping** for financial documents
- **Browser automation** for dynamic financial sites

This implementation will transform Fintellect from having mock AI responses to providing real, actionable financial intelligence powered by the same enterprise tools that make @nexus so effective. 