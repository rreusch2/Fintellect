import { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Bot, Target, Wallet, Send, Loader2, Lightbulb, TrendingUp, LineChart, ArrowUpRight, PieChart, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import FinanceOverview from "@/components/Dashboard/FinanceOverview";
import { SpendingDistributionChart } from "@/components/Transactions/SpendingDistributionChart";
import AIFinancialInsights from "@/components/Dashboard/AIFinancialInsights";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { FeatureTour } from "@/components/onboarding/FeatureTour";
import { Navigation } from "@/components/layout/Navigation";
import { COLORS, getCategoryColor, formatCategoryName } from '@/lib/categories';
import { useTransactions } from "@/hooks/use-transactions";
import { isDemoMode, setDemoMode } from "@/lib/demo";
import PlaidLink from "@/components/Plaid/PlaidLink";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";
import AIAssistant from "@/components/Dashboard/AIAssistant";

// Expanded quick prompts with more relevant options
const quickPrompts = [
  "Analyze my spending",
  "Suggest savings tips",
  "Investment advice",
  "Emergency fund advice"
];

// Add interface for account type
interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  availableBalance?: number;
  plaidInstitutionId?: string; // Add this field
}

// Add the quickActions constant
const quickActions = [
  { label: "💰 Spending Analysis", message: "Can you analyze my recent spending patterns?" },
  { label: "🎯 Financial Goals", message: "Help me set and track financial goals" },
  { label: "💡 Saving Tips", message: "What are some personalized saving tips for me?" },
  { label: "📊 Investment Advice", message: "Give me investment recommendations based on my profile" },
  { label: "🤖 AI Advisor", message: "I'd like some comprehensive financial advice from the AI Financial Advisor" },
];

