import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, LineChart, Wallet, Target, Bot, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AIInsights() {
  const { data: summary } = useTransactions();
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: savingsTips, isLoading: isLoadingSavings, refetch: getSavingsTips } = useQuery({
    queryKey: ['savings-tips'],
    queryFn: async () => {
      const response = await fetch("/api/ai/savings-tips");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get savings tips");
      }
      return response.json();
    },
    enabled: false,
    retry: 1,
    onError: (error) => {
      console.error("Error getting savings tips:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get savings tips. Please try again.",
      });
    }
  });

  const handleGetSavingsTips = async () => {
    setSelectedInsight("savings");
    await getSavingsTips();
  };

  if (!summary) return null;

  // Filter out transfers and calculate actual spending categories
  const spendingCategories = Object.entries(summary.categoryTotals)
    .filter(([category, amount]) => (
      amount > 0 && 
      !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER', 'UNCATEGORIZED'].includes(category) &&
      !category.includes('TRANSFER')
    ))
    .map(([category, amount]) => ({
      category,
      amount: Math.abs(amount)
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate total spending (excluding transfers and credits)
  const totalSpending = spendingCategories.reduce((sum, { amount }) => sum + amount, 0);

  // Find unusual spending patterns
  const unusualCategories = spendingCategories
    .filter(({ amount }) => amount > totalSpending * 0.3)
    .map(({ category }) => category);

  return (
    <div className="space-y-6">
      {/* AI Transaction Insights */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium mb-4">
          <Sparkles className="h-5 w-5 text-blue-400" />
          AI Financial Insights
        </h2>

        {/* Spending Analysis */}
        <div className="space-y-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <LineChart className="h-4 w-4" />
              Spending Analysis
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {spendingCategories.slice(0, 2).map(({ category, amount }) => (
                <div key={category} className="bg-[#1D2839]/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">{category}</div>
                  <div className="text-lg font-medium">${(amount / 100).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Unusual Activity */}
          {unusualCategories.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Target className="h-4 w-4" />
                Unusual Activity
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {unusualCategories.map(category => (
                  <div key={category} className="bg-[#1D2839]/50 rounded-lg p-4">
                    <div className="text-sm text-yellow-400">{category}</div>
                    <div className="text-sm text-muted-foreground">Above normal range</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium mb-4">
          <Bot className="h-5 w-5 text-blue-400" />
          AI Assistant
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Get real-time insights and answers about your finances
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button
            variant="outline"
            className="bg-[#1D2839]/50 border-[#1D2839] justify-start"
            onClick={() => setSelectedInsight("spending")}
          >
            Analyze my spending
          </Button>
          <Button
            variant="outline"
            className="bg-[#1D2839]/50 border-[#1D2839] justify-start"
            onClick={handleGetSavingsTips}
            disabled={isLoadingSavings}
          >
            {isLoadingSavings ? "Analyzing..." : "Suggest savings tips"}
          </Button>
          <Button
            variant="outline"
            className="bg-[#1D2839]/50 border-[#1D2839] justify-start"
            onClick={() => setSelectedInsight("investment")}
          >
            Investment advice
          </Button>
          <Button
            variant="outline"
            className="bg-[#1D2839]/50 border-[#1D2839] justify-start"
            onClick={() => setSelectedInsight("emergency")}
          >
            Emergency fund advice
          </Button>
        </div>

        {/* Savings Tips Display */}
        {selectedInsight === "savings" && savingsTips && (
          <div className="space-y-4">
            {/* Spending Overview */}
            <div className="bg-[#1D2839]/50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium mb-2">30-Day Spending Overview</h3>
              <div className="text-2xl font-bold mb-2">
                ${(savingsTips.spendingOverview.total / 100).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Top categories: {savingsTips.spendingOverview.topCategories.map(c => 
                  `${c.category} (${c.percentage}%)`
                ).join(', ')}
              </div>
            </div>

            {/* Recommendations */}
            {savingsTips.recommendations.map((tip, index) => (
              <Card key={index} className="p-4 bg-[#1D2839]/50 border-[#1D2839]">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="font-medium">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-blue-400">
                        Save up to ${tip.potentialSavings}/month
                      </span>
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                        {tip.difficulty} difficulty
                      </span>
                      <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full">
                        {tip.timeframe}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!selectedInsight && (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Try one of the quick actions above to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
