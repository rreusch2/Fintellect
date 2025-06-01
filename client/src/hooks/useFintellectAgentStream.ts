import { useState, useEffect, useRef, useCallback } from 'react';
import { getNexusApiUrl } from '../config/api.js';

// --- Core Types ---
export interface FintellectUnifiedMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ActiveToolCall {
  toolName: string;
  toolIndex: number;
  args: any; // Tool arguments like { filePath: string, content: string }
  messageId: string;
  status: 'executing' | 'completed' | 'error';
}

export interface ToolResultPayload {
  toolName: string;
  toolIndex: number;
  status: 'success' | 'error';
  result?: any; // Success result like { filePath: string, content: string }
  error?: string; // Error message if failed
  messageId: string;
  args?: any; // Tool arguments passed to the tool
  
  // Additional properties needed for ToolCallSidePanel
  name?: string;
  content?: string;
  timestamp?: string;
  isSuccess?: boolean;
}

// --- SSE Event Types (based on Suna/Nexus architecture) ---
interface AssistantChunkEvent {
  type: 'assistant_chunk';
  content: string;
  messageId: string;
}

interface ToolStartedEvent {
  type: 'tool_started';
  toolName: string;
  toolIndex: number;
  args: any;
  messageId: string;
}

interface ToolCompletedEvent {
  type: 'tool_completed';
  toolName: string;
  toolIndex: number;
  status: 'success' | 'error';
  result?: any;
  error?: string;
  messageId: string;
}

interface MessageCompleteEvent {
  type: 'message_complete';
  messageId: string;
  content: string; // Final cleaned content without XML
}

interface PingEvent {
  type: 'ping';
}

interface ErrorEvent {
  type: 'error';
  message: string;
}

type SSEEvent = AssistantChunkEvent | ToolStartedEvent | ToolCompletedEvent | MessageCompleteEvent | PingEvent | ErrorEvent;

// --- Hook Callbacks ---
export interface FintellectAgentStreamCallbacks {
  onNewMessage: (message: FintellectUnifiedMessage) => void;
  onToolCallStarted: (toolCall: ActiveToolCall) => void;
  onToolCallCompleted: (toolResult: ToolResultPayload) => void;
  onStreamStatusChange: (status: 'idle' | 'connecting' | 'streaming' | 'processing_tool' | 'completed' | 'error') => void;
  onStreamError: (error: { message: string, code?: number }) => void;
}

// --- Hook Result ---
export interface UseFintellectAgentStreamResult {
  status: 'idle' | 'connecting' | 'streaming' | 'processing_tool' | 'completed' | 'error';
  streamingText: string; // Live accumulating text from assistant
  activeToolCall: ActiveToolCall | null; // Current tool being executed
  error: string | null;
  startAgentRun: (conversationId: string, messageContent: string) => void;
}

