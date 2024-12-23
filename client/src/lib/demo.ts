import { useTransactions } from "@/hooks/use-transactions";

export function isDemoMode(): boolean {
  // Check localStorage first for demo mode flag
  const demoMode = localStorage.getItem('demoMode');
  if (demoMode === 'true') return true;

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.get('demo') === 'true';
  
  // If demo mode is set in URL, save it to localStorage
  if (isDemo) {
    localStorage.setItem('demoMode', 'true');
  }

  return isDemo;
}

export function setDemoMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('demoMode', 'true');
  } else {
    localStorage.removeItem('demoMode');
  }
} 