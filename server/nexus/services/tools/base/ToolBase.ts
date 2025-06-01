/**
 * Enhanced Tool Base Architecture
 * Inspired by @nexus patterns but adapted for financial AI
 */

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
    timestamp?: number;
  };
}

export interface ToolContext {
  userId: string;
  conversationId: string;
  userFinancialData?: any;
  securityLevel: 'sandbox' | 'restricted' | 'full';
  preferences?: {
    riskTolerance?: 'low' | 'medium' | 'high';
    investmentHorizon?: 'short' | 'medium' | 'long';
    primaryGoals?: string[];
  };
}

export interface ToolCallSchema {
  name: string;
  parameters: Record<string, any>;
  description?: string;
}

export abstract class EnhancedToolBase {
  abstract name: string;
  abstract description: string;
  abstract schema: Record<string, any>; // JSON schema for parameters
  
  abstract execute(parameters: any, context: ToolContext): Promise<ToolResult>;
  
  protected successResponse(data: any, metadata?: any): ToolResult {
    return { 
      success: true, 
      data, 
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    };
  }
  
  protected failResponse(error: string, metadata?: any): ToolResult {
    return { 
      success: false, 
      error,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    };
  }

  protected formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  protected formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  }

  protected validateParameters(parameters: any, required: string[]): string | null {
    for (const field of required) {
      if (!(field in parameters) || parameters[field] === undefined || parameters[field] === null) {
        return `Required parameter '${field}' is missing`;
      }
    }
    return null;
  }

  protected logExecution(parameters: any, result: ToolResult, context: ToolContext): void {
    console.log(`[${this.name}] Executed for user ${context.userId}:`, {
      parameters,
      success: result.success,
      executionTime: result.metadata?.executionTime,
      error: result.error
    });
  }
}

// Base for financial-specific tools
export abstract class FinancialToolBase extends EnhancedToolBase {
  protected validateSymbol(symbol: string): boolean {
    // Basic symbol validation - alphanumeric, 1-6 characters
    return /^[A-Z]{1,6}$/.test(symbol.toUpperCase());
  }

  protected formatFinancialData(data: any): any {
    // Common financial data formatting
    if (typeof data === 'object' && data !== null) {
      const formatted = { ...data };
      
      // Format common financial fields
      if (formatted.price) formatted.price = parseFloat(formatted.price);
      if (formatted.volume) formatted.volume = parseInt(formatted.volume);
      if (formatted.marketCap) formatted.marketCap = parseInt(formatted.marketCap);
      if (formatted.change) formatted.change = parseFloat(formatted.change);
      
      return formatted;
    }
    return data;
  }

  protected calculateMetrics(current: number, previous: number): {
    change: number;
    changePercent: number;
  } {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
    
    return {
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2))
    };
  }
} 