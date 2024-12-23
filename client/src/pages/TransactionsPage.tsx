import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import TransactionList from "@/components/Transactions/TransactionList";
import { SpendingDistributionChart } from "@/components/Transactions/SpendingDistributionChart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  ArrowUpDown,
  FilterIcon,
  Bot,
  TrendingUp,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  PieChart,
} from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { COLORS } from '@/lib/categories';

// Add this helper function at the top of the file, outside the component
const getCategoryColor = (category: string): string => {
  // Remove underscores and normalize category name
  const normalizedCategory = category.replace(/_/g, ' ').toUpperCase();
  return COLORS[normalizedCategory as keyof typeof COLORS] || COLORS.OTHER;
};

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { data: summary, isLoading } = useTransactions();

  // Filter and prepare data for the spending distribution chart
  const spendingData = Object.entries(summary?.categoryTotals || {})
    .filter(([category, amount]) => (
      amount > 0 && 
      !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER', 'UNCATEGORIZED'].includes(category) &&
      !category.includes('TRANSFER')
    ))
    .reduce((acc, [category, amount]) => {
      acc[category] = Math.abs(amount);
      return acc;
    }, {} as Record<string, number>);

  // Calculate total spending
  const totalSpending = Object.values(spendingData).reduce((sum, amount) => sum + amount, 0);

  // Get unique categories from the transactions
  const categories = Object.keys(spendingData).filter(category => 
    !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER', 'UNCATEGORIZED'].includes(category)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-[300px]">
            <AlertCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/20 opacity-15"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <Navigation />

      <main className="container mx-auto px-4 py-8 relative">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transactions</h1>
            <AIDisclaimer variant="minimal" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 w-[200px]"
              />
            </div>
            <Select
              value={selectedCategory || undefined}
              onValueChange={(value) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-[2fr,1fr] mb-6">
          {/* Left Column: Transaction List */}
          <TransactionList 
            transactions={summary?.transactions || []}
            searchQuery={searchQuery}
          />

          {/* Right Column: Charts and Insights */}
          <div className="space-y-6">
            {/* Spending Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Spending Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <SpendingDistributionChart data={spendingData} />
                </div>
                <div className="mt-4 space-y-2">
                  {Object.entries(spendingData)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, amount]) => {
                      const formattedCategory = category.replace(/_/g, ' ');
                      const percentage = (amount / totalSpending) * 100;
                      const categoryColor = getCategoryColor(category);
                      
                      return (
                        <div key={category} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ 
                                backgroundColor: categoryColor,
                                opacity: 0.8 
                              }}
                            />
                            <span className="text-sm font-medium">{formattedCategory}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              ${(amount / 100).toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI Transaction Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Monthly Change */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Change</span>
                    <div className={`flex items-center gap-1 ${
                      summary?.monthOverMonthChange > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {summary?.monthOverMonthChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(summary?.monthOverMonthChange || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Top Categories */}
                <div className="space-y-2">
                  {Object.entries(spendingData)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([category, amount]) => (
                      <div key={category} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm">${(amount / 100).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {((amount / totalSpending) * 100).toFixed(1)}% of total spending
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <BetaFeedback />
    </div>
  );
}
