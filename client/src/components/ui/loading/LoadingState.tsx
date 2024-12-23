import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
} 