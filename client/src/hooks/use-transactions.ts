import { useQuery } from "@tanstack/react-query";

export interface Transaction {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  merchantName: string | null;
  accountName: string;
  accountType: string;
}

export interface CategoryTrend {
  category: string;
  currentSpend: number;
  previousSpend: number;
  percentageChange: number;
}

export interface TransactionSummary {
  totalBalance: number;
  monthlySpending: number;
  monthlySavings: number;
  monthOverMonthChange: number;
  categoryTotals: Record<string, number>;
  categoryTrends: CategoryTrend[];
  transactions: Transaction[];
  accounts: Array<{
    id: number;
    name: string;
    type: string;
    balance: number;
    availableBalance?: number;
  }>;
  spendingTrends: {
    labels: string[];
    data: number[];
  };
  hasPlaidConnection: boolean;
  status?: 'pending';
  message?: string;
}

export function useTransactions() {
  return useQuery<TransactionSummary>({
    queryKey: ["/api/plaid/transactions/summary"],
    staleTime: 30000,
    retry: 2,
    refetchInterval: (data) => {
      // If the data is in pending state, poll every 10 seconds
      return data?.status === 'pending' ? 10000 : false;
    },
  });
}
