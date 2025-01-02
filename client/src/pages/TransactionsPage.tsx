import { useState, useMemo } from "react";
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
  Wallet,
  Calculator,
} from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { COLORS, formatCategoryName } from '@/lib/categories';
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";

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

  // Calculate spending data and totals
  const { spendingData, totalSpending, topCategory, averageTransaction } = useMemo(() => {
    if (!summary?.categoryTotals) {
      return { 
        spendingData: {}, 
        totalSpending: 0, 
        topCategory: null, 
        averageTransaction: 0 
      };
    }

    // Filter and prepare spending data
    const filteredData = Object.entries(summary.categoryTotals)
      .filter(([category, amount]) => (
        amount > 0 && 
        !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER', 'UNCATEGORIZED'].includes(category) &&
        !category.includes('TRANSFER')
      ))
      .reduce((acc, [category, amount]) => {
        acc[category] = Math.abs(amount);
        return acc;
      }, {} as Record<string, number>);

    // Calculate totals
    const total = Object.values(filteredData).reduce((sum, amount) => sum + amount, 0);
    
    // Find top category
    const topCat = Object.entries(filteredData)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Calculate average transaction
    const avgTransaction = summary.transactions?.length > 0 
      ? total / summary.transactions.length 
      : 0;

    return {
      spendingData: filteredData,
      totalSpending: total,
      topCategory: topCat,
      averageTransaction: avgTransaction
    };
  }, [summary]);

  // Get unique categories
  const categories = useMemo(() => 
    Object.keys(spendingData).filter(category => 
      !['TRANSFER_IN', 'TRANSFER_OUT', 'OTHER', 'UNCATEGORIZED'].includes(category)
    ), [spendingData]);

  usePageTitle('Transactions');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex items-center justify-center h-[60vh]">
            <LoadingState message="Loading transactions..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <Navigation />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Transactions</h1>
              <AIDisclaimer variant="minimal" />
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm rounded-lg p-2 border border-gray-800">
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
                <SelectTrigger className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="bg-gray-900/50 backdrop-blur-sm border-gray-800"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6"
        >
          {/* Total Spending Card */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                  <Wallet className="h-4 w-4 text-blue-400" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spending
                </CardTitle>
              </div>
              <div className="text-xl md:text-2xl font-bold">
                ${(totalSpending / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          {/* Top Category Card */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                  <PieChart className="h-4 w-4 text-purple-400" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Category
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: topCategory ? COLORS[topCategory as keyof typeof COLORS] : undefined }}
                />
                <span className="text-2xl font-bold">
                  {topCategory ? formatCategoryName(topCategory) : '-'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ${topCategory ? (spendingData[topCategory] / 100).toFixed(2) : '0.00'}
              </p>
            </CardContent>
          </Card>

          {/* Average Transaction Card */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                  <Calculator className="h-4 w-4 text-emerald-400" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Transaction
                </CardTitle>
              </div>
              <div className="text-2xl font-bold">
                ${(averageTransaction / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                From {summary?.transactions?.length || 0} transactions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[2fr,1fr] mb-6">
          {/* Search and Filter Controls - Mobile Optimized */}
          <div className="lg:hidden mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm rounded-lg p-2 border border-gray-800">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedCategory || undefined}
                  onValueChange={(value) => setSelectedCategory(value)}
                >
                  <SelectTrigger className="bg-gray-900/50 backdrop-blur-sm border-gray-800 w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategoryName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-gray-900/50 backdrop-blur-sm border-gray-800"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Left Column: Transaction List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                    </div>
                    <CardTitle>Recent Transactions</CardTitle>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {summary?.transactions?.length || 0} transactions found
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TransactionList 
                  transactions={summary?.transactions || []}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Spending Distribution */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                    <PieChart className="h-5 w-5 text-purple-400" />
                  </div>
                  <CardTitle>Spending Distribution</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[200px] md:h-[300px]">
                  <SpendingDistributionChart data={spendingData} showLegend={false} />
                </div>
                <div className="mt-6 space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
                  {Object.entries(spendingData)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = ((amount / totalSpending) * 100).toFixed(1);
                      return (
                        <div 
                          key={category} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-900/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div 
                              className="w-3 h-3 rounded-full transition-transform group-hover:scale-110 shrink-0" 
                              style={{ backgroundColor: COLORS[category as keyof typeof COLORS] }}
                            />
                            <span className="text-sm group-hover:text-blue-400 transition-colors truncate">
                              {formatCategoryName(category)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-medium">
                              ${(amount/100).toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground group-hover:text-blue-400/70 transition-colors">
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced AI Insights */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                    <Bot className="h-5 w-5 text-emerald-400" />
                  </div>
                  AI Transaction Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Monthly Change Card */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Change</span>
                    <div className={`flex items-center gap-1 ${
                      (summary?.monthOverMonthChange ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {(summary?.monthOverMonthChange ?? 0) > 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(summary?.monthOverMonthChange || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Top Categories with Enhanced Styling */}
                <div className="space-y-3">
                  {Object.entries(spendingData)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([category, amount]) => (
                      <div key={category} 
                        className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800 hover:bg-gray-900/60 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: getCategoryColor(category) }} 
                            />
                            <span className="text-sm font-medium">
                              {formatCategoryName(category)}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            ${(amount / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {((amount / totalSpending) * 100).toFixed(1)}% of total spending
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
      <BetaFeedback />
    </div>
  );
}
