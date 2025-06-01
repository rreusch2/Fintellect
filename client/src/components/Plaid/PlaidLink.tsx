import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Lock, CheckCircle, AlertCircle, Sparkles, CreditCard } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'ready' | 'connecting' | 'processing' | 'success' | 'error'>('ready');
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
            title: "Connection Error",
            description: "Failed to load Plaid. Please refresh the page and try again."
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
        setConnectionStep('ready');
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to create link token");
        }

        const data = await response.json();
        // Handle both formats: {link_token} or {linkToken}
        const token = data.link_token || data.linkToken;
        if (!token) {
          console.error("Missing link token in response:", data);
          throw new Error("Invalid link token format");
        }
        setLinkToken(token);
      } catch (error) {
        console.error("Error creating link token:", error);
        setConnectionStep('error');
        toast({
          variant: "destructive",
          title: "Initialization Error",
          description: "Failed to initialize bank connection. Please try again."
        });
      }
    };

    getLinkToken();
  }, [scriptLoaded, toast]);

  const handleClick = async () => {
    if (!linkToken || !window.Plaid || isLoading) return;
    
    setIsLoading(true);
    setIsConnecting(true);
    setConnectionStep('connecting');
    
    try {
      const { open } = await window.Plaid.create({
        token: linkToken,
        onSuccess: async (public_token: string, metadata: any) => {
          try {
            setConnectionStep('processing');
            
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

            setConnectionStep('success');
            
            toast({
              title: "Bank Connected Successfully!",
              description: `${metadata.institution?.name || 'Your bank'} has been connected securely.`,
            });

            // Call the onSuccess prop if provided
            onSuccess?.();

            // Add a small delay to show success state
            setTimeout(() => {
              // Reload the page to show real transactions
              window.location.reload();
            }, 1500);
          } catch (error: any) {
            console.error("Error setting access token:", error);
            setConnectionStep('error');
            toast({
              variant: "destructive",
              title: "Connection Failed",
              description: error.message || "Failed to connect bank account. Please try again."
            });
            setIsLoading(false);
            setIsConnecting(false);
          }
        },
        onExit: (err: any) => {
          if (err != null) {
            console.error("Plaid Link exit with error:", err);
            setConnectionStep('error');
            toast({
              variant: "destructive",
              title: "Connection Cancelled",
              description: err.error_message || "Bank connection was cancelled or failed."
            });
          } else {
            setConnectionStep('ready');
          }
          setIsLoading(false);
          setIsConnecting(false);
        },
        onLoad: () => {
          // Keep loading state until actual connection starts
        },
        onEvent: (eventName: string) => {
          console.log("Plaid Link event:", eventName);
          if (eventName === 'OPEN') {
            setConnectionStep('connecting');
          }
        },
      });

      open();
    } catch (error: any) {
      console.error("Error opening Plaid Link:", error);
      setConnectionStep('error');
      setIsLoading(false);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error.message || "Failed to open bank connection. Please try again."
      });
    }
  };

  const getButtonContent = () => {
    switch (connectionStep) {
      case 'connecting':
        return (
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20 animate-pulse"></div>
            </div>
            <span>Opening Secure Connection...</span>
          </motion.div>
        );
      
      case 'processing':
        return (
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Sparkles className="h-4 w-4 animate-bounce" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 opacity-20 animate-pulse"></div>
            </div>
            <span>Processing Connection...</span>
          </motion.div>
        );
      
      case 'success':
        return (
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </motion.div>
            <span>Connected Successfully!</span>
          </motion.div>
        );
      
      case 'error':
        return (
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span>Connection Failed - Retry</span>
          </motion.div>
        );
      
      default:
        return (
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Shield className="h-4 w-4" />
            <span>{children || "Connect Bank Account Securely"}</span>
          </motion.div>
        );
    }
  };

  const getButtonVariant = () => {
    if (connectionStep === 'success') return 'default';
    if (connectionStep === 'error') return 'destructive';
    return variant;
  };

  const getButtonClassName = () => {
    const baseClasses = "relative inline-flex items-center justify-center overflow-hidden transition-all duration-300";
    
    const stateClasses = {
      ready: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/25",
      connecting: "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg animate-pulse",
      processing: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25",
      success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25",
      error: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg hover:shadow-red-500/25"
    };

    return cn(baseClasses, stateClasses[connectionStep], className);
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: connectionStep === 'ready' ? 1.02 : 1 }}
        whileTap={{ scale: connectionStep === 'ready' ? 0.98 : 1 }}
      >
        <Button
          onClick={handleClick}
          disabled={!linkToken || !scriptLoaded || isLoading || connectionStep === 'success'}
          className={getButtonClassName()}
        >
          {/* Animated background effects */}
          <AnimatePresence>
            {connectionStep === 'connecting' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-400/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </AnimatePresence>

          {/* Button content */}
          <div className="relative z-10 font-semibold">
            {getButtonContent()}
          </div>

          {/* Success particles */}
          <AnimatePresence>
            {connectionStep === 'success' && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-emerald-300 rounded-full"
                    initial={{ 
                      opacity: 0,
                      x: '50%',
                      y: '50%',
                      scale: 0
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                      scale: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Security badges */}
      <AnimatePresence>
        {connectionStep === 'ready' && (
          <motion.div 
            className="flex items-center justify-center space-x-4 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[
              { icon: Lock, text: "256-bit SSL" },
              { icon: Shield, text: "Bank-grade Security" },
              { icon: CreditCard, text: "Read-only Access" }
            ].map((badge, index) => (
              <motion.div
                key={badge.text}
                className="flex items-center space-x-1 text-xs text-gray-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <badge.icon className="w-3 h-3" />
                <span>{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
