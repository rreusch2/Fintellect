interface EnhancedUserContext extends UserContext {
  spendingAnalysis: {
    categoryTotals: Record<string, number>;
    recurringPatterns: Array<{
      key: string;
      averageAmount: number;
      frequency: number;
      frequencyDays: number;
      isConsistent: boolean;
      category: string;
    }>;
    spendingVelocity: number;
    categoryAcceleration: Array<{
      category: string;
      acceleration: number;
    }>;
  };
}

export class ChatbotAgent {
  private model: GoogleGenerativeAI;
  private knowledgeStore: KnowledgeStore;
  private dashboardAgent: DashboardInsightsAgent;

  constructor(
    model: GoogleGenerativeAI,
    knowledgeStore: KnowledgeStore,
    dashboardAgent: DashboardInsightsAgent
  ) {
    this.model = model;
    this.knowledgeStore = knowledgeStore;
    this.dashboardAgent = dashboardAgent;
  }

  private async getEnhancedContext(userId: number): Promise<EnhancedUserContext> {
    const transactions = await this.transactionService.getUserTransactions(userId);
    const goals = await this.goalService.getUserGoals(userId);
    const income = await this.incomeService.getUserIncome(userId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Helper to categorize transactions
    const categorizeTransactions = (txs: Transaction[]): Record<string, number> => {
      return txs.reduce((acc, tx) => {
        const category = tx.category || 'UNCATEGORIZED';
        acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
        return acc;
      }, {} as Record<string, number>);
    };

    // Get monthly transactions
    const monthlyTransactions = transactions.filter(tx => 
      new Date(tx.date) >= startOfMonth && new Date(tx.date) <= now
    );

    // Get recent transactions
    const recentTransactions = transactions.filter(tx =>
      new Date(tx.date) >= sevenDaysAgo && new Date(tx.date) <= now
    );

    // Calculate spending by category
    const monthlySpendingByCategory = categorizeTransactions(monthlyTransactions);
    const recentSpendingByCategory = categorizeTransactions(recentTransactions);

    // Calculate totals
    const totalMonthlySpending = Object.values(monthlySpendingByCategory).reduce((a, b) => a + b, 0);
    const totalRecentSpending = Object.values(recentSpendingByCategory).reduce((a, b) => a + b, 0);

    // Analyze spending patterns
    const patterns = this.analyzeSpendingPatterns(transactions, monthlySpendingByCategory);

    return {
      spendingAnalysis: {
        totalMonthlySpending,
        recentSpending: totalRecentSpending,
        patterns
      },
      monthlySpendingByCategory,
      recentSpendingByCategory,
      recentTransactions: recentTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
      goals: goals.map(g => ({
        name: g.name,
        target: g.targetAmount,
        current: g.currentAmount
      })),
      income: {
        monthlyIncome: income.monthlyAmount,
        sources: income.sources
      }
    };
  }

  private analyzeSpendingPatterns(
    transactions: Transaction[],
    monthlySpending: Record<string, number>
  ): string[] {
    const patterns: string[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Identify top spending categories
    const topCategories = Object.entries(monthlySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    patterns.push(
      `Top spending categories this month: ${topCategories
        .map(([category, amount]) => `${this.formatCategory(category)} (${formatCurrency(amount)})`)
        .join(', ')}`
    );

    // Analyze recurring transactions
    const recurringTransactions = this.findRecurringTransactions(transactions);
    if (recurringTransactions.length > 0) {
      patterns.push(
        `Recurring monthly expenses: ${recurringTransactions
          .map(r => `${r.description} (${formatCurrency(r.averageAmount)})`)
          .join(', ')}`
      );
    }

    // Analyze spending velocity
    const recentDailyAvg = this.calculateDailyAverage(
      transactions.filter(t => new Date(t.date) >= startOfMonth)
    );
    const previousMonthDailyAvg = this.calculateDailyAverage(
      transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= new Date(now.getFullYear(), now.getMonth() - 1, 1) &&
               txDate < startOfMonth;
      })
    );

    const spendingVelocityChange = ((recentDailyAvg - previousMonthDailyAvg) / previousMonthDailyAvg) * 100;
    if (Math.abs(spendingVelocityChange) > 10) {
      patterns.push(
        `Daily spending is ${spendingVelocityChange > 0 ? 'up' : 'down'} ${Math.abs(spendingVelocityChange).toFixed(1)}% compared to last month`
      );
    }

    return patterns;
  }

  private calculateDailyAverage(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;
    const total = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const days = Math.ceil(
      (new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))) -
       new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())))) /
      (1000 * 60 * 60 * 24)
    ) || 1;
    return total / days;
  }

  private findRecurringTransactions(transactions: Transaction[]): Array<{
    description: string;
    averageAmount: number;
  }> {
    const transactionsByMerchant: Record<string, Transaction[]> = {};
    
    // Group transactions by merchant
    transactions.forEach(tx => {
      const key = tx.merchantName || tx.description;
      if (!transactionsByMerchant[key]) {
        transactionsByMerchant[key] = [];
      }
      transactionsByMerchant[key].push(tx);
    });

    // Find recurring patterns
    return Object.entries(transactionsByMerchant)
      .filter(([, txs]) => txs.length >= 2)
      .map(([merchant, txs]) => {
        const amounts = txs.map(t => Math.abs(t.amount));
        const averageAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sq, n) => sq + Math.pow(n - averageAmount, 2), 0) / amounts.length
        );

        // Consider it recurring if amount variation is less than 10%
        if (stdDev / averageAmount < 0.1) {
          return {
            description: merchant,
            averageAmount
          };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  private formatCategory(category: string): string {
    // Special case mappings for common categories
    const specialCases: Record<string, string> = {
      'FOOD_AND_DRINK': 'Food & Drink',
      'GENERAL_MERCHANDISE': 'General Merchandise',
      'GENERAL_SERVICES': 'General Services',
      'TRANSPORTATION': 'Transportation',
      'TRAVEL': 'Travel',
      'HOME_IMPROVEMENT': 'Home Improvement',
      'PERSONAL_CARE': 'Personal Care',
      'ENTERTAINMENT': 'Entertainment',
      'HEALTH_FITNESS': 'Health & Fitness',
      'BILLS_UTILITIES': 'Bills & Utilities'
    };

    // Check if we have a special case mapping
    if (specialCases[category]) {
      return specialCases[category];
    }

    // Default formatting for other categories
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatSpendingSection(spending: Record<string, number>, total: number, title: string): string {
    if (total === 0) return `${title}:\n  No spending recorded for this period`;

    const sortedCategories = Object.entries(spending)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        return `    - ${this.formatCategory(category)}: ${formatCurrency(amount)} (${percentage}% of total)`;
      })
      .join('\n');
    
    return `${title}:\n  Total: ${formatCurrency(total)}\n  Breakdown by Category:\n${sortedCategories}`;
  }

  private formatContextForPrompt(context: EnhancedUserContext): string {
    const {
      spendingAnalysis,
      recentTransactions,
      monthlySpendingByCategory,
      recentSpendingByCategory,
      goals,
      income
    } = context;

    const monthlyTotal = spendingAnalysis.totalMonthlySpending;
    const recentTotal = spendingAnalysis.recentSpending;

    const monthlySpending = this.formatSpendingSection(
      monthlySpendingByCategory,
      monthlyTotal,
      'Monthly Spending (Current Calendar Month)'
    );

    const recentSpending = this.formatSpendingSection(
      recentSpendingByCategory,
      recentTotal,
      'Recent Spending (Last 7 Days)'
    );

    const formattedGoals = goals.map(goal => 
      `  - ${goal.name}: Target: ${formatCurrency(goal.target)}, Progress: ${formatCurrency(goal.current)} (${((goal.current / goal.target) * 100).toFixed(1)}%)`
    ).join('\n');

    const recentTransactionsList = recentTransactions
      .map(t => `  - ${t.date}: ${this.formatCategory(t.category)} - ${formatCurrency(t.amount)} - ${t.description}`)
      .join('\n');

    return `
Income Information:
  Monthly Income: ${formatCurrency(income.monthlyIncome)}
  Income Sources: ${income.sources.join(', ')}

${monthlySpending}

${recentSpending}

Active Financial Goals:
${formattedGoals}

Recent Transactions:
${recentTransactionsList}

Notable Patterns:
${spendingAnalysis.patterns.map(p => `  - ${p}`).join('\n')}
`;
  }

  public async chat(userId: number, message: string): Promise<string> {
    const context = await this.getEnhancedContext(userId);
    const contextStr = this.formatContextForPrompt(context);

    const prompt = `You are a highly knowledgeable AI Financial Assistant with access to detailed user financial data. Your role is to provide accurate, data-driven financial advice.

Current Financial Context:
${contextStr}

User Message: "${message}"

Important Guidelines:
1. ACCURACY IS CRITICAL - Always use the exact numbers from the financial data provided
2. When discussing spending:
   - NEVER use underscores in category names (use "Food & Drink" instead of "FOOD_AND_DRINK")
   - Always format category names in Title Case with spaces (e.g., "General Merchandise", "Food & Drink")
   - Show both monthly and recent (7-day) spending when analyzing patterns
   - Monthly total: ${formatCurrency(context.spendingAnalysis.totalMonthlySpending)}
   - Recent total: ${formatCurrency(context.spendingAnalysis.recentSpending)}
   - Include exact amounts and percentages for each category
3. For budgeting advice:
   - Base recommendations on both monthly and recent spending patterns
   - Show clear category breakdowns with properly formatted names
   - Provide realistic reduction targets based on spending history
4. Response Format:
   - Use proper currency formatting (e.g., $1,234.56)
   - Keep responses clear and well-structured
   - Format category names consistently as described above
   - Break down spending analysis into clear sections
5. Time Periods:
   - Always specify whether you're discussing monthly or recent (7-day) spending
   - Use exact dates when relevant
   - Be explicit about time periods in all analyses

Your response should be detailed, accurate, and directly based on the user's actual financial data. Focus on providing clear, actionable insights with properly formatted category names and spending amounts.

Maximum response length: 2000 characters. If you need more space, break your response into multiple parts.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
} 