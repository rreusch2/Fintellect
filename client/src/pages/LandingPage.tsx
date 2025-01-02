import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  LineChart, 
  Sparkles,
  Bot,
  Target,
  ArrowRight,
  CheckCircle2,
  Shield,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <Brain className="h-8 w-8" />,
    title: "AI-Powered Analysis",
    description: "Real-time financial insights and personalized recommendations powered by advanced machine learning",
    color: "text-blue-500"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Bank-Grade Security",
    description: "Secure bank connections via Plaid with end-to-end encryption and strict data protection protocols",
    color: "text-green-500"
  },
  {
    icon: <Bot className="h-8 w-8" />,
    title: "AI Financial Assistant",
    description: "24/7 intelligent chat assistance for budgeting, investment guidance, and financial planning",
    color: "text-purple-500"
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Smart Goal Tracking",
    description: "AI-optimized financial goals with automated progress tracking and actionable recommendations",
    color: "text-orange-500"
  },
];

const stats = [
  { value: "256-bit", label: "Bank-Level Encryption" },
  { value: "SOC2", label: "Security Compliance" },
  { value: "24/7", label: "AI Assistant Availability" },
  { value: "99.9%", label: "Platform Uptime" },
];

export default function LandingPage() {
  const isMobile = useIsMobile();
  usePageTitle('AI-Powered Financial Management');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className={cn(
        "container mx-auto px-4",
        isMobile ? "py-8" : "py-16"
      )}>
        <div className={cn(
          "grid items-center gap-8",
          isMobile ? "grid-cols-1" : "grid-cols-2"
        )}>
          {/* Hero content */}
        </div>
      </section>

      {/* Features Section */}
      <section className={cn(
        "container mx-auto px-4",
        isMobile ? "py-8" : "py-16"
      )}>
        <div className={cn(
          "grid gap-8",
          isMobile ? "grid-cols-1" : "grid-cols-3"
        )}>
          {/* Feature cards */}
        </div>
      </section>

      {/* CTA Section */}
      <section className={cn(
        "container mx-auto px-4",
        isMobile ? "py-8" : "py-16"
      )}>
        {/* CTA content */}
      </section>
    </div>
  );
}
