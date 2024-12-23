import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation, Link } from "wouter";
import {
  TrendingUp,
  LineChart,
  PieChart,
  AlertCircle,
  Lock,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Shield,
  Wallet,
  Target,
  Bot,
} from "lucide-react";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";

interface InvestmentAdvice {
  riskProfile: {
    score: number;
    label: "Conservative" | "Moderate" | "Aggressive";
    description: string;
  };
  portfolioRecommendations: Array<{
    assetClass: string;
    allocation: number;
    reasoning: string;
    risk: "Low" | "Medium" | "High";
  }>;
  insights: Array<{
    type: "opportunity" | "warning" | "tip";
    title: string;
    description: string;
    impact: string;
    isPremium?: boolean;
  }>;
  marketAnalysis: {
    trends: string[];
    opportunities: string[];
    risks: string[];
  };
}

export default function InvestmentStrategyPage() {
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const { data: advice, isLoading } = useQuery<InvestmentAdvice>({
    queryKey: ["/api/ai/investment-advice"],
  });

  if (isLoading || !advice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AlertCircle className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  const handleUpgrade = () => {
    toast({
      title: "Premium Feature",
      description: "Upgrade to access detailed investment insights and personalized recommendations.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Investment Strategy</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/transactions" className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Transactions
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
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="grid gap-6">
          {/* Risk Profile Section */}
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Risk Profile Analysis
                </CardTitle>
                <AIDisclaimer variant="minimal" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{advice.riskProfile.label}</span>
                  <Badge variant="secondary">{advice.riskProfile.score}/10</Badge>
                </div>
                <Progress value={advice.riskProfile.score * 10} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {advice.riskProfile.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Recommendations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Recommended Portfolio Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {advice.portfolioRecommendations.map((rec, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{rec.assetClass}</span>
                        <Badge
                          variant={
                            rec.risk === "Low"
                              ? "default"
                              : rec.risk === "Medium"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {rec.risk} Risk
                        </Badge>
                      </div>
                      <Progress value={rec.allocation} className="h-2" />
                      <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Market Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Current Trends</h3>
                    <ul className="space-y-2">
                      {advice.marketAnalysis.trends.map((trend, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Key Opportunities</h3>
                    <ul className="space-y-2">
                      {advice.marketAnalysis.opportunities.map((opp, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-green-500" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Risk Factors</h3>
                    <ul className="space-y-2">
                      {advice.marketAnalysis.risks.map((risk, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Insights */}
          <div className="grid gap-6 md:grid-cols-3">
            {advice.insights.map((insight, index) => (
              <Card key={index} className={insight.isPremium ? "opacity-75" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {insight.type === "opportunity" && (
                        <Sparkles className="h-5 w-5 text-green-500" />
                      )}
                      {insight.type === "warning" && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {insight.type === "tip" && (
                        <DollarSign className="h-5 w-5 text-blue-500" />
                      )}
                      {insight.title}
                    </CardTitle>
                    {insight.isPremium && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {insight.isPremium
                      ? insight.description.substring(0, 100) + "..."
                      : insight.description}
                  </p>
                  {insight.isPremium ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={handleUpgrade}
                    >
                      Upgrade to Premium
                      <Lock className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Badge variant="outline" className="w-full justify-center">
                      {insight.impact}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <BetaFeedback />
    </div>
  );
}
