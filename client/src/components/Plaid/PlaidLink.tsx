import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { usePlaidLink } from "@/hooks/use-plaid-link";
import { cn } from "@/lib/utils";
import { isDemoMode, setDemoMode } from "@/lib/demo";

interface PlaidLinkProps {
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  children?: React.ReactNode;
}

// Global script loading state
let isScriptLoading = false;
let scriptLoadPromise: Promise<void> | null = null;

export default function PlaidLink({ 
  onSuccess, 
  className = "",
  variant = "default",
  children 
}: PlaidLinkProps) {
  console.log('PlaidLink component mounted');
  const [isLoading, setIsLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();
  const { handlePlaidSuccess } = usePlaidLink();

  // Load Plaid script
  useEffect(() => {
    console.log('PlaidLink: Running script loading useEffect');
    if (window.Plaid) {
      console.log('PlaidLink: Plaid script already loaded');
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    let scriptLoadPromise: Promise<void> | null = new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('PlaidLink: Plaid script finished loading (onload)');
        setScriptLoaded(true);
        scriptLoadPromise = null;
        resolve();
      };
      script.onerror = (error) => {
        console.error('PlaidLink: Plaid script failed to load (onerror)', error);
        setScriptLoaded(false);
        scriptLoadPromise = null;
        reject(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load Plaid. Please refresh the page."
        });
      };
      document.head.appendChild(script);
    });

    const checkScriptLoad = async () => {
        try {
            console.log('PlaidLink: Awaiting script load promise...');
            await scriptLoadPromise;
            console.log('PlaidLink: Script load promise resolved.');
        } catch (error) {
            console.error("PlaidLink: Error awaiting script load promise:", error);
        }
    };

    checkScriptLoad();

  }, [toast]);

  // Get link token
  useEffect(() => {
    console.log('PlaidLink: Running link token useEffect. scriptLoaded:', scriptLoaded);
    if (!scriptLoaded) return;

    const getLinkToken = async () => {
      console.log('PlaidLink: Attempting to get link token...');
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          credentials: "include",
        });

        console.log('PlaidLink: Fetched link token. Status:', response.status, 'OK:', response.ok);

        if (!response.ok) {
          let errorBody = 'Unknown error';
          try {
            errorBody = await response.text();
            console.error('PlaidLink: Link token fetch !ok response body:', errorBody);
            const errorJson = JSON.parse(errorBody);
            errorBody = errorJson.message || errorJson.error || JSON.stringify(errorJson);
          } catch (parseErr) { /* Ignore if response isn't JSON or text */ }
          throw new Error(`Failed to create link token (Status: ${response.status}). ${errorBody}`);
        }

        const data = await response.json();
        console.log('PlaidLink: Link token response JSON:', data);
        
        const link_token = data?.linkToken;

        if (!link_token) {
           console.error('PlaidLink: link_token not found in response data (looking for linkToken).', data);
           throw new Error('Link token (linkToken) not found in response from server.');
        }

        console.log('PlaidLink: Link Token Received:', link_token);
        setLinkToken(link_token);

      } catch (error) {
        console.error("PlaidLink: Error inside getLinkToken:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize Plaid connection"
        });
      }
    };

    getLinkToken();
  }, [scriptLoaded, toast]);

  const handleClick = async () => {
    if (!linkToken || !window.Plaid || isLoading) return;
    
    setIsLoading(true);
    try {
      const { open } = await window.Plaid.create({
        token: linkToken,
        onSuccess: async (public_token: string, metadata: any) => {
          try {
            // If we're in demo mode, disable it first
            if (isDemoMode()) {
              setDemoMode(false);
            }

            const response = await fetch("/api/plaid/set-access-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                public_token,
                institution: metadata.institution,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to set access token");
            }

            if (!data.success) {
              throw new Error(data.error || "Failed to connect bank account");
            }

            toast({
              title: "Success",
              description: "Bank account connected successfully",
            });

            // Call the onSuccess prop if provided
            onSuccess?.();

            // Reload the page to show real transactions
            window.location.reload();
          } catch (error: any) {
            console.error("Error setting access token:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message || "Failed to connect bank account"
            });
          } finally {
            setIsLoading(false);
          }
        },
        onExit: (err: any) => {
          if (err != null) {
            console.error("Plaid Link exit with error:", err);
            toast({
              variant: "destructive",
              title: "Error",
              description: err.error_message || "Error connecting to bank"
            });
          }
          setIsLoading(false);
        },
        onLoad: () => {
          setIsLoading(false);
        },
        onEvent: (eventName: string) => {
          console.log("Plaid Link event:", eventName);
        },
      });

      open();
    } catch (error: any) {
      console.error("Error opening Plaid Link:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to open Plaid connection"
      });
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!linkToken || !scriptLoaded || isLoading}
      variant={variant}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          {children || "Connect Bank Account"}
        </>
      )}
    </Button>
  );
}
