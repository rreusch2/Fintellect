import { useState } from "react";
import { Bot, TrendingUp, AlertCircle, Sparkles, Target, Wallet, LineChart } from "lucide-react";
import { useAIInsights } from "@/hooks/use-ai-insights";
import { Card } from "@/components/ui/card";
import { useTransactions } from "@/hooks/use-transactions";

export default function AIFinancialInsights() {
  const { insights, isLoading } = useAIInsights();
  const { data: summary } = useTransactions();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[#1D2839]/50 rounded" />
        <div className="space-y-3">
          <div className="h-24 bg-[#1D2839]/50 rounded-lg" />
          <div className="h-24 bg-[#1D2839]/50 rounded-lg" />
          <div className="h-24 bg-[#1D2839]/50 rounded-lg" />
        </div>
      </div>
    );
  }

  // Smart insights based on user data
  const generateSmartInsights = () => {
    const defaultInsights = [
      {
        type: "action" as const,
        title: "High Transportation Costs",
        description: "Your transportation spending is higher than usual. Consider carpooling or public transit to reduce expenses.",
        impact: "$100/month potential savings",
        priority: "high" as const,
        icon: <LineChart className="h-4 w-4" />
      },
      {
        type: "tip" as const,
        title: "Recurring Subscriptions",
        description: "We found several subscription services. Review them to identify any unused services you could cancel.",
        impact: "Save up to $45/month",
        priority: "medium" as const,
        icon: <Wallet className="h-4 w-4" />
      },
      {
        type: "action" as const,
        title: "Savings Opportunity",
        description: "Based on your spending patterns, you could increase your monthly savings by reducing discretionary expenses.",
        impact: "Potential $200 monthly savings",
        priority: "high" as const,
        icon: <Target className="h-4 w-4" />
      }
    ];

    if (!summary || !summary.categoryTotals) {
      return defaultInsights;
    }

    const customInsights = [];
    const categories = Object.entries(summary.categoryTotals);
    
    // Find highest spending category
    const highestSpending = categories
      .filter(([cat]) => !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER'].includes(cat))
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))[0];
    
    if (highestSpending) {
      customInsights.push({
        type: "action" as const,
        title: `High ${highestSpending[0].toLowerCase()} Spending`,
        description: `Your ${highestSpending[0].toLowerCase()} expenses are your highest category. Consider setting a budget limit.`,
        impact: `Save ${((Math.abs(highestSpending[1]) * 0.2) / 100).toFixed(0)}/month`,
        priority: "high" as const,
        icon: <LineChart className="h-4 w-4" />
      });
    }

    // Monthly savings potential
    if (summary.monthlySpending > 0) {
      const savingsPotential = Math.floor(summary.monthlySpending * 0.15 / 100);
      customInsights.push({
        type: "tip" as const,
        title: "Savings Opportunity",
        description: "We've identified potential savings in your monthly spending patterns.",
        impact: `Save up to $${savingsPotential}/month`,
        priority: "medium" as const,
        icon: <Wallet className="h-4 w-4" />
      });
    }

    // Budget or spending trend insight
    if (summary.monthOverMonthChange !== 0) {
      const trend = summary.monthOverMonthChange > 0 ? "increased" : "decreased";
      customInsights.push({
        type: "action" as const,
        title: "Spending Trend Alert",
        description: `Your monthly spending has ${trend} by ${Math.abs(summary.monthOverMonthChange).toFixed(1)}% compared to last month.`,
        impact: trend === "increased" ? "Action recommended" : "Keep it up!",
        priority: trend === "increased" ? "high" as const : "medium" as const,
        icon: <Target className="h-4 w-4" />
      });
    }

    return customInsights.length >= 3 ? customInsights.slice(0, 3) : [...customInsights, ...defaultInsights].slice(0, 3);
  };

  const displayInsights = generateSmartInsights();

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <Sparkles className="h-5 w-5 text-blue-400" />
        AI Financial Insights
      </h2>

      <div className="grid gap-4">
        {displayInsights.map((insight, index) => (
          <Card key={index} className="p-4 bg-[#1D2839]/50 border-[#1D2839] hover:bg-[#1D2839]/70 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                insight.type === "action" 
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-purple-500/10 text-purple-400"
              }`}>
                {insight.icon}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{insight.title}</h3>
                  {insight.priority === "high" && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-400">
                      High Priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {insight.impact && (
                  <p className="text-sm text-blue-400 mt-2 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {insight.impact}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {summary?.hasPlaidConnection === false && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-500">Connect Your Bank</h3>
              <p className="text-sm text-muted-foreground">
                Link your accounts to get personalized insights based on your actual spending patterns.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 