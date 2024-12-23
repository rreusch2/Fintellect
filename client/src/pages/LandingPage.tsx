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
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Brain className="h-8 w-8" />,
    title: "AI-Powered Insights",
    description: "Get personalized financial advice and insights powered by advanced AI technology",
    color: "text-blue-500"
  },
  {
    icon: <Bot className="h-8 w-8" />,
    title: "Financial Assistant",
    description: "Chat with our AI assistant for real-time guidance and answers to your financial questions",
    color: "text-purple-500"
  },
  {
    icon: <LineChart className="h-8 w-8" />,
    title: "Budget Analysis",
    description: "Advanced AI analysis of your spending patterns and automated budget recommendations",
    color: "text-green-500"
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Smart Goals",
    description: "Set and track financial goals with AI-driven strategies for achievement",
    color: "text-orange-500"
  },
];

const stats = [
  { value: "99%", label: "Accuracy in Transaction Analysis" },
  { value: "24/7", label: "AI Assistant Availability" },
  { value: "50+", label: "Financial Insights Generated" },
  { value: "<2min", label: "Average Response Time" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Rich gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-background">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-primary/30 to-primary/50"></div>
          </div>
          
          {/* Enhanced animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Larger floating orbs */}
            <div 
              className="absolute top-20 left-[10%] w-48 h-48 bg-white/10 rounded-full blur-[100px] animate-float-slow"
            />
            <div 
              className="absolute bottom-40 right-[15%] w-64 h-64 bg-primary-foreground/10 rounded-full blur-[120px] animate-float-medium"
            />
            <div 
              className="absolute top-1/4 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-[80px] animate-float-fast"
            />
            
            {/* Additional decorative elements */}
            <div className="absolute top-[15%] left-[25%] w-2 h-2 bg-white/40 rounded-full animate-pulse"/>
            <div className="absolute top-[45%] right-[35%] w-2 h-2 bg-white/30 rounded-full animate-pulse delay-300"/>
            <div className="absolute bottom-[25%] left-[40%] w-2 h-2 bg-white/20 rounded-full animate-pulse delay-700"/>
            
            {/* Subtle accent lines */}
            <div className="absolute top-[30%] left-0 w-[20%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent transform -rotate-45"/>
            <div className="absolute bottom-[40%] right-0 w-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent transform rotate-45"/>
          </div>
        </div>
        
        <div className="container relative mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            {/* AI Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center mb-6 gap-2"
            >
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
              <span className="text-white/90 font-medium">Powered by Advanced AI</span>
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Transform Your Finances with 
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                AI-Powered Intelligence
              </span>
            </motion.h1>
            
            {/* Subheading */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed"
            >
              Experience the future of financial management with our AI-driven platform.
              Get personalized insights, smart budgeting, and intelligent investment guidance.
            </motion.p>
            
            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link href="/auth">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="min-w-[200px] shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
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
            Join thousands of users who are already managing their finances smarter with our AI-powered platform.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="min-w-[200px]">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer with Legal Links */}
      <footer className="py-8 bg-muted mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
            <Link href="/legal" className="text-center hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/legal" className="text-center hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal" className="text-center hover:text-primary transition-colors">
              AI Disclosures
            </Link>
            <Link href="/legal" className="text-center hover:text-primary transition-colors">
              Data Collection Notice
            </Link>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            © {new Date().getFullYear()} Your Financial AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
