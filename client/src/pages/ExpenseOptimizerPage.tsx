import React from 'react';
import { Navigation } from "../components/layout/Navigation";
import { Footer } from "../components/layout/Footer";
import { PageHeader } from "../components/layout/PageHeader";
import AIExpenseOptimizer from "../components/Dashboard/AIExpenseOptimizer";
import { usePageTitle } from "../hooks/use-page-title";
import { AIDisclaimer } from "../components/legal/AIDisclaimer";
import { motion } from "framer-motion";
import { CircleDollarSign, ArrowRight, Sparkles, Receipt, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";

const ExpenseOptimizerPage: React.FC = () => {
  usePageTitle('Thrive - Expense Optimizer');

  const features = [
    {
      icon: Receipt,
      title: "Subscription Manager",
      description: "Identify unused subscriptions and opportunities to save"
    },
    {
      icon: CreditCard,
      title: "Bill Negotiation",
      description: "Get guidance on negotiating better rates for services"
    },
    {
      icon: Sparkles,
      title: "Smart Recommendations",
      description: "Personalized advice based on your spending patterns"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <PageHeader
          title="Thrive"
          subtitle="Expense Optimization Assistant"
          icon={<CircleDollarSign className="h-6 w-6 text-purple-500" />}
          gradient="from-purple-400 via-pink-500 to-purple-600"
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <AIDisclaimer />
          </div>
          
          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-card rounded-lg border border-border hover:border-purple-400/30 transition-all"
              >
                <div className="p-2 bg-purple-500/10 rounded-md w-fit mb-4">
                  <feature.icon className="h-5 w-5 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
          {/* Main Content */}
          <div className="grid md:grid-cols-12 gap-8">
            {/* Expense Optimizer Component */}
            <div className="md:col-span-7">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AIExpenseOptimizer />
              </motion.div>
            </div>
            
            {/* Information Panel */}
            <div className="md:col-span-5">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card p-6 rounded-lg border border-border h-full"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  About Thrive
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  Thrive is your resourceful ally for finding savings opportunities in your spending. 
                  Ask Thrive about your expenses, subscriptions, or bills to get practical, 
                  actionable advice on how to optimize your finances.
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-purple-500/10 rounded-full flex items-center justify-center mt-0.5">
                      <ArrowRight className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Subscription tracking</span> - 
                      Identifies services you may not be using efficiently
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-purple-500/10 rounded-full flex items-center justify-center mt-0.5">
                      <ArrowRight className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Spending insights</span> - 
                      Analyzes your transaction patterns to find optimization opportunities
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-purple-500/10 rounded-full flex items-center justify-center mt-0.5">
                      <ArrowRight className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Practical recommendations</span> - 
                      Offers actionable advice with specific savings estimates
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full border-purple-500/20 text-purple-500 hover:bg-purple-500/10">
                  View All Financial Insights
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExpenseOptimizerPage;