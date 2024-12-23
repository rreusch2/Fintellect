import { Bot } from "lucide-react";

interface AIDisclaimerProps {
  className?: string;
  variant?: "minimal" | "standard";
}

export function AIDisclaimer({ className = "", variant = "standard" }: AIDisclaimerProps) {
  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Bot className="h-4 w-4" />
        <span>AI-generated insights • Not financial advice</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 ${className}`}>
      <Bot className="h-5 w-5 text-primary/60" />
      <p className="text-sm text-muted-foreground">
        These insights are AI-generated based on your financial data. Consider them as suggestions, not professional financial advice.
      </p>
    </div>
  );
} 