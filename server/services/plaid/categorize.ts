// Add or update the categorization logic
export function categorizeTransaction(transaction: any) {
  const description = transaction.description.toLowerCase();
  const name = transaction.name.toLowerCase();
  
  // Specific merchant mappings
  const merchantMappings: Record<string, { category: string; subcategory?: string }> = {
    'sparkfun': { category: 'SHOPPING', subcategory: 'RETAIL' },
    'fun': { category: 'SHOPPING', subcategory: 'RETAIL' },
    'starbucks': { category: 'FOOD_AND_DRINK', subcategory: 'COFFEE_SHOPS' },
    'mcdonalds': { category: 'FOOD_AND_DRINK', subcategory: 'FAST_FOOD' },
    'uber': { category: 'TRANSPORTATION', subcategory: 'RIDE_SHARE' },
  };

  // Check for credit card payments
  if (description.includes('credit card') || 
      description.includes('payment') || 
      name.includes('credit card') || 
      name.includes('payment')) {
    return {
      category: 'PAYMENT',
      subcategory: 'CREDIT_CARD'
    };
  }

  // Check for specific merchant matches
  for (const [key, mapping] of Object.entries(merchantMappings)) {
    if (description.includes(key)) {
      return mapping;
    }
  }

  // If the category is housing, remap it to shopping
  if (transaction.category?.toUpperCase().includes('HOUSING')) {
    return {
      category: 'SHOPPING',
      subcategory: 'RETAIL'
    };
  }

  // Default categorization
  return transaction.category;
} 