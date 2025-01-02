import { Shield, Lock } from "lucide-react";

export function SecurityBadge() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Shield className="h-4 w-4" />
      <span>Bank-grade security</span>
      <Lock className="h-4 w-4" />
      <span>Plaid protected</span>
    </div>
  );
} 