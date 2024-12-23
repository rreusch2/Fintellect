import { MERCHANT_CATEGORIES } from "./merchant-categories";

interface CategorySuggestion {
  categoryId: string;
  subcategoryId: string | null;
}

const COMMON_PATTERNS = {
  FOOD_AND_DRINK: [
    /restaurant/i,
    /cafe/i,
    /coffee/i,
    /doordash/i,
    /uber.*eats/i,
    /grubhub/i,
    /mcdonalds/i,
    /starbucks/i,
    /subway/i,
    /pizza/i,
    /burger/i,
    /dining/i,
    /bakery/i,
  ],
  TRANSPORTATION: [
    /uber(?!.*eats)/i,
    /lyft/i,
    /taxi/i,
    /transit/i,
    /transport/i,
    /parking/i,
    /gas/i,
    /shell/i,
    /chevron/i,
    /exxon/i,
    /speedway/i,
    /marathon/i,
    /bp(?!\s+oil)/i,
  ],
  SHOPPING: [
    /amazon/i,
    /walmart/i,
    /target/i,
    /costco/i,
    /sams club/i,
    /ebay/i,
    /etsy/i,
    /market/i,
    /store/i,
    /shop/i,
    /retail/i,
  ],
  ENTERTAINMENT: [
    /netflix/i,
    /spotify/i,
    /hulu/i,
    /disney\+/i,
    /prime video/i,
    /cinema/i,
    /movie/i,
    /theater/i,
    /hbo/i,
    /youtube/i,
    /game/i,
    /steam/i,
    /playstation/i,
    /xbox/i,
  ],
  BUSINESS: [
    /office/i,
    /software/i,
    /subscription/i,
    /consulting/i,
    /service/i,
    /professional/i,
    /business/i,
  ],
  HEALTHCARE: [
    /pharmacy/i,
    /medical/i,
    /health/i,
    /doctor/i,
    /hospital/i,
    /clinic/i,
    /dental/i,
    /cvs/i,
    /walgreens/i,
  ],
  TRANSFER: [
    /transfer/i,
    /zelle/i,
    /venmo/i,
    /paypal/i,
    /cash app/i,
    /withdrawal/i,
    /deposit/i,
    /payment/i,
    /check/i,
    /ach/i,
    /direct dep/i,
  ],
};

export function suggestCategory(
  description: string,
  amount: number,
  merchantName?: string
): CategorySuggestion {
  const searchText = `${description} ${merchantName || ''}`.toLowerCase();

  // First check for transfers
  if (COMMON_PATTERNS.TRANSFER.some(pattern => pattern.test(searchText))) {
    return {
      categoryId: amount > 0 ? 'TRANSFER_OUT' : 'TRANSFER_IN',
      subcategoryId: null
    };
  }

  // Check merchant categories first
  if (merchantName) {
    const merchantCategory = MERCHANT_CATEGORIES[merchantName.toLowerCase()];
    if (merchantCategory) {
      return {
        categoryId: merchantCategory,
        subcategoryId: null
      };
    }
  }

  // Then check common patterns
  for (const [category, patterns] of Object.entries(COMMON_PATTERNS)) {
    if (category === 'TRANSFER') continue; // Already checked above
    if (patterns.some(pattern => pattern.test(searchText))) {
      return {
        categoryId: category,
        subcategoryId: null
      };
    }
  }

  // If no match found, try to make an educated guess based on amount
  if (amount > 100000) { // More than $1000
    return {
      categoryId: 'BUSINESS',
      subcategoryId: null
    };
  } else if (amount > 50000) { // More than $500
    return {
      categoryId: 'SHOPPING',
      subcategoryId: null
    };
  } else if (amount < 2000) { // Less than $20
    return {
      categoryId: 'FOOD_AND_DRINK',
      subcategoryId: null
    };
  }

  // If all else fails
  return {
    categoryId: 'UNCATEGORIZED',
    subcategoryId: null
  };
}
