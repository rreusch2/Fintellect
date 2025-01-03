import { useState } from "react";
import { Bot, TrendingUp, AlertCircle, Sparkles, Target, Wallet, LineChart, ArrowUpRight, PieChart } from "lucide-react";
import { useAIInsights } from "@/hooks/use-ai-insights";
import { Card } from "@/components/ui/card";
import { useTransactions } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";

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
  
  // Calculate total spending excluding transfers
  const totalSpending = Object.entries(summary?.categoryTotals || {})
    .filter(([category]) => !category.includes('TRANSFER'))
    .reduce((sum, [_, amount]) => sum + (amount > 0 ? amount : 0), 0);

  // Get sorted spending categories
  const sortedCategories = Object.entries(summary?.categoryTotals || {})
    .filter(([category, amount]) => 
      !category.includes('TRANSFER') && amount > 0
    )
    .sort(([_, a], [__, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpending * 100).toFixed(1)
    }));

  // Calculate food and drink specific metrics
  const foodAndDrink = summary?.categoryTotals?.['FOOD_AND_DRINK'] || 0;
  const foodPercentage = ((foodAndDrink / totalSpending) * 100).toFixed(1);
  const suggestedFoodBudget = Math.round(foodAndDrink * 0.8);
  const potentialSavings = foodAndDrink - suggestedFoodBudget;

  // Calculate essential vs discretionary spending
  const essentialCategories = ['RENT', 'UTILITIES', 'FOOD_AND_DRINK', 'TRANSPORTATION', 'HEALTHCARE'];
  const essentialSpending = Object.entries(summary?.categoryTotals || {})
    .filter(([category]) => essentialCategories.some(c => category.includes(c)))
    .reduce((sum, [_, amount]) => sum + (amount > 0 ? amount : 0), 0);
  
  const discretionarySpending = totalSpending - essentialSpending;

  const insights = [
    {
      title: "High Food & Drink Spending",
      description: `Your food and dining expenses are ${formatCurrency(foodAndDrink)} (${foodPercentage}% of total spending). Consider setting a monthly budget of ${formatCurrency(suggestedFoodBudget)} to save ${formatCurrency(potentialSavings)} per month.`,
      priority: "HIGH",
      badge: "ACTION NEEDED",
      icon: Wallet,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Top Spending Categories",
      description: `Your highest spending areas are:\n${sortedCategories.slice(0, 3)
        .map(({ category, amount, percentage }) => 
          `${category.replace(/_/g, ' ')}: ${formatCurrency(amount)} (${percentage}%)`
        )
        .join('\n')}`,
      priority: "MEDIUM",
      badge: "ANALYSIS",
      icon: PieChart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Monthly Budget Optimization",
      description: `Based on your spending patterns, here's a recommended monthly budget:\n• Essential spending: ${formatCurrency(essentialSpending)} (${((essentialSpending/totalSpending)*100).toFixed(1)}%)\n• Discretionary spending: ${formatCurrency(discretionarySpending)} (${((discretionarySpending/totalSpending)*100).toFixed(1)}%)\nPotential monthly savings: ${formatCurrency(totalSpending * 0.15)} by optimizing essential expenses.`,
      priority: "HIGH",
      badge: "OPPORTUNITY",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    }
  ];

  return (
    <Card className={cn(
      "bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors",
      "h-auto max-h-[500px] overflow-auto"
    )}>
      <div className="p-3 sm:p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-medium">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
          AI Financial Insights
        </h2>

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Card key={index} className="p-3 sm:p-4 bg-[#1D2839]/50 border-[#1D2839] hover:bg-[#1D2839]/60 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${insight.bgColor} flex-shrink-0`}>
                  <insight.icon className={`h-4 w-4 ${insight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <h3 className="font-medium text-sm sm:text-base">{insight.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${insight.bgColor} ${insight.color}`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {insight.description}
                  </p>
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
    </Card>
  );
} 