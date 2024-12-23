import React from 'react';
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Bot, Target, Wallet, LayoutDashboard, Brain, CircleDollarSign, FileText, Shield } from "lucide-react";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { motion } from "framer-motion";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";

const aiServices = [
  {
    title: "AI Financial Assistant",
    description: "Chat with our AI to get personalized financial guidance and answers to your questions.",
    icon: Bot,
    route: "/ai/assistant",
    color: "bg-blue-500/10 text-blue-400"
  },
  {
    title: "Budget Analysis",
    description: "Get AI-powered insights into your spending patterns and budget optimization.",
    icon: CircleDollarSign,
    route: "/ai/budget",
    color: "bg-green-500/10 text-green-400"
  },
  {
    title: "Investment Strategy",
    description: "Receive personalized investment recommendations based on your financial profile.",
    icon: Brain,
    route: "/ai/investment",
    color: "bg-purple-500/10 text-purple-400"
  }
];

export default function AIHubPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  const navigateToService = (route: string) => {
    setLocation(route);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      {/* Header */}
      <header className="border-b border-border/10 backdrop-blur-md bg-background/70 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
            AI Services Hub
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
            </Button>
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {aiServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-lg bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-primary/50 transition-all duration-300"
            >
              <div className={`p-3 rounded-lg ${service.color} w-fit mb-4`}>
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-4">{service.description}</p>
              <Button 
                onClick={() => navigateToService(service.route)}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary"
              >
                Access Service
              </Button>
            </motion.div>
          ))}
        </div>

        {/* AI Disclaimer */}
        <div className="mt-8">
          <AIDisclaimer />
        </div>
      </main>
      <BetaFeedback />
    </div>
  );
}
