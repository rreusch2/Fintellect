import { Lightbulb } from "lucide-react";

interface UsageTipProps {
  title: string;
  description: string;
}

export function UsageTip({ title, description }: UsageTipProps) {
  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-blue-500" />
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
} 