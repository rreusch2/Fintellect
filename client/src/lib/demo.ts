import { useTransactions } from "@/hooks/use-transactions";

export function isDemoMode(): boolean {
  return localStorage.getItem('demoMode') === 'true';
}

export function setDemoMode(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('demoMode', 'true');
  } else {
    localStorage.removeItem('demoMode');
  }
}

export function clearDemoMode(): void {
  localStorage.removeItem('demoMode');
} 