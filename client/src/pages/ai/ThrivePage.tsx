import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CircleDollarSign } from "lucide-react";

// Define the expected structure of an insight (matching ThriveAgent.ts)
interface ThriveInsight {
  type: "optimization" | "pattern" | "alert" | "suggestion";
  title: string;
  description: string;
  actionable_tip?: string;
  potential_savings?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category_focus?: string;
}

// Async function to fetch insights from the backend
const fetchThriveInsights = async (): Promise<ThriveInsight[]> => {
  const response = await fetch("/api/ai/thrive/insights", {
    method: "GET",
    credentials: "include", // Important for session cookies
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    let errorMsg = "Failed to fetch Thrive insights";
    try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
    } catch (e) { /* Ignore if response is not JSON */ }
    throw new Error(errorMsg);
  }

  return response.json();
};

export default function ThrivePage() {
  usePageTitle("Thrive - Expense Optimizer");

  const { data: insights, isLoading, isError, error } = useQuery<ThriveInsight[], Error>({
    queryKey: ['thriveInsights'], // Unique key for this query
    queryFn: fetchThriveInsights,
    // Optional: Add staleTime or cacheTime if needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-background text-foreground dark flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="flex items-center gap-3 mb-6">
           <div className={`p-3 rounded-lg bg-green-500/10 text-green-400 w-fit`}>
              <CircleDollarSign className="h-6 w-6" />
            </div>
          <h1 className="text-3xl font-bold">Thrive - Expense Optimizer</h1>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Generating expense insights...</span>
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message || "Could not load expense optimization insights. Please try again later."}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && insights && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <Card key={index} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                       {/* Can add icons based on insight.type later */}
                       {insight.title}
                    </CardTitle>
                    <CardDescription>Priority: {insight.priority} {insight.category_focus ? `(${insight.category_focus})` : ''}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.actionable_tip && (
                        <p className="text-sm font-semibold">Tip: <span className="font-normal">{insight.actionable_tip}</span></p>
                    )}
                    {insight.potential_savings && (
                        <p className="text-sm font-semibold">Savings: <span className="font-normal text-green-400">{insight.potential_savings}</span></p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground col-span-full text-center">No specific expense optimization insights available at the moment.</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 