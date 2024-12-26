import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Sparkles, Send, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeatureRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureRequestModal({ open, onOpenChange }: FeatureRequestModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");

  // Replace this URL with your Google Apps Script Web App URL
  const SUBMISSION_URL = "https://script.google.com/macros/s/AKfycbyF7K6G9oKkERvtJj5X-FaTYWaIEzGaD-YxVeBoeHvFM8HPF7dzfsC56DTug3eQk-ob/exec";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      useCase: formData.get("useCase"),
    };

    try {
      const response = await fetch(SUBMISSION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(data)
      });

      // Since we're using no-cors, assume success if no error
      toast({
        title: "Feature Request Submitted",
        description: "Thank you for your suggestion! We'll review your idea.",
        variant: "default",
      });
      
      onOpenChange(false);
      setDescription("");
      setUseCase("");
      
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit feature request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl mb-3">
            <Sparkles className="h-6 w-6 text-primary" />
            Request AI Feature
          </DialogTitle>
          
          <DialogDescription className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-base font-medium text-foreground">
                Help Shape Fintellect's Future
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're building advanced AI features to transform personal finance, and we value your innovative ideas.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-4">
                <Lightbulb className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">
                    Share Your Vision
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your ideas help shape our platform's future. We recognize community members whose suggestions 
                    inspire new features.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-border/10 mt-4 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Feature Name</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="Give your AI feature idea a name"
                  maxLength={100}
                  className="transition-all hover:border-primary/50 focus:border-primary"
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  Max 100 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What would this AI feature do?</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how this AI feature would work..."
                  className="h-24 transition-all hover:border-primary/50 focus:border-primary"
                  maxLength={500}
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  {description.length}/500 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="useCase">How would this benefit users?</Label>
                <Textarea
                  id="useCase"
                  name="useCase"
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="Explain how this feature would enhance users' financial management..."
                  className="h-24 transition-all hover:border-primary/50 focus:border-primary"
                  maxLength={300}
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  {useCase.length}/300 characters
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 