import { useTransactions } from "@/hooks/use-transactions";

export function isDemoMode(): boolean {
  // Check both localStorage and URL params
  const demoMode = localStorage.getItem('demoMode') === 'true';
  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.get('demo') === 'true';
  
  // If either condition is true, ensure localStorage is set
  if (isDemo && !demoMode) {
    localStorage.setItem('demoMode', 'true');
  }

  return demoMode || isDemo;
}

export function setDemoMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('demoMode', 'true');
  } else {
    localStorage.removeItem('demoMode');
  }
} 