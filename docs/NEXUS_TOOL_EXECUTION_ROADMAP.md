# Nexus AI Tool Execution Roadmap

## Current State vs. @nexus Capabilities

### What We Have Now ✅
- **Real-time streaming responses** - Character-by-character AI responses
- **Financial data analysis** - Using actual user Plaid transaction data
- **Tool call detection** - XML parsing to hide tool execution from users
- **Mock tool responses** - Placeholder outputs that look realistic

### What @nexus Has That We Need 🎯

## 1. Web Search & Scraping (Tavily/Firecrawl Alternative)

### Implementation Options:

#### Option A: Playwright + Custom Search
```typescript
// Real web scraping tool
class WebScrapingTool implements Tool {
  async execute(params: { url: string, selector?: string }) {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.goto(params.url);
    const content = await page.textContent(params.selector || 'body');
    await browser.close();
    return { success: true, data: content };
  }
}
```

#### Option B: Integrate Real APIs
- **Tavily API** - $0.001/request for web search
- **Firecrawl API** - $0.003/page for web scraping
- **SerpAPI** - Google search results

### Setup Steps:
1. Add Playwright to dependencies: `npm install playwright`
2. Create `WebScrapingTool.ts` in `server/nexus/services/tools/`
3. Configure proxy/rate limiting for responsible scraping
4. Add error handling for blocked content

## 2. Market Research Tool (Real Financial APIs)

### API Integrations:
```typescript
class MarketResearchTool implements Tool {
  async execute(params: { query: string, type: 'stocks' | 'crypto' | 'news' }) {
    // Use real APIs:
    // - Alpha Vantage: Free tier 5 calls/min, 500/day
    // - Yahoo Finance API: Real-time data
    // - News API: Financial news aggregation
    // - CoinGecko: Crypto data (free)
    
    const data = await this.fetchMarketData(params);
    return { 
      success: true, 
      data,
      humanReadable: this.formatMarketData(data)
    };
  }
}
```

## 3. File Generation & Management

### Capabilities Needed:
- **PDF Reports**: Financial analysis summaries
- **CSV Exports**: Transaction data, budgets
- **Charts/Graphs**: Investment performance visuals
- **Temporary File Handling**: Secure file storage

### Implementation:
```typescript
class FileGenerationTool implements Tool {
  async execute(params: { type: 'pdf' | 'csv' | 'chart', data: any }) {
    const tempDir = `/tmp/nexus-files/${uuidv4()}`;
    
    switch (params.type) {
      case 'pdf':
        return await this.generatePDF(params.data, tempDir);
      case 'csv':
        return await this.generateCSV(params.data, tempDir);
      case 'chart':
        return await this.generateChart(params.data, tempDir);
    }
  }
  
  private async generatePDF(data: any, outputPath: string) {
    // Use puppeteer or jsPDF
    // Generate financial report
    return { success: true, filePath: outputPath, downloadUrl: '/api/files/download/...' };
  }
}
```

## 4. Browser Automation (Like @nexus)

### What @nexus Does:
- **Account Login**: Automates brokerage logins
- **Transaction Monitoring**: Checks account balances
- **Order Execution**: Places trades (with user confirmation)
- **Screen Recording**: Visual proof of actions

### Our Implementation Strategy:
```typescript
class BrowserAutomationTool implements Tool {
  async execute(params: { action: string, credentials?: any, options?: any }) {
    const browser = await playwright.chromium.launch({ 
      headless: false, // Show browser for transparency
      slowMo: 100     // Slow down for human oversight
    });
    
    const context = await browser.newContext({
      recordVideo: { dir: '/tmp/automation-videos/' } // Record actions
    });
    
    const page = await context.newPage();
    
    switch (params.action) {
      case 'check_account_balance':
        return await this.checkAccountBalance(page, params.credentials);
      case 'research_stock':
        return await this.researchStock(page, params.options.symbol);
      // NEVER implement automatic trading without explicit user confirmation
    }
  }
}
```

## 5. Code Execution Environment

### Secure Python/JavaScript Execution:
```typescript
class CodeInterpreterTool implements Tool {
  async execute(params: { code: string, language: 'python' | 'javascript' }) {
    // Use Docker container for security
    const container = await docker.createContainer({
      Image: 'python:3.9-slim',
      Cmd: ['python', '-c', params.code],
      WorkingDir: '/workspace',
      HostConfig: {
        Memory: 128 * 1024 * 1024, // 128MB limit
        CpuQuota: 50000,            // 50% CPU
        NetworkMode: 'none'         // No network access
      }
    });
    
    const result = await container.start();
    return { success: true, output: result.output };
  }
}
```

## Implementation Priority Order

### Phase 1: Core Web Capabilities (2-3 weeks)
1. **Real Web Search** - Integrate Tavily or SerpAPI
2. **Basic Web Scraping** - Playwright for financial sites
3. **Market Data APIs** - Alpha Vantage + Yahoo Finance
4. **File Downloads** - CSV exports and basic PDFs

### Phase 2: Advanced Features (3-4 weeks)  
1. **Browser Automation** - Account balance checking
2. **Code Interpreter** - Python financial calculations
3. **Advanced File Generation** - Rich PDF reports with charts
4. **Video Recording** - Document automation actions

### Phase 3: Advanced Security (2-3 weeks)
1. **Sandboxed Execution** - Docker containers for code
2. **User Confirmation Flow** - For sensitive actions
3. **Audit Logging** - Track all tool executions
4. **Rate Limiting** - Prevent API abuse

## Security Considerations

### Financial Data Protection:
- **Encrypt credentials** in database
- **Use session tokens** instead of stored passwords  
- **Require 2FA** for sensitive operations
- **Log all actions** for audit trail
- **Sandbox all code execution**

### API Key Management:
```typescript
// Store API keys securely
const secrets = {
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  ALPHA_VANTAGE_KEY: process.env.ALPHA_VANTAGE_KEY,
  SERP_API_KEY: process.env.SERP_API_KEY
};

// Rate limiting
const rateLimiter = new Map();
```

## Cost Estimates

### API Costs (Monthly):
- **Tavily Web Search**: ~$10-30/month (1000-3000 searches)
- **Alpha Vantage**: Free tier or $49.99/month premium
- **News API**: $449/month for commercial use
- **Server Resources**: $20-50/month for Docker containers

### Total Estimated Cost: $100-150/month for full capabilities

## Next Steps

1. **Choose API providers** and get API keys
2. **Set up development environment** with Docker
3. **Implement web search tool** first (highest impact)
4. **Add market data APIs** for real financial information
5. **Create secure file handling** system
6. **Test with real user scenarios**

## Testing Strategy

### Test Scenarios:
1. **Web Search**: "Find recent news about Tesla stock"
2. **Market Research**: "Get current S&P 500 performance"
3. **File Generation**: "Create PDF report of my spending"
4. **Code Execution**: "Calculate optimal portfolio allocation"
5. **Browser Automation**: "Check my Schwab account balance"

Each tool should be tested in isolation and then integrated into the full system. 