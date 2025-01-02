import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import {
  TrendingUp,
  LineChart,
  PieChart,
  AlertCircle,
  Lock,
  Sparkles,
  ArrowUpRight,
  DollarSign,
  Loader2,
} from "lucide-react";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { Navigation } from "@/components/layout/Navigation";
import InvestmentProfileForm from "@/components/investment/InvestmentProfileForm";
import { motion } from "framer-motion";

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
  const { user } = useUser();
  const { toast } = useToast();

  const { data: advice, isLoading, isError } = useQuery<InvestmentAdvice>({
    queryKey: ["investment-advice"],
    queryFn: async () => {
      const response = await fetch("/api/investment/advice");
      if (!response.ok) throw new Error("Failed to fetch investment advice");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
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
      <Navigation />

      {/* Add Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Work in Progress Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 rounded-full bg-blue-500/10">
                  <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Enhanced Investment Features Coming Soon!
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    We're working on bringing you a powerful investment strategy platform with AI-driven insights and personalized portfolio recommendations. Stay tuned for the update!
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                    <Badge variant="secondary" className="bg-blue-500/10">
                      AI-Powered Insights
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/10">
                      Portfolio Analysis
                    </Badge>
                    <Badge variant="secondary" className="bg-cyan-500/10">
                      Smart Recommendations
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-[400px,1fr] opacity-50 pointer-events-none">
          {/* Investment Profile Form */}
          <div>
            <InvestmentProfileForm />
          </div>

          {/* AI Investment Advice */}
          <div className="space-y-6">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-[400px] gap-4"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Analyzing your investment profile with Google Gemini AI...
                </p>
              </motion.div>
            ) : isError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-muted-foreground">
                    Failed to load investment advice. Please try again later.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : advice ? (
              <>
                {/* AI Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
                    <CardHeader>
                      <div className="space-y-3">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI Investment Summary
                        </CardTitle>
                        <AIDisclaimer variant="minimal" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium">
                            {advice.riskProfile.label} Investor Profile
                          </span>
                          <Badge variant="outline" className="bg-primary/10">
                            Risk Score: {advice.riskProfile.score}/10
                          </Badge>
                        </div>
                        <Progress
                          value={advice.riskProfile.score * 10}
                          className="h-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          {advice.riskProfile.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Portfolio Strategy */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" />
                        Personalized Portfolio Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {advice.portfolioRecommendations.map((rec, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    rec.risk === "Low"
                                      ? "default"
                                      : rec.risk === "Medium"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="w-20 justify-center"
                                >
                                  {rec.risk} Risk
                                </Badge>
                                <span className="font-medium">
                                  {rec.assetClass}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                {rec.allocation}%
                              </span>
                            </div>
                            <Progress
                              value={rec.allocation}
                              className="h-2"
                            />
                            <p className="text-sm text-muted-foreground">
                              {rec.reasoning}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Market Insights Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Current Market Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LineChart className="h-5 w-5 text-primary" />
                          Market Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              Current Trends
                            </h3>
                            <ul className="space-y-2">
                              {advice.marketAnalysis.trends.map((trend, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-muted-foreground"
                                >
                                  • {trend}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              Risk Factors
                            </h3>
                            <ul className="space-y-2">
                              {advice.marketAnalysis.risks.map((risk, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-muted-foreground"
                                >
                                  • {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Investment Opportunities */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Investment Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {advice.marketAnalysis.opportunities.map((opp, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg bg-primary/5 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-sm">
                                  Opportunity {index + 1}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {opp}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>

                {/* AI Investment Tips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    {advice.insights.map((insight, index) => (
                      <Card
                        key={index}
                        className={insight.isPremium ? "opacity-75 hover:opacity-100 transition-opacity" : ""}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                              {insight.type === "opportunity" && (
                                <Sparkles className="h-5 w-5 text-green-500" />
                              )}
                              {insight.type === "warning" && (
                                <AlertCircle className="h-5 w-5 text-destructive" />
                              )}
                              {insight.type === "tip" && (
                                <DollarSign className="h-5 w-5 text-primary" />
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
                              Upgrade for Full Insight
                              <Lock className="h-4 w-4 ml-2" />
                            </Button>
                          ) : (
                            <Badge
                              variant="outline"
                              className="w-full justify-center bg-primary/5"
                            >
                              {insight.impact}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
      <BetaFeedback />
    </div>
  );
}
