import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { Navigation } from '../../components/layout/Navigation.jsx';
import { NexusAuthProvider } from '../../nexus/contexts/NexusAuthContext.js';
import { useNexusConversations } from '../../nexus/hooks/useNexusConversations.js';
import { useNexusConversation } from '../../nexus/hooks/useNexusConversation.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Separator } from '../../components/ui/separator.jsx';
import { ScrollArea } from '../../components/ui/scroll-area.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { usePageTitle } from '../../hooks/use-page-title.js';
import { getNexusApiUrl } from '../../config/api.js';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Send, 
  Loader2,
  MessageSquare,
  X,
  Menu,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  DollarSign,
  PieChart,
  Target,
  BarChart3,
  Briefcase,
  Settings,
  Search,
  Plus,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Code2,
  FileText,
  Terminal,
  Play,
  Zap,
  Trash2,
  Copy,
  CheckCheck,
  Clock,
  Code,
  Eye,
  Download,
  Sidebar,
  Computer,
  FolderOpen
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useToast } from '../../hooks/use-toast.js';
import { Progress } from '../../components/ui/progress.jsx';
import { WorkspaceBadge } from '../../components/ui/WorkspaceBadge.jsx';
import { StatusPill } from '../../components/ui/StatusPill.jsx';
import { useArtifacts, Artifact } from '../../hooks/useArtifacts.js';
import { SimplifiedToolCallSidePanel } from '../../components/nexus/SimplifiedToolCallSidePanel.tsx';
import { 
  useFintellectAgentStream, 
  FintellectUnifiedMessage, 
  ActiveToolCall, 
  ToolResultPayload 
} from '../../hooks/useFintellectAgentStream.js';

// Financial prompt suggestions with enhanced styling
const financialPrompts = [
  {
    title: 'Market research dashboard',
    query: 'Analyze current market trends in my investment portfolio and provide insights on sector performance, risk assessment, and potential opportunities.',
    icon: <BarChart3 className="text-emerald-500" size={20} />,
    gradient: 'from-emerald-500/10 to-green-500/10',
    border: 'border-emerald-500/20',
    hover: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
  },
  {
    title: 'Budget optimization',
    query: 'Review my spending patterns and create a personalized budget optimization plan with recommendations for reducing expenses and increasing savings.',
    icon: <DollarSign className="text-blue-500" size={20} />,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/20',
    hover: 'hover:border-blue-500/40 hover:bg-blue-500/5',
  },
  {
    title: 'Investment strategy',
    query: 'Develop a comprehensive investment strategy based on my financial goals, risk tolerance, and current market conditions.',
    icon: <TrendingUp className="text-purple-500" size={20} />,
    gradient: 'from-purple-500/10 to-violet-500/10',
    border: 'border-purple-500/20',
    hover: 'hover:border-purple-500/40 hover:bg-purple-500/5',
  },
  {
    title: 'Financial goal planning',
    query: 'Help me create and track financial goals including emergency fund, retirement planning, and major purchase planning with actionable steps.',
    icon: <Target className="text-rose-500" size={20} />,
    gradient: 'from-rose-500/10 to-pink-500/10',
    border: 'border-rose-500/20',
    hover: 'hover:border-rose-500/40 hover:bg-rose-500/5',
  },
];

const suggestedPrompts = [
  {
    title: "Market Research",
    description: "Research current market conditions and investment opportunities",
    icon: TrendingUp
  },
  {
    title: "Budget Optimization", 
    description: "Analyze spending patterns and optimize budget allocation",
    icon: DollarSign
  },
  {
    title: "Investment Strategy",
    description: "Develop personalized investment strategy", 
    icon: Target
  },
  {
    title: "Financial Goal Planning",
    description: "Create actionable plans for your financial objectives",
    icon: Sparkles
  }
];

const AnalystPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { conversationId } = useParams();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<FintellectUnifiedMessage[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentAnalystPageStatus, setCurrentAnalystPageStatus] = useState<'idle' | 'connecting' | 'streaming' | 'processing_tool' | 'completed' | 'error'>('idle');
  const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState<string | null>(null);
  const [pageActiveToolCall, setPageActiveToolCall] = useState<ActiveToolCall | null>(null);
  
  // Computer sidebar state
  const [isComputerSidebarOpen, setIsComputerSidebarOpen] = useState(false);
  const [completedTools, setCompletedTools] = useState<ToolResultPayload[]>([]);
  const [currentToolIndex, setCurrentToolIndex] = useState(0);
  const [currentSandboxId, setCurrentSandboxId] = useState<string | null>(null);

  const [workspaceFileCount, setWorkspaceFileCount] = useState(0);
  
  // Refs to track streaming state more reliably
  const hasCreatedStreamingMessageRef = useRef(false);
  const currentStreamingMessageIdRef = useRef<string | null>(null);
  
  // Smart auto-scroll behavior
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Track if user has manually navigated in Computer sidebar
  const hasUserNavigatedRef = useRef(false);

  // Workspace browser state
  const [showWorkspaceBrowser, setShowWorkspaceBrowser] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  // Artifact management
  const {
    artifactGroups,
    allArtifacts,
    isOpen: isArtifactSidebarOpen,
    setIsOpen: setIsArtifactSidebarOpen,
    addArtifact,
    updateArtifact,
    clearArtifacts
  } = useArtifacts();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Agent Stream Hook Integration --- 
  const handleStreamError = useCallback((error: { message: string, code?: number }) => {
    toast({ 
      title: 'Connection Error',
      description: error.message,
      variant: 'destructive'
    });
  }, [toast]);

  const {
    status: streamStatus,
    streamingText,
    activeToolCall,
    error: streamError,
    startAgentRun,
  } = useFintellectAgentStream({
    onNewMessage: (message: FintellectUnifiedMessage) => {
      console.log('[AnalystPage] New message received:', message);
      
      // Update existing streaming message if it exists, otherwise add new
      setMessages(prev => {
        const streamingMessageId = currentStreamingMessageIdRef.current;
        
        // If this is the final message for our current streaming session
        if (streamingMessageId && message.id !== streamingMessageId) {
          // Find the streaming message and update it with final content
          const existingIndex = prev.findIndex(m => m.id === streamingMessageId);
          if (existingIndex >= 0) {
            const newMessages = [...prev];
            // Preserve the streaming content if the final message content is empty
            const finalContent = message.content.trim() || streamingText || newMessages[existingIndex].content;
            newMessages[existingIndex] = {
              ...newMessages[existingIndex],
              content: finalContent,
              timestamp: message.timestamp
            };
            console.log(`[AnalystPage] Updated streaming message ${streamingMessageId} with final content: "${finalContent.substring(0, 100)}..."`);
            return newMessages;
          }
        }
        
        // If the message ID matches our streaming message, update it
        if (streamingMessageId && message.id === streamingMessageId) {
          const existingIndex = prev.findIndex(m => m.id === streamingMessageId);
          if (existingIndex >= 0) {
            const newMessages = [...prev];
            // Use the final message content or preserve existing content
            const finalContent = message.content.trim() || streamingText || newMessages[existingIndex].content;
            newMessages[existingIndex] = {
              ...newMessages[existingIndex],
              content: finalContent,
              timestamp: message.timestamp
            };
            console.log(`[AnalystPage] Updated same-ID streaming message ${streamingMessageId} with content: "${finalContent.substring(0, 100)}..."`);
            return newMessages;
          }
        }
        
        // Otherwise find by message ID and update, or add new
        const existingIndex = prev.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          const newMessages = [...prev];
          newMessages[existingIndex] = {
            ...newMessages[existingIndex],
            content: message.content,
            timestamp: message.timestamp
          };
          return newMessages;
        } else {
          return [...prev, {
            ...message,
            conversationId: conversationId || ''
          }];
        }
      });
      
      setCurrentAssistantMessageId(null);
      hasCreatedStreamingMessageRef.current = false;
      currentStreamingMessageIdRef.current = null;
    },
    onToolCallStarted: (toolCall: ActiveToolCall) => {
      console.log('[AnalystPage] 🔧 TOOL STARTED:', JSON.stringify(toolCall, null, 2));
      console.log('[AnalystPage] 📊 Current completedTools count:', completedTools.length);
      
      // Add the actual search query or command to the tool call for better display
      let enhancedToolCall = {...toolCall};
      
      // Try to extract meaningful information from the args
      if (toolCall.args) {
        console.log('[AnalystPage] Tool args:', JSON.stringify(toolCall.args, null, 2));
        
        // For file operations, add to artifacts if needed
        if (toolCall.toolName === 'create_file' && toolCall.args) {
          // Extract file path from args
          const filePath = toolCall.args.filePath || '';
          if (filePath) {
            // Add to artifacts if not already exists
            const exists = allArtifacts.some(a => a.filePath === filePath);
            if (!exists && currentAssistantMessageId) {
              // Create placeholder artifact
              const artifact: Omit<Artifact, 'id'> = {
                type: 'file',
                title: filePath.split('/').pop() || 'New File',
                content: '',
                filePath: filePath,
                language: filePath.split('.').pop() || 'text',
                timestamp: new Date(),
                status: 'pending',
                metadata: {
                  type: 'file',
                  extension: filePath.split('.').pop() || ''
                }
              };
              
              // Add to artifacts
              addArtifact(currentAssistantMessageId, artifact);
            }
          }
        }
      }
      
      // Update page active tool call
      setPageActiveToolCall(enhancedToolCall);
      
      // Create a tool call entry for the sidebar
      const toolCallEntry: ToolResultPayload = {
        toolName: toolCall.toolName,
        toolIndex: toolCall.toolIndex,
        status: 'success',
        messageId: toolCall.messageId,
        name: toolCall.toolName,
        content: `Running ${toolCall.toolName}...`,
        timestamp: new Date().toISOString(),
        isSuccess: true,
        args: toolCall.args,
        result: {
          content: 'Processing...',
          isSuccess: true,
          timestamp: new Date().toISOString()
        }
      };
      
      // Add to completed tools for the sidebar
      setCompletedTools(prev => [...prev, toolCallEntry]);
      
      // Automatically show the Computer sidebar when a tool is running
      setIsComputerSidebarOpen(true);
      // Only update to latest tool if user hasn't manually navigated
      if (!hasUserNavigatedRef.current) {
        setCurrentToolIndex(completedTools.length);
      }
      
      // Set current assistant message ID if not already set
      if (!hasCreatedStreamingMessageRef.current) {
        setCurrentAssistantMessageId(toolCall.messageId);
        hasCreatedStreamingMessageRef.current = true;
        currentStreamingMessageIdRef.current = toolCall.messageId;
        
        // Create placeholder assistant message if none exists
        const assistantMessage: FintellectUnifiedMessage = {
          id: toolCall.messageId,
          conversationId: conversationId || '',
          role: 'assistant',
          content: '', // Will be filled by streaming
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => {
          // Only add if not already exists
          const exists = prev.some(msg => msg.id === toolCall.messageId);
          return exists ? prev : [...prev, assistantMessage];
        });
      }
    },
    onToolCallCompleted: (toolResult: ToolResultPayload) => {
      console.log('[AnalystPage] ✅ TOOL COMPLETED:', toolResult);
      console.log('[AnalystPage] 📊 Current completedTools count before adding:', completedTools.length);
      
      // Add to completed tools for ToolCallSidePanel
      // Ensure the toolResult has all the properties needed by ToolCallSidePanel
      const enhancedToolResult: ToolResultPayload = {
        ...toolResult,
        name: toolResult.name || toolResult.toolName,
        content: toolResult.content || JSON.stringify(toolResult.result),
        timestamp: toolResult.timestamp || new Date().toISOString(),
        isSuccess: toolResult.isSuccess !== undefined ? toolResult.isSuccess : toolResult.status === 'success'
      };
      
      setCompletedTools(prev => [...prev, enhancedToolResult]);
      
      // Clear active tool call
      setPageActiveToolCall(null);
      
      // Automatically open the Computer sidebar when a tool is completed
      setIsComputerSidebarOpen(true);
      
      // Update the current tool index to show the latest tool only if user hasn't manually navigated
      if (!hasUserNavigatedRef.current) {
        setCurrentToolIndex(completedTools.length);
      }
      
      if (toolResult.status === 'success' && toolResult.toolName === 'create_file' && toolResult.result) {
        // Add to artifacts
        const artifact: Omit<Artifact, 'id'> = {
          type: 'file',
          title: toolResult.result.filePath?.split('/').pop() || 'Unknown File',
          content: toolResult.result.content || '',
          filePath: toolResult.result.filePath || '',
          language: toolResult.result.filePath?.split('.').pop() || 'text',
          timestamp: new Date(),
          status: 'success',
          metadata: { 
            toolName: toolResult.toolName,
            messageId: toolResult.messageId
          }
        };
        
        addArtifact(toolResult.messageId, artifact);
        setWorkspaceFileCount(prev => prev + 1);
        
        toast({ 
          title: 'File Created',
          description: `${artifact.title} is ready in Artifacts`
        });
      } else if (toolResult.status === 'error') {
        toast({ 
          title: 'Tool Error',
          description: toolResult.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    },
    onStreamStatusChange: (status: 'idle' | 'connecting' | 'streaming' | 'processing_tool' | 'completed' | 'error') => {
      console.log('[AnalystPage] Stream status changed:', status);
      
      // Only create assistant message when first transitioning to streaming
      if (status === 'streaming' && !hasCreatedStreamingMessageRef.current) {
        const messageId = `asst_turn_${Date.now()}`;
        setCurrentAssistantMessageId(messageId);
        hasCreatedStreamingMessageRef.current = true;
        currentStreamingMessageIdRef.current = messageId;
        
        console.log(`[AnalystPage] Creating streaming message with ID: ${messageId}`);
        
        const assistantMessage: FintellectUnifiedMessage = {
          id: messageId,
          conversationId: conversationId || '',
          role: 'assistant',
          content: '', // Will be filled by streaming
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // When a tool starts processing, make sure we show it in the UI
      if (status === 'processing_tool') {
        // If we don't have an active tool call but the status says we're processing a tool,
        // create a dummy one to show the tool progress
        if (!pageActiveToolCall && activeToolCall) {
          setPageActiveToolCall(activeToolCall);
        }
      }
      
      // Clear current message ID when streaming completes
      if (status === 'completed' || status === 'error') {
        setCurrentAssistantMessageId(null);
        hasCreatedStreamingMessageRef.current = false;
        currentStreamingMessageIdRef.current = null;
      }
    },
    onStreamError: handleStreamError,
  });

  // Smart auto-scroll: only scroll when user is near bottom
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText, activeToolCall, shouldAutoScroll]);
  
  // Check if user is near bottom when they scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  };
  
  // Update page active tool call when activeToolCall changes
  useEffect(() => {
    if (activeToolCall) {
      console.log('[AnalystPage] Setting active tool call from hook:', activeToolCall);
      setPageActiveToolCall(activeToolCall);
      
      // Automatically show the Computer sidebar when a tool is running
      if (streamStatus === 'processing_tool') {
        setIsComputerSidebarOpen(true);
        // Only set to last tool if user hasn't manually navigated
        if (!hasUserNavigatedRef.current) {
          setCurrentToolIndex(completedTools.length);
        }
      }
    } else {
      setPageActiveToolCall(null);
    }
  }, [activeToolCall, streamStatus, completedTools.length, currentToolIndex]);
  
  // Debug log for pageActiveToolCall
  useEffect(() => {
    console.log('[AnalystPage] pageActiveToolCall updated:', pageActiveToolCall);
  }, [pageActiveToolCall]);
  
  // Monitor stream status changes
  useEffect(() => {
    console.log('[AnalystPage] Stream status changed:', streamStatus);
    
    // When a tool starts processing, we should show progress
    if (streamStatus === 'processing_tool' && !isComputerSidebarOpen) {
      // If we have an active tool but no pageActiveToolCall, create one from the stream status
      if (!pageActiveToolCall && activeToolCall) {
        setPageActiveToolCall(activeToolCall);
      }
      
      // Automatically open the ComputerSidebar
      setIsComputerSidebarOpen(true);
    }
  }, [streamStatus, isComputerSidebarOpen, pageActiveToolCall, activeToolCall]);
  
  // Monitor streaming text for research execution patterns
  useEffect(() => {
    if (streamingText && 
        (streamingText.includes('Starting Research Execution') || 
         streamingText.includes('Searching:') || 
         streamingText.includes('Scraping'))) {
      
      console.log('[AnalystPage] Research execution detected in streaming text');
      
      // Create dummy tool calls if none exist
      if (completedTools.length === 0 && !pageActiveToolCall) {
        const dummyToolCall = {
          toolName: 'web_search',
          toolIndex: 0,
          args: { query: 'market conditions' },
          messageId: currentAssistantMessageId || `msg_${Date.now()}`,
          status: 'executing' as const
        };
        
        setPageActiveToolCall(dummyToolCall);
        
        // Open the ComputerSidebar
        setIsComputerSidebarOpen(true);
      }
    }
  }, [streamingText, completedTools.length, pageActiveToolCall, currentAssistantMessageId]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      clearArtifacts();
      setMessages([]);
      setCompletedTools([]); // Clear tool calls when switching conversations
      setCurrentAssistantMessageId(null);
      hasCreatedStreamingMessageRef.current = false;
      currentStreamingMessageIdRef.current = null;
      hasUserNavigatedRef.current = false; // Reset navigation flag for new conversation
      setCurrentSandboxId(null); // Clear sandbox ID when switching conversations
      fetchMessagesForConversation(conversationId);
    }
  }, [conversationId, clearArtifacts]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(getNexusApiUrl('/conversations'), {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessagesForConversation = async (convId: string) => {
    if (!convId) return;

    try {
      console.log(`[AnalystPage] Fetching messages for ${convId}`);
      
      // Verify conversation exists
      const conversationResponse = await fetch(getNexusApiUrl(`/conversations/${convId}`), {
        credentials: 'include'
      });

      if (conversationResponse.status === 404) {
        toast({ 
          title: 'Conversation Not Found', 
          description: 'Starting a new conversation instead.',
          variant: 'default'
        });
        navigate('/nexus/analyst');
        return;
      }

      if (!conversationResponse.ok) {
        throw new Error('Failed to verify conversation');
      }

      // Fetch messages
      const messagesResponse = await fetch(getNexusApiUrl(`/conversations/${convId}/messages`), {
        credentials: 'include'
      });

      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messagesData = await messagesResponse.json();
      const historicMessages = messagesData.messages || [];
      
      // Convert to FintellectUnifiedMessage format
      const formattedMessages: FintellectUnifiedMessage[] = historicMessages.map((msg: any) => ({
        id: msg.id,
        conversationId: convId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      }));

      console.log(`[AnalystPage] Loaded ${formattedMessages.length} messages`);
      setMessages(formattedMessages);
      
      // Try to get sandbox ID for this conversation
      try {
        const sandboxResponse = await fetch(getNexusApiUrl(`/conversations/${convId}/sandbox`), {
          credentials: 'include'
        });
        
        if (sandboxResponse.ok) {
          const sandboxData = await sandboxResponse.json();
          if (sandboxData.sandboxId) {
            console.log(`[AnalystPage] Found existing sandbox ID: ${sandboxData.sandboxId}`);
            setCurrentSandboxId(sandboxData.sandboxId);
          }
        } else {
          console.log(`[AnalystPage] No sandbox found for conversation ${convId}`);
          setCurrentSandboxId(null);
        }
      } catch (sandboxError) {
        console.log('[AnalystPage] Could not fetch sandbox ID:', sandboxError);
        setCurrentSandboxId(null);
      }
      
      // Try to fetch historical tool calls for this conversation
      try {
        const toolCallsResponse = await fetch(getNexusApiUrl(`/conversations/${convId}/toolcalls`), {
          credentials: 'include'
        });
        
        if (toolCallsResponse.ok) {
          const toolCallsData = await toolCallsResponse.json();
          const historicToolCalls = toolCallsData.toolCalls || [];
          
          // Format tool calls for the sidebar
          const formattedToolCalls: ToolResultPayload[] = historicToolCalls.map((toolCall: any) => ({
            messageId: toolCall.messageId || toolCall.id,
            toolName: toolCall.toolName || toolCall.name || 'Tool Call',
            toolIndex: toolCall.toolIndex || 0,
            status: 'success',
            result: toolCall.result || toolCall.content || {},
            timestamp: toolCall.timestamp || toolCall.createdAt || new Date().toISOString(),
            isSuccess: toolCall.isSuccess !== undefined ? toolCall.isSuccess : true,
            name: toolCall.name || toolCall.toolName || 'Tool Call',
            content: toolCall.content || `${toolCall.toolName || 'Tool'} executed`,
            args: toolCall.args || {}
          }));
          
          console.log(`[AnalystPage] Loaded ${formattedToolCalls.length} historical tool calls`);
          setCompletedTools(formattedToolCalls);
        } else {
          console.log('[AnalystPage] No historical tool calls found or endpoint not available');
          // Clear any existing tool calls when loading a conversation
          setCompletedTools([]);
        }
      } catch (toolCallError) {
        console.log('[AnalystPage] Could not fetch historical tool calls:', toolCallError);
        // Clear any existing tool calls when loading a conversation
        setCompletedTools([]);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error', 
        description: 'Failed to load conversation messages', 
        variant: 'destructive'
      });
    }
  };

  const startNewConversation = async (prompt?: string) => {
    try {
      clearArtifacts();
      setMessages([]);
      setCompletedTools([]); // Clear tool calls when starting new conversation
      setCurrentAssistantMessageId(null);
      hasCreatedStreamingMessageRef.current = false;
      currentStreamingMessageIdRef.current = null;
      hasUserNavigatedRef.current = false; // Reset navigation flag for new conversation
      setCurrentSandboxId(null); // Clear sandbox ID when starting new conversation
      setInput(prompt || '');
      
      // Create new conversation via API
      const response = await fetch(getNexusApiUrl('/conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: prompt ? prompt.substring(0, 50) + '...' : 'New Conversation'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      const newConvId = data.conversation.id;
      
      console.log(`[AnalystPage] Created conversation: ${newConvId}`);
      
      await fetchConversations();
      navigate(`/nexus/analyst/${newConvId}`);
      
      toast({ title: "New conversation started" });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to start new conversation', 
        variant: 'destructive' 
      });
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !conversationId) return;
    
    if (streamStatus === 'streaming' || streamStatus === 'connecting' || streamStatus === 'processing_tool') {
      toast({ 
        title: "Please wait", 
        description: "AI is currently busy", 
        variant: "default"
      });
      return;
    }

    // Add user message immediately
    const userMessage: FintellectUnifiedMessage = {
      id: `user-${Date.now()}`,
      conversationId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      // Start the agent stream
      startAgentRun(conversationId, content);
      
      // Send message to backend to trigger processing
      const response = await fetch(getNexusApiUrl(`/conversations/${conversationId}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      console.log(`[AnalystPage] Message sent for processing`);
      
      // Get sandbox ID from response if available
      const responseData = await response.json();
      if (responseData.sandboxId) {
        console.log(`[AnalystPage] Received sandbox ID: ${responseData.sandboxId}`);
        setCurrentSandboxId(responseData.sandboxId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.', 
        variant: 'destructive'
      });
    }
  };

  const renderMessageContent = (message: FintellectUnifiedMessage): React.ReactNode => {
    const isLiveStreamingMessage = message.role === 'assistant' && 
                                  message.id === currentStreamingMessageIdRef.current && 
                                  (streamStatus === 'streaming' || streamStatus === 'processing_tool');
    
    // Debug logging
    console.log(`[AnalystPage] Rendering message ${message.id}:`, {
      role: message.role,
      messageId: message.id,
      currentStreamingMessageIdRef: currentStreamingMessageIdRef.current,
      streamStatus,
      isLiveStreamingMessage,
      streamingTextLength: streamingText.length,
      messageContentLength: message.content.length
    });
    
    if (isLiveStreamingMessage) {
      // This is the live streaming assistant message
      console.log(`[AnalystPage] Rendering live streaming content: "${streamingText.substring(0, 100)}..."`);
      return (
        <div className="space-y-2">
          {/* Streaming text */}
          {streamingText && (
            <div className="whitespace-pre-wrap">{streamingText}</div>
          )}
          
          {/* Active tool call - show tool progress */}
          {(pageActiveToolCall || streamStatus === 'processing_tool') && (
            <div className="mt-2">
              <Button 
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50"
                onClick={() => {
                  console.log('[AnalystPage] Progress button clicked, opening ComputerSidebar');
                  setIsComputerSidebarOpen(true);
                  setCurrentToolIndex(completedTools.length); // Show the active tool
                }}
              >
                <Terminal className="h-4 w-4" />
                {pageActiveToolCall ? pageActiveToolCall.toolName : 'Processing'}
              </Button>
            </div>
          )}
          
          {/* We've removed the tool pills to make the Computer sidebar open automatically */}
        </div>
      );
    } else {
      // This is a completed message
      console.log(`[AnalystPage] Rendering completed message content: "${message.content.substring(0, 100)}..."`);
      return (
        <div className="whitespace-pre-wrap">{message.content}</div>
      );
    }
  };

  const renderMessage = (message: FintellectUnifiedMessage) => {
    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 ${
          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        {/* Avatar */}
        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          message.role === 'user' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
        }`}>
          {message.role === 'user' ? (
            <span className="text-white font-medium text-sm">U</span>
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-[80%] ${
          message.role === 'user' ? 'text-right' : 'text-left'
        }`}>
          <div className={`rounded-lg p-4 ${
            message.role === 'user'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
          }`}>
            {renderMessageContent(message)}
          </div>
          <div className={`text-xs mt-2 ${
            message.role === 'user' ? 'text-green-200' : 'text-slate-500'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage();
    }
  };

  const deleteConversation = async (convToDeleteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(getNexusApiUrl(`/conversations/${convToDeleteId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== convToDeleteId));
        
        if (convToDeleteId === conversationId) {
          navigate('/nexus/analyst');
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const clearAllConversations = async () => {
    if (!confirm('Are you sure you want to delete all conversations?')) {
      return;
    }

    try {
      const deletePromises = conversations.map(conv => 
        fetch(getNexusApiUrl(`/conversations/${conv.id}`), {
          method: 'DELETE',
          credentials: 'include',
        })
      );

      await Promise.all(deletePromises);
      setConversations([]);
      navigate('/nexus/analyst');
    } catch (error) {
      console.error('Error clearing conversations:', error);
    }
  };

  const fetchWorkspaceFiles = async () => {
    if (!conversationId) return;
    
    setIsLoadingWorkspace(true);
    try {
      const response = await fetch(getNexusApiUrl(`/conversations/${conversationId}/workspace/files`), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaceFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching workspace files:', error);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const renderWorkspaceBrowser = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/10 border border-blue-500/30 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Workspace Browser</h3>
              <p className="text-sm text-slate-400">Files created in this session</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowWorkspaceBrowser(false)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoadingWorkspace ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-3 text-blue-400 animate-spin" />
                <p className="text-slate-400">Loading workspace files...</p>
              </div>
            </div>
          ) : workspaceFiles.length > 0 ? (
            <div className="p-4 space-y-3 overflow-y-auto h-full">
              {workspaceFiles.map((file, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{file.name}</h4>
                        <p className="text-sm text-slate-400">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'} • 
                          {file.modified ? new Date(file.modified).toLocaleString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {file.content && (
                    <div className="mt-3 bg-slate-950/50 border border-slate-700/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                        {file.content.substring(0, 500)}
                        {file.content.length > 500 ? '...' : ''}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No files in workspace yet</p>
                <p className="text-slate-500 text-sm mt-1">Files will appear here as they are created</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- Status mapping helper ---
  const mapStreamStatusToStatusPill = (status: 'idle' | 'connecting' | 'streaming' | 'processing_tool' | 'completed' | 'error'): 'error' | 'executing' | 'ready' | 'processing' | 'connected' => {
    switch (status) {
      case 'idle': return 'ready';
      case 'connecting': return 'processing';
      case 'streaming': return 'connected';
      case 'processing_tool': return 'executing';
      case 'completed': return 'ready';
      case 'error': return 'error';
      default: return 'ready';
    }
  };

  if (!conversationId) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Navigation isComputerSidebarOpen={isComputerSidebarOpen} />
        
        <div className="flex-1 flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          <div className="w-80 border-r border-slate-700/50 flex flex-col">
            <div className="border-b border-slate-700/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold text-white">Nexus AI</h1>
                </div>
                <Button
                  onClick={() => startNewConversation()}
                  size="sm"
                  className="h-8 w-8 p-0 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden px-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3 mt-4">Recent Conversations</h3>
              <div className="space-y-2 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => navigate(`/nexus/analyst/${conversation.id}`)}
                      className="w-full p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm text-left hover:bg-slate-700/50 hover:border-slate-600/50 transition-colors"
                    >
                      <div className="font-medium truncate">{conversation.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No conversations yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center space-y-8">
              <div className="space-y-4">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/25">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-3">
                    Hey, what would you like Nexus to do today?
                  </h1>
                  <p className="text-xl text-slate-400">
                    Get personalized financial insights powered by your real transaction data
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe what you need help with..."
                    className="w-full pr-20 pl-4 py-4 text-lg bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-400 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      size="sm"
                      className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {suggestedPrompts.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => startNewConversation(prompt.description)}
                      className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-700/40 hover:border-slate-600/50 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-600/30 transition-colors">
                          <Icon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg mb-2">{prompt.title}</h3>
                          <p className="text-slate-400 text-sm leading-relaxed">{prompt.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navigation isComputerSidebarOpen={isComputerSidebarOpen} />
      
      <div className="flex-1 flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="w-80 border-r border-slate-700/50 flex flex-col bg-slate-900/50">
          <div className="border-b border-slate-700/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-white">Nexus AI</h1>
              </div>
              <Button
                onClick={() => navigate('/nexus/analyst')}
                size="sm"
                className="h-8 w-8 p-0 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-700/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400">Conversations</h3>
              {conversations.length > 0 && conversationId && (
                <Button
                  onClick={clearAllConversations}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  title="Clear All Conversations"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              <div className="space-y-2">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group relative rounded-lg border transition-all duration-200 cursor-pointer ${
                        conversation.id === conversationId 
                          ? 'bg-slate-700/80 border-slate-600/80 shadow-lg' 
                          : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/40 hover:border-slate-600/40'
                      }`}
                      onClick={() => navigate(`/nexus/analyst/${conversation.id}`)}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-medium text-slate-200 truncate text-sm">
                              {conversation.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500">
                                {conversation.messageCount || 0} messages
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            onClick={(e: React.MouseEvent) => deleteConversation(conversation.id, e)}
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                            title="Delete Conversation"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No conversations yet</p>
                    <p className="text-slate-600 text-xs mt-1">Start a new chat to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/30 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Connected
              </span>
            </div>
          </div>
        </div>

        <div className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isComputerSidebarOpen ? "mr-[28rem]" : "mr-0"
        )}>
          <div className="flex-1 flex flex-col h-full">
            <div className="border-b border-slate-700/50 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Financial Analysis</h2>
                <div className="flex items-center space-x-4">
                  {/* Removed old WorkspaceBadge - now using Computer sidebar Files tab */}
                  
                  {/* Computer Button - Toggle Computer sidebar */}
                  <Button
                    onClick={() => {
                      console.log('[AnalystPage] Computer button clicked, toggling sidebar');
                      setIsComputerSidebarOpen(!isComputerSidebarOpen);
                    }}
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 px-3 border-blue-600/50 text-blue-300 hover:text-white transition-colors",
                      isComputerSidebarOpen && "bg-blue-500/20 border-blue-500/40 text-blue-200"
                    )}
                    title={`${isComputerSidebarOpen ? 'Hide' : 'Show'} Computer`}
                  >
                    <Computer className="h-4 w-4 mr-2" />
                    <span className="text-xs">
                      Nexus Computer {completedTools.length > 0 && `(${completedTools.length})`}
                    </span>
                  </Button>
                
                {/* Removed old Artifacts button - now using Computer sidebar Files tab */}
                
                <StatusPill status={mapStreamStatusToStatusPill(streamStatus)} />
              </div>
            </div>
          </div>

          <div 
            className="flex-1 min-h-0 overflow-y-auto px-6 py-4 h-0"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            <div className="space-y-4">
              {messages.map((msg) => renderMessage(msg))}
              
              {/* Show connection/processing indicator */}
              {(streamStatus === 'connecting' || (streamStatus === 'streaming' && !messages.find(m => m.id === currentAssistantMessageId))) && (
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        {streamStatus === 'connecting' ? 'Connecting...' : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-700/50 px-6 py-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  placeholder="Ask me anything about your finances..."
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-400 min-h-[44px]"
                  disabled={streamStatus === 'streaming' || streamStatus === 'processing_tool'}
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || streamStatus === 'streaming' || streamStatus === 'processing_tool'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-[44px] px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
          </div>
        </div>
      </div>
      
      {/* Nexus Computer Sidebar for tool calls */}
      <SimplifiedToolCallSidePanel
        isOpen={isComputerSidebarOpen}
        onClose={() => {
          console.log('[AnalystPage] Closing ComputerSidebar');
          setIsComputerSidebarOpen(false);
        }}
        toolCalls={completedTools.map(tool => {
          // Create proper tool call format for Nexus components
          // The working Nexus components expect:
          // - assistantContent: the actual tool invocation (XML or parameters)
          // - toolContent: the actual tool result
          
          let assistantContent = '';
          let toolContent = tool.result;
          
          // Create XML-style content for assistant call based on tool type
          if (tool.toolName?.toLowerCase().includes('search') || tool.toolName?.toLowerCase().includes('web-search')) {
            const query = tool.args?.query || 'information';
            assistantContent = `<web-search query="${query}"></web-search>`;
          } else if (tool.toolName?.toLowerCase().includes('create-file') || tool.toolName?.toLowerCase().includes('file')) {
            console.log('[AnalystPage] Processing file tool args:', {
              toolName: tool.toolName,
              args: tool.args,
              availableProps: Object.keys(tool.args || {}),
              path: tool.args?.path,
              filePath: tool.args?.filePath,
              file_path: tool.args?.file_path
            });
            
            const filePath = tool.args?.path || tool.args?.filePath || tool.args?.file_path || `${tool.toolName || 'file'}.txt`;
            const content = tool.args?.content || '';
            assistantContent = `<create-file file_path="${filePath}">${content}</create-file>`;
          } else if (tool.toolName?.toLowerCase().includes('scrape') || tool.toolName?.toLowerCase().includes('browse')) {
            const url = tool.args?.url || tool.args?.website || 'website';
            assistantContent = `<web-scrape url="${url}"></web-scrape>`;
          } else {
            // Fallback to JSON format
            assistantContent = JSON.stringify(tool.args || {}, null, 2);
          }
          
          return {
            assistantCall: {
              content: assistantContent,
              name: tool.name || tool.toolName || 'Tool Call',
              timestamp: tool.timestamp || new Date().toISOString()
            },
            toolResult: {
              content: toolContent,
              isSuccess: tool.isSuccess !== undefined ? tool.isSuccess : (tool.status === 'success'),
              timestamp: tool.result?.timestamp || tool.timestamp || new Date().toISOString()
            }
          };
        })}
        currentIndex={currentToolIndex}
        onNavigate={(index) => {
          console.log('[AnalystPage] User manually navigating to tool call index:', index);
          // Mark that user has manually navigated
          hasUserNavigatedRef.current = true;
          // Update current index when navigating
          setCurrentToolIndex(index);
        }}
        agentStatus={streamStatus}
        isLoading={streamStatus === 'processing_tool'}
        onFileClick={(filePath) => {
          console.log('[AnalystPage] File clicked:', filePath);
          
          // Handle file clicks as needed - you can implement your own logic here
          toast({
            title: 'File Clicked',
            description: `File: ${filePath.split('/').pop()}`,
            variant: 'default'
          });
        }}
      />
      
      {showWorkspaceBrowser && renderWorkspaceBrowser()}
    </div>
  );
};

export default AnalystPage; 