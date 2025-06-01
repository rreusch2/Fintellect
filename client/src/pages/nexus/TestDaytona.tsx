import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ToolResult {
  toolName: string;
  parameters: any;
  result: any;
}

export default function TestDaytona() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [status, setStatus] = useState('ready');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Create a conversation when component mounts
  useEffect(() => {
    createConversation();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const createConversation = async () => {
    try {
      const response = await fetch('/api/nexus/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title: 'Daytona Test' }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConversationId = data.conversation.id;
        setConversationId(newConversationId);
        setupEventSource(newConversationId);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const setupEventSource = (convId: string) => {
    const eventSource = new EventSource(`/api/nexus/conversations/${convId}/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('Connected to stream');
          break;
        case 'streamChunk':
          // Handle streaming content
          break;
        case 'message':
          setMessages(prev => [...prev, {
            role: data.message.role,
            content: data.message.content,
            timestamp: new Date()
          }]);
          setIsLoading(false);
          break;
        case 'toolResult':
          setToolResults(prev => [...prev, data.result]);
          break;
        case 'statusChange':
          setStatus(data.status);
          break;
        case 'error':
          console.error('Stream error:', data.error);
          setIsLoading(false);
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setIsLoading(false);
    };

    eventSourceRef.current = eventSource;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversationId) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const messageContent = inputValue;
    setInputValue('');

    try {
      await fetch(`/api/nexus/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: messageContent }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const testDaytonaFlow = () => {
    setInputValue("Research current market conditions and investment opportunities");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧪 Daytona Integration Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chat Interface</h2>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === 'ready' ? 'bg-green-100 text-green-800' :
                status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status}
              </span>
              <button
                onClick={testDaytonaFlow}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Test Daytona Flow
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center">
                Start a conversation to test Daytona sandbox integration...
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block bg-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about market research, financial analysis, or data processing..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>

        {/* Tool Results */}
        {toolResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🔧 Tool Execution Results</h2>
            <div className="space-y-4">
              {toolResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-medium text-sm text-gray-600 mb-2">
                    {result.toolName}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Parameters:</h4>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.parameters, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Result:</h4>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Test Instructions
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>
              This page demonstrates the new Daytona integration. Try these prompts:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Research current market conditions and investment opportunities</li>
              <li>Create a financial analysis report for AAPL stock</li>
              <li>Analyze tech sector trends and generate recommendations</li>
              <li>Create a budget analysis script and run it</li>
            </ul>
            <p className="text-sm mt-4">
              You should see XML tool calls being parsed and executed with proper sandbox management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 