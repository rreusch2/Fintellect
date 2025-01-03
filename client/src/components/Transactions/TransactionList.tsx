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
import { COLORS, getCategoryColor, getCategoryIcon, formatCategoryName } from '@/lib/categories';

interface Transaction {
  id: number;
  description: string;
  merchantName?: string | null;
  category: string;
  amount: number;
  date: string;
  accountName: string;
  accountType: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  searchQuery?: string;
}

function cleanTransactionDescription(description: string, merchantName: string | null | undefined): string {
  if (merchantName) {
    return merchantName;
  }

  let cleaned = description
    .replace(/\b\d{6,}\b/g, '')
    .replace(/\bCARD\s+\d+\b/i, '')
    .replace(/\b\d{2}\/\d{2}\/?\d{0,4}\b/, '')
    .replace(/^(PURCHASE[- ]|POS |DEBIT |CREDIT |WITHDRAWAL |CHECKCARD |PAYMENT |EFT |ACH )/i, '')
    .replace(/\bTIMESTAMP\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  cleaned = cleaned.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return cleaned;
}

function formatAmount(amount: number): string {
  const formatted = Math.abs(amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  return amount < 0 ? formatted : `-${formatted}`;
}

function getAmountColor(amount: number) {
  // Expenses are negative (red), income is positive (green)
  return amount < 0 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";
}

// Move getTailwindColor outside of the component
const getTailwindColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    '#FF9800': 'orange',  // Food and Drink
    '#2196F3': 'blue',    // Transportation
    '#9C27B0': 'purple',  // General Merchandise
    '#4CAF50': 'emerald', // General Services
    '#00BCD4': 'cyan',    // Travel
    '#E91E63': 'pink',    // Entertainment
    '#FFD700': 'yellow',  // Loan Payments
    '#FF4081': 'rose',    // Personal Care
    '#FFA726': 'amber',   // Utilities
    '#66BB6A': 'green',   // Income
    '#7C4DFF': 'indigo',  // Transfer
  };

  const hexColor = COLORS[category as keyof typeof COLORS];
  return colorMap[hexColor] || 'gray';
};

export default function TransactionList({ transactions, searchQuery }: TransactionListProps) {
  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.merchantName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="divide-y divide-gray-800">
      {/* Table Header */}
      <div className="grid grid-cols-[2fr,1fr,auto] gap-8 p-4 bg-gray-900/30">
        <div className="text-sm font-medium text-muted-foreground">Transaction</div>
        <div className="text-sm font-medium text-muted-foreground">Category</div>
        <div className="text-sm font-medium text-muted-foreground text-right">Amount</div>
      </div>

      {/* Transactions */}
      {filteredTransactions.map((transaction) => (
        <div 
          key={transaction.id}
          className="grid grid-cols-[2fr,1fr,auto] gap-8 p-4 hover:bg-gray-900/40 transition-colors group items-center"
        >
          {/* Transaction Info */}
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${COLORS[transaction.category as keyof typeof COLORS]}10` }}
            >
              {getTransactionIcon(transaction.category)}
            </div>
            <div>
              <p className="font-medium">
                {transaction.merchantName || transaction.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(transaction.date))} ago
              </p>
            </div>
          </div>

          {/* Enhanced Category Display - Fixed Width Container */}
          <div className="flex items-center">
            <div 
              className="px-3 py-1.5 rounded-full transition-colors w-full max-w-[200px]"
              style={{ 
                backgroundColor: `${COLORS[transaction.category as keyof typeof COLORS]}10`,
                borderColor: `${COLORS[transaction.category as keyof typeof COLORS]}20`,
                borderWidth: '1px'
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[transaction.category as keyof typeof COLORS] }}
                />
                <span 
                  className="text-sm truncate"
                  style={{ color: COLORS[transaction.category as keyof typeof COLORS] }}
                >
                  {formatCategoryName(transaction.category)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <span className={`font-medium justify-self-end whitespace-nowrap ${
            transaction.amount > 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {transaction.amount > 0 ? '-' : '+'}${Math.abs(transaction.amount/100).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function getTransactionIcon(category: string) {
  // Use the exact colors from COLORS for the icons
  const color = COLORS[category as keyof typeof COLORS];
  
  const iconMap: Record<string, React.ReactNode> = {
    FOOD_AND_DRINK: <Utensils className="h-4 w-4" style={{ color }} />,
    TRANSPORTATION: <Car className="h-4 w-4" style={{ color }} />,
    GENERAL_MERCHANDISE: <ShoppingBag className="h-4 w-4" style={{ color }} />,
    GENERAL_SERVICES: <Briefcase className="h-4 w-4" style={{ color }} />,
    TRAVEL: <Plane className="h-4 w-4" style={{ color }} />,
    ENTERTAINMENT: <Gamepad2 className="h-4 w-4" style={{ color }} />,
    LOAN_PAYMENTS: <Building2 className="h-4 w-4" style={{ color }} />,
    PERSONAL_CARE: <Heart className="h-4 w-4" style={{ color }} />,
    UTILITIES: <Zap className="h-4 w-4" style={{ color }} />,
    INCOME: <ArrowUpRight className="h-4 w-4" style={{ color }} />,
    TRANSFER: <ArrowLeftRight className="h-4 w-4" style={{ color }} />,
  };

  return iconMap[category] || <CreditCard className="h-4 w-4" style={{ color }} />;
}