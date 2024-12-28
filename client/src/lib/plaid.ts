import { setDemoMode } from "./demo";
import { toast } from "@/hooks/use-toast";

export async function handlePlaidSuccess(public_token: string) {
  try {
    // Disable demo mode first
    setDemoMode(false);
    
    // Exchange the token
    const response = await fetch('/api/plaid/exchange_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to exchange token');
    }

    toast({
      title: "Success",
      description: "Bank account connected successfully"
    });

    // Reload to show real transactions
    window.location.reload();
  } catch (error) {
    console.error('Plaid error:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to connect bank account. Please try again."
    });
    throw error; // Re-throw to be handled by the component
  }
} 