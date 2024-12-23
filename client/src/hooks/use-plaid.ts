import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PlaidAccount {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit";
  balance: number;
}

export function usePlaid() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<PlaidAccount[]>({
    queryKey: ["/api/plaid/accounts"],
  });

  const linkMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const response = await fetch("/api/plaid/exchange_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to exchange token");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/accounts"] });
    },
  });

  const openPlaidLink = async () => {
    setIsLoading(true);
    try {
      // Get link token from our backend
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create link token");
      }

      const { link_token } = await response.json();
      
      // Load Plaid Link
      const { link, exit } = await new Promise<{
        link: any;
        exit: () => void;
      }>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
        script.onload = () => {
          const handler = (window as any).Plaid.create({
            token: link_token,
            onSuccess: async (public_token: string, metadata: any) => {
              try {
                const response = await fetch("/api/plaid/set-access-token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    public_token,
                    institution: metadata.institution,
                  }),
                });

                if (!response.ok) {
                  throw new Error("Failed to set access token");
                }

                queryClient.invalidateQueries({ queryKey: ["/api/plaid/accounts"] });
                
                toast({
                  title: "Success",
                  description: "Bank account connected successfully",
                });

                return true;
              } catch (error: any) {
                console.error("Error setting access token:", error);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: error.message || "Failed to connect bank account",
                });
                return false;
              }
            },
            onExit: () => {
              document.body.removeChild(script);
              setIsLoading(false);
            },
            onEvent: (eventName: string) => {
              console.log("Plaid Link event:", eventName);
            },
          });

          resolve({
            link: handler,
            exit: () => handler.exit(),
          });
        };
        document.body.appendChild(script);
      });

      // Open Plaid Link
      link.open();
      return exit;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start Plaid Link",
      });
      setIsLoading(false);
      return false;
    }
  };

  return {
    accounts,
    isLoading,
    openPlaidLink,
  };
}
