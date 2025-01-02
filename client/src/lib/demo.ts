import { useTransactions } from "@/hooks/use-transactions";

export function isDemoMode(): boolean {
  // Only check localStorage, remove URL params check to be consistent
  return localStorage.getItem('demoMode') === 'true';
}

export function setDemoMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('demoMode', 'true');
  } else {
    localStorage.removeItem('demoMode');
  }
  
  // Force clear any URL params that might be causing issues
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  window.history.replaceState({}, '', url.toString());
} 