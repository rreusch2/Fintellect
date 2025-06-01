export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export abstract class Tool {
  abstract name: string;
  abstract description: string;
  
  abstract execute(params: any, context: any): Promise<ToolResult>;
} 