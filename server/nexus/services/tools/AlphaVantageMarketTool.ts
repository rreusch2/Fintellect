/**
 * Alpha Vantage Market Data Tool
 * Real-time financial market data - Enhanced beyond @nexus capabilities
 */

import { FinancialToolBase, ToolResult, ToolContext } from './base/ToolBase';

export class AlphaVantageMarketTool extends FinancialToolBase {
  name = 'alpha-vantage-market';
  description = 'Get real-time market data, company fundamentals, and financial analysis using Alpha Vantage';
  
  schema = {
    type: 'object',
    properties: {
      function: {
        type: 'string',
        enum: ['GLOBAL_QUOTE', 'OVERVIEW', 'INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'EARNINGS', 'TIME_SERIES_DAILY'],
        description: 'The type of financial data to retrieve'
      },
      symbol: {
        type: 'string',
        description: 'Stock symbol (e.g., AAPL, TSLA, MSFT)'
      },
      outputsize: {
        type: 'string',
        enum: ['compact', 'full'],
        description: 'For time series data, compact returns last 100 data points, full returns all available'
      }
    },
    required: ['function', 'symbol']
  };

  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('AlphaVantageMarketTool: No API key found. Tool will return mock data.');
    }
  }

  async execute(parameters: {
    function: 'GLOBAL_QUOTE' | 'OVERVIEW' | 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'EARNINGS' | 'TIME_SERIES_DAILY';
    symbol: string;
    outputsize?: 'compact' | 'full';
  }, context: ToolContext): Promise<ToolResult> {
    
    const startTime = Date.now();
    
    // Validate parameters
    const validation = this.validateParameters(parameters, ['function', 'symbol']);
    if (validation) {
      return this.failResponse(validation);
    }

    // Validate symbol format
    if (!this.validateSymbol(parameters.symbol)) {
      return this.failResponse(`Invalid symbol format: ${parameters.symbol}. Use 1-6 uppercase letters.`);
    }

    try {
      // If no API key, return mock data for demonstration
      if (!this.apiKey) {
        return this.getMockData(parameters, context);
      }

      const url = new URL('https://www.alphavantage.co/query');
      url.searchParams.set('function', parameters.function);
      url.searchParams.set('symbol', parameters.symbol.toUpperCase());
      url.searchParams.set('apikey', this.apiKey);
      
      if (parameters.outputsize) {
        url.searchParams.set('outputsize', parameters.outputsize);
      }

      console.log(`[AlphaVantage] Fetching ${parameters.function} for ${parameters.symbol}`);
      
      const response = await fetch(url.toString());
      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        return this.failResponse(`Alpha Vantage error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        return this.failResponse(`Alpha Vantage rate limit: ${data['Note']}`);
      }

      if (data['Information']) {
        return this.failResponse(`Alpha Vantage info: ${data['Information']}`);
      }

      // Process different response types
      let processedData;
      let humanReadable;
      
      switch (parameters.function) {
        case 'GLOBAL_QUOTE':
          processedData = this.processGlobalQuote(data['Global Quote']);
          humanReadable = this.formatQuoteForHuman(processedData);
          break;
        case 'OVERVIEW':
          processedData = this.processCompanyOverview(data);
          humanReadable = this.formatOverviewForHuman(processedData);
          break;
        case 'TIME_SERIES_DAILY':
          processedData = this.processTimeSeries(data);
          humanReadable = this.formatTimeSeriesForHuman(processedData, parameters.symbol);
          break;
        default:
          processedData = this.formatFinancialData(data);
          humanReadable = `Financial data retrieved for ${parameters.symbol}`;
      }

      const executionTime = Date.now() - startTime;
      const result = this.successResponse({
        symbol: parameters.symbol.toUpperCase(),
        function: parameters.function,
        data: processedData,
        timestamp: Date.now()
      }, {
        source: 'alpha-vantage',
        executionTime,
        dataAge: this.calculateDataAge(data)
      });

      result.humanReadable = humanReadable;
      result.displayName = `Market Data: ${parameters.symbol.toUpperCase()}`;

      this.logExecution(parameters, result, context);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.failResponse(`Alpha Vantage request failed: ${error.message}`, {
        executionTime,
        source: 'alpha-vantage'
      });
    }
  }

  private processGlobalQuote(quote: any): any {
    if (!quote) return null;
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      lastUpdated: quote['07. latest trading day'],
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low'])
    };
  }

  private processCompanyOverview(data: any): any {
    return {
      name: data['Name'],
      symbol: data['Symbol'],
      exchange: data['Exchange'],
      currency: data['Currency'],
      country: data['Country'],
      sector: data['Sector'],
      industry: data['Industry'],
      marketCap: parseInt(data['MarketCapitalization']) || 0,
      peRatio: parseFloat(data['PERatio']) || null,
      pegRatio: parseFloat(data['PEGRatio']) || null,
      bookValue: parseFloat(data['BookValue']) || null,
      dividendYield: parseFloat(data['DividendYield']) || null,
      eps: parseFloat(data['EPS']) || null,
      revenuePerShare: parseFloat(data['RevenuePerShareTTM']) || null,
      profitMargin: parseFloat(data['ProfitMargin']) || null,
      beta: parseFloat(data['Beta']) || null,
      _52WeekHigh: parseFloat(data['52WeekHigh']) || null,
      _52WeekLow: parseFloat(data['52WeekLow']) || null,
      sharesOutstanding: parseInt(data['SharesOutstanding']) || 0
    };
  }

  private processTimeSeries(data: any): any {
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return null;

    const dates = Object.keys(timeSeries).sort().reverse(); // Most recent first
    const prices = dates.slice(0, 100).map(date => ({
      date,
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      volume: parseInt(timeSeries[date]['5. volume'])
    }));

    return {
      symbol: data['Meta Data']['2. Symbol'],
      lastRefreshed: data['Meta Data']['3. Last Refreshed'],
      timeZone: data['Meta Data']['5. Time Zone'],
      prices
    };
  }

  private formatQuoteForHuman(quote: any): string {
    if (!quote) return 'No quote data available';
    
    const changeDirection = quote.change >= 0 ? '📈' : '📉';
    const changeSign = quote.change >= 0 ? '+' : '';
    
    return `${quote.symbol}: ${this.formatCurrency(quote.price)} ${changeDirection} ${changeSign}${this.formatCurrency(quote.change)} (${quote.changePercent}) - Volume: ${quote.volume.toLocaleString()}`;
  }

  private formatOverviewForHuman(overview: any): string {
    if (!overview) return 'No company data available';
    
    return `${overview.name} (${overview.symbol}) - ${overview.sector} | Market Cap: ${this.formatCurrency(overview.marketCap)} | P/E: ${overview.peRatio || 'N/A'} | Dividend Yield: ${overview.dividendYield ? this.formatPercentage(overview.dividendYield) : 'N/A'}`;
  }

  private formatTimeSeriesForHuman(timeSeries: any, symbol: string): string {
    if (!timeSeries || !timeSeries.prices || timeSeries.prices.length === 0) {
      return 'No time series data available';
    }
    
    const latest = timeSeries.prices[0];
    const previous = timeSeries.prices[1];
    
    if (!previous) {
      return `${symbol} latest: ${this.formatCurrency(latest.close)} (${latest.date})`;
    }
    
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;
    const changeDirection = change >= 0 ? '📈' : '📉';
    const changeSign = change >= 0 ? '+' : '';
    
    return `${symbol} ${changeDirection} ${this.formatCurrency(latest.close)} ${changeSign}${this.formatCurrency(change)} (${changePercent.toFixed(2)}%) - ${latest.date}`;
  }

  private calculateDataAge(data: any): number {
    // Try to extract timestamp from various fields
    let timestamp = null;
    
    if (data['Global Quote'] && data['Global Quote']['07. latest trading day']) {
      timestamp = new Date(data['Global Quote']['07. latest trading day']);
    } else if (data['Meta Data'] && data['Meta Data']['3. Last Refreshed']) {
      timestamp = new Date(data['Meta Data']['3. Last Refreshed']);
    }
    
    if (timestamp) {
      return Date.now() - timestamp.getTime();
    }
    
    return 0; // Unknown age
  }

  private getMockData(parameters: any, context: ToolContext): ToolResult {
    // Mock data for demonstration when no API key is available
    const mockData = {
      GLOBAL_QUOTE: {
        symbol: parameters.symbol.toUpperCase(),
        price: 150.25 + Math.random() * 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: '+1.25%',
        volume: Math.floor(Math.random() * 10000000),
        previousClose: 148.75,
        lastUpdated: new Date().toISOString().split('T')[0],
        open: 149.50,
        high: 152.30,
        low: 148.10
      },
      OVERVIEW: {
        name: `${parameters.symbol.toUpperCase()} Corporation`,
        symbol: parameters.symbol.toUpperCase(),
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'USA',
        sector: 'Technology',
        industry: 'Software',
        marketCap: Math.floor(Math.random() * 1000000000000),
        peRatio: 25.5 + Math.random() * 20,
        pegRatio: 1.2 + Math.random(),
        bookValue: 45.30,
        dividendYield: Math.random() * 5,
        eps: 6.25,
        revenuePerShare: 85.40,
        profitMargin: 0.15 + Math.random() * 0.2,
        beta: 1.1 + Math.random() * 0.8
      }
    };

    const data = mockData[parameters.function] || mockData.GLOBAL_QUOTE;
    let humanReadable;
    
    if (parameters.function === 'GLOBAL_QUOTE') {
      humanReadable = this.formatQuoteForHuman(data);
    } else if (parameters.function === 'OVERVIEW') {
      humanReadable = this.formatOverviewForHuman(data);
    } else {
      humanReadable = `Mock ${parameters.function} data for ${parameters.symbol}`;
    }

    return this.successResponse({
      symbol: parameters.symbol.toUpperCase(),
      function: parameters.function,
      data,
      timestamp: Date.now(),
      isMockData: true
    }, {
      source: 'alpha-vantage-mock',
      executionTime: 100
    });
  }
} 