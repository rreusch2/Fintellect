import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { apiConfig, getBestLLMProvider } from '../../config/apis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface Tool {
  name: string;
  execute(parameters: Record<string, any>, context: AgentContext): Promise<ToolResult>;
  getDescription(): string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  displayName?: string;
  humanReadable?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  timestamp: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface AgentContext {
  userId: string;
  conversationId: string;
  userFinancialData?: any;
}

// Hide these XML tool tags from streaming display
const HIDE_STREAMING_XML_TAGS = new Set([
  'financial-analysis',
  'market-research',
  'alpha-vantage-market',
  'tavily-search',
  'firecrawl-scrape',
  'browser-automation',
  'code-interpreter',
  'daytona-sandbox'
]);

export class ThreadManager extends EventEmitter {
  private tools: Map<string, Tool> = new Map();
  private messages: Message[] = [];
  private conversationId: string;
  private llmProvider: 'anthropic' | 'openai' | 'google';
  private llmClient: any;
  private conversationState: Map<string, any> = new Map();

  constructor(conversationId: string, tools: Map<string, Tool>) {
    super();
    this.conversationId = conversationId;
    this.tools = tools;
    this.llmProvider = getBestLLMProvider();
    this.initializeLLMClient();
  }

  private initializeLLMClient(): void {
    switch (this.llmProvider) {
      case 'anthropic':
        if (apiConfig.anthropic.apiKey) {
          this.llmClient = new Anthropic({ apiKey: apiConfig.anthropic.apiKey });
        }
        break;
      case 'openai':
        if (apiConfig.openai.apiKey) {
          this.llmClient = new OpenAI({ apiKey: apiConfig.openai.apiKey });
        }
        break;
      case 'google':
        if (apiConfig.google.apiKey) {
          const genAI = new GoogleGenerativeAI(apiConfig.google.apiKey);
          this.llmClient = genAI.getGenerativeModel({ 
            model: apiConfig.google.model,
            generationConfig: {
              maxOutputTokens: apiConfig.google.maxTokens,
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
            }
          });
        }
        break;
    }
  }

  async processMessage(userMessage: string, context: AgentContext, systemPrompt: string): Promise<void> {
    try {
      console.log(`ThreadManager: Processing message for conversation ${this.conversationId}:`, userMessage);
      
      // Add user message to conversation
      await this.addMessage({
        role: 'user',
        content: userMessage
      });

      this.emit('statusChange', 'thinking');

      console.log(`ThreadManager: Generating AI response with provider: ${this.llmProvider}`);
      
      // Generate streaming AI response
      await this.generateStreamingResponse(userMessage, systemPrompt, context);
      
      console.log(`ThreadManager: Message processing completed`);
      this.emit('statusChange', 'completed');
    } catch (error) {
      console.error('ThreadManager: Error processing message:', error);
      this.emit('error', error);
      this.emit('statusChange', 'error');
    }
  }

  private async generateStreamingResponse(userMessage: string, systemPrompt: string, context: AgentContext): Promise<void> {
    const history = this.getConversationHistory();

    switch (this.llmProvider) {
      case 'anthropic':
        await this.generateAnthropicStreamingResponse(userMessage, systemPrompt, history, context);
        break;
      case 'openai':
        await this.generateOpenAIStreamingResponse(userMessage, systemPrompt, history, context);
        break;
      case 'google':
        await this.generateGoogleStreamingResponse(userMessage, systemPrompt, history, context);
        break;
    }
  }

