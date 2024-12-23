import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { FeatureTour } from "@/components/onboarding/FeatureTour";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <BetaFeedback />
      <FeatureTour />
    </div>
  );
} 