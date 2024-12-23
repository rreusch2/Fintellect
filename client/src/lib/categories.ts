import { IconType } from "lucide-react";
import { 
  ShoppingBag,
  Utensils,
  Car,
  Plane,
  Coffee,
  CreditCard,
  DollarSign,
  Building,
  Music,
  Smartphone,
  ShoppingCart,
  HelpCircle
} from "lucide-react";

// Category mapping
export const CategoryMap = {
  // Food & Dining
  'FOOD_AND_DRINK': 'Food & Dining',
  'FOOD_DINING': 'Food & Dining',
  'FOODDINING': 'Food & Dining',
  'RESTAURANTS': 'Food & Dining',
  'COFFEE_SHOPS': 'Coffee & Cafes',
  'COFFEESHOPS': 'Coffee & Cafes',
  'FAST_FOOD': 'Food & Dining',
  'FASTFOOD': 'Food & Dining',

  // Transportation
  'TRANSPORTATION': 'Transportation',
  'RIDE_SHARE': 'Transportation',
  'RIDESHARE': 'Transportation',
  'TAXI': 'Transportation',
  'AUTO': 'Transportation',
  'PARKING': 'Transportation',
  'AIRLINES': 'Travel',

  // Shopping
  'SHOPPING': 'Shopping',
  'RETAIL': 'Shopping',
  'MERCHANDISE': 'Shopping',
  'SPARKFUN': 'Shopping',
  'FUN': 'Shopping',

  // Other
  'OTHER': 'Other',
  'UNCATEGORIZED': 'Other',
  'LOAN_PAYMENTS': 'Loan Payment',
  'TRANSFER': 'Transfer',
  'PAYMENT': 'Payment'
} as const;

// Icon mapping
export const CategoryIcons: Record<string, IconType> = {
  'Food & Dining': Utensils,
  'Coffee & Cafes': Coffee,
  'Transportation': Car,
  'Travel': Plane,
  'Shopping': ShoppingBag,
  'Bills & Utilities': Building,
  'Entertainment': Music,
  'Loan Payment': CreditCard,
  'Transfer': DollarSign,
  'Payment': DollarSign,
  'Other': HelpCircle,
};

// Color mapping
export const CategoryColors: Record<string, string> = {
  'Food & Dining': 'text-orange-500 border-orange-200 bg-orange-100',
  'Coffee & Cafes': 'text-brown-500 border-brown-200 bg-brown-100',
  'Transportation': 'text-blue-500 border-blue-200 bg-blue-100',
  'Travel': 'text-purple-500 border-purple-200 bg-purple-100',
  'Shopping': 'text-green-500 border-green-200 bg-green-100',
  'Bills & Utilities': 'text-gray-500 border-gray-200 bg-gray-100',
  'Entertainment': 'text-pink-500 border-pink-200 bg-pink-100',
  'Loan Payment': 'text-red-500 border-red-200 bg-red-100',
  'Transfer': 'text-blue-500 border-blue-200 bg-blue-100',
  'Payment': 'text-blue-500 border-blue-200 bg-blue-100',
  'Other': 'text-gray-500 border-gray-200 bg-gray-100',
};

export function normalizeCategory(category: string): string {
  const cleanCategory = category.replace(/_/g, '').toUpperCase();
  return CategoryMap[cleanCategory] || 
         CategoryMap[cleanCategory.replace(/\s+/g, '')] || 
         category.replace(/_/g, ' ');
}

export function getCategoryIcon(category: string): IconType {
  const normalizedCategory = normalizeCategory(category);
  return CategoryIcons[normalizedCategory] || HelpCircle;
}

export function getCategoryColor(category: string): string {
  const normalizedCategory = normalizeCategory(category);
  return CategoryColors[normalizedCategory] || CategoryColors['Other'];
}

// Add this new function for display formatting
export function formatCategoryForDisplay(category: string): string {
  // First normalize the category
  const normalizedCategory = normalizeCategory(category);
  // Return the normalized category which is already in display format
  return normalizedCategory;
}

export const COLORS = {
  'TRANSPORTATION': '#3B82F6',
  'FOOD AND DRINK': '#10B981',
  'SHOPPING': '#F59E0B',
  'ENTERTAINMENT': '#8B5CF6',
  'UTILITIES': '#EC4899',
  'HEALTH': '#06B6D4',
  'TRANSFER': '#4B5563',
  'OTHER': '#6B7280'
} as const;

export type CategoryColor = keyof typeof COLORS;