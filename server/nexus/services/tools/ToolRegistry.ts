import { Tool } from './base/Tool.js';
import { DockerSandboxTool } from './DockerSandboxTool.js';
import { WebSearchTool } from './WebSearchTool.js';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools = new Map<string, Tool>();
  public xml_tools = new Map<string, any>(); // Add XML tools registry

  private constructor() {
    this.registerDefaultTools();
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerDefaultTools() {
    // Register our financial analysis tools
    this.registerTool(new DockerSandboxTool());
    this.registerTool(new WebSearchTool());
    
    // Register XML tools that can be called via XML tags
    this.registerXmlTool('create-file', { 
      method: 'create-file',
      schema: { xml_schema: { mappings: [
        { node_type: 'attribute', param_name: 'path', path: 'path' },
        { node_type: 'text', param_name: 'content', path: 'create-file' }
      ]}}
    });
    
    this.registerXmlTool('web-search', { 
      method: 'web-search',
      schema: { xml_schema: { mappings: [
        { node_type: 'attribute', param_name: 'query', path: 'query' },
        { node_type: 'attribute', param_name: 'num_results', path: 'num_results' }
      ]}}
    });
    
    this.registerXmlTool('web-scrape', { 
      method: 'web-scrape',
      schema: { xml_schema: { mappings: [
        { node_type: 'attribute', param_name: 'url', path: 'url' },
        { node_type: 'attribute', param_name: 'selector', path: 'selector' }
      ]}}
    });
    
    console.log('[ToolRegistry] Financial analysis tools registered successfully!');
    console.log('[ToolRegistry] Available capabilities: Docker sandbox, Web search, File operations');
    console.log(`[ToolRegistry] XML tools registered: ${Array.from(this.xml_tools.keys()).join(', ')}`);
  }

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  registerXmlTool(xmlTagName: string, toolInfo: any) {
    this.xml_tools.set(xmlTagName, toolInfo);
    console.log(`[ToolRegistry] Registered XML tool: ${xmlTagName} -> ${toolInfo.method}`);
  }

  getXmlTool(xmlTagName: string): any | undefined {
    return this.xml_tools.get(xmlTagName);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getAvailableXmlTools(): string[] {
    return Array.from(this.xml_tools.keys());
  }

  getAvailableFunctions(): Record<string, any> {
    const functions: Record<string, any> = {};
    
    // Add functions from regular tools
    for (const [name, tool] of this.tools) {
      functions[name] = async (...args: any[]) => {
        return await tool.execute(...args);
      };
    }
    
    // Add XML tool functions with proper mapping
    functions['create-file'] = async (params: any) => {
      const dockerTool = this.tools.get('docker-sandbox');
      if (dockerTool) {
        return await dockerTool.execute({
          action: 'create-file',
          filePath: params.path,
          content: params.content
        }, { userId: 'system', conversationId: 'system' });
      }
      throw new Error('Docker sandbox tool not available');
    };
    
    functions['web-search'] = async (params: any) => {
      const webTool = this.tools.get('web-search');
      if (webTool) {
        return await webTool.execute({
          query: params.query,
          num_results: params.num_results || 5
        }, { userId: 'system', conversationId: 'system' });
      }
      throw new Error('Web search tool not available');
    };
    
    functions['web-scrape'] = async (params: any) => {
      const webTool = this.tools.get('web-search'); // May need separate scrape tool
      if (webTool) {
        return await webTool.execute({
          action: 'scrape',
          url: params.url,
          selector: params.selector
        }, { userId: 'system', conversationId: 'system' });
      }
      throw new Error('Web scrape tool not available');
    };
    
    return functions;
  }

  hasToolsForNames(names: string[]): boolean {
    return names.some(name => this.tools.has(name));
  }

  getToolDocumentation(): string {
    const toolDocs: string[] = [];
    
    for (const [name, tool] of this.tools) {
      toolDocs.push(`### ${name}
Description: ${tool.description || 'No description available'}
Usage: Use this tool for ${tool.name} operations`);
    }
    
    if (toolDocs.length === 0) {
      return '\n## Available Tools: None currently registered';
    }
    
    return `\n## Available Tools:\n${toolDocs.join('\n\n')}

## Analysis Capabilities:
- **docker-sandbox**: Create and manage financial analysis files in isolated Docker environments
- **File Operations**: Create todo lists, market research reports, investment analyses, and other financial documents
- **Pattern Detection**: Automatically detect analysis types and create appropriate file structures
- **Progress Tracking**: Systematic todo-driven workflow with progress updates

## Future Research Capabilities (Coming Soon):
- **Web Search**: Real-time financial data and market trends research
- **Web Scraping**: Extract detailed content from financial websites  
- **Browser Automation**: Interact with complex financial platforms
- **Data Integration**: Incorporate live market data into analysis`;
  }
}

// Export singleton instance
export const toolRegistry = ToolRegistry.getInstance(); 