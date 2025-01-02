import { useTransactions } from "@/hooks/use-transactions";

export function isDemoMode(): boolean {
  // Only check localStorage, remove URL param check for consistency
  return localStorage.getItem('demoMode') === 'true';
}

export function setDemoMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('demoMode', 'true');
  } else {
    localStorage.removeItem('demoMode');
    // Clear any URL params related to demo mode
    const url = new URL(window.location.href);
    url.searchParams.delete('demo');
    window.history.replaceState({}, '', url.toString());
  }
} 