import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

const tourSteps = [
  {
    title: "Welcome to Finance Dashboard",
    description: "Let's take a quick tour of the main features.",
    target: "dashboard-overview"
  },
  {
    title: "AI Assistant",
    description: "Get personalized financial advice and insights here.",
    target: "ai-assistant"
  },
  {
    title: "Financial Overview",
    description: "Track your total balance, spending, and savings at a glance.",
    target: "financial-overview"
  },
  {
    title: "Spending Trends",
    description: "Visualize your spending patterns over time.",
    target: "spending-trends"
  },
  {
    title: "AI Insights",
    description: "Get smart recommendations and analysis of your finances.",
    target: "ai-insights"
  }
];

export function FeatureTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    // Show tour only for new users
    if (user && !user.hasCompletedOnboarding) {
      setShowTour(true);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setShowTour(false);
    // Update user preferences
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCompletedOnboarding: true })
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  return (
    <Dialog open={showTour} onOpenChange={setShowTour}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tourSteps[currentStep].title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground">
            {tourSteps[currentStep].description}
          </p>
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setShowTour(false)}
            >
              Skip Tour
            </Button>
            <Button onClick={handleNext}>
              {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 