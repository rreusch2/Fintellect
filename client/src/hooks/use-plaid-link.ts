import { useToast } from "./use-toast";
import { setDemoMode } from "@/lib/demo";

export function usePlaidLink() {
  const { toast } = useToast();

  const handlePlaidSuccess = async (public_token: string) => {
    try {
      const response = await fetch('/api/plaid/set-access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      // Disable demo mode and reload
      setDemoMode(false);
      window.location.reload();
    } catch (error) {
      console.error('Plaid error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect bank account. Please try again."
      });
    }
  };

  return { handlePlaidSuccess };
} 