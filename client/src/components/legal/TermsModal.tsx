import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Shield, Lock, FileText, Bot, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  variant?: "signup" | "view" | "update";
  defaultTab?: "terms" | "privacy";
}

export function TermsModal({ 
  open, 
  onOpenChange, 
  onAccept, 
  variant = "view",
  defaultTab = "terms"
}: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {variant === "signup" ? "Terms of Service & Privacy Policy" : "Legal Documents"}
          </DialogTitle>
          <DialogDescription>
            {variant === "signup" 
              ? "Please review our terms and privacy policy carefully"
              : "Review our legal documents and policies"}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-4 py-3 h-[500px]">
            <TabsContent value="terms" className="mt-0 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  <h3 className="font-semibold">Data Protection</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We use industry-standard encryption to protect your financial data. Your bank credentials are never stored on our servers and are handled securely through Plaid.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Bot className="h-5 w-5" />
                  <h3 className="font-semibold">AI Services</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our AI-powered insights are for informational purposes only and should not be considered professional financial advice. The accuracy of insights depends on the data available and market conditions.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-semibold">Data Usage</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your financial data is used solely to provide personalized insights and improve our services. We never sell your data to third parties. Read our full Privacy Policy for details on data handling practices.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Lock className="h-5 w-5" />
                  <h3 className="font-semibold">Plaid Integration</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We use Plaid to securely connect to your financial institutions. By using our service, you also agree to Plaid's Privacy Policy and Terms of Service.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://plaid.com/legal" target="_blank" rel="noopener noreferrer">
                      Plaid Privacy Policy
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://plaid.com/legal" target="_blank" rel="noopener noreferrer">
                      Plaid Terms
                    </a>
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <UserCheck className="h-5 w-5" />
                  <h3 className="font-semibold">Your Responsibilities</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  You are responsible for maintaining the security of your account credentials and verifying any financial decisions. We recommend enabling two-factor authentication and regularly reviewing your connected accounts.
                </p>
              </section>
            </TabsContent>

            <TabsContent value="privacy" className="mt-0 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Lock className="h-5 w-5" />
                  <h3 className="font-semibold">Data Usage</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We use your data to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Provide personalized financial insights and recommendations</li>
                  <li>Improve our AI models and service accuracy</li>
                  <li>Maintain and enhance our services</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Lock className="h-5 w-5" />
                  <h3 className="font-semibold">Plaid Integration</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We use Plaid to securely connect to your financial institutions. By using our service, you also agree to Plaid's Privacy Policy and Terms of Service.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://plaid.com/legal" target="_blank" rel="noopener noreferrer">
                      Plaid Privacy Policy
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://plaid.com/legal" target="_blank" rel="noopener noreferrer">
                      Plaid Terms
                    </a>
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <UserCheck className="h-5 w-5" />
                  <h3 className="font-semibold">Your Responsibilities</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  You are responsible for maintaining the security of your account credentials and verifying any financial decisions. We recommend enabling two-factor authentication and regularly reviewing your connected accounts.
                </p>
              </section>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {variant === "signup" && (
            <Button onClick={onAccept} className="gap-2">
              <Shield className="h-4 w-4" />
              Accept All Terms
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 