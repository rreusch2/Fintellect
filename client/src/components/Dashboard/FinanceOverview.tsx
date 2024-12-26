import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, 
  CreditCard, 
  TrendingDown, 
  AlertCircle,
  LineChart,
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import PlaidLink from "@/components/Plaid/PlaidLink";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

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
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-900/60 transition-colors">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle>Financial Overview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your current financial snapshot
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              title="Available Balance"
              value={formatCurrency(summary.totalBalance)}
              trend={summary.monthOverMonthChange >= 0 ? "up" : "down"}
              description="Balance available for spending"
              icon={<CreditCard className="h-4 w-4" />}
              gradient="from-emerald-500/20 to-teal-500/20"
              iconColor="text-emerald-400"
              borderColor="border-emerald-500/20"
            />
            <StatCard
              title="Monthly Spending"
              value={formatCurrency(summary.monthlySpending)}
              trend="down"
              change={`${summary.monthOverMonthChange?.toFixed(1) || "0"}%`}
              description="Total spending this month"
              icon={<LineChart className="h-4 w-4" />}
              gradient="from-purple-500/20 to-pink-500/20"
              iconColor="text-purple-400"
              borderColor="border-purple-500/20"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  trend,
  change,
  description,
  icon,
  gradient,
  iconColor,
  borderColor,
}: {
  title: string;
  value: string;
  trend: "up" | "down";
  change?: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: string;
  iconColor?: string;
  borderColor?: string;
}) {
  return (
    <div className="group flex flex-col p-6 border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} border ${borderColor} group-hover:scale-110 transition-transform duration-300`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {change && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend === "up" 
              ? "text-emerald-400 bg-emerald-500/10" 
              : "text-rose-400 bg-rose-500/10"
          }`}>
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {change}
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