export default function DashboardPage() {
  const { user } = useUser();
  const { data: summary } = useTransactions();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: string }>>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI financial assistant. I analyze your spending patterns, transactions, and financial goals to provide personalized advice. How can I help you today?",
    },
  ]);
  const [isLoadingSavings, setIsLoadingSavings] = useState(false);
  const [savingsTips, setSavingsTips] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update the demo detection logic
  const isDemo = isDemoMode();

  // Remove the demo mode activation effect
  useEffect(() => {
    if (localStorage.getItem('demoMode') === 'true') {
      console.log('Demo mode active from localStorage');
    }
  }, []);

  // Calculate spending data similar to TransactionsPage
  const spendingData = useMemo(() => {
    if (!summary?.categoryTotals) {
      return {};
    }

    return Object.entries(summary.categoryTotals)
      .filter(([category, amount]) => (
        amount > 0 && 
        !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER', 'UNCATEGORIZED'].includes(category) &&
        !category.includes('TRANSFER')
      ))
      .reduce((acc, [category, amount]) => {
        acc[category] = Math.abs(amount);
        return acc;
      }, {} as Record<string, number>);
  }, [summary]);

  // Add back the chat mutation
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, userId: user?.id }),
      });
      
      if (!response.ok) throw new Error("Failed to send message");
      return response.json() as Promise<AIResponse>;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      const suggestions = data.suggestions || [];
      if (suggestions.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Here are some suggestions based on your question:\n" +
              suggestions.map(s => `• ${s.title}: ${s.description}`).join("\n"),
          },
        ]);
      }
    },
  });

  // Update the handleSend function to handle all prompts consistently
  const handleSend = async (message: string) => {
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: message }]);

    if (message === "Suggest savings tips") {
      setIsLoadingSavings(true);
      try {
        const response = await fetch('/api/ai/savings-tips', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to fetch savings tips');
        }

        const data = await response.json();
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: Array.isArray(data.tips) 
            ? data.tips.join('\n\n')
            : 'I apologize, but I was unable to generate savings tips at this time.'
        }]);

      } catch (error) {
        console.error('Savings tips error:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error while generating savings tips. Please try again.'
        }]);
      } finally {
        setIsLoadingSavings(false);
      }
    } else {
      sendMessage.mutate(message);
    }
  };

  // Add these functions
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    sendMessage.mutate(input);
    setInput("");
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setMessages(prev => [...prev, { role: "user", content: action.message }]);
    sendMessage.mutate(action.message);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  usePageTitle('Dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      <Navigation />

      {/* Add Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <main className="container mx-auto px-2 sm:px-4 py-8 relative z-10">
        {/* Demo Mode Banner */}
        {isDemo && (
          <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
            <div className="relative flex flex-col sm:flex-row items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Lightbulb className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Welcome to Demo Mode!</h3>
                <p className="text-muted-foreground mb-4">
                  You're currently exploring with sample data. Ready to see your actual finances? Connect your bank account to unlock personalized insights and real-time tracking.
                </p>
                <PlaidLink
                  onSuccess={async (public_token) => {
                    try {
                      // First disable demo mode
                      setDemoMode(false);
                      
                      // Exchange the token
                      const response = await fetch('/api/plaid/exchange_token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ public_token }),
                        credentials: 'include'
                      });

                      if (!response.ok) {
                        throw new Error('Failed to exchange token');
                      }

                      // Reload to show real transactions
                      window.location.reload();
                    } catch (error) {
                      console.error('Plaid error:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to connect bank account. Please try again."
                      });
                    }
                  }}
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600 inline-flex"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Connect Your Bank Account
                </PlaidLink>
              </div>
            </div>
          </div>
        )}

        {/* Update FinanceOverview styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid gap-6 sm:gap-8">
            <FinanceOverview />
          </div>
        </motion.div>

        {/* Main Content Grid - Update for better mobile layout */}
        <div className="grid gap-4 sm:gap-6 mt-6 sm:mt-8 md:grid-cols-2">
          {/* Left Column */}
          <motion.div className="space-y-4 sm:space-y-6">
            {/* Spending Distribution Card */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors overflow-hidden">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Spending Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {/* Chart container */}
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <SpendingDistributionChart 
                    data={spendingData} 
                    showLegend={false}
                  />
                </div>
                {/* Scrollable legend */}
                <div className="mt-4 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent pr-2">
                  {Object.entries(spendingData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = (amount / Object.values(spendingData).reduce((sum, val) => sum + val, 0)) * 100;
                      return (
                        <div 
                          key={category} 
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ 
                                backgroundColor: getCategoryColor(category),
                                boxShadow: '0 0 10px rgba(var(--primary), 0.1)'
                              }}
                            />
                            <span className="text-sm font-medium text-foreground/90">
                              {formatCategoryName(category)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold tabular-nums text-foreground/90">
                              ${(amount / 100).toFixed(2)}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground min-w-[60px] text-right">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* AI Financial Insights */}
            <div className="w-full">
              <AIFinancialInsights />
            </div>
          </motion.div>

          {/* Right Column - AI Assistant */}
          <motion.div className="w-full">
            <AIAssistant />
          </motion.div>
        </div>
      </main>

      {/* Update Demo Mode Floating Indicator styling */}
      {isDemo && (
        <div className="fixed bottom-20 sm:bottom-6 left-6 z-40">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-[1px] rounded-lg shadow-lg">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Demo Mode Active</span>
                <span className="text-xs text-muted-foreground">Using sample data</span>
              </div>
              <PlaidLink 
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onSuccess={async (public_token) => {
                  try {
                    setDemoMode(false);
                    
                    const response = await fetch('/api/plaid/exchange_token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ public_token }),
                      credentials: 'include'
                    });

                    if (!response.ok) {
                      throw new Error('Failed to exchange token');
                    }

                    window.location.reload();
                  } catch (error) {
                    console.error('Plaid error:', error);
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to connect bank account. Please try again."
                    });
                  }
                }}
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Connect Bank
              </PlaidLink>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <BetaFeedback />
      </div>

      <Footer />
      <FeatureTour />
    </div>
  );
}