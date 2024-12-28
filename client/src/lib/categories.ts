import {
  Utensils, // Food & Drink
  ShoppingBag, // Shopping
  Car, // Transportation
  Plane, // Travel
  Gamepad, // Entertainment
  Heart, // Personal Care
  Zap, // Bills & Utilities
  CreditCard, // Loan Payments
  ArrowLeftRight, // Transfer
  DollarSign, // Income
  Building2, // Tax
  HelpCircle, // Uncategorized
  Briefcase, // Business
  GraduationCap, // Education
  Stethoscope, // Healthcare
  Home, // Housing
  Gift, // General Merchandise
  WrenchIcon, // General Services
  CalendarClock, // Subscription
} from 'lucide-react';

// Define both demo and real transaction colors
export const COLORS = {
  // Real transaction categories
  'FOOD_AND_DRINK': '#FF9F1C', // Warm orange
  'GENERAL_MERCHANDISE': '#4EA8DE', // Clear blue
  'GENERAL_SERVICES': '#9333EA', // Deep purple
  'TRANSPORTATION': '#10B981', // Emerald green
  'TRAVEL': '#E879F9', // Bright pink
  'ENTERTAINMENT': '#EC4899', // Deep pink
  'PERSONAL_CARE': '#06B6D4', // Cyan
  'BILLS_AND_UTILITIES': '#6366F1', // Indigo
  'LOAN_PAYMENTS': '#2563EB', // Royal blue
  'TRANSFER': '#94A3B8', // Slate
  'TAX': '#64748B', // Cool gray
  'UNCATEGORIZED': '#CBD5E1', // Light gray
  'BUSINESS': '#3B82F6', // Bright blue
  'EDUCATION': '#F97316', // Bright orange
  'HEALTHCARE': '#14B8A6', // Teal
  'HOUSING': '#8B5CF6', // Violet
  'SUBSCRIPTION': '#D946EF', // Fuchsia
  'OTHER': '#94A3B8', // Slate gray

  // Demo mode specific categories (if needed)
  'UTILITIES': '#6366F1', // Same as BILLS_AND_UTILITIES
  'SHOPPING': '#4EA8DE', // Same as GENERAL_MERCHANDISE
} as const;

// Map categories to their respective icons
export const CATEGORY_ICONS = {
  'FOOD_AND_DRINK': Utensils,
  'SHOPPING': ShoppingBag,
  'TRANSPORTATION': Car,
  'TRAVEL': Plane,
  'ENTERTAINMENT': Gamepad,
  'PERSONAL_CARE': Heart,
  'BILLS_AND_UTILITIES': Zap,
  'LOAN_PAYMENTS': CreditCard,
  'TRANSFER': ArrowLeftRight,
  'INCOME': DollarSign,
  'TAX': Building2,
  'UNCATEGORIZED': HelpCircle,
  'BUSINESS': Briefcase,
  'EDUCATION': GraduationCap,
  'HEALTHCARE': Stethoscope,
  'HOUSING': Home,
  'GENERAL_MERCHANDISE': Gift,
  'GENERAL_SERVICES': WrenchIcon,
  'SUBSCRIPTION': CalendarClock,
};

// Helper function to normalize category names
export function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper to get category color with fallback
export function getCategoryColor(category: string): string {
  // Normalize the category string
  const normalizedCategory = category.toUpperCase().replace(/[^A-Z_]/g, '_');

  // Direct mapping for known categories
  if (normalizedCategory in COLORS) {
    return COLORS[normalizedCategory as keyof typeof COLORS];
  }

  // Handle special cases and variations
  if (normalizedCategory.includes('UTILITIES')) return COLORS.BILLS_AND_UTILITIES;
  if (normalizedCategory.includes('SHOP')) return COLORS.GENERAL_MERCHANDISE;
  if (normalizedCategory.includes('FOOD') || normalizedCategory.includes('DINING')) return COLORS.FOOD_AND_DRINK;
  if (normalizedCategory.includes('TRANSPORT')) return COLORS.TRANSPORTATION;
  if (normalizedCategory.includes('ENTERTAINMENT')) return COLORS.ENTERTAINMENT;
  if (normalizedCategory.includes('HOME') || normalizedCategory.includes('RENT')) return COLORS.HOUSING;
  if (normalizedCategory.includes('HEALTH')) return COLORS.HEALTHCARE;
  if (normalizedCategory.includes('EDUCATION')) return COLORS.EDUCATION;
  if (normalizedCategory.includes('PERSONAL')) return COLORS.PERSONAL_CARE;
  if (normalizedCategory.includes('GENERAL_MERCH')) return COLORS.GENERAL_MERCHANDISE;
  if (normalizedCategory.includes('GENERAL_SERV')) return COLORS.GENERAL_SERVICES;

  // Default fallback
  return COLORS.OTHER;
}

// Helper to get category icon with fallback
export function getCategoryIcon(category: string) {
  const normalizedCategory = category.toUpperCase().replace(/\s+/g, '_');
  return CATEGORY_ICONS[normalizedCategory as keyof typeof CATEGORY_ICONS] || HelpCircle;
}