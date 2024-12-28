import { useQuery } from "@tanstack/react-query";
import { useToast } from "./use-toast";

interface Transaction {
  id: number;
  amount: number;
  category: string;
  description: string;
  merchantName?: string;
  date: string;
}

interface TransactionSummary {
  transactions: Transaction[];
  categoryTotals: Record<string, number>;
  monthlySpending: number;
  monthOverMonthChange: number;
  recentTransactions: Transaction[]; // Last 100 transactions
  allTransactions: Transaction[]; // All transactions for AI
  stats: {
    totalTransactions: number;
    averageAmount: number;
    topMerchants: Array<{ name: string; total: number; count: number }>;
    monthlyTrends: Array<{ month: string; total: number }>;
  };
}

export function useTransactions(limit?: number) {
  const { toast } = useToast();

  return useQuery<TransactionSummary>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions/summary");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
    select: (data) => ({
      ...data,
      // Keep full dataset for AI but limit display
      recentTransactions: data.transactions.slice(0, limit || 100),
      stats: {
        ...data.stats,
        // Add enhanced statistics
        topMerchants: calculateTopMerchants(data.transactions),
        monthlyTrends: calculateMonthlyTrends(data.transactions)
      }
    }),
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions. Please try again.",
      });
    },
  });
}

// Helper functions for enhanced statistics
function calculateTopMerchants(transactions: Transaction[]) {
  const merchantMap = transactions.reduce((acc, t) => {
    const name = t.merchantName || t.description;
    if (!acc[name]) {
      acc[name] = { total: 0, count: 0 };
    }
    acc[name].total += Math.abs(t.amount);
    acc[name].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return Object.entries(merchantMap)
    .map(([name, stats]) => ({
      name,
      ...stats
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function calculateMonthlyTrends(transactions: Transaction[]) {
  const monthlyTotals = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthlyTotals)
    .map(([month, total]) => ({
      month,
      total
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months
}
