import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Computer, Loader2, FileText, TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { ScrollArea } from '../../components/ui/scroll-area.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Progress } from '../../components/ui/progress.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ToolCall {
  id: string;
  name: string;
  parameters: any;
  timestamp: Date;
}

interface ToolResult {
  id: string;
  content: string;
  isSuccess: boolean;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

const FINANCIAL_PROMPTS = [
  {
    title: "Market Research Dashboard",
    description: "Analyze market opportunities and competitive landscape",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-emerald-600",
    prompt: "Analyze the market for my next company in the healthcare industry, located in the UK. Give me the major players, their market size, strengths, and weaknesses, and add their website URLs. Once done, generate a PDF report."
  },
  {
    title: "Budget Optimization",
    description: "Optimize spending and improve financial efficiency",
    icon: DollarSign,
    gradient: "from-blue-500 to-blue-600",
    prompt: "Analyze my spending patterns and budget performance. Identify areas where I'm overspending and provide specific recommendations to optimize my monthly budget and increase my savings rate."
  },
  {
    title: "Investment Strategy",
    description: "Develop personalized investment recommendations",
    icon: Target,
    gradient: "from-purple-500 to-purple-600",
    prompt: "Based on my financial profile and goals, create a comprehensive investment strategy. Include asset allocation recommendations, risk assessment, and specific investment vehicles that align with my timeline and objectives."
  },
  {
    title: "Financial Goal Planning",
    description: "Create actionable plans to achieve financial goals",
    icon: FileText,
    gradient: "from-rose-500 to-rose-600",
    prompt: "Review my current financial goals and create a detailed action plan. Analyze my progress, identify potential obstacles, and provide specific steps to accelerate goal achievement while maintaining financial stability."
  }
];

export default function NexusPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'error' | 'connected'>('idle');
  const [showToolPanel, setShowToolPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/nexus/conversations', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/nexus/conversations/${conversationId}/messages`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const createConversation = async (initialMessage?: string) => {
    try {
      const response = await fetch('/api/nexus/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: initialMessage ? initialMessage.substring(0, 50) + '...' : 'New Financial Analysis',
          initialMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newConversation = data.conversation;
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversation(newConversation.id);
        setMessages([]);
        setStreamingContent('');
        setToolCalls([]);
        setToolResults([]);
        setShowToolPanel(true);

        if (initialMessage) {
          // Add user message immediately
          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: initialMessage,
            timestamp: new Date()
          };
          setMessages([userMessage]);
          setAgentStatus('running');
          
          // Start streaming
          startStreaming(newConversation.id);
        }

        return newConversation.id;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const startStreaming = (conversationId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/nexus/conversations/${conversationId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('Connected to stream');
          setAgentStatus('connected');
          break;
        case 'streamChunk':
          setStreamingContent(prev => prev + data.content);
          break;
        case 'toolResult':
          setToolResults(prev => [...prev, data.result]);
          break;
        case 'message':
          if (data.message.role === 'assistant') {
            setMessages(prev => [...prev, data.message]);
            setStreamingContent('');
          }
          break;
        case 'statusChange':
          setAgentStatus(data.status);
          if (data.status === 'idle') {
            setIsLoading(false);
          }
          break;
        case 'error':
          console.error('Stream error:', data.error);
          setAgentStatus('error');
          setIsLoading(false);
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setAgentStatus('error');
      setIsLoading(false);
    };
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    let conversationId = activeConversation;
    
    if (!conversationId) {
      conversationId = await createConversation(content);
      if (!conversationId) return;
    } else {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setAgentStatus('running');
      setIsLoading(true);

      try {
        await fetch(`/api/nexus/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ content })
        });

        startStreaming(conversationId);
      } catch (error) {
        console.error('Error sending message:', error);
        setIsLoading(false);
        setAgentStatus('error');
      }
    }

    setCurrentInput('');
    setShowToolPanel(true);
  };

  const handlePromptClick = (prompt: string) => {
    createConversation(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(currentInput);
    }
  };

  const renderToolCall = (toolCall: ToolCall) => {
    const getToolIcon = (name: string) => {
      switch (name) {
        case 'market-research': return TrendingUp;
        case 'financial-analysis': return DollarSign;
        case 'create-file': return FileText;
        default: return Computer;
      }
    };

    const Icon = getToolIcon(toolCall.name);
    
    return (
      <div key={toolCall.id} className="inline-flex items-center gap-1.5 py-1 px-2 my-1 text-xs text-muted-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/50">
        <div className='border-2 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center p-0.5 rounded-sm border-neutral-400/20 dark:border-neutral-600'>
          <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </div>
        <span className="font-mono text-xs text-foreground">{toolCall.name}</span>
      </div>
    );
  };

  const parseMessageContent = (content: string) => {
    // Parse XML tool calls and render them as interactive elements
    const xmlRegex = /<([a-zA-Z\-_]+)(?:\s+[^>]*)?>(?:[\s\S]*?)<\/\1>|<([a-zA-Z\-_]+)(?:\s+[^>]*)?\/>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = xmlRegex.exec(content)) !== null) {
      // Add text before the tag
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {textBefore}
          </span>
        );
      }

      // Add tool call representation
      const toolName = match[1] || match[2];
      const toolCall: ToolCall = {
        id: `${match.index}`,
        name: toolName,
        parameters: {},
        timestamp: new Date()
      };
      
      parts.push(renderToolCall(toolCall));
      lastIndex = xmlRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  if (!activeConversation && conversations.length === 0) {
    // Welcome screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Hey
              </h1>
              <p className="text-xl text-slate-300">
                What would you like Nexus to do today?
              </p>
            </div>

            {/* Prompt Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {FINANCIAL_PROMPTS.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <Card 
                    key={index}
                    className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm"
                    onClick={() => handlePromptClick(prompt.prompt)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${prompt.gradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                            {prompt.title}
                          </h3>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {prompt.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Input */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Nexus anything about your finances..."
                  className="w-full h-14 pl-6 pr-14 text-lg bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
                <Button
                  onClick={() => sendMessage(currentInput)}
                  disabled={!currentInput.trim() || isLoading}
                  className="absolute right-2 top-2 h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dual-pane interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800/50 border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <Button
            onClick={() => createConversation()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className={`cursor-pointer transition-all duration-200 ${
                  activeConversation === conv.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50'
                    : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50'
                }`}
                onClick={() => setActiveConversation(conv.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {conv.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {conv.messageCount} messages
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(conv.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className={`${showToolPanel ? 'w-1/2' : 'w-full'} flex flex-col transition-all duration-300`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Financial AI Assistant</h2>
              <div className="flex items-center gap-2">
                <StatusPill 
                  status={ 
                    isLoading && agentStatus === 'running' ? 'processing' :
                    agentStatus === 'error' ? 'error' :
                    agentStatus === 'connected' ? 'connected' :
                    agentStatus === 'idle' ? 'ready' :
                    'processing'
                  }
                />
                <Badge 
                  variant={agentStatus === 'running' ? 'default' : agentStatus === 'error' ? 'destructive' : 'secondary'}
                  className="capitalize"
                >
                  {agentStatus === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {agentStatus}
                </Badge>
                {showToolPanel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToolPanel(!showToolPanel)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Computer className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {Array.isArray(messages) && messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-slate-800/50 text-slate-100 border border-slate-700/50'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.role === 'assistant' ? parseMessageContent(message.content) : message.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Streaming content */}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-4 bg-slate-800/50 text-slate-100 border border-slate-700/50">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {parseMessageContent(streamingContent)}
                      <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
            {isLoading && agentStatus === 'running' && (
              <Progress value={null} className="w-full h-1 mb-2 bg-slate-700/50 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500" />
            )}
            <div className="relative">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your finances..."
                disabled={agentStatus === 'running'}
                className="w-full h-12 pl-4 pr-12 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500/50"
              />
              <Button
                onClick={() => sendMessage(currentInput)}
                disabled={!currentInput.trim() || agentStatus === 'running'}
                className="absolute right-2 top-2 h-8 w-8 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {agentStatus === 'running' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tool Execution Panel */}
        {showToolPanel && (
          <div className="w-1/2 border-l border-slate-700/50 bg-slate-800/30 flex flex-col">
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Computer className="h-5 w-5" />
                  Nexus Computer
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowToolPanel(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {toolResults.map((result) => (
                  <Card key={result.id} className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${result.isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium text-white">Tool Execution</span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-300 whitespace-pre-wrap">
                        {result.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {agentStatus === 'running' && (
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm text-slate-300">Processing...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
} 