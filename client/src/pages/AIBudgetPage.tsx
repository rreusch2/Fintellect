import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PieChart, ArrowUpRight, TrendingUp, ArrowDown } from "lucide-react";
import type { BudgetAnalysis } from "../../server/services/ai/agents/BudgetAnalysisAgent";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";

export default function AIBudgetPage() {
  const { data: analysis, isLoading } = useQuery<BudgetAnalysis>({
    queryKey: ["/api/ai/budget-analysis"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Unable to load budget analysis. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="h-8 w-8 text-primary" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">AI Budget Analysis</h1>
              <AIDisclaimer variant="minimal" />
            </div>
          </div>

          {/* Overview Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Spending Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Total Spend</p>
                  <p className="text-2xl font-bold">${(analysis.overview.totalSpend/100).toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>{analysis.overview.monthOverMonthChange}% vs last month</span>
                  </div>
                </div>
                {analysis.overview.topCategories.map((category, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">{category.category}</p>
                    <p className="text-2xl font-bold">${(category.amount/100).toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>{category.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.insights.map((insight, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <h3 className="font-semibold mb-2">{insight.category}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{insight.finding}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">
                          Potential Savings: ${(insight.potentialSavings/100).toFixed(2)}
                        </span>
                        <Button variant="outline" size="sm">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <h3 className="font-semibold mb-2">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {rec.effort} effort
                        </span>
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                          {rec.timeframe}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <BetaFeedback />
    </div>
  );
}
