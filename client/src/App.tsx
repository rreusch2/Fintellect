import "./index.css";
import React from 'react';
import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import OnboardingPage from "./pages/OnboardingPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import AIHubPage from "./pages/AIHubPage";
import AIBudgetPage from "./pages/AIBudgetPage";
import InvestmentStrategyPage from "./pages/InvestmentStrategyPage";
import GoalsPage from "./pages/GoalsPage";
import TransactionsPage from "./pages/TransactionsPage";
import TermsPage from "./pages/legal/TermsPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Public routes that don't require authentication
  const publicRoutes = (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route>
        <LandingPage />
      </Route>
    </Switch>
  );

  // Protected routes that require authentication
  const protectedRoutes = (
    <Switch>
      <Route path="/onboarding">
        {!user?.hasCompletedOnboarding ? (
          <OnboardingPage />
        ) : (
          <DashboardPage />
        )}
      </Route>
      <Route path="/dashboard">
        {user?.hasCompletedOnboarding ? (
          <DashboardPage />
        ) : (
          <OnboardingPage />
        )}
      </Route>
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/goals" component={GoalsPage} />
      <Route path="/ai/hub" component={AIHubPage} />
      <Route path="/ai/assistant" component={AIAssistantPage} />
      <Route path="/ai/budget" component={AIBudgetPage} />
      <Route path="/ai/investment" component={InvestmentStrategyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/profile" component={ProfileSettingsPage} />
      <Route>
        {user?.hasCompletedOnboarding ? (
          <DashboardPage />
        ) : (
          <OnboardingPage />
        )}
      </Route>
    </Switch>
  );

  return (
    <ErrorBoundary>
      {user ? protectedRoutes : publicRoutes}
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
