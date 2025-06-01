import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Shield, FileText, Bot, ArrowLeft, CheckCircle, Sparkles, Lock, Globe } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PlaidLink from "@/components/Plaid/PlaidLink";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useMutation } from "@tanstack/react-query";
import { TermsModal } from "@/components/legal/TermsModal";
import { getLatestVersion } from "@/lib/legal/versions";
import { isDemoMode, setDemoMode } from "@/lib/demo";
import { usePageTitle } from "@/hooks/use-page-title";

function stepDescription(step: number): string {
  switch (step) {
    case 1:
      return "Terms & Privacy";
    case 2:
      return "Connect Your Bank";
    default:
      return "";
  }
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, refetch } = useUser();
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    console.log('User state in OnboardingPage:', user);
    if (!user) return;
    
    if (user.hasCompletedOnboarding && user.hasPlaidSetup) {
      console.log('User has completed onboarding and Plaid setup, redirecting to dashboard');
      setLocation("/dashboard");
    } else if (user.consentVersion) {
      console.log('User has accepted terms, showing Plaid setup step');
      setStep(2);
    } else {
      console.log('User needs to accept terms first');
      setStep(1);
    }
  }, [user, setLocation]);

  const acceptTerms = useMutation({
    mutationFn: async () => {
      console.log('Submitting consent with credentials');
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Cookie': document.cookie
      });
      
      const payload = {
        termsVersion: getLatestVersion('terms-service')?.version,
        privacyVersion: getLatestVersion('privacy-policy')?.version,
        consentDate: new Date().toISOString(),
      };
      
      console.log('Consent payload:', payload);
      
      const response = await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log('Consent response status:', response.status);
      console.log('Consent response headers:', {
        'set-cookie': response.headers.get('set-cookie'),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Consent submission failed:', response.status, errorText);
        throw new Error(errorText || "Failed to save consent");
      }

      console.log('Consent submission successful');
      const data = await response.json();
      console.log('Consent response data:', data);
      return data;
    },
    onSuccess: async (data) => {
      console.log('Consent saved successfully, refetching user data');
      // Update the user data with the response from the server
      const result = await refetch();
      console.log('User data after consent:', result.data);
      
      setStep(2);
      toast({
        title: "Terms Accepted",
        description: "Thank you for accepting our terms and privacy policy.",
      });
    },
    onError: (error: Error) => {
      console.error('Consent mutation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save consent. Please try again.",
      });
    },
  });

  const handleTermsAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast({
        variant: "destructive",
        title: "Required",
        description: "You must accept both the Terms of Service and Privacy Policy to continue.",
      });
      return;
    }
    acceptTerms.mutate();
  };

  const handlePlaidSuccess = async () => {
    try {
      console.log('Completing onboarding after Plaid setup');
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Cookie': document.cookie
      });
      
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      console.log('Complete onboarding response status:', response.status);
      console.log('Complete onboarding response headers:', {
        'set-cookie': response.headers.get('set-cookie'),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Complete onboarding failed:', response.status, errorText);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to complete onboarding. Please try again.",
        });
        throw new Error(errorText || "Failed to complete onboarding");
      }

      const data = await response.json();
      console.log('Onboarding completed successfully, user data:', data.user);
      
      // Refetch user data to ensure we have the latest state
      console.log('Refetching user data after completing onboarding');
      await refetch();
      
      toast({
        title: "Success",
        description: "Bank account connected successfully",
      });
      
      // Use setLocation instead of window.location for a smoother transition
      // that preserves React state
      console.log('Redirecting to dashboard after successful onboarding');
      setLocation("/dashboard");
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error
          ? (error as Error).message
          : "Failed to complete bank account setup",
      });
    }
  };

  const handleDemoMode = async () => {
    setIsDemoLoading(true);
    try {
      console.log('Enabling demo mode');
      const response = await fetch('/api/plaid/demo', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Demo mode activation failed:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to enable demo mode');
      }

      console.log('Demo mode enabled successfully');
      setDemoMode(true);
      
      // Complete onboarding for demo mode
      const onboardingResponse = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!onboardingResponse.ok) {
        console.warn('Demo mode enabled but onboarding completion failed');
      } else {
        console.log('Demo mode onboarding completed successfully');
      }
      
      // Refetch user data to ensure we have the latest state
      await refetch();
      
      // Use setLocation instead of window.location for a smoother transition
      setLocation('/dashboard');
    } catch (error) {
      console.error('Error enabling demo mode:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error
          ? (error as Error).message
          : "Failed to enable demo mode"
      });
    } finally {
      setIsDemoLoading(false);
    }
  };

  const openModalWithTab = (tab: "terms" | "privacy") => {
    setActiveTab(tab);
    setShowTerms(true);
  };

  usePageTitle('Get Started');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-gray-400">Loading your account...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20 border-b border-cyan-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">
                Fintellect
              </span>
              <div className="hidden sm:flex items-center px-2 py-1 rounded-full border bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-sm">
                <span className="text-[11px] font-semibold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  BETA
                </span>
              </div>
            </Link>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= 1 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <div className={`w-12 h-0.5 transition-all duration-300 ${
                  step >= 2 ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gray-700'
                }`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= 2 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  2
                </div>
              </div>
            </div>

            {/* Back Button */}
            <Link href="/auth">
              <Button variant="ghost" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center pt-20">
        {/* Enhanced Background */}
        <div className="absolute inset-0">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900"></div>
          
          {/* Floating shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute top-1/4 left-1/5 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
              animate={{ 
                y: [0, -20, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute bottom-1/4 right-1/5 w-48 h-48 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl"
              animate={{ 
                y: [0, 25, 0],
                x: [0, -20, 0],
                scale: [1, 0.9, 1]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />
          </div>
          
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        </div>

        {/* Floating Step Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/12"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 3, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut"
            }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute top-1/3 right-1/12"
            animate={{ 
              y: [0, 12, 0],
              rotate: [0, -3, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute bottom-1/3 left-1/8"
            animate={{ 
              y: [0, -10, 0],
              x: [0, 8, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-400/25 backdrop-blur-sm border border-cyan-300/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-300" />
            </div>
          </motion.div>
        </div>

        {/* Onboarding Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg mx-4"
        >
          <Card className="backdrop-blur-md bg-gray-900/40 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-lg"></div>
            
            <CardHeader className="relative z-10 text-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </motion.div>
              
              <div>
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  Setup Your{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Account
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Step {step} of 2: {stepDescription(step)}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-transparent backdrop-blur-sm">
                      {/* Subtle animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5"></div>
                      
                      <div className="relative p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur-sm">
                            <Shield className="h-5 w-5 text-cyan-400" />
                          </div>
                          <h3 className="font-semibold text-white text-lg">Legal Agreement</h3>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                          Before you start using our services, please review and accept our Terms of Service and Privacy Policy to ensure a secure and compliant experience.
                        </p>
                        
                        <div className="space-y-4">
                          <motion.div 
                            className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-cyan-500/30 transition-colors duration-300"
                            whileHover={{ scale: 1.02 }}
                          >
                            <Checkbox
                              id="terms"
                              checked={termsAccepted}
                              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                              className="mt-0.5 border-gray-600 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-600"
                            />
                            <div className="grid gap-1.5 leading-none flex-1">
                              <label
                                htmlFor="terms"
                                className="text-sm font-medium text-white leading-none cursor-pointer"
                              >
                                Accept Terms of Service
                              </label>
                              <p className="text-sm text-gray-400">
                                <button
                                  type="button"
                                  onClick={() => openModalWithTab("terms")}
                                  className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                                >
                                  Read Terms of Service →
                                </button>
                              </p>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-cyan-500/30 transition-colors duration-300"
                            whileHover={{ scale: 1.02 }}
                          >
                            <Checkbox
                              id="privacy"
                              checked={privacyAccepted}
                              onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                              className="mt-0.5 border-gray-600 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-600"
                            />
                            <div className="grid gap-1.5 leading-none flex-1">
                              <label
                                htmlFor="privacy"
                                className="text-sm font-medium leading-none cursor-pointer text-white"
                              >
                                Accept Privacy Policy
                              </label>
                              <p className="text-sm text-gray-400">
                                <button
                                  type="button"
                                  onClick={() => openModalWithTab("privacy")}
                                  className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                                >
                                  Read Privacy Policy →
                                </button>
                              </p>
                            </div>
                          </motion.div>
                          
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              variant="outline" 
                              onClick={() => openModalWithTab("terms")}
                              className="w-full border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400/50 text-gray-300 hover:text-white transition-all duration-300"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Review Full Terms & Privacy
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleTermsAccept}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 border-0"
                        disabled={acceptTerms.isPending || !termsAccepted || !privacyAccepted}
                      >
                        {acceptTerms.isPending ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <span className="flex items-center justify-center space-x-2">
                            <span>Continue to Bank Connection</span>
                            <motion.div
                              animate={{ x: [0, 3, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              →
                            </motion.div>
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-transparent backdrop-blur-sm">
                      <div className="relative p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur-sm">
                            <Bot className="h-5 w-5 text-cyan-400" />
                          </div>
                          <h3 className="font-semibold text-white text-lg">Connect Your Bank</h3>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                          Securely connect your bank account with Plaid integration to enable automatic transaction tracking, spending analysis, and personalized financial insights.
                        </p>
                        
                        <div className="space-y-4">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <PlaidLink 
                              onSuccess={handlePlaidSuccess}
                              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 font-semibold flex items-center justify-center space-x-2"
                            >
                              <Lock className="w-4 h-4" />
                              <span>Connect Bank Account Securely</span>
                            </PlaidLink>
                          </motion.div>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-gray-900 px-3 text-gray-400 font-medium">Or</span>
                            </div>
                          </div>
                          
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              onClick={handleDemoMode}
                              disabled={isDemoLoading}
                              className="w-full bg-gray-800/30 hover:bg-gray-800/50 border-gray-600/50 hover:border-gray-500 text-gray-300 hover:text-white transition-all duration-300"
                            >
                              {isDemoLoading ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Setting up demo...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <Globe className="w-4 h-4" />
                                  Try Demo Mode
                                </span>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                        
                        {/* Security badges */}
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                          {['Bank-level Security', '256-bit Encryption', 'Read-only Access'].map((badge, index) => (
                            <motion.div
                              key={badge}
                              className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded-full text-xs text-gray-400 backdrop-blur-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                            >
                              {badge}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <TermsModal 
        open={showTerms} 
        onOpenChange={setShowTerms}
        onAccept={() => {
          setTermsAccepted(true);
          setPrivacyAccepted(true);
          setShowTerms(false);
        }}
        variant="signup"
        defaultTab={activeTab}
      />
    </div>
  );
}