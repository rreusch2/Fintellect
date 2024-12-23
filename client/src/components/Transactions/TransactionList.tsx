import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Plane,
  Coffee,
  CreditCard,
  Heart,
  Wifi,
  Zap,
  HelpCircle,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  ShoppingCart,
  Briefcase,
  Gamepad2,
  GraduationCap,
  Stethoscope,
  Ticket
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  description: string;
  merchantName?: string | null;
  category: string;
  subcategory?: string | null;
  amount: number;
  displayAmount: number;
  date: string;
  accountName: string;
  accountType: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  searchQuery?: string;
}

const CATEGORY_CONFIG = {
  'FOOD_AND_DRINK': {
    icon: Utensils,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    label: 'Food & Drink'
  },
  'TRANSPORTATION': {
    icon: Car,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Transportation'
  },
  'TRANSFER': {
    icon: ArrowLeftRight,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    label: 'Transfer'
  },
  'TRANSFER_IN': {
    icon: ArrowDownLeft,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    label: 'Transfer In'
  },
  'TRANSFER_OUT': {
    icon: ArrowUpRight,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Transfer Out'
  },
  'SHOPPING': {
    icon: ShoppingBag,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    label: 'Shopping'
  },
  'ENTERTAINMENT': {
    icon: Gamepad2,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    label: 'Entertainment'
  },
  'BUSINESS': {
    icon: Briefcase,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    label: 'Business'
  },
  'EDUCATION': {
    icon: GraduationCap,
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    label: 'Education'
  },
  'HEALTHCARE': {
    icon: Stethoscope,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    label: 'Healthcare'
  },
  'RECREATION': {
    icon: Ticket,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    label: 'Recreation'
  },
  'UNCATEGORIZED': {
    icon: HelpCircle,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    label: 'Uncategorized'
  }
} as const;

function getCategoryConfig(category: string) {
  const normalizedCategory = category.toUpperCase().replace(/\s+/g, '_');
  return (
    CATEGORY_CONFIG[normalizedCategory as keyof typeof CATEGORY_CONFIG] || 
    CATEGORY_CONFIG.UNCATEGORIZED
  );
}

function formatAmount(amount: number) {
  const formatted = Math.abs(amount / 100).toFixed(2);
  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}

function getAmountColor(amount: number) {
  // Expenses are negative (red), income is positive (green)
  return amount < 0 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";
}

export default function TransactionList({ transactions, searchQuery }: TransactionListProps) {
  const filteredTransactions = searchQuery
    ? transactions.filter((t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.merchantName && t.merchantName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : transactions;

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery ? "No transactions match your search" : "No transactions found"}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => {
              const config = getCategoryConfig(transaction.category);
              const Icon = config.icon;

              return (
                <TableRow key={transaction.id} className="group">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.merchantName && (
                        <div className="text-sm text-muted-foreground">
                          {transaction.merchantName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "transition-colors",
                        config.color
                      )}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    {transaction.subcategory && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {transaction.subcategory}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{transaction.accountName}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {transaction.accountType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium tabular-nums",
                    getAmountColor(transaction.displayAmount)
                  )}>
                    {formatAmount(transaction.displayAmount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}