// --- Main Hook ---
export function useFintellectAgentStream(
  callbacks: FintellectAgentStreamCallbacks
): UseFintellectAgentStreamResult {
  // --- State ---
  const [status, setStatus] = useState<'idle' | 'connecting' | 'streaming' | 'processing_tool' | 'completed' | 'error'>('idle');
  const [streamingText, setStreamingText] = useState<string>('');
  const [activeToolCall, setActiveToolCall] = useState<ActiveToolCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // --- XML Tool Call Extraction State ---
  const [accumulatedXMLContent, setAccumulatedXMLContent] = useState<string>('');
  const [processedXMLChunks, setProcessedXMLChunks] = useState<Set<string>>(new Set());
  const [toolCallIndex, setToolCallIndex] = useState<number>(0);

  // --- Refs for stable references ---
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // --- Cleanup on unmount ---
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        console.log('[FintellectAgentStream] Cleanup: closing EventSource');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // --- Status update helper ---
  const updateStatus = useCallback((newStatus: typeof status, errorMessage?: string) => {
    if (!isMountedRef.current) return;
    
    console.log(`[FintellectAgentStream] 🔄 Status change: ${status} -> ${newStatus}`);
    
    setStatus(newStatus);
    callbacks.onStreamStatusChange(newStatus);
    
    if (newStatus === 'error') {
      const errMsg = errorMessage || 'Unknown stream error';
      setError(errMsg);
      callbacks.onStreamError({ message: errMsg });
    } else {
      // For all non-error statuses, clear any previous error
      setError(null);
    }
  }, [callbacks, status]);

  // --- Reset state for new run ---
  const resetStreamState = useCallback(() => {
    setStreamingText('');
    setActiveToolCall(null);
    setError(null);
    currentMessageIdRef.current = null;
    setAccumulatedXMLContent('');
    setProcessedXMLChunks(new Set());
    setToolCallIndex(0);
  }, []);
  
  // --- XML Tool Call Extraction Functions ---
  const extractXMLChunks = useCallback((content: string): string[] => {
    const chunks: string[] = [];
    const registeredTags = ['create-file', 'web-search', 'str-replace', 'read-file', 'delete-file', 'execute-command', 'web-scrape', 'file-create', 'full-file-rewrite'];
    
    let pos = 0;
    while (pos < content.length) {
      let nextTagStart = -1;
      let currentTag = null;
      
      // Find earliest occurrence of any registered tag
      for (const tagName of registeredTags) {
        const tagPos = content.indexOf(`<${tagName}`, pos);
        if (tagPos !== -1 && (nextTagStart === -1 || tagPos < nextTagStart)) {
          nextTagStart = tagPos;
          currentTag = tagName;
        }
      }
      
      if (nextTagStart === -1) break;
      
      // Extract complete XML block
      const chunk = extractCompleteXMLBlock(content, nextTagStart, currentTag);
      if (chunk) {
        chunks.push(chunk);
        pos = nextTagStart + chunk.length;
      } else {
        pos = nextTagStart + 1;
      }
    }
    
    return chunks;
  }, []);
  
  const extractCompleteXMLBlock = (content: string, startPos: number, tagName: string): string | null => {
    const startTagPattern = new RegExp(`<${tagName}(\\s[^>]*)?>`);
    const endTagPattern = new RegExp(`</${tagName}>`);
    
    // Find start tag
    const startMatch = content.slice(startPos).match(startTagPattern);
    if (!startMatch) return null;
    
    const startTagEnd = startPos + startMatch.index! + startMatch[0].length;
    
    // Find matching end tag (handling nested tags)
    let depth = 1;
    let searchPos = startTagEnd;
    
    while (depth > 0 && searchPos < content.length) {
      const nextStart = content.indexOf(`<${tagName}`, searchPos);
      const nextEnd = content.indexOf(`</${tagName}>`, searchPos);
      
      if (nextEnd === -1) break; // No closing tag found
      
      if (nextStart !== -1 && nextStart < nextEnd) {
        // Found nested opening tag
        depth++;
        searchPos = nextStart + tagName.length + 1;
      } else {
        // Found closing tag
        depth--;
        if (depth === 0) {
          // Found matching closing tag
          const endPos = nextEnd + `</${tagName}>`.length;
          return content.slice(startPos, endPos);
        }
        searchPos = nextEnd + `</${tagName}>`.length;
      }
    }
    
    return null; // No complete block found
  };
  
  const parseXMLToolCall = useCallback((xmlChunk: string): {toolCall: any, parsing_details: any} | null => {
    // Extract tag name
    const tagMatch = xmlChunk.match(/^<([^\s>]+)/);
    if (!tagMatch) return null;
    
    const xmlTagName = tagMatch[1];
    
    // Extract parameters based on common patterns
    const params: Record<string, any> = {};
    const parsing_details = {
      attributes: {},
      text_content: null
    };
    
    // Parse attributes like file_path="...", path="...", or query="..."
    const attributeRegex = /(\w+)=["']([^"']+)["']/g;
    let attrMatch;
    while ((attrMatch = attributeRegex.exec(xmlChunk)) !== null) {
      params[attrMatch[1]] = attrMatch[2];
      parsing_details.attributes[attrMatch[1]] = attrMatch[2];
    }
    
    // Normalize common attribute names
    if (params.file_path && !params.path) {
      params.path = params.file_path;
    } else if (params.path && !params.file_path) {
      params.file_path = params.path;
    }
    
    // Extract text content between tags
    const contentMatch = xmlChunk.match(new RegExp(`<${xmlTagName}[^>]*>([\\s\\S]*?)<\\/${xmlTagName}>`));
    if (contentMatch) {
      params.content = contentMatch[1].trim();
      parsing_details.text_content = contentMatch[1].trim();
    }
    
    return {
      toolCall: {
        function_name: xmlTagName.replace(/-/g, '_'), // create-file -> create_file, str-replace -> str_replace
        xml_tag_name: xmlTagName,
        arguments: params
      },
      parsing_details
    };
  }, []);
  
  // --- Process XML tool calls from streaming content ---
  const processStreamingXMLContent = useCallback((content: string) => {
    // Accumulate XML content
    const newXMLContent = accumulatedXMLContent + content;
    setAccumulatedXMLContent(newXMLContent);
    console.log('[XML Processing] 📋 Accumulated XML content length:', newXMLContent.length);
    console.log('[XML Processing] 📋 Looking for XML in:', newXMLContent.substring(0, 300) + '...');
    
    // Extract complete XML chunks
    const xmlChunks = extractXMLChunks(newXMLContent);
    console.log('[XML Processing] 🔍 Found', xmlChunks.length, 'XML chunks');
    
    for (const chunk of xmlChunks) {
      if (!processedXMLChunks.has(chunk)) {
        // Parse this new XML tool call
        const result = parseXMLToolCall(chunk);
        if (result) {
          const { toolCall, parsing_details } = result;
          
          console.log('[XML Processing] Successfully parsed tool call:', {
            toolName: toolCall.xml_tag_name,
            arguments: toolCall.arguments,
            parsing_details,
            chunk: chunk.substring(0, 200) + (chunk.length > 200 ? '...' : '')
          });
          
          // Validate required fields
          if (!toolCall.xml_tag_name || !toolCall.arguments) {
            console.warn('[XML Processing] Invalid tool call structure:', toolCall);
            continue;
          }
          
          // Create tool call started event
          const activeToolCallData: ActiveToolCall = {
            toolName: toolCall.xml_tag_name,
            toolIndex: toolCallIndex,
            args: toolCall.arguments,
            messageId: currentMessageIdRef.current || `tool_${Date.now()}`,
            status: 'executing'
          };
          
          // Create tool result event with proper structure for sidebar
          const toolResultData: ToolResultPayload = {
            toolName: toolCall.xml_tag_name,
            toolIndex: toolCallIndex,
            status: 'success',
            result: {
              filePath: toolCall.arguments.file_path || toolCall.arguments.path,
              content: toolCall.arguments.content,
              query: toolCall.arguments.query,
              url: toolCall.arguments.url,
              output: `Tool executed: ${toolCall.xml_tag_name} with ${Object.keys(toolCall.arguments).length} parameters`,
              ...toolCall.arguments
            },
            messageId: currentMessageIdRef.current || `tool_${Date.now()}`,
            args: {
              ...toolCall.arguments,
              // Ensure both path and filePath are available for the sidebar
              path: toolCall.arguments.path || toolCall.arguments.file_path,
              filePath: toolCall.arguments.file_path || toolCall.arguments.path
            },
            name: toolCall.xml_tag_name,
            content: toolCall.xml_tag_name.includes('file') ? 
              `File: ${toolCall.arguments.file_path || toolCall.arguments.path || 'Unknown file'}\nContent: ${toolCall.arguments.content || 'N/A'}` :
              toolCall.xml_tag_name.includes('search') ?
              `Query: ${toolCall.arguments.query || 'N/A'}` :
              JSON.stringify(toolCall.arguments, null, 2),
            timestamp: new Date().toISOString(),
            isSuccess: true
          };
          
          // Notify callbacks
          console.log('[XML Processing] 🔧 TOOL STARTED CALLBACK - About to call onToolCallStarted:', activeToolCallData);
          callbacks.onToolCallStarted(activeToolCallData);
          setActiveToolCall(activeToolCallData);
          updateStatus('processing_tool');
          
          // Mark as processed immediately to prevent duplicates
          setProcessedXMLChunks(prev => new Set(prev).add(chunk));
          
          // Complete the tool call with extracted data
          // Use a longer timeout to ensure UI updates properly
          setTimeout(() => {
            if (isMountedRef.current) {
              console.log('[XML Processing] ✅ TOOL COMPLETED CALLBACK - About to call onToolCallCompleted:', toolResultData);
              callbacks.onToolCallCompleted(toolResultData);
              setActiveToolCall(null);
              setToolCallIndex(prev => prev + 1);
              updateStatus('streaming'); // Return to streaming status
            }
          }, 250);
          
          // Remove processed chunk from accumulated content to prevent reprocessing
          setAccumulatedXMLContent(prev => prev.replace(chunk, ''));
        } else {
          console.warn('[XML Processing] Failed to parse XML chunk:', chunk.substring(0, 100));
        }
      }
    }
  }, [accumulatedXMLContent, processedXMLChunks, toolCallIndex, parseXMLToolCall, extractXMLChunks, callbacks, updateStatus]);

  // --- Handle individual SSE events ---
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (!isMountedRef.current) return;

    console.log('[FintellectAgentStream] Processing event:', event.type, event);

    switch (event.type) {
      case 'assistant_chunk':
        // Accumulate streaming text
        if (typeof event.content === 'string') {
          console.log(`[FintellectAgentStream] 📝 Received chunk (${event.content.length} chars):`, event.content.substring(0, 100) + '...');
          
          // Sync messageId if this is the first chunk
          if (event.messageId && currentMessageIdRef.current !== event.messageId) {
            console.log(`[FintellectAgentStream] Syncing messageId: ${currentMessageIdRef.current} -> ${event.messageId}`);
            currentMessageIdRef.current = event.messageId;
          }
          setStreamingText(prev => {
            const newText = prev + event.content;
            console.log(`[FintellectAgentStream] 📝 Updated streaming text length: ${newText.length}`);
            return newText;
          });
          
          // *** NEW: Process XML tool calls from streaming content ***
          console.log('[FintellectAgentStream] 🔍 Processing chunk for XML content:', event.content.substring(0, 200) + '...');
          processStreamingXMLContent(event.content);
          
          updateStatus('streaming');
        }
        break;

      case 'status':
        // Handle Nexus-style status events for tool execution
        try {
          const parsedContent = typeof event.content === 'string' ? JSON.parse(event.content) : event.content;
          
          switch (parsedContent.status_type) {
            case 'tool_started':
              const toolCall: ActiveToolCall = {
                toolName: parsedContent.function_name || parsedContent.xml_tag_name,
                toolIndex: parsedContent.tool_index || 0,
                args: parsedContent.arguments || {},
                messageId: event.messageId,
                status: 'executing'
              };
              setActiveToolCall(toolCall);
              callbacks.onToolCallStarted(toolCall);
              updateStatus('processing_tool');
              break;
              
            case 'tool_completed':
            case 'tool_failed':
            case 'tool_error':
              const toolResult: ToolResultPayload = {
                toolName: parsedContent.function_name || parsedContent.xml_tag_name,
                toolIndex: parsedContent.tool_index || 0,
                status: parsedContent.status_type === 'tool_completed' ? 'success' : 'error',
                result: parsedContent.status_type === 'tool_completed' ? parsedContent : undefined,
                error: parsedContent.status_type !== 'tool_completed' ? parsedContent.message : undefined,
                messageId: event.messageId
              };
              
              // Clear active tool call if it matches
              if (activeToolCall && activeToolCall.toolIndex === (parsedContent.tool_index || 0)) {
                setActiveToolCall(null);
              }
              
              callbacks.onToolCallCompleted(toolResult);
              updateStatus('streaming'); // Back to streaming after tool completes
              break;
          }
        } catch (e) {
          console.warn('[FintellectAgentStream] Failed to parse status event content:', e);
        }
        break;

      case 'tool_started':
        // Tool execution has begun
        console.log('[FintellectAgentStream] 🔧 SSE TOOL_STARTED EVENT RECEIVED:', event);
        const toolCall: ActiveToolCall = {
          toolName: event.toolName,
          toolIndex: event.toolIndex,
          args: event.args,
          messageId: event.messageId,
          status: 'executing'
        };
        console.log('[FintellectAgentStream] 🔧 About to call onToolCallStarted with:', toolCall);
        setActiveToolCall(toolCall);
        callbacks.onToolCallStarted(toolCall);
        updateStatus('processing_tool');
        break;

      case 'tool_completed':
        // Tool execution finished
        console.log('[FintellectAgentStream] 🎯 SSE TOOL_COMPLETED EVENT RECEIVED:', event);
        const toolResult: ToolResultPayload = {
          toolName: event.toolName,
          toolIndex: event.toolIndex,
          status: event.status,
          result: event.result,
          error: event.error,
          messageId: event.messageId,
          // Add missing properties for ToolCallSidePanel
          name: event.toolName,
          content: `Tool executed: ${event.toolName}`,
          timestamp: new Date().toISOString(),
          isSuccess: event.status === 'success',
          args: event.args || {}
        };
        
        console.log('[FintellectAgentStream] 🎯 About to call onToolCallCompleted with:', toolResult);
        
        // Clear active tool call if it matches
        if (activeToolCall && 
            activeToolCall.toolIndex === event.toolIndex && 
            activeToolCall.toolName === event.toolName) {
          setActiveToolCall(null);
        }
        
        callbacks.onToolCallCompleted(toolResult);
        updateStatus('streaming'); // Back to streaming after tool completes
        break;

      case 'message_complete':
        // Assistant turn is finished
        console.log(`[FintellectAgentStream] 🏁 Received message_complete event:`);
        console.log(`[FintellectAgentStream] 🏁 Event messageId: ${event.messageId}`);
        console.log(`[FintellectAgentStream] 🏁 Event content length: ${event.content?.length || 0}`);
        console.log(`[FintellectAgentStream] 🏁 Event content preview: ${event.content?.substring(0, 200) + '...' || 'NO CONTENT'}`);
        console.log(`[FintellectAgentStream] 🏁 Current streaming text length: ${streamingText.length}`);
        console.log(`[FintellectAgentStream] 🏁 Current messageId ref: ${currentMessageIdRef.current}`);
        
        const finalMessage: FintellectUnifiedMessage = {
          id: event.messageId,
          conversationId: '', // Will be set by caller
          role: 'assistant',
          content: event.content, // Clean content without XML
          timestamp: new Date().toISOString()
        };
        
        console.log(`[FintellectAgentStream] 🏁 Creating final message:`, finalMessage);
        
        callbacks.onNewMessage(finalMessage);
        updateStatus('completed');
        
        // DON'T reset state immediately - let the status handler save the message first
        // The status handler will clear these refs when it's done saving
        
        // Close the connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;

      case 'ping':
        // Keepalive - no action needed
        console.log('[FintellectAgentStream] Received keepalive ping');
        break;

      case 'error':
        // Backend error
        updateStatus('error', event.message);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;

      default:
        console.warn('[FintellectAgentStream] Unknown event type:', (event as any).type);
    }
  }, [callbacks, updateStatus, resetStreamState, activeToolCall]);

  // --- Start agent run ---
  const startAgentRun = useCallback((conversationId: string, messageContent: string) => {
    if (!isMountedRef.current) return;

    // Close existing connection
    if (eventSourceRef.current) {
      console.log('[FintellectAgentStream] Closing existing connection before new run');
      eventSourceRef.current.close();
    }

    // Reset state
    resetStreamState();
    updateStatus('connecting');
    
    // Generate messageId for this turn
    currentMessageIdRef.current = `assistant_turn_${Date.now()}`;
    
    console.log(`[FintellectAgentStream] Starting run - Conversation: ${conversationId}, MessageId: ${currentMessageIdRef.current}`);

    // Connect to SSE endpoint
    const sseUrl = getNexusApiUrl(`/conversations/${conversationId}/stream`);
    console.log(`[FintellectAgentStream] Connecting to: ${sseUrl}`);
    
    eventSourceRef.current = new EventSource(sseUrl, { withCredentials: true });

    // --- Event handlers ---
    eventSourceRef.current.onopen = () => {
      if (!isMountedRef.current) return;
      console.log('[FintellectAgentStream] SSE connection opened');
      updateStatus('streaming');
    };

    eventSourceRef.current.onmessage = (event) => {
      if (!isMountedRef.current) return;
      
      try {
        const data: SSEEvent = JSON.parse(event.data);
        
        // Add conversationId to message_complete events
        if (data.type === 'message_complete') {
          // We'll let the handleSSEEvent create the message and then update it
          handleSSEEvent(data);
          // Update the message with conversationId via callback
          return;
        }
        
        handleSSEEvent(data);
      } catch (parseError) {
        console.error('[FintellectAgentStream] Failed to parse SSE data:', parseError, event.data);
        updateStatus('error', 'Failed to parse server response');
      }
    };

    eventSourceRef.current.onerror = (err) => {
      if (!isMountedRef.current) return;
      console.error('[FintellectAgentStream] SSE connection error:', err);
      updateStatus('error', 'Connection error');
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

  }, [updateStatus, resetStreamState, handleSSEEvent]);

  return {
    status,
    streamingText,
    activeToolCall,
    error,
    startAgentRun
  };
} 