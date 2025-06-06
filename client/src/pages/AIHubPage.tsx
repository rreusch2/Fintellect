import React, { useState } from 'react';
import { useUser } from "../hooks/use-user.js";
import { Button } from "../components/ui/button.jsx";
import { useLocation, Link } from "wouter";
import { Navigation } from "../components/layout/Navigation.jsx";
import { 
  Bot, 
  Brain, 
  CircleDollarSign, 
  Calculator,
  Sparkles,
  Rocket,
  MessageSquarePlus,
  Shield,
  Clock,
  Zap,
  Lock,
  Radar
} from "lucide-react";
import { AIDisclaimer } from "../components/legal/AIDisclaimer.jsx";
import { motion } from "framer-motion";
import { BetaFeedback } from "../components/feedback/BetaFeedback.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip.jsx";
import { useToast } from "../hooks/use-toast.js";
import { Footer } from "../components/layout/Footer.jsx";
import { FeatureRequestModal } from "../components/ai/FeatureRequestModal.jsx";
import { usePageTitle } from "../hooks/use-page-title.js";

const aiServices = [
  {
    title: "Nexus Analyst",
    description: "Your financial markets research specialist. Get in-depth stock analysis, sentiment tracking, financial statement breakdowns, and investment recommendations.",
    icon: Radar,
    features: [
      "Stock and investment research",
      "Sentiment analysis",
      "Financial statement analysis",
      "Market trend identification"
    ],
    route: "/nexus/analyst",
    color: "bg-indigo-500/10 text-indigo-400",
    status: "active"
  },
  {
    title: "AI Financial Assistant",
    description: "Your personal AI-powered financial advisor available 24/7. Get real-time insights, spending analysis, and personalized recommendations through natural conversation.",
    icon: Bot,
    features: [
      "Real-time financial guidance",
      "Natural language processing",
      "Personalized recommendations",
      "Transaction analysis"
    ],
    route: "/ai/assistant",
    color: "bg-blue-500/10 text-blue-400",
    status: "active"
  },
  {
    title: "AI Investment Strategist",
    description: "Harness the power of AI to analyze your financial profile and create personalized investment strategies. Get dynamic portfolio recommendations, risk assessments, and market insights tailored to your goals.",
    icon: Brain,
    features: [
      "Smart portfolio optimization",
      "AI risk analysis",
      "Real-time market insights",
      "Intelligent goal planning"
    ],
    route: "/ai/investment",
    color: "bg-purple-500/10 text-purple-400",
    status: "active"
  },
  {
    title: "Thrive - Expense Optimizer",
    description: "Your resourceful ally for finding savings and optimization opportunities in your spending. Get actionable recommendations to reduce costs and improve your financial efficiency.",
    icon: CircleDollarSign,
    features: [
      "Subscription optimization",
      "Bill negotiation assistance",
      "Spending pattern analysis",
      "Merchant comparison"
    ],
    route: "/ai/expense-optimizer",
    color: "bg-purple-500/10 text-purple-400",
    status: "active"
  }
];

const upcomingFeatures = [
  {
    title: "AI Budget Analyst",
    description: "Advanced AI-powered analysis of your spending patterns with predictive insights and intelligent optimization suggestions.",
    icon: CircleDollarSign,
    features: [
      "AI-driven spending analysis",
      "Smart budget optimization",
      "Automated savings detection"
    ],
    color: "bg-green-500/10 text-green-400"
  },
  {
    title: "AI Tax Strategist",
    description: "Intelligent tax optimization and planning powered by advanced AI analysis of your financial data.",
    icon: Calculator,
    features: [
      "AI tax optimization",
      "Smart deduction finder",
      "Proactive tax planning"
    ],
    color: "bg-orange-500/10 text-orange-400"
  }
];

const aiStats = [
  { value: "24/7", label: "AI Availability", icon: Clock },
  { value: "Bank-Grade", label: "Security", icon: Shield },
  { value: "Real-Time", label: "Analysis", icon: Sparkles },
  { value: "Plaid", label: "Integration", icon: Lock }
];

export default function AIHubPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);

  const navigateToService = (route: string) => {
    setLocation(route);
  };

  const handleFeatureRequest = () => {
    setShowFeatureRequest(true);
  };

  usePageTitle('AI Hub');

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      <Navigation />

      {/* Particle Animation Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        {/* Hero Section with Stats */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
              AI-Powered Financial Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Experience the future of finance with our advanced AI technologies
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
              {aiStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-primary/20 transition-all duration-300"
                >
                  <stat.icon className="h-5 w-5 text-primary/60 mb-2 mx-auto" />
                  <div className="text-lg font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Disclaimer - moved closer to stats */}
        <div className="max-w-5xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AIDisclaimer />
          </motion.div>
        </div>

        {/* Available Services Section - moved up */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-2xl font-semibold">Available Services</h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {aiServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-lg bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col"
              >
                <div className={`p-3 rounded-lg ${service.color} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-6">{service.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {service.features.map((feature, i) => (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          {feature}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Advanced AI Feature</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>

                <div className="mt-auto">
                  <Button 
                    onClick={() => navigateToService(service.route)}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary group-hover:bg-primary/20"
                  >
                    Access Service
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Coming Soon Section - adjusted spacing */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h3 className="text-2xl font-semibold">Coming Soon</h3>
            </div>
            <Button
              onClick={handleFeatureRequest}
              variant="outline"
              className="gap-2"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Request Feature
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {upcomingFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-6 rounded-lg bg-gray-900/50 backdrop-blur-sm border border-gray-800 relative overflow-hidden group"
              >
                <div className="flex items-start gap-6">
                  <div className={`p-3 rounded-lg ${feature.color} w-fit group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {feature.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          {feat}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Add Footer */}
      <Footer />
      <BetaFeedback />

      <FeatureRequestModal 
        open={showFeatureRequest} 
        onOpenChange={setShowFeatureRequest}
      />
    </div>
  );
}
