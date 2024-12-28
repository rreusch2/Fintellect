import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
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

const ITEMS_PER_PAGE = 25;

export default function TransactionList({ transactions, searchQuery }: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.merchantName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: paginatedTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </Select>
        </div>
      </div>

      <div 
        ref={parentRef}
        className="h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const transaction = paginatedTransactions[virtualRow.index];
            return (
              <div
                key={transaction.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Existing transaction row content */}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
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