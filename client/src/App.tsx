import "./index.css";
import React, { useEffect } from 'react';
import { Switch, Route, useLocation, Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import ContactPage from "./pages/ContactPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import OnboardingPage from "./pages/OnboardingPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import AIHubPage from "./pages/AIHubPage";
import AIBudgetPage from "./pages/AIBudgetPage";
import InvestmentStrategyPage from "./pages/InvestmentStrategyPage";
import ExpenseOptimizerPage from "./pages/ExpenseOptimizerPage";
import GoalsPage from "./pages/GoalsPage";
import TransactionsPage from "./pages/TransactionsPage";
import TermsPage from "./pages/legal/TermsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/toaster";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import AnalystPage from "./pages/nexus/AnalystPage";
import TestDaytona from "./pages/nexus/TestDaytona";

// Create a separate redirect component to handle navigation
function AIHubRedirect() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    navigate("/nexus/analyst");
  }, [navigate]);
  
  return null;
}

function App() {
  const { user, isLoading } = useUser();
  const [location, navigate] = useLocation();

  console.log('App render - Auth state:', { 
    isAuthenticated: !!user, 
    isLoading, 
    hasCompletedOnboarding: user?.hasCompletedOnboarding,
    currentPath: location
  });

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
      <Route path="/auth" component={AuthPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/">
        {location === '/' && <LandingPage />}
      </Route>
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
          <Redirect to="/dashboard" />
        )}
      </Route>
      <Route path="/dashboard">
        {user?.hasCompletedOnboarding ? (
          <DashboardPage />
        ) : (
          <Redirect to="/onboarding" />
        )}
      </Route>
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/goals" component={GoalsPage} />
      <Route path="/ai/hub" component={AIHubRedirect} />
      <Route path="/ai/assistant" component={AIAssistantPage} />
      <Route path="/ai/budget" component={AIBudgetPage} />
      <Route path="/ai/investment" component={InvestmentStrategyPage} />
      <Route path="/ai/expense-optimizer" component={ExpenseOptimizerPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/profile" component={ProfileSettingsPage} />
      <Route path="/nexus/analyst/:conversationId?" component={AnalystPage} />
      <Route path="/nexus/test-daytona" component={TestDaytona} />
      <Route path="/">
        {user?.hasCompletedOnboarding ? (
          <DashboardPage />
        ) : (
          <Redirect to="/onboarding" />
        )}
      </Route>
      <Route>
        {user?.hasCompletedOnboarding ? (
          <DashboardPage />
        ) : (
          <Redirect to="/onboarding" />
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
