import { useTransactions } from "@/hooks/use-transactions";

export function isDemoMode(): boolean {
  // Add debug logging
  const demoMode = localStorage.getItem('demoMode');
  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.get('demo') === 'true';
  
  console.log('Demo Mode Check:', {
    localStorage: demoMode,
    urlParam: isDemo
  });

  return demoMode === 'true' || isDemo;
}

export function setDemoMode(enabled: boolean) {
  console.log('Setting Demo Mode:', enabled);
  if (enabled) {
    localStorage.setItem('demoMode', 'true');
  } else {
    localStorage.removeItem('demoMode');
  }
} 