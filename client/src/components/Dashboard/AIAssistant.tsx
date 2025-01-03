import { useRef, useEffect } from "react";
import { Bot, Loader2, Send, DollarSign, TrendingUp, Target, Calendar, PieChart, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <Card className={cn(
      "bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 flex flex-col hover:bg-gray-900/60 transition-colors",
      // Adjust height based on screen size
      "h-[85rem] md:h-[85rem]"
    )}>
      <div className="p-4 md:p-6 border-b border-gray-800 bg-gray-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Bot className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Get personalized financial guidance through natural conversation
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 min-h-0">
        {/* Quick Actions - Make scrollable on mobile */}
        <div className="p-4 md:p-6 pb-2 bg-gradient-to-b from-gray-900/30 to-transparent">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(action.message)}
                disabled={isLoading}
                className={`${action.bgColor} border-${action.color}/20 hover:bg-${action.color}/20 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap`}
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages Container - Adjust padding for mobile */}
        <div className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6 min-h-0">
          <div className="h-full overflow-y-auto rounded-lg bg-background/5 border border-gray-800/50 shadow-xl">
            <div className="p-3 md:p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-blue-500/20 blur-lg animate-pulse"></div>
                    <div className="relative p-6 rounded-full bg-blue-500/10 shadow-lg ring-1 ring-blue-500/20">
                      <Bot className="h-16 w-16 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-w-md px-4">
                    <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Start a Conversation
                    </h3>
                    <p className="text-base text-gray-400 leading-relaxed">
                      Get personalized financial insights and advice through natural conversation. Choose a quick action below or type your question.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-2xl p-4">
                    {quickActions.map((action) => (
                      <div
                        key={action.label}
                        onClick={() => handleSendMessage(action.message)}
                        className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 cursor-pointer hover:bg-gray-800/80 hover:border-gray-600/50 transition-all hover:scale-[1.02] group"
                      >
                        <div className={`p-3 rounded-xl ${action.bgColor} ring-1 ring-${action.color}/20 group-hover:ring-${action.color}/40 transition-all`}>
                          <action.icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <div className="font-medium text-gray-200 group-hover:text-white transition-colors">
                            {action.label}
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                            {action.label === "Analyze Spending" && "Get insights on your spending patterns"}
                            {action.label === "Budget Help" && "Create a personalized budget plan"}
                            {action.label === "Savings Tips" && "Discover ways to save money"}
                            {action.label === "Recurring Charges" && "Review your subscriptions"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-full max-w-md px-4">
                    <div className="relative mt-4 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                      <div className="absolute -top-3 left-4 px-2 bg-gray-900 text-sm text-gray-500">
                        Example Questions
                      </div>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>"How much did I spend on food last month?"</p>
                        <p>"What are my top spending categories?"</p>
                        <p>"Help me reduce my monthly expenses"</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-gray-500">
                    <Bot className="h-4 w-4" />
                    <span>Powered by AI Financial Assistant</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
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
                  ))}
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
              )}
            </div>
          </div>
        </div>

        {/* Input Area - Adjust padding and layout for mobile */}
        <div className="p-3 md:p-4 border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask about your finances..."
              className="flex-1 bg-gray-800/50 border-gray-700 focus:border-blue-500/50 transition-colors shadow-sm text-sm md:text-base"
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage(inputRef.current?.value || "")}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 