  private async generateAnthropicStreamingResponse(
    userMessage: string, 
    systemPrompt: string, 
    history: any[], 
    context: AgentContext
  ): Promise<void> {
    if (!this.llmClient) {
      throw new Error('Anthropic client not initialized');
    }

    const messages = [
      ...history,
      { role: 'user', content: userMessage }
    ];

    const stream = await this.llmClient.messages.create({
      model: apiConfig.anthropic.model,
      max_tokens: apiConfig.anthropic.maxTokens,
      system: systemPrompt,
      messages,
      stream: true
    });

    let fullResponse = '';
    let insideToolCall = false;
    let currentToolTag = '';
    let toolCallBuffer = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.text) {
        const text = chunk.delta.text;
        fullResponse += text;
        
        // Process character by character for tool call detection
        for (const char of text) {
          if (!insideToolCall) {
            // Check for opening tool tag
            if (char === '<') {
              toolCallBuffer = char;
            } else if (toolCallBuffer.length > 0) {
              toolCallBuffer += char;
              
              // Check if we have a complete opening tag
              if (char === '>') {
                const toolMatch = toolCallBuffer.match(/<([a-zA-Z\-_]+)(?:\s+[^>]*)?>/);
                if (toolMatch && HIDE_STREAMING_XML_TAGS.has(toolMatch[1])) {
                  // Start hiding tool call
                  insideToolCall = true;
                  currentToolTag = toolMatch[1];
                  this.emit('streamChunk', `\n\n**${this.getToolDisplayName(currentToolTag)}**\n`);
                  this.emit('statusChange', `executing-${currentToolTag}`);
                } else {
                  // Not a tool call, emit the buffered content
                  this.emit('streamChunk', toolCallBuffer);
                }
                toolCallBuffer = '';
              } else if (char === ' ' && toolCallBuffer.length > 10) {
                // Reset if it's getting too long without closing
                this.emit('streamChunk', toolCallBuffer);
                toolCallBuffer = '';
              }
            } else {
              // Regular content - emit immediately
              this.emit('streamChunk', char);
            }
          } else {
            // Inside tool call - check for closing tag
            toolCallBuffer += char;
            
            if (char === '>') {
              const closingTagPattern = `</${currentToolTag}>`;
              if (toolCallBuffer.endsWith(closingTagPattern)) {
                // End of tool call
                insideToolCall = false;
                currentToolTag = '';
                toolCallBuffer = '';
                this.emit('streamChunk', '\n');
              }
            }
          }
        }
      }
    }

    // Process any final tool calls
    await this.processFinalToolCalls(fullResponse, context);
    
    // Add assistant message
    await this.addMessage({
      role: 'assistant',
      content: fullResponse
    });
  }

  private async generateOpenAIStreamingResponse(
    userMessage: string,
    systemPrompt: string, 
    history: any[], 
    context: AgentContext
  ): Promise<void> {
    if (!this.llmClient) {
      throw new Error('OpenAI client not initialized');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    const stream = await this.llmClient.chat.completions.create({
      model: apiConfig.openai.model,
      max_tokens: apiConfig.openai.maxTokens,
      messages,
      stream: true
    });

    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        // Process the content for tool calls and streaming
        await this.processStreamingContent(content, context);
      }
    }

    // Add assistant message
    await this.addMessage({
      role: 'assistant',
      content: fullResponse
    });
  }

  private async generateGoogleStreamingResponse(
    userMessage: string,
    systemPrompt: string,
    history: any[],
    context: AgentContext
  ): Promise<void> {
    if (!this.llmClient) {
      throw new Error('Google client not initialized');
    }

    const model = this.llmClient.getGenerativeModel({ 
      model: apiConfig.google.model,
      systemInstruction: systemPrompt
    });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessageStream(userMessage);
    let fullResponse = '';

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullResponse += text;
        await this.processStreamingContent(text, context);
      }
    }

    // Add assistant message
    await this.addMessage({
      role: 'assistant',
      content: fullResponse
    });
  }

  private async processStreamingContent(content: string, context: AgentContext): Promise<void> {
    // For OpenAI and Google, detect and hide tool calls
    let insideToolCall = false;
    let currentToolTag = '';
    let toolCallBuffer = '';
    
    for (const char of content) {
      if (!insideToolCall) {
        // Check for opening tool tag
        if (char === '<') {
          toolCallBuffer = char;
        } else if (toolCallBuffer.length > 0) {
          toolCallBuffer += char;
          
          // Check if we have a complete opening tag
          if (char === '>') {
            const toolMatch = toolCallBuffer.match(/<([a-zA-Z\-_]+)(?:\s+[^>]*)?>/);
            if (toolMatch && HIDE_STREAMING_XML_TAGS.has(toolMatch[1])) {
              // Start hiding tool call
              insideToolCall = true;
              currentToolTag = toolMatch[1];
              this.emit('streamChunk', `\n\n**${this.getToolDisplayName(currentToolTag)}**\n`);
              this.emit('statusChange', `executing-${currentToolTag}`);
            } else {
              // Not a tool call, emit the buffered content
              this.emit('streamChunk', toolCallBuffer);
            }
            toolCallBuffer = '';
          } else if (char === ' ' && toolCallBuffer.length > 10) {
            // Reset if it's getting too long without closing
            this.emit('streamChunk', toolCallBuffer);
            toolCallBuffer = '';
          }
        } else {
          // Regular content - emit immediately
          this.emit('streamChunk', char);
        }
      } else {
        // Inside tool call - check for closing tag
        toolCallBuffer += char;
        
        if (char === '>') {
          const closingTagPattern = `</${currentToolTag}>`;
          if (toolCallBuffer.endsWith(closingTagPattern)) {
            // End of tool call
            insideToolCall = false;
            currentToolTag = '';
            toolCallBuffer = '';
            this.emit('streamChunk', '\n');
          }
        }
      }
    }
  }

  private async handleToolCallStream(toolName: string, xmlStart: string, context: AgentContext): Promise<void> {
    // Emit a user-friendly tool execution message
    const toolDisplayName = this.getToolDisplayName(toolName);
    this.emit('streamChunk', `\n\n**${toolDisplayName}**\n`);
    this.emit('statusChange', `executing-${toolName}`);
  }

  private getToolDisplayName(toolName: string): string {
    const displayNames: Record<string, string> = {
      'financial-analysis': 'Analyzing Financial Data',
      'market-research': 'Researching Market Information',
      'alpha-vantage-market': 'Getting Real-time Market Data',
      'tavily-search': 'Searching Web',
      'firecrawl-scrape': 'Gathering Web Data',
      'browser-automation': 'Automating Browser Actions',
      'code-interpreter': 'Running Code Analysis',
      'daytona-sandbox': 'Creating Secure Workspace'
    };
    
    return displayNames[toolName] || `Running ${toolName}`;
  }

  private async processFinalToolCalls(fullResponse: string, context: AgentContext): Promise<void> {
    // Parse XML tool calls from the full response
    const toolCallRegex = /<([a-zA-Z\-_]+)(?:\s+([^>]*))?>(?:([\s\S]*?))<\/\1>|<([a-zA-Z\-_]+)(?:\s+([^>]*))?\s*\/>/g;
    let match;
    
    console.log('[ThreadManager] Processing final tool calls from response length:', fullResponse.length);

    while ((match = toolCallRegex.exec(fullResponse)) !== null) {
      const toolName = match[1] || match[4];
      const attributesStr = match[2] || match[5] || '';
      const content = match[3] || '';
      
      console.log('[ThreadManager] Found tool call:', { toolName, attributesStr, content: content.substring(0, 100) });

      if (HIDE_STREAMING_XML_TAGS.has(toolName)) {
        const parameters = this.parseToolParameters(attributesStr, content);
        console.log('[ThreadManager] Parsed parameters:', parameters);
        
        const toolCall: ToolCall = {
          id: uuidv4(),
          name: toolName,
          parameters,
          timestamp: new Date()
        };

        await this.executeToolCall(toolCall, context);
      } else {
        console.log('[ThreadManager] Tool not in HIDE_STREAMING_XML_TAGS:', toolName);
      }
    }
  }

  private parseToolParameters(attributesStr: string, content: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    console.log('[ThreadManager] Parsing attributes string:', attributesStr);
    
    // Parse attributes
    const attrRegex = /(\w+)=["']([^"']+)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
      params[attrMatch[1]] = attrMatch[2];
      console.log('[ThreadManager] Parsed attribute:', attrMatch[1], '=', attrMatch[2]);
    }
    
    // Parse content for parameters (key="value" format)
    if (content.trim()) {
      const lines = content.trim().split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Match key="value" format (with or without quotes)
          const paramMatch = trimmedLine.match(/^(\w+)=["']?([^"'\n]+)["']?$/);
          if (paramMatch) {
            const [, key, value] = paramMatch;
            params[key] = value;
            console.log('[ThreadManager] Parsed content parameter:', key, '=', value + '...');
          } else if (trimmedLine.startsWith('content="') && !params.content) {
            // Special handling for content parameter - extract the actual content without the wrapper
            const contentMatch = trimmedLine.match(/^content="(.+)"$/s);
            if (contentMatch) {
              params.content = contentMatch[1];
              console.log('[ThreadManager] Extracted content parameter, length:', contentMatch[1].length);
            } else {
              // If content spans multiple lines, capture everything after content="
              const contentStart = content.indexOf('content="');
              if (contentStart !== -1) {
                const contentAfterStart = content.substring(contentStart + 9); // Skip 'content="'
                const contentEnd = contentAfterStart.lastIndexOf('"');
                if (contentEnd !== -1) {
                  params.content = contentAfterStart.substring(0, contentEnd);
                  console.log('[ThreadManager] Extracted multi-line content parameter, length:', params.content.length);
                }
              }
            }
          }
        }
      }
      
      // If no structured parameters found, treat entire content as raw content
      if (Object.keys(params).length === 0) {
        params.content = content.trim();
        console.log('[ThreadManager] Added raw content parameter, length:', content.trim().length);
      }
    }
    
    console.log('[ThreadManager] Final parsed parameters:', params);
    return params;
  }

  private async executeToolCall(toolCall: ToolCall, context: AgentContext): Promise<ToolResult> {
    console.log(`[ThreadManager] Attempting to execute tool: ${toolCall.name}`);
    console.log(`[ThreadManager] Available tools:`, Array.from(this.tools.keys()));
    
    // Handle sandbox ID substitution for daytona-sandbox tool
    if (toolCall.name === 'daytona-sandbox') {
      // If we have a stored sandbox ID and the parameters contain placeholder IDs, substitute them
      const currentSandboxId = this.conversationState.get('currentSandboxId');
      if (currentSandboxId && toolCall.parameters.sandboxId) {
        if (toolCall.parameters.sandboxId === '[sandbox-id]' || 
            toolCall.parameters.sandboxId === '[sandbox-id-from-creation]' ||
            toolCall.parameters.sandboxId.startsWith('[sandbox')) {
          console.log(`[ThreadManager] Substituting placeholder ${toolCall.parameters.sandboxId} with actual sandbox ID: ${currentSandboxId}`);
          toolCall.parameters.sandboxId = currentSandboxId;
        }
      }
    }
    
    const tool = this.tools.get(toolCall.name);
    if (!tool) {
      const errorResult: ToolResult = {
        success: false,
        error: `Tool ${toolCall.name} not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
        timestamp: new Date()
      };
      console.error(`[ThreadManager] Tool not found:`, toolCall.name);
      this.emit('toolResult', errorResult);
      return errorResult;
    }

    try {
      console.log(`[ThreadManager] Executing tool ${toolCall.name} with parameters:`, toolCall.parameters);
      this.emit('statusChange', `executing-${toolCall.name}`);
      const result = await tool.execute(toolCall.parameters, context);
      
      console.log(`[ThreadManager] Tool ${toolCall.name} execution result:`, result);
      
      // Store sandbox ID if this was a successful sandbox creation
      if (toolCall.name === 'daytona-sandbox' && 
          result.success && 
          toolCall.parameters.action === 'create-sandbox' && 
          result.data?.sandboxId) {
        console.log(`[ThreadManager] Storing sandbox ID for conversation: ${result.data.sandboxId}`);
        this.conversationState.set('currentSandboxId', result.data.sandboxId);
      }
      
      // Emit tool result with human-readable message
      if (result.humanReadable) {
        this.emit('streamChunk', `${result.humanReadable}\n\n`);
      }
      
      this.emit('toolResult', result);
      return result;
    } catch (error) {
      console.error(`Error executing tool ${toolCall.name}:`, error);
      const errorResult: ToolResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      this.emit('toolResult', errorResult);
      return errorResult;
    }
  }

  private getConversationHistory(): any[] {
    return this.messages
      .filter(msg => msg.role !== 'tool')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const fullMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    this.messages.push(fullMessage);
    this.emit('message', fullMessage);
    return fullMessage;
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
} 