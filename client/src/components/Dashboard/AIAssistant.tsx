import { useRef, useEffect } from "react";
import { Bot, Loader2, Send, DollarSign, TrendingUp, Target, Calendar, PieChart, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const quickActions = [
  { 
    label: "Analyze Spending",
    message: "Can you analyze my recent spending patterns and suggest areas for improvement?",
    icon: PieChart,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  { 
    label: "Budget Help",
    message: "Help me create a budget based on my spending patterns",
    icon: Target,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  { 
    label: "Savings Tips",
    message: "What are some personalized saving tips based on my transaction history?",
    icon: DollarSign,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  { 
    label: "Recurring Charges",
    message: "Can you identify my recurring charges and suggest potential optimizations?",
    icon: Calendar,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  }
];

const formatMessageContent = (content: string) => {
  // Split into sections based on markdown headers
  const sections = content.split(/\*\*(.*?)\*\*/g).filter(Boolean);
  
  return sections.map((section, i) => {
    // Check if this is a header (odd indices in the split)
    const isHeader = i % 2 === 0;
    
    if (isHeader) {
      // Format section headers with icons
      const getHeaderIcon = (title: string) => {
        if (title.includes("Monthly")) return <Calendar className="h-6 w-6 text-blue-400" />;
        if (title.includes("Recent")) return <TrendingUp className="h-6 w-6 text-green-400" />;
        if (title.includes("Insights")) return <Sparkles className="h-6 w-6 text-purple-400" />;
        return null;
      };

      return (
        <div key={i} className="font-semibold text-lg mt-6 mb-4">
          <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 rounded-lg p-3">
            {getHeaderIcon(section)}
            <span className="text-xl">{section}</span>
          </div>
        </div>
      );
    }

    // Process the content section
    return (
      <div key={i} className="space-y-4">
        {section.split('\n').map((line, j) => {
          // Skip empty lines
          if (!line.trim()) return null;

          // Format currency amounts
          const formattedLine = line.replace(/\$[\d,]+\.\d{2}/g, match => 
            `<span class="font-semibold text-green-400">${match}</span>`
          );

          // Format percentages
          const formattedWithPercentages = formattedLine.replace(/(\d+\.?\d*)%/g, match =>
            `<span class="font-semibold text-blue-400">${match}</span>`
          );

          // Format category names
          const categories = ['Food & Drink', 'General Merchandise', 'Entertainment', 'Transportation', 'Travel', 'General Services'];
          const formattedWithCategories = categories.reduce((text, category) => {
            return text.replace(new RegExp(category, 'g'), 
              `<span class="text-purple-400">${category}</span>`
            );
          }, formattedWithPercentages);

          // Format spending overview cards
          if (line.includes('Total Monthly Spending') || line.includes('Total Recent Spending')) {
            return (
              <div key={j} className="flex items-center gap-4 bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <DollarSign className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <div 
                    className="text-xl font-semibold"
                    dangerouslySetInnerHTML={{ __html: formattedWithCategories }}
                  />
                  <div className="text-sm text-gray-400">
                    {line.includes('Monthly') ? 'Current Month' : 'Last 7 Days'}
                  </div>
                </div>
              </div>
            );
          }

          // Format category breakdowns
          if (line.trim().startsWith('Food & Drink:') || line.trim().startsWith('General Merchandise:') || 
              line.trim().startsWith('Entertainment:') || line.trim().startsWith('Transportation:')) {
            return (
              <div key={j} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400/50"></div>
                  <div 
                    className="font-medium"
                    dangerouslySetInnerHTML={{ __html: formattedWithCategories }}
                  />
                </div>
              </div>
            );
          }

          // Format insights and recommendations
          if (line.includes('Reduce') || line.includes('Consider') || line.includes('Track')) {
            const getInsightIcon = (text: string) => {
              if (text.includes('Reduce')) return <ArrowDownRight className="h-6 w-6" />;
              if (text.includes('Track')) return <Target className="h-6 w-6" />;
              return <Sparkles className="h-6 w-6" />;
            };

            const getInsightColor = (text: string) => {
              if (text.includes('Reduce')) return 'text-green-400 bg-green-500/10 border-green-500/20';
              if (text.includes('Track')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
              return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            };

            return (
              <div key={j} className={`flex items-start gap-4 rounded-lg p-4 border ${getInsightColor(line)}`}>
                <div className="mt-1">
                  {getInsightIcon(line)}
                </div>
                <div>
                  <div 
                    className="font-medium mb-1"
                    dangerouslySetInnerHTML={{ __html: formattedWithCategories }}
                  />
                  {line.includes('saving') && (
                    <div className="text-sm bg-green-500/10 text-green-400 px-2 py-1 rounded-full inline-block mt-2">
                      Potential Monthly Savings: {line.match(/\$[\d,]+\.\d{2}/)?.[0] || '$0.00'}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Format budget recommendations with special styling
          if (line.includes('Needs:') || line.includes('Wants:') || line.includes('Savings')) {
            const [category, amount] = line.split(':').map(s => s.trim());
            return (
              <div key={j} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    category.includes('Needs') ? 'bg-blue-500/20' :
                    category.includes('Wants') ? 'bg-purple-500/20' :
                    'bg-green-500/20'
                  }`}>
                    {category.includes('Needs') ? <Target className="h-5 w-5 text-blue-400" /> :
                     category.includes('Wants') ? <Sparkles className="h-5 w-5 text-purple-400" /> :
                     <DollarSign className="h-5 w-5 text-green-400" />}
                  </div>
                  <div>
                    <div className="font-medium">{category}</div>
                    <div className="text-sm text-gray-400">
                      {category.includes('Needs') ? 'Essential expenses' :
                       category.includes('Wants') ? 'Non-essential spending' :
                       'Future security'}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-semibold">
                  {amount}
                </div>
              </div>
            );
          }

          // Format numbered steps with icons
          if (line.match(/^\d+\./)) {
            return (
              <div key={j} className="flex items-start gap-3 p-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-medium text-blue-400">
                  {line.match(/^\d+/)?.[0]}
                </div>
                <div className="flex-1">
                  <div 
                    className="text-gray-300"
                    dangerouslySetInnerHTML={{ __html: formattedWithCategories }}
                  />
                </div>
              </div>
            );
          }

          // Format bullet points with custom styling
          if (line.trim().startsWith('*')) {
            return (
              <div key={j} className="flex items-center gap-3 pl-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                <div 
                  className="flex-1 text-gray-300"
                  dangerouslySetInnerHTML={{ __html: formattedWithCategories }}
                />
              </div>
            );
          }

          return (
            <div 
              key={j} 
              className="leading-relaxed text-gray-300"
              dangerouslySetInnerHTML={{ __html: formattedWithCategories }}
            />
          );
        })}
      </div>
    );
  });
};

export default function AIAssistant() {
  const { messages, sendMessage, isLoading, clearMessages } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    
    try {
      sendMessage(message);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e.currentTarget.value);
    }
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors h-full">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
            <Bot className="h-5 w-5 text-blue-400" />
          </div>
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-[600px] md:h-full">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                <div className="p-4 rounded-full bg-primary/10 mb-2 hidden md:flex">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="p-3 rounded-full bg-primary/10 mb-2 md:hidden">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">How can I help you today?</h3>
                  <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                    Ask me anything about your finances, spending patterns, or get personalized recommendations.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md mt-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="text-sm md:text-base justify-start gap-2 h-auto py-2 px-3"
                      onClick={() => handleSendMessage(action.message)}
                    >
                      <action.icon className="h-4 w-4 text-primary" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className="flex items-start gap-2 max-w-[85%] group">
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <Bot className="h-5 w-5 text-blue-500" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 shadow-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800/80 backdrop-blur-sm border border-gray-700 group-hover:bg-gray-800/90 transition-colors"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-invert max-w-none">
                          {formatMessageContent(message.content)}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap font-sans">
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="flex items-center gap-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3 shadow-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm font-medium">Analyzing your finances...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask about your finances..."
                className="flex-1 bg-gray-800/50 border-gray-700 focus:border-blue-500/50 transition-colors shadow-sm"
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage(inputRef.current?.value || "")}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 