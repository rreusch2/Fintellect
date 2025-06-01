/**
 * Path mapping utility for Nexus integration
 * 
 * This file helps map import paths from the reference Nexus implementation
 * to the Fintellect project structure.
 */

// Map of original Nexus paths to Fintellect paths
export const pathMap: Record<string, string> = {
  // Core utilities
  '@/lib/utils': '../../../lib/utils',
  
  // UI components
  '@/components/ui/': '../../../components/ui/',
  
  // Hooks
  '@/hooks/': '../../hooks/',
  
  // Contexts
  '@/contexts/': '../../contexts/',
  
  // API
  '@/lib/api': '../../api/index',
  
  // Constants
  '@/lib/constants/': '../../utils/constants/',
};

/**
 * Helper function to convert Nexus paths to Fintellect paths
 * @param originalPath The original import path from Nexus
 * @returns The mapped path for Fintellect
 */
export function mapPath(originalPath: string): string {
  for (const [key, value] of Object.entries(pathMap)) {
    if (originalPath.startsWith(key)) {
      return originalPath.replace(key, value);
    }
  }
  return originalPath;
}
