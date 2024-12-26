// Add category enum for consistency
export const TransactionCategories = {
  FOOD_AND_DRINK: 'FOOD_AND_DRINK',
  GENERAL_MERCHANDISE: 'GENERAL_MERCHANDISE',
  GENERAL_SERVICES: 'GENERAL_SERVICES',
  TRANSPORTATION: 'TRANSPORTATION',
  TRAVEL: 'TRAVEL',
  ENTERTAINMENT: 'ENTERTAINMENT',
  PERSONAL_CARE: 'PERSONAL_CARE',
  BILLS_AND_UTILITIES: 'BILLS_AND_UTILITIES',
  LOAN_PAYMENTS: 'LOAN_PAYMENTS',
  TRANSFER: 'TRANSFER',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  INCOME: 'INCOME',
  TAX: 'TAX',
  UNCATEGORIZED: 'UNCATEGORIZED',
  SHOPPING: 'SHOPPING',
  FINANCIAL: 'FINANCIAL',
  BILLS: 'BILLS',
  HOUSING: 'HOUSING',
  MEDICAL: 'MEDICAL',
  EDUCATION: 'EDUCATION',
  BUSINESS: 'BUSINESS',
  SUBSCRIPTION: 'SUBSCRIPTION',
} as const;

// Add or update the categorization logic
export function categorizeTransaction(transaction: any) {
  const description = (transaction.description || '').toLowerCase();
  const merchantName = (transaction.merchantName || '').toLowerCase();
  
  // Check for food-related keywords
  if (
    description.includes('pizza') ||
    description.includes('restaurant') ||
    description.includes('cafe') ||
    description.includes('diner') ||
    merchantName.includes('pizza') ||
    merchantName.includes('restaurant') ||
    merchantName.includes('cafe') ||
    merchantName.includes('diner')
  ) {
    return { 
      category: TransactionCategories.FOOD_AND_DRINK,
      subcategory: 'RESTAURANTS'
    };
  }

  // Comprehensive merchant mappings
  const merchantMappings: Record<string, { category: string; subcategory?: string }> = {
    // Food & Drink
    'starbucks': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'COFFEE_SHOPS' },
    'dunkin': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'COFFEE_SHOPS' },
    'mcdonalds': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'FAST_FOOD' },
    'burger king': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'FAST_FOOD' },
    'wendys': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'FAST_FOOD' },
    'popeyes': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'FAST_FOOD' },
    'chipotle': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'RESTAURANTS' },
    'panera': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'RESTAURANTS' },
    'grubhub': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'DELIVERY' },
    'uber eats': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'DELIVERY' },
    'doordash': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'DELIVERY' },
    'pizza': { category: TransactionCategories.FOOD_AND_DRINK, subcategory: 'RESTAURANTS' },
    
    // Shopping & General Merchandise
    'amazon': { category: TransactionCategories.GENERAL_MERCHANDISE, subcategory: 'ONLINE_RETAIL' },
    'walmart': { category: TransactionCategories.GENERAL_MERCHANDISE, subcategory: 'RETAIL' },
    'target': { category: TransactionCategories.GENERAL_MERCHANDISE, subcategory: 'RETAIL' },
    'costco': { category: TransactionCategories.GENERAL_MERCHANDISE, subcategory: 'WHOLESALE_CLUBS' },
    'sams club': { category: TransactionCategories.GENERAL_MERCHANDISE, subcategory: 'WHOLESALE_CLUBS' },
    
    // Transportation
    'uber': { category: TransactionCategories.TRANSPORTATION, subcategory: 'RIDE_SHARE' },
    'lyft': { category: TransactionCategories.TRANSPORTATION, subcategory: 'RIDE_SHARE' },
    'citgo': { category: TransactionCategories.TRANSPORTATION, subcategory: 'GAS' },
    'shell': { category: TransactionCategories.TRANSPORTATION, subcategory: 'GAS' },
    'exxon': { category: TransactionCategories.TRANSPORTATION, subcategory: 'GAS' },
    'bp': { category: TransactionCategories.TRANSPORTATION, subcategory: 'GAS' },
    'paybyphone': { category: TransactionCategories.TRANSPORTATION, subcategory: 'PARKING' },
    
    // Entertainment
    'netflix': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'STREAMING' },
    'hulu': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'STREAMING' },
    'spotify': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'STREAMING' },
    'apple music': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'STREAMING' },
    'xbox': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'GAMING' },
    'playstation': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'GAMING' },
    'steam': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'GAMING' },
    'topgolf': { category: TransactionCategories.ENTERTAINMENT, subcategory: 'RECREATION' },
    
    // Personal Care
    'planet fitness': { category: TransactionCategories.PERSONAL_CARE, subcategory: 'FITNESS' },
    'la fitness': { category: TransactionCategories.PERSONAL_CARE, subcategory: 'FITNESS' },
    'cvs': { category: TransactionCategories.PERSONAL_CARE, subcategory: 'PHARMACY' },
    'walgreens': { category: TransactionCategories.PERSONAL_CARE, subcategory: 'PHARMACY' },
    
    // Bills & Utilities
    'microsoft': { category: TransactionCategories.BILLS_AND_UTILITIES, subcategory: 'SOFTWARE' },
    'apple': { category: TransactionCategories.BILLS_AND_UTILITIES, subcategory: 'SOFTWARE' },
    'at&t': { category: TransactionCategories.BILLS_AND_UTILITIES, subcategory: 'PHONE' },
    'verizon': { category: TransactionCategories.BILLS_AND_UTILITIES, subcategory: 'PHONE' },
    't-mobile': { category: TransactionCategories.BILLS_AND_UTILITIES, subcategory: 'PHONE' },
    
    // Financial Services
    'cleo': { category: TransactionCategories.FINANCIAL, subcategory: 'SERVICE' },
    'earnin': { category: TransactionCategories.LOAN_PAYMENTS, subcategory: 'SERVICE' },
    'brigit': { category: TransactionCategories.LOAN_PAYMENTS, subcategory: 'SERVICE' },
    'venmo': { category: TransactionCategories.TRANSFER, subcategory: 'PAYMENT_APP' },
    'cash app': { category: TransactionCategories.TRANSFER, subcategory: 'PAYMENT_APP' },
    'paypal': { category: TransactionCategories.TRANSFER, subcategory: 'PAYMENT_APP' },
  };

  // Check for transfers
  if (description.includes('transfer') || description.includes('zelle') || 
      merchantName.includes('transfer') || merchantName.includes('zelle')) {
    const isIncoming = transaction.amount < 0; // Plaid uses negative for incoming money
    return {
      category: isIncoming ? TransactionCategories.TRANSFER_IN : TransactionCategories.TRANSFER_OUT,
      subcategory: description.includes('cash app') ? 'CASH_APP' : 
                   description.includes('venmo') ? 'VENMO' : 
                   description.includes('paypal') ? 'PAYPAL' : 'OTHER'
    };
  }

  // Check for specific merchant matches
  for (const [key, mapping] of Object.entries(merchantMappings)) {
    if (description.includes(key) || merchantName.includes(key)) {
      return mapping;
    }
  }

  // Check for common patterns
  if (description.includes('irs') || description.includes('internal revenue')) {
    return { category: TransactionCategories.TAX, subcategory: 'GOVERNMENT' };
  }

  // Map Plaid categories to our categories
  if (transaction.personal_finance_category?.primary) {
    const plaidCategory = transaction.personal_finance_category.primary.toUpperCase();
    const categoryMapping: Record<string, string> = {
      'FOOD_AND_DRINK': TransactionCategories.FOOD_AND_DRINK,
      'GENERAL_MERCHANDISE': TransactionCategories.GENERAL_MERCHANDISE,
      'GENERAL_SERVICES': TransactionCategories.GENERAL_SERVICES,
      'TRANSPORTATION': TransactionCategories.TRANSPORTATION,
      'TRAVEL': TransactionCategories.TRAVEL,
      'ENTERTAINMENT': TransactionCategories.ENTERTAINMENT,
      'PERSONAL_CARE': TransactionCategories.PERSONAL_CARE,
      'BILLS_AND_UTILITIES': TransactionCategories.BILLS_AND_UTILITIES,
      'LOAN_PAYMENTS': TransactionCategories.LOAN_PAYMENTS,
      'TRANSFER': TransactionCategories.TRANSFER,
      'INCOME': TransactionCategories.INCOME,
      'TAX': TransactionCategories.TAX,
      'SHOPPING': TransactionCategories.SHOPPING,
      'FINANCIAL': TransactionCategories.FINANCIAL,
      'BILLS': TransactionCategories.BILLS_AND_UTILITIES,
      'HOUSING': TransactionCategories.HOUSING,
      'MEDICAL': TransactionCategories.MEDICAL,
      'EDUCATION': TransactionCategories.EDUCATION,
      'BUSINESS': TransactionCategories.BUSINESS,
      'SUBSCRIPTION': TransactionCategories.SUBSCRIPTION,
    };

    return {
      category: categoryMapping[plaidCategory] || TransactionCategories.UNCATEGORIZED,
      subcategory: transaction.personal_finance_category.detailed
    };
  }

  // Default categorization
  return {
    category: TransactionCategories.UNCATEGORIZED,
    subcategory: null
  };
} 