import React, { useState } from 'react';
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter"; // Removed Link as it wasn't used
import { Navigation } from "@/components/layout/Navigation";
import {
  Bot,
  CircleDollarSign,
  Sparkles,
  Rocket,
  MessageSquarePlus,
  Shield,
  Clock,
  Lock,
  Radar // Removed Brain, Target, ClipboardList, Zap
} from "lucide-react";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { motion } from "framer-motion";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
// Removed Tooltip related imports as they are not used in the revised card structure
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/layout/Footer";
import { FeatureRequestModal } from "@/components/ai/FeatureRequestModal";
import { usePageTitle } from "@/hooks/use-page-title";

// Updated aiServices array
const aiServices = [
  {
    title: "Sentinel - Research Intelligence", // Or your preferred new name
    description: "Your autonomous research agent that monitors markets, news, and various data sources based on your preferences. Receive timely, actionable insights about potential opportunities and risks.",
    icon: Radar, // Changed icon
    features: [
      "Scheduled market research",
      "Data-driven insights",
      "News and trend analysis",
      "Customizable alert system"
    ],
    route: "/ai/sentinel",
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
    title: "Thrive - Expense Optimizer",
    description: "Your resourceful, practical ally for spending. Analyzes spending patterns in context of your lifestyle to find savings opportunities that respect your priorities.",
    icon: CircleDollarSign,
    features: [
      "Contextual spending analysis",
      "Subscription value assessment",
      "Personalized savings opportunities",
      "Bill negotiation insights"
    ],
    route: "/ai/thrive",
    color: "bg-green-500/10 text-green-400",
    status: "active"
  }
];


const upcomingFeatures = [];

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
        <div className="text-center mb-12"> {/* Increased bottom margin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
              AI-Powered Financial Services {/* Increased text size */}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8"> {/* Increased bottom margin */}
              Experience the future of finance with our advanced AI technologies
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10"> {/* Increased bottom margin */}
              {aiStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1 }} // Adjusted delay start
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

        {/* AI Disclaimer */}
        <div className="max-w-5xl mx-auto mb-12"> {/* Increased bottom margin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AIDisclaimer />
          </motion.div>
        </div>

        {/* Available Services Section - Updated */}
        <section className="mb-16"> {/* Increased bottom margin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mb-8" // Increased bottom margin
          >
            <h3 className="text-3xl font-semibold">Explore Our AI Services</h3> {/* Increased text size */}
            <span className="h-px w-1/3 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></span> {/* Adjusted width */}
          </motion.div>

          {/* Updated Grid Layout for 3 cards, centered */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"> {/* Increased gap and max-width */}
            {aiServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                // Add h-full for consistent height and highlight Sentinel
                className={`
                  group p-6 rounded-lg bg-gray-900/50 backdrop-blur-sm border 
                  hover:border-primary/50 transition-all duration-300 
                  hover:shadow-lg hover:shadow-primary/10 flex flex-col h-full 
                  ${service.title.includes("Sentinel")
                    ? 'border-primary/40 ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-lg shadow-primary/15' // Enhanced Sentinel highlight
                    : 'border-gray-800 hover:border-primary/30'} 
                `}
              >
                <div className={`p-3 rounded-lg ${service.color} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-6 flex-grow">{service.description}</p> {/* Use flex-grow */}

                {/* Features - slightly refined look */}
                <div className="space-y-2 mb-6">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {/* Use service color for feature bullet */}
                      <div className={`h-1.5 w-1.5 rounded-full ${service.color.replace('bg-', 'bg-').replace('/10', '/60')}`}></div>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-auto"> {/* Pushes button to bottom */}
                  <Button
                    onClick={() => navigateToService(service.route)}
                    variant="outline"
                    className="w-full border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors group-hover:border-primary/50" // Enhanced hover
                  >
                    Explore Service <Rocket className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Coming Soon Section - retained for structure */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h3 className="text-2xl font-semibold">Coming Soon</h3>
            </div>
            <Button
              onClick={handleFeatureRequest}
              variant="outline"
              className="gap-2 border-primary/30 hover:bg-primary/10" // Consistent styling
            >
              <MessageSquarePlus className="h-4 w-4" />
              Request Feature
            </Button>
          </div>

          {/* Placeholder if upcomingFeatures array gets populated later */}
          {upcomingFeatures.length === 0 && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-muted-foreground py-8 italic"
              >
                More innovative AI features are under development...
             </motion.div>
          )}
          
          {/* Original grid logic kept for future use if needed */}
          {upcomingFeatures.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-8">
              {upcomingFeatures.map((feature, index) => (
                // ... (original upcoming feature card rendering logic)
                <div key={index}></div> // Placeholder
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer and other components */}
      <Footer />
      <BetaFeedback />

      <FeatureRequestModal
        open={showFeatureRequest}
        onOpenChange={setShowFeatureRequest}
      />
    </div>
  );
}