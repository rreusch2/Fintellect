import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { COLORS, formatCategoryName } from '@/lib/categories';

interface Transaction {
  id: number;
  description: string;
  merchantName?: string | null;
  category: string;
  subcategory?: string | null;
  amount: number;
  date: string;
  accountName: string;
  accountType: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  searchQuery?: string;
}

export default function TransactionList({ transactions, searchQuery }: TransactionListProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
    transaction.merchantName?.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  );

  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
      </div>

      <div className="space-y-2">
        {paginatedTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:bg-gray-900/70 transition-colors"
          >
            {/* Transaction content */}
            <div className="flex items-start gap-4 flex-1">
              <div className="flex flex-col flex-1">
                <p className="font-medium">
                  {transaction.merchantName || transaction.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>

              {/* Category */}
              <div 
                className="px-3 py-1.5 rounded-full"
                style={{ 
                  backgroundColor: `${COLORS[transaction.category as keyof typeof COLORS]}10`,
                  borderColor: `${COLORS[transaction.category as keyof typeof COLORS]}20`,
                  borderWidth: '1px'
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[transaction.category as keyof typeof COLORS] }}
                  />
                  <span 
                    className="text-sm"
                    style={{ color: COLORS[transaction.category as keyof typeof COLORS] }}
                  >
                    {formatCategoryName(transaction.category)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <span className={`font-medium whitespace-nowrap ${
                transaction.amount > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {transaction.amount > 0 ? '-' : '+'}${Math.abs(transaction.amount/100).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Pagination */}
      {filteredTransactions.length > itemsPerPage && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(filteredTransactions.length / itemsPerPage)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), p + 1))}
            disabled={page >= Math.ceil(filteredTransactions.length / itemsPerPage)}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}