import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, AlertCircle } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import PlaidLink from "@/components/Plaid/PlaidLink";
import { useQueryClient } from "@tanstack/react-query";

export default function FinanceOverview() {
  const { data: summary, isLoading } = useTransactions();
  const queryClient = useQueryClient();

  const handlePlaidSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/plaid/transactions/summary"] });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  if (!summary?.hasPlaidConnection) {
    return (
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="p-4 rounded-full bg-blue-500/10">
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No Bank Accounts Connected</h3>
              <p className="text-muted-foreground max-w-sm">
                Connect your bank accounts to see your financial overview and get personalized insights.
              </p>
            </div>
            <PlaidLink 
              onSuccess={handlePlaidSuccess}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Connect Bank Account
            </PlaidLink>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading financial overview..." />;
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No financial data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Available Balance"
            value={formatCurrency(summary.totalBalance)}
            trend={summary.monthOverMonthChange >= 0 ? "up" : "down"}
            change={`${summary.monthOverMonthChange?.toFixed(1) || "0"}%`}
            description="Balance available for spending"
          />
          <StatCard
            title="Monthly Spending"
            value={formatCurrency(summary.monthlySpending)}
            trend="down"
            change={`${summary.monthOverMonthChange?.toFixed(1) || "0"}%`}
            description="Total spending this month"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  trend,
  change,
  description,
}: {
  title: string;
  value: string;
  trend: "up" | "down";
  change: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
        {trend === "up" ? <ArrowUpRight /> : <ArrowDownRight />}
        <span className="ml-1">{change}</span>
      </div>
    </div>
  );
}
