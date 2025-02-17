import { useState, useEffect } from "react";
import { Sparkles, BookmarkPlus, X, ArrowRight, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface FinancialTip {
  id: string;
  title: string;
  description: string;
  category: 'budgeting' | 'saving' | 'investing' | 'debt' | 'general';
  relevanceScore: number;
  action?: string;
}

export default function AIFinancialTip() {
  const { data: transactionData } = useTransactions();
  const [savedTips, setSavedTips] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedFinancialTips');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Fetch personalized tip using transaction data and AI
  const { data: tip, isLoading, error } = useQuery<FinancialTip>({
    queryKey: ['financial-tip', transactionData?.totalBalance, currentTipIndex],
    queryFn: async () => {
      if (!transactionData) {
        throw new Error('No transaction data available');
      }

      const response = await fetch('/api/ai/financial-tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            totalBalance: transactionData?.totalBalance || 0,
            monthlySpending: transactionData?.monthlySpending || 0,
            categoryTotals: transactionData?.categoryTotals || {},
            previousTips: savedTips,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tip');
      }

      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    enabled: !!transactionData, // Only run query when transaction data is available
  });

  const handleSaveTip = () => {
    if (tip?.id) {
      const newSavedTips = [...savedTips, tip.id];
      setSavedTips(newSavedTips);
      localStorage.setItem('savedFinancialTips', JSON.stringify(newSavedTips));
    }
  };

  const handleNextTip = () => {
    setCurrentTipIndex(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 p-6">
        <div className="h-24 flex items-center justify-center">
          <Brain className="h-6 w-6 text-primary/60 animate-bounce" />
        </div>
      </Card>
    );
  }

  if (error || !tip) {
    return (
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Brain className="h-6 w-6 text-primary/60" />
          <p className="text-sm text-muted-foreground text-center">
            Unable to load financial tip at this time.
            {error instanceof Error ? ` (${error.message})` : ''}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentTipIndex(prev => prev + 1)}
          >
            Try Another Tip
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tip.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          "bg-gray-900/50 backdrop-blur-sm border-gray-800",
          "hover:bg-gray-900/60 transition-all duration-300"
        )}>
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-medium">Financial Tip of the Day</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveTip}
                  disabled={savedTips.includes(tip.id)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextTip}
                  className="text-muted-foreground hover:text-primary"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tip Content */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-primary/90">
                {tip.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tip.description}
              </p>
              {tip.action && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20"
                  >
                    {tip.action}
                  </Button>
                </div>
              )}
            </div>

            {/* Category Tag */}
            {tip.category && (
              <div className="pt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                  {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
                </span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
} 