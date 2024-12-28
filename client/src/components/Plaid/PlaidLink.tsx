import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { usePlaidLink } from "@/hooks/use-plaid-link";
import { cn } from "@/lib/utils";

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
  const [isLoading, setIsLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();
  const { handlePlaidSuccess } = usePlaidLink();

  // Load Plaid script
  useEffect(() => {
    const loadScript = async () => {
      // If script is already loaded, we're done
      if (document.querySelector('script[src*="link-initialize.js"]')) {
        setScriptLoaded(true);
        return;
      }

      // If script is currently loading, wait for it
      if (isScriptLoading && scriptLoadPromise) {
        await scriptLoadPromise;
        setScriptLoaded(true);
        return;
      }

      // Start loading the script
      isScriptLoading = true;
      scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
        script.onload = () => {
          setScriptLoaded(true);
          isScriptLoading = false;
          resolve();
        };
        script.onerror = (error) => {
          isScriptLoading = false;
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

      try {
        await scriptLoadPromise;
      } catch (error) {
        console.error("Error loading Plaid script:", error);
      }
    };

    loadScript();
  }, [toast]);

  // Get link token
  useEffect(() => {
    if (!scriptLoaded) return;

    const getLinkToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to create link token");
        }

        const { link_token } = await response.json();
        setLinkToken(link_token);
      } catch (error) {
        console.error("Error creating link token:", error);
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

            onSuccess?.();
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
      onSuccess={handlePlaidSuccess}
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
