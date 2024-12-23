// Create a new file for category mapping
export const CategoryMap = {
  // Food & Dining
  'FOOD_AND_DRINK': 'Food & Dining',
  'FOOD_DINING': 'Food & Dining',
  'RESTAURANTS': 'Food & Dining',
  'COFFEE_SHOPS': 'Coffee & Cafes',
  'FAST_FOOD': 'Food & Dining',

  // Transportation
  'TRANSPORTATION': 'Transportation',
  'RIDE_SHARE': 'Transportation',
  'TAXI': 'Transportation',
  'AUTO': 'Auto & Transport',
  'PARKING': 'Auto & Transport',
  'AIRLINES': 'Travel',

  // Shopping
  'SHOPPING': 'Shopping',
  'RETAIL': 'Shopping',
  'MERCHANDISE': 'Shopping',

  // Bills & Utilities
  'UTILITIES': 'Bills & Utilities',
  'PHONE': 'Bills & Utilities',
  'INTERNET': 'Bills & Utilities',

  // Entertainment
  'ENTERTAINMENT': 'Entertainment',
  'MOVIES': 'Entertainment',
  'MUSIC': 'Entertainment',

  // Other
  'OTHER': 'Other',
  'UNCATEGORIZED': 'Other',
  'LOAN_PAYMENTS': 'Loan Payment',
  'TRANSFER': 'Transfer',
  'PAYMENT': 'Payment'
};

export function normalizeCategory(category: string): string {
  const normalized = CategoryMap[category.toUpperCase()] || category;
  return normalized.replace(/_/g, ' ');
} 