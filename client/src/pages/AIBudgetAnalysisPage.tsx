import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import {
  Bot,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  LayoutDashboard,
  Download,
  Sparkles,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { CreateBudgetDialog } from "@/components/Budget/CreateBudgetDialog";
import { useToast } from "@/hooks/use-toast";
import CategoryBreakdown from "@/components/Dashboard/BudgetAnalysis/CategoryBreakdown";
import SpendingTrends from "@/components/Dashboard/BudgetAnalysis/SpendingTrends";
import RecurringExpenses from "@/components/Dashboard/BudgetAnalysis/RecurringExpenses";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert"; // Added import for Alert component
import { Progress } from "@/components/ui/progress"; // Added import for Progress component


interface BudgetAnalysis {
  overview: {
    totalSpend: number;
    monthOverMonthChange: number;
    topCategories: {
      category: string;
      amount: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      color: string;
    }[];
    monthlyIncome?: number;
    savingsRate?: number;
  };
  insights: {
    category: string;
    finding: string;
    potentialSavings: number;
    suggestedAction: string;
    impact?: {
      monthly: number;
      yearly: number;
    };
  }[];
  recommendations: {
    title: string;
    description: string;
    effort: 'easy' | 'medium' | 'hard';
    impact: string;
    timeframe: 'immediate' | 'short-term' | 'long-term';
    steps?: string[];
  }[];
  recurringExpenses?: {
    merchantName: string;
    category: string;
    averageAmount: number;
    frequency: string;
    lastCharged: string;
  }[];
}

export default function AIBudgetAnalysisPage() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: analysis, isLoading } = useQuery<BudgetAnalysis>({
    queryKey: ["/api/ai/budget-analysis"],
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch("/api/ai/budget-analysis/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "budget-analysis.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Your budget analysis report has been downloaded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download the report. Please try again.",
      });
    }
  };

  if (isLoading || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AlertCircle className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">AI Budget Analysis</h1>
            <CreateBudgetDialog 
              categories={analysis.overview.topCategories.map(cat => ({
                category: cat.category,
                amount: cat.amount
              }))}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/goals" className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/ai/hub" className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Hub
                </Link>
              </Button>
            </div>
            <span className="text-sm">Welcome, {user?.username}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Budget Overview
              </h2>
              <p className="text-sm text-muted-foreground">
                AI-powered insights and recommendations for your spending
              </p>
            </div>
            <Button onClick={handleDownloadReport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(analysis.overview.totalSpend / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.overview.monthOverMonthChange >= 0 ? "+" : ""}
                  {analysis.overview.monthOverMonthChange}% from last month
                </p>
              </CardContent>
            </Card>

            {analysis.overview.topCategories.slice(0, 3).map((category, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {category.category}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(category.amount / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Financial Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.overview.topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm text-muted-foreground">
                          ${(category.amount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(category.amount / analysis.overview.totalSpend * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Spending</span>
                      <span className="text-sm text-muted-foreground">
                        ${(analysis.overview.totalSpend / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${
                      analysis.overview.monthOverMonthChange > 0 
                        ? 'text-red-500' 
                        : 'text-green-500'
                    }`}>
                      {analysis.overview.monthOverMonthChange > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      <span className="text-sm">
                        {analysis.overview.monthOverMonthChange > 0 ? '+' : ''}
                        {analysis.overview.monthOverMonthChange.toFixed(1)}% from last month
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights and Recommendations */}
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Insights
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Personalized analysis of your spending patterns
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 space-y-3 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold flex items-center gap-2 text-primary">
                          {insight.category}
                          {insight.impact && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="animate-pulse">
                                    ${(insight.impact.yearly / 100).toFixed(0)}/year
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Potential yearly impact if implemented</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </h3>
                        <Badge variant={insight.potentialSavings > 5000 ? "destructive" : "default"}>
                          ${(insight.potentialSavings / 100).toFixed(2)}/mo savings
                        </Badge>
                      </div>
                      
                      <p className="text-sm">
                        {insight.finding}
                      </p>
                      
                      <div className="bg-accent/50 p-3 rounded-lg space-y-2">
                        <p className="text-sm font-medium">Recommended Action:</p>
                        <p className="text-sm text-muted-foreground">
                          {insight.suggestedAction}
                        </p>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full mt-2"
                        >
                          Take Action
                          <ArrowUpRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Action Plan
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Strategic recommendations to improve your finances
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="group p-4 rounded-lg border bg-card hover:bg-accent/50 space-y-3 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-primary">{rec.title}</h3>
                        <Badge 
                          variant={
                            rec.effort === 'easy' ? 'default' : 
                            rec.effort === 'medium' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {rec.effort} effort
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="group-hover:bg-background/50">
                          {rec.impact}
                        </Badge>
                        <Badge variant="outline" className="group-hover:bg-background/50">
                          {rec.timeframe}
                        </Badge>
                      </div>
                      
                      {rec.steps && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm font-medium">Steps to take:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {rec.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}