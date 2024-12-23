import { suggestCategory } from './categories';
import { prisma } from '../db';
import { PlaidTransaction } from './plaid/types';

export async function processTransaction(transaction: PlaidTransaction) {
  const amountInCents = Math.round(transaction.amount * -100);

  const merchantName = transaction.merchant_name?.trim() || null;
  const description = transaction.name?.trim() || '';

  console.log('Processing transaction:', {
    description,
    merchantName,
    amount: amountInCents,
    original: {
      name: transaction.name,
      merchant_name: transaction.merchant_name,
      amount: transaction.amount
    }
  });

  const { categoryId, subcategoryId } = suggestCategory(
    description,
    amountInCents,
    merchantName
  );

  console.log('Category suggestion:', { categoryId, subcategoryId });

  return {
    ...transaction,
    category: categoryId,
    subcategory: subcategoryId,
    merchantName,
    description,
    amount: amountInCents,
    date: new Date(transaction.date),
  };
}

export async function saveTransactions(transactions: PlaidTransaction[]) {
  console.log(`Processing ${transactions.length} transactions`);

  const processedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const processed = await processTransaction(transaction);
      
      try {
        const saved = await prisma.transaction.create({
          data: {
            plaidId: transaction.transaction_id,
            accountId: transaction.account_id,
            amount: processed.amount,
            category: processed.category,
            subcategory: processed.subcategory,
            date: processed.date,
            description: processed.description,
            merchantName: processed.merchantName,
            pending: transaction.pending,
            isoCurrencyCode: transaction.iso_currency_code,
          },
        });

        console.log('Saved transaction:', {
          id: saved.id,
          description: saved.description,
          category: saved.category,
          subcategory: saved.subcategory
        });

        return saved;
      } catch (error) {
        console.error('Error saving transaction:', error);
        throw error;
      }
    })
  );

  return processedTransactions;
}

export async function getTransactionSummary(userId: string) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get current month's transactions
  const currentMonthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });

  // Get previous month's transactions for comparison
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const previousMonthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: firstDayOfLastMonth,
        lte: lastDayOfLastMonth,
      },
    },
  });

  // Calculate totals
  const calculateTotals = (transactions: typeof currentMonthTransactions) => {
    return transactions.reduce(
      (acc, t) => {
        const amount = t.amount;
        if (amount > 0) {
          acc.income += amount;
        } else {
          acc.spending += Math.abs(amount);
        }
        
        // Group by category
        if (!acc.categoryTotals[t.category]) {
          acc.categoryTotals[t.category] = 0;
        }
        acc.categoryTotals[t.category] += Math.abs(amount);

        // Track subcategories
        if (t.subcategory) {
          const key = `${t.category}:${t.subcategory}`;
          if (!acc.subcategoryTotals[key]) {
            acc.subcategoryTotals[key] = 0;
          }
          acc.subcategoryTotals[key] += Math.abs(amount);
        }

        return acc;
      },
      { 
        income: 0, 
        spending: 0, 
        categoryTotals: {} as Record<string, number>,
        subcategoryTotals: {} as Record<string, number>
      }
    );
  };

  const currentTotals = calculateTotals(currentMonthTransactions);
  const previousTotals = calculateTotals(previousMonthTransactions);

  // Calculate month-over-month changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Get total balance from accounts
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      balance: true,
    },
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return {
    totalBalance,
    monthlySpending: currentTotals.spending,
    monthlyIncome: currentTotals.income,
    monthlySavings: currentTotals.income - currentTotals.spending,
    monthOverMonthChange: calculateChange(
      currentTotals.spending,
      previousTotals.spending
    ),
    categoryTotals: currentTotals.categoryTotals,
    subcategoryTotals: currentTotals.subcategoryTotals,
    hasPlaidConnection: accounts.length > 0,
  };
} 