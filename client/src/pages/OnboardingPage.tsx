import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Shield, FileText, Bot } from "lucide-react";
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
    if (!user) return;
    
    if (user.hasCompletedOnboarding && user.hasPlaidSetup) {
      setLocation("/dashboard");
    } else if (user.consentVersion) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [user, setLocation]);

  const acceptTerms = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          termsVersion: getLatestVersion('terms-service')?.version,
          privacyVersion: getLatestVersion('privacy-policy')?.version,
          consentDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save consent");
      }

      return response.json();
    },
    onSuccess: async () => {
      await refetch();
      setStep(2);
      toast({
        title: "Terms Accepted",
        description: "Thank you for accepting our terms and privacy policy.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
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
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      await refetch();
      toast({
        title: "Success",
        description: "Bank account connected successfully",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete bank account setup",
      });
    }
  };

  const handleDemoMode = async () => {
    setIsDemoLoading(true);
    try {
      const response = await fetch('/api/plaid/demo', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to enable demo mode');
      }

      setDemoMode(true);
      window.location.href = '/dashboard';
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enable demo mode"
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <Card className="w-full max-w-lg bg-gray-900/50 backdrop-blur-sm border-gray-800 relative z-10">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
            Setup Your Account
          </CardTitle>
          <CardDescription className="text-gray-400">
            Step {step} of 2: {stepDescription(step)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium text-white">Legal Agreement</h3>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  Before you start using our services, please review and accept our Terms of Service and Privacy Policy.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Accept Terms of Service
                      </label>
                      <p className="text-sm text-gray-400">
                        <button
                          type="button"
                          onClick={() => openModalWithTab("terms")}
                          className="text-blue-400 hover:underline"
                        >
                          Read Terms of Service
                        </button>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="privacy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Accept Privacy Policy
                      </label>
                      <p className="text-sm text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => openModalWithTab("privacy")}
                          className="text-primary hover:underline"
                        >
                          Read Privacy Policy
                        </button>
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => openModalWithTab("terms")}
                    className="w-full border-blue-500/20 hover:bg-blue-500/10"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Review Terms & Privacy
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleTermsAccept}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={acceptTerms.isPending || !termsAccepted || !privacyAccepted}
              >
                {acceptTerms.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium text-white">Connect Your Bank</h3>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  Connect your bank account to enable automatic transaction tracking and personalized insights.
                </p>
                <div className="flex flex-col gap-4">
                  <PlaidLink 
                    onSuccess={handlePlaidSuccess}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Connect Bank Account
                  </PlaidLink>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-2 text-gray-400">Or</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDemoMode}
                    disabled={isDemoLoading}
                    className="w-full bg-gray-800/50 hover:bg-gray-800/70 border-gray-700"
                  >
                    {isDemoLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Setting up demo...
                      </span>
                    ) : (
                      "Try Demo Mode"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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