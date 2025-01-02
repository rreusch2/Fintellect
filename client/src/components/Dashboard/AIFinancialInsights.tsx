import { useState } from "react";
import { Bot, TrendingUp, AlertCircle, Sparkles, Target, Wallet, LineChart, ArrowUpRight, PieChart } from "lucide-react";
import { useAIInsights } from "@/hooks/use-ai-insights";
import { Card } from "@/components/ui/card";
import { useTransactions } from "@/hooks/use-transactions";

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount / 100);
};

export default function AIFinancialInsights() {
  const { data: summary } = useTransactions();
  const totalMonthlySpending = Object.values(summary?.categoryTotals || {}).reduce((a, b) => a + b, 0);

  // Calculate month-over-month changes
  const foodAndDrinkSpending = summary?.categoryTotals?.["FOOD_AND_DRINK"] || 0;
  const foodAndDrinkPercentage = (foodAndDrinkSpending / totalMonthlySpending) * 100;
  
  const insights = [
    {
      title: "High Food & Drink Spending",
      description: `Your food and dining expenses are ${formatCurrency(foodAndDrinkSpending)} (${foodAndDrinkPercentage.toFixed(1)}% of total spending). Consider setting a monthly budget of ${formatCurrency(foodAndDrinkSpending * 0.8)} to save ${formatCurrency(foodAndDrinkSpending * 0.2)} per month.`,
      priority: "HIGH",
      badge: "ACTION NEEDED",
      icon: Wallet,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Top Spending Categories",
      description: `Your highest spending areas are:\n1. Food & Drink: ${formatCurrency(123259)} (34.3%)\n2. General Merchandise: ${formatCurrency(91961)} (25.6%)\n3. General Services: ${formatCurrency(78147)} (21.8%)`,
      priority: "MEDIUM",
      badge: "ANALYSIS",
      icon: PieChart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Monthly Budget Optimization",
      description: `Based on your spending patterns, here's a recommended monthly budget:\n• Essential spending: ${formatCurrency(293367)} (81.7%)\n• Discretionary spending: ${formatCurrency(65779)} (18.3%)\nPotential monthly savings: ${formatCurrency(53800)} by optimizing essential expenses.`,
      priority: "HIGH",
      badge: "OPPORTUNITY",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium mb-4">
          <Sparkles className="h-5 w-5 text-blue-400" />
          AI Financial Insights
        </h2>

        <div className="space-y-4">
          {insights.map((insight, index) => (
            <Card key={index} className="p-4 bg-[#1D2839]/50 border-[#1D2839] hover:bg-[#1D2839]/60 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${insight.bgColor} flex-shrink-0`}>
                  <insight.icon className={`h-4 w-4 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{insight.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${insight.bgColor} ${insight.color}`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{insight.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400`}>
                      {insight.badge}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 