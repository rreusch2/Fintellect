import { Shield, FileText, ExternalLink, Info } from "lucide-react";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { useState } from "react";
import { TermsModal } from "@/components/legal/TermsModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/lib/constants";

export function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  const openModalWithTab = (tab: "terms" | "privacy") => {
    setActiveTab(tab);
    setShowTerms(true);
  };

  return (
    <>
      <footer className="border-t border-border/10 backdrop-blur-md bg-background/70 mt-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => openModalWithTab("terms")}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 group"
                    >
                      <FileText className="h-3 w-3" />
                      Terms of Service
                      <span className="text-xs text-muted-foreground/60 group-hover:text-primary/60">v1.0</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View our Terms of Service</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => openModalWithTab("privacy")}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 group"
                    >
                      <Shield className="h-3 w-3" />
                      Privacy Policy
                      <span className="text-xs text-muted-foreground/60 group-hover:text-primary/60">v1.0</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View our Privacy Policy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <a 
                href="https://plaid.com/legal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5"
              >
                <ExternalLink className="h-3 w-3" />
                Plaid Legal
              </a>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                {APP_CONFIG.COPYRIGHT_TEXT}
              </p>
              <div className="border-l border-border/10 pl-3">
                <AIDisclaimer variant="minimal" className="text-xs text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </footer>

      <TermsModal 
        open={showTerms} 
        onOpenChange={setShowTerms}
        defaultTab={activeTab}
        variant="view"
      />
    </>
  );
} 