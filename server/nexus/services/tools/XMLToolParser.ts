import { parseString } from 'xml2js';
import { promisify } from 'util';
import { toolRegistry } from './ToolRegistry.js';

const parseXml = promisify(parseString);

export interface XMLToolCall {
  toolName: string;
  parameters: Record<string, any>;
  rawXml: string;
  xmlStartIndex: number;
  xmlEndIndex: number;
}

export class XMLToolParser {
  /**
   * Extract and parse XML tool calls from a text response
   */
  static extractToolCalls(text: string): XMLToolCall[] {
    const toolCalls: XMLToolCall[] = [];
    
    console.log(`[XMLToolParser] Extracting tool calls from text (length: ${text.length})`);
    console.log(`[XMLToolParser] Text content for parsing:`, text.substring(0, 1000));
    
    // Find XML tags in the text - enhanced regex to handle more cases
    const xmlRegex = /<([a-zA-Z][a-zA-Z0-9_-]*)\s*([^>]*?)>([\s\S]*?)<\/\1\s*>/g;
    let match;
    let matchCount = 0;
    
    while ((match = xmlRegex.exec(text)) !== null) {
      matchCount++;
      console.log(`[XMLToolParser] Found XML match ${matchCount}:`, {
        fullMatch: match[0].substring(0, 200) + '...',
        tagName: match[1],
        attributes: match[2],
        contentLength: match[3].length
      });
      const [fullMatch, tagName, attributes, content] = match;
      
      try {
        // Parse attributes
        const params: Record<string, any> = {};
        
        console.log(`[XMLToolParser] Parsing attributes for ${tagName}:`, attributes);
        
        // Extract attributes from the opening tag - enhanced regex to handle various quote styles
        const attrRegex = /(\w+)\s*=\s*["']([^"']*)["']/g;
        let attrMatch;
        let attrCount = 0;
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          attrCount++;
          const attrName = attrMatch[1];
          const attrValue = attrMatch[2];
          params[attrName] = attrValue;
          
          console.log(`[XMLToolParser] Parsed attribute ${attrCount}: ${attrName} = "${attrValue}"`);
          
          // Special handling for file path attributes
          if (attrName === 'path' || attrName === 'file_path' || attrName === 'filePath') {
            params.file_path = attrValue;
            params.path = attrValue;
            console.log(`[XMLToolParser] Mapped file path: ${attrValue}`);
          }
        }
        
        console.log(`[XMLToolParser] Total attributes parsed: ${attrCount}`, params);
        
        // Handle special case for daytona-sandbox
        if (tagName === 'daytona-sandbox') {
          // Extract action from attributes
          const actionMatch = /action=["']([^"']*)["']/.exec(attributes);
          if (actionMatch) {
            params.action = actionMatch[1];
          }
          
          // If there's content, parse it for additional parameters
          if (content.trim()) {
            const contentParams = this.parseContent(content);
            Object.assign(params, contentParams);
          }
        } else {
          // For file creation tools, handle both attributes and content
          if (tagName === 'create-file' || tagName === 'file-create' || tagName === 'write-file') {
            // Content goes into 'content' parameter for file tools
            if (content.trim()) {
              params.content = content.trim();
            }
            
            // Ensure file path is properly mapped
            if (params.path && !params.file_path) {
              params.file_path = params.path;
            } else if (params.file_path && !params.path) {
              params.path = params.file_path;
            }
          } else {
            // For other tools, content goes into 'content' parameter
            if (content.trim()) {
              params.content = content.trim();
            }
          }
        }
        
        // Debug logging for file path extraction
        if (tagName === 'create-file' || tagName === 'file-create' || tagName === 'write-file') {
          console.log(`[XMLToolParser] Parsed ${tagName}:`, {
            tagName,
            params,
            extractedFilePath: params.file_path || params.path,
            rawXmlSnippet: fullMatch.substring(0, 100) + '...'
          });
        }
        
        toolCalls.push({
          toolName: tagName,
          parameters: params,
          rawXml: fullMatch,
          xmlStartIndex: match.index,
          xmlEndIndex: match.index + fullMatch.length - 1
        });
      } catch (error) {
        console.error(`Error parsing XML tool call: ${tagName}`, error);
      }
    }
    
    return toolCalls;
  }
  
  /**
   * Parse content for nested parameters
   */
  private static parseContent(content: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Look for nested XML elements
    const nestedRegex = /<(\w+)>([^<]*)<\/\1>/g;
    let match;
    
    while ((match = nestedRegex.exec(content)) !== null) {
      params[match[1]] = match[2];
    }
    
    // If no nested elements, use the content as-is
    if (Object.keys(params).length === 0 && content.trim()) {
      params.content = content.trim();
    }
    
    return params;
  }
  
  /**
   * Convert tool call to proper tool name
   */
  static mapToolName(xmlToolName: string): string {
    const toolMapping: Record<string, string> = {
      'daytona-sandbox': 'daytona-sandbox',
      'development-environment': 'daytona-sandbox',
      'create-file': 'daytona-sandbox',
      'create-sandbox': 'daytona-sandbox',
      'alpha-vantage-market': 'market-research',
      'market-research': 'market-research'
    };
    
    return toolMapping[xmlToolName] || xmlToolName;
  }
  
  /**
   * Validate if text contains tool calls
   */
  static hasToolCalls(text: string): boolean {
    const xmlRegex = /<([a-zA-Z-]+)([^>]*)>/;
    return xmlRegex.test(text);
  }
} 