import { Bot, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransactionInsightsProps {
  data: {
    transactions: Array<{
      category: string;
      amount: number;
      date: string;
    }>;
    categoryTotals: Record<string, number>;
    monthOverMonthChange: number;
  };
}

export default function TransactionInsights({ data }: TransactionInsightsProps) {
  // Filter out transfers and calculate actual spending categories
  const spendingCategories = Object.entries(data.categoryTotals)
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
    .filter(({ amount }) => amount > totalSpending * 0.3) // Categories that make up more than 30% of spending
    .map(({ category }) => category);

  return (
    <div className="space-y-6">
      {/* Spending Analysis */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Spending Analysis
        </h3>
        <p className="text-sm">
          Your top spending categories this month:
        </p>
        <div className="flex flex-wrap gap-2">
          {spendingCategories.slice(0, 3).map(({ category, amount }) => (
            <Badge key={category} variant="secondary" className="bg-[#1D2839] text-blue-400">
              {category}: ${(amount / 100).toFixed(2)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Unusual Activity */}
      {unusualCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Unusual Activity
          </h3>
          <p className="text-sm">
            Higher than usual spending in:
          </p>
          <div className="flex flex-wrap gap-2">
            {unusualCategories.map(category => (
              <Badge key={category} variant="secondary" className="bg-[#1D2839] text-yellow-400">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Comparison */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
          <Bot className="h-4 w-4" />
          Monthly Comparison
        </h3>
        <p className="text-sm">
          Your spending is {Math.abs(data.monthOverMonthChange).toFixed(1)}% 
          {data.monthOverMonthChange > 0 ? " higher" : " lower"} than last month
        </p>
      </div>
    </div>
  );
}
