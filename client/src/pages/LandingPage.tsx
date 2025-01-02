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
  usePageTitle('AI-Powered Financial Management');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Restored and enhanced gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-600/98 to-blue-700/95">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
            {/* Enhanced gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-blue-600/30 to-blue-700/50"></div>
          </div>
          
          {/* Enhanced animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Larger floating orbs with improved positioning */}
            <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[140px] animate-float-slow"></div>
            <div className="absolute bottom-40 right-[15%] w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[160px] animate-float-medium"></div>
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-300/10 rounded-full blur-[120px] animate-float-fast"></div>
            
            {/* Restored decorative elements with improved visibility */}
            <div className="absolute top-[15%] left-[25%] w-2 h-2 bg-blue-200/40 rounded-full animate-pulse"></div>
            <div className="absolute top-[45%] right-[35%] w-2 h-2 bg-blue-200/30 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-[25%] left-[40%] w-2 h-2 bg-blue-200/20 rounded-full animate-pulse delay-700"></div>
            
            {/* Enhanced accent lines */}
            <div className="absolute top-[30%] left-0 w-[20%] h-[1px] bg-gradient-to-r from-transparent via-blue-200/20 to-transparent transform -rotate-45"></div>
            <div className="absolute bottom-[40%] right-0 w-[15%] h-[1px] bg-gradient-to-r from-transparent via-blue-200/15 to-transparent transform rotate-45"></div>
          </div>
        </div>
        
        <div className="container relative mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8 text-center"
          >
            {/* Logo Section */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-8xl sm:text-9xl font-extrabold tracking-tighter"
              >
                <span className="relative inline-block">
                  {/* Enhanced glow effect */}
                  <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-400/20 animate-pulse"></div>
                  
                  {/* Main logo text with lighter gradient for better visibility */}
                  <span className="relative inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100 animate-gradient font-display">
                    Fintellect
                  </span>
                </span>
              </motion.h1>

              {/* Improved tagline and beta badge layout */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4"
              >
                <div className="flex items-center gap-2 text-xl text-white/95">
                  <Sparkles className="h-6 w-6 text-blue-100 animate-pulse" />
                  <span className="font-light tracking-wide">Powered by Advanced AI</span>
                </div>
                
                {/* Refined Beta Badge */}
                <div className="flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-400/10 to-cyan-400/10 border border-blue-200/20 backdrop-blur-sm">
                  <span className="text-sm font-semibold tracking-widest text-blue-50">
                    BETA
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Main headline with improved spacing */}
            <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight"
              >
                Transform Your Finances with{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-blue-200">
                    AI-Powered
                  </span>
                  <div className="absolute inset-0 blur-lg bg-blue-400/20 animate-pulse"></div>
                </span>{" "}
                Intelligence
              </motion.h2>
              
              {/* Enhanced subheading */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl md:text-2xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed font-light"
              >
                Experience intelligent financial management powered by advanced AI. 
                Get personalized insights, smart budgeting, and secure bank integration 
                through Plaid.
              </motion.p>
            </div>

            {/* Enhanced CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pt-4"
            >
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="min-w-[240px] h-14 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Intelligent Financial Management</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with comprehensive financial tools
              to provide you with the smartest way to manage your money.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className={`mb-4 ${feature.color}`}>{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
            <div className="space-y-6">
              {[
                "Real-time AI analysis of your financial patterns",
                "Personalized investment recommendations",
                "Smart budget optimization with ML algorithms",
                "24/7 AI assistant for financial guidance",
                "Bank-level security for your data",
                "Comprehensive financial dashboard"
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
                >
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/90 to-primary relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Your Finances?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join our community of users leveraging AI to revolutionize their financial management.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="min-w-[200px]">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Security and Compliance Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Enterprise-Grade Security</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-background/50">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Secure Bank Integration</h3>
                  <p className="text-muted-foreground">
                    Bank connections powered by Plaid with end-to-end encryption and 
                    read-only access to your financial data.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="p-6">
                  <Lock className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Data Protection</h3>
                  <p className="text-muted-foreground">
                    SOC2 compliant with 256-bit encryption, regular security audits, 
                    and strict data privacy controls.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Replace the old footer with our consistent Footer component */}
      <Footer />
    </div>
  );
}
