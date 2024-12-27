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

// Enhanced color palette with distinct, visually appealing colors
export const COLORS = {
  UTILITIES: '#4CAF50',      // Green
  SHOPPING: '#FF9800',       // Orange
  FOOD_AND_DRINK: '#F44336', // Red
  TRANSPORTATION: '#2196F3', // Blue
  ENTERTAINMENT: '#E91E63',  // Pink
  HOUSING: '#9C27B0',       // Purple
  HEALTHCARE: '#00BCD4',     // Cyan
  EDUCATION: '#3F51B5',     // Indigo
  PERSONAL: '#795548',      // Brown
  OTHER: '#9E9E9E',         // Grey
  UNCATEGORIZED: '#607D8B'   // Blue Grey
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
  if (normalizedCategory.includes('UTILITIES')) return COLORS.UTILITIES;
  if (normalizedCategory.includes('SHOP')) return COLORS.SHOPPING;
  if (normalizedCategory.includes('FOOD') || normalizedCategory.includes('DINING')) return COLORS.FOOD_AND_DRINK;
  if (normalizedCategory.includes('TRANSPORT')) return COLORS.TRANSPORTATION;
  if (normalizedCategory.includes('ENTERTAINMENT')) return COLORS.ENTERTAINMENT;
  if (normalizedCategory.includes('HOME') || normalizedCategory.includes('RENT')) return COLORS.HOUSING;
  if (normalizedCategory.includes('HEALTH')) return COLORS.HEALTHCARE;
  if (normalizedCategory.includes('EDUCATION')) return COLORS.EDUCATION;
  if (normalizedCategory.includes('PERSONAL')) return COLORS.PERSONAL;

  // Default fallback
  return COLORS.OTHER;
}

// Helper to get category icon with fallback
export function getCategoryIcon(category: string) {
  const normalizedCategory = category.toUpperCase().replace(/\s+/g, '_');
  return CATEGORY_ICONS[normalizedCategory as keyof typeof CATEGORY_ICONS] || HelpCircle;
}