import { Sparkles } from "lucide-react";

export function BetaBanner() {
  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/10">
      <div className="container mx-auto px-4 py-1 text-xs text-center flex items-center justify-center gap-2 text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        <span>
          Welcome to the Fintellect Beta! Help us improve by sharing your feedback
        </span>
      </div>
    </div>
  );
} 