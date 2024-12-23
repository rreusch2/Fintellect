import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Bot, Target, Wallet, Send, Loader2, Lightbulb, TrendingUp, LineChart, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import FinanceOverview from "@/components/Dashboard/FinanceOverview";
import SpendingChart from "@/components/Dashboard/SpendingChart";
import AIFinancialInsights from "@/components/Dashboard/AIFinancialInsights";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { FeatureTour } from "@/components/onboarding/FeatureTour";
import { Navigation } from "@/components/layout/Navigation";
import { COLORS } from '@/lib/categories';
import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "@/components/ui/card";
import { isDemoMode, setDemoMode } from "@/lib/demo";

// Expanded quick prompts with more relevant options
const quickPrompts = [
  "Analyze my spending",
  "Suggest savings tips",
  "Investment advice",
  "Emergency fund advice"
];

export default function DashboardPage() {
  const { user } = useUser();
  const { data: summary } = useTransactions();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: string }>>([]);
  const [isLoadingSavings, setIsLoadingSavings] = useState(false);
  const [savingsTips, setSavingsTips] = useState<any>(null);

  // Check if we're in demo mode (check both localStorage and Plaid accounts)
  const isDemo = isDemoMode() || summary?.accounts?.some(account => account.plaidInstitutionId === "demo") || false;

  // If we detect a demo account but demo mode isn't set in localStorage, set it
  useEffect(() => {
    if (summary?.accounts?.some(account => account.plaidInstitutionId === "demo")) {
      setDemoMode(true);
    }
  }, [summary?.accounts]);

  // Calculate spending by category for the pie chart
  const spendingByCategory = summary?.categoryTotals 
    ? Object.entries(summary.categoryTotals)
      .filter(([category, amount]) => (
        amount > 0 && 
        !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER', 'UNCATEGORIZED'].includes(category) &&
        !category.includes('TRANSFER')
      ))
      .map(([category, amount]) => ({
        category,
        amount: Math.abs(amount),
        color: COLORS[category] || '#888888'
      }))
      .sort((a, b) => b.amount - a.amount)
    : [];

  // Add the chat mutation
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      setInput("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI response. Please try again.",
      });
    },
  });

  const handleSend = (message: string) => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: message }]);
    sendMessage.mutate(message);
  };

  const handleGetSavingsTips = async () => {
    setIsLoadingSavings(true);
    try {
      const response = await fetch("/api/ai/savings-tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transactions: summary?.transactions || [],
          categories: summary?.categoryTotals || {}
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get savings tips");
      }
      
      const data = await response.json();
      setSavingsTips(data);
      setMessages(prev => [
        ...prev,
        { role: "user", content: "Suggest savings tips" },
        { 
          role: "assistant", 
          content: `Here are some personalized savings recommendations based on your spending:\n\n${
            data.recommendations.map((tip: any) => 
              `💡 ${tip.title}\n` +
              `📝 ${tip.description}\n` +
              `💰 Potential savings: $${tip.potentialSavings}/month\n` +
              `⚡ Difficulty: ${tip.difficulty}\n` +
              `⏱️ Timeframe: ${tip.timeframe}\n`
            ).join('\n')
          }`
        }
      ]);
    } catch (error) {
      console.error("Error getting savings tips:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get savings tips. Please try again.",
      });
    } finally {
      setIsLoadingSavings(false);
    }
  };

  const handleConnectBank = () => {
    setDemoMode(false);
    window.location.href = "/onboarding";
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <Navigation />

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Demo Mode Banner */}
        {isDemo && (
          <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
            <div className="relative flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Lightbulb className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Welcome to Demo Mode! 👋</h3>
                <p className="text-muted-foreground mb-4">
                  You're currently exploring with sample data. Ready to see your actual finances? Connect your bank account to unlock personalized insights and real-time tracking.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="default"
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={handleConnectBank}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Connect Your Bank Account
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-blue-500/20 hover:bg-blue-500/10"
                    onClick={() => window.location.href = "/ai/assistant"}
                  >
                    Learn More About Features
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Floating Indicator */}
        {isDemo && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-[1px] rounded-lg shadow-lg">
              <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Demo Mode Active</span>
                  <span className="text-xs text-muted-foreground">Using sample data</span>
                </div>
                <Button 
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleConnectBank}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Connect Bank
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Financial Overview Section */}
        <div className="grid gap-8">
          <FinanceOverview />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 mt-8 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            <SpendingChart spendingByCategory={spendingByCategory} />
            <AIFinancialInsights />
          </div>

          {/* Right Column - AI Assistant */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 flex flex-col h-full">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Assistant</h2>
                  <p className="text-sm text-muted-foreground">
                    Get real-time insights and answers about your finances
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 p-6">
              {/* Quick Actions */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 transition-colors justify-start text-left"
                    onClick={() => handleSend("Analyze my spending")}
                  >
                    Analyze my spending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 transition-colors justify-start text-left"
                    onClick={handleGetSavingsTips}
                    disabled={isLoadingSavings}
                  >
                    {isLoadingSavings ? "Analyzing..." : "Suggest savings tips"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 transition-colors justify-start text-left"
                    onClick={() => handleSend("Investment advice")}
                  >
                    Investment advice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 transition-colors justify-start text-left"
                    onClick={() => handleSend("Emergency fund advice")}
                  >
                    Emergency fund advice
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background/5 rounded-lg border border-gray-800/50 mb-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
                    <Bot className="h-8 w-8 mb-2 text-blue-500/70" />
                    <p className="text-sm font-medium">No conversations yet</p>
                    <p className="text-sm">
                      Try one of the quick actions above or ask a question below
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      } animate-in slide-in-from-bottom-2`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mr-2">
                          <Bot className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800/80"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {sendMessage.isPending && (
                  <div className="flex items-center gap-2 text-muted-foreground p-2 bg-gray-800/50 rounded-lg animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="mt-auto border-t border-gray-800 pt-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your finances..."
                    className="flex-1 bg-gray-800/50 border-gray-700"
                  />
                  <Button 
                    type="submit" 
                    disabled={sendMessage.isPending || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BetaFeedback />
      <FeatureTour />
    </div>
  );
}