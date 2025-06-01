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
  Lock,
  CreditCard,
  TrendingUp,
  PieChart,
  MessageCircle,
  Terminal,
  FileText,
  Globe,
  Zap,
  Eye,
  DollarSign,
  BarChart3,
  Layers,
  Search,
  Monitor,
  CloudLightning
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { useRef, useEffect, useState } from "react";

// TypeScript Interfaces
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  gradient: string;
  features: string[];
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

// Enhanced Feature Card Component
const FeatureCard = ({ feature, index }: FeatureCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ 
        y: -8,
        transition: { type: "spring", stiffness: 300 }
      }}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border border-blue-100/60 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:shadow-cyan-500/20">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-cyan-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute inset-[1px] bg-white rounded-lg"></div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000 ease-out overflow-hidden"></div>
        
        <CardContent className="p-6 relative z-10">
          {/* Icon container */}
          <motion.div 
            className="mb-4 flex justify-start"
            whileHover={{ 
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.5 }
            }}
          >
            <div className={`p-3 rounded-xl ${feature.gradient} shadow-lg group-hover:shadow-xl transition-all duration-500 relative`}>
              {feature.icon}
              
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating particles effect on hover */}
              <div className="absolute -inset-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="absolute top-1 right-0 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-0 left-1 w-1 h-1 bg-cyan-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </motion.div>
          
          <h3 className="text-xl font-semibold mb-3 text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
            {feature.title}
          </h3>
          <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-base mb-4">
            {feature.description}
          </p>
          
          {/* Feature list */}
          <ul className="space-y-2">
            {feature.features.map((item, idx) => (
              <motion.li 
                key={idx}
                className="flex items-center gap-2 text-base text-gray-600"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 + idx * 0.05 }}
              >
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex-shrink-0"></div>
                <span className="group-hover:text-gray-700 transition-colors duration-300">{item}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Scroll Animation Hook
const useScrollAnimation = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return { ref, isInView };
};

const coreFeatures = [
  {
    icon: <CreditCard className="h-6 w-6 text-white" />,
    title: "Secure Bank Integration",
    description: "Connect your bank accounts securely with Plaid's industry-leading technology for real-time financial data access.",
    color: "text-blue-500",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    features: [
      "Plaid-powered bank connections",
      "256-bit end-to-end encryption",
      "Read-only account access",
      "Real-time transaction syncing",
      "Multi-bank account support"
    ]
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-white" />,
    title: "Smart Dashboard Analytics",
    description: "Comprehensive financial overview with interactive charts, spending patterns, and account balance monitoring.",
    color: "text-green-500",
    gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
    features: [
      "Monthly spending overview",
      "Account balance tracking",
      "Interactive spending distribution charts",
      "Category-based analysis",
      "Trend visualization"
    ]
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-white" />,
    title: "AI Transaction Advisor",
    description: "Intelligent chatbot that analyzes your transactions to provide personalized financial insights and recommendations.",
    color: "text-purple-500",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-600",
    features: [
      "Transaction pattern analysis",
      "Personalized financial advice",
      "Spending habit insights",
      "Budget recommendations",
      "Natural language interaction"
    ]
  },
  {
    icon: <Terminal className="h-6 w-6 text-white" />,
    title: "Nexus Agent (Premium)",
    description: "Advanced AI finance employee with its own Linux environment for automated research, report generation, and analysis.",
    color: "text-orange-500",
    gradient: "bg-gradient-to-br from-orange-500 to-red-600",
    features: [
      "Dedicated Linux environment",
      "Automated financial research",
      "Custom report generation (.txt, .md)",
      "Web browsing and analysis",
      "Finance task automation"
    ]
  }
];

const advancedFeatures = [
  {
    icon: <Search className="h-5 w-5 text-white" />,
    title: "Web Research Engine",
    description: "Nexus Agent can browse the web and conduct comprehensive financial research on your behalf.",
    gradient: "bg-gradient-to-br from-cyan-500 to-blue-600"
  },
  {
    icon: <FileText className="h-5 w-5 text-white" />,
    title: "Report Generation",
    description: "Automatically create detailed financial reports in various formats based on your data and research.",
    gradient: "bg-gradient-to-br from-green-500 to-emerald-600"
  },
  {
    icon: <Monitor className="h-5 w-5 text-white" />,
    title: "Browser Automation",
    description: "Advanced AI-powered browser automation for financial tasks and data collection.",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-600"
  },
  {
    icon: <CloudLightning className="h-5 w-5 text-white" />,
    title: "Linux Environment",
    description: "Full Linux environment access for complex financial calculations and data processing.",
    gradient: "bg-gradient-to-br from-orange-500 to-red-600"
  },
  {
    icon: <Layers className="h-5 w-5 text-white" />,
    title: "Multi-Tool Integration",
    description: "Seamless integration with various financial tools and APIs for comprehensive analysis.",
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600"
  },
  {
    icon: <Zap className="h-5 w-5 text-white" />,
    title: "Real-time Processing",
    description: "Lightning-fast data processing and analysis for immediate financial insights.",
    gradient: "bg-gradient-to-br from-yellow-500 to-orange-600"
  }
];

export default function FeaturesPage() {
  usePageTitle('Features - AI-Powered Financial Management');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  // Check for reduced motion preference and handle scroll
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    // Handle scroll for navigation styling
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setNavScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const heroAnimation = useScrollAnimation();
  const advancedAnimation = useScrollAnimation();
  const coreAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar - Same as Landing Page */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navScrolled 
          ? 'backdrop-blur-md bg-white/95 border-b border-gray-200/50 shadow-sm' 
          : 'backdrop-blur-md bg-black/20 border-b border-cyan-500/20'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <span className={`text-2xl md:text-3xl font-bold bg-clip-text text-transparent tracking-tight transition-all duration-300 ${
                navScrolled 
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600' 
                  : 'bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400'
              }`}>
                Fintellect
              </span>
              <div className={`hidden sm:flex items-center px-2 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                navScrolled 
                  ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30' 
                  : 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20'
              }`}>
                <span className={`text-[11px] font-semibold tracking-wider bg-clip-text text-transparent transition-all duration-300 ${
                  navScrolled 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600' 
                    : 'bg-gradient-to-r from-cyan-400 to-blue-400'
                }`}>
                  BETA
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/">
                <span className={`transition-colors duration-300 font-medium tracking-wide cursor-pointer ${
                  navScrolled 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-gray-300 hover:text-cyan-400'
                }`}>
                  Home
                </span>
              </Link>
              <span className={`transition-colors duration-300 font-medium tracking-wide ${
                navScrolled 
                  ? 'text-blue-600' 
                  : 'text-cyan-400'
              }`}>
                Features
              </span>
              <Link href="/contact">
                <span className={`transition-colors duration-300 font-medium tracking-wide cursor-pointer ${
                  navScrolled 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-gray-300 hover:text-cyan-400'
                }`}>
                  Contact
                </span>
              </Link>
              <Link href="/auth">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 border-0"
                >
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                className={`p-2 transition-colors duration-300 ${
                  navScrolled 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-gray-300 hover:text-cyan-400'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroAnimation.ref}
        className="relative py-20 pt-32 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 60%, #64748b 80%, #475569 100%)'
        }}
      >
        {/* Subtle geometric background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-blue-400 rounded-full"></div>
          <div className="absolute top-40 right-32 w-32 h-32 border border-cyan-400 rounded-lg rotate-45"></div>
          <div className="absolute bottom-32 left-1/3 w-48 h-48 border border-blue-300 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 border border-cyan-300 rounded-lg rotate-12"></div>
        </div>
        
        {/* Floating feature icons */}
        <div className="absolute inset-0 overflow-hidden">
          {[
            { icon: CreditCard, top: '15%', left: '10%', delay: 0 },
            { icon: BarChart3, top: '25%', right: '15%', delay: 0.5 },
            { icon: MessageCircle, top: '60%', left: '8%', delay: 1 },
            { icon: Terminal, top: '70%', right: '12%', delay: 1.5 },
            { icon: Search, top: '35%', left: '85%', delay: 2 },
            { icon: FileText, top: '80%', left: '75%', delay: 2.5 }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="absolute opacity-20"
              style={{ 
                top: item.top, 
                left: item.left, 
                right: item.right 
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl backdrop-blur-sm">
                <item.icon className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-full text-blue-700 font-semibold text-sm mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              AI-Powered Financial Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span 
                className="bg-gradient-to-r from-gray-900 via-blue-800 to-cyan-800 bg-clip-text text-transparent"
              >
                Powerful Features for
              </span>
              <br />
              <span 
                className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent"
              >
                Smart Financial Management
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-8 text-gray-700 max-w-3xl mx-auto leading-relaxed">
              From secure bank integration to advanced AI automation, discover how our platform 
              transforms the way you manage your finances with cutting-edge technology and intelligent insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-blue-500/25 transition-all duration-300 border-0"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Feature highlights preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Shield, label: "Bank-Grade Security", color: "from-blue-500 to-blue-600" },
                { icon: Brain, label: "AI-Powered Insights", color: "from-cyan-500 to-cyan-600" },
                { icon: Terminal, label: "Nexus Agent", color: "from-purple-500 to-purple-600" },
                { icon: Zap, label: "Real-time Analysis", color: "from-green-500 to-green-600" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  className="group cursor-default"
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="p-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:bg-white/90">
                    <div className={`w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Advanced AI Capabilities Section */}
      <section 
        ref={advancedAnimation.ref}
        className="py-14 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 70%, #1e293b 100%)'
        }}
      >
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-16 left-16 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-16 right-16 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={advancedAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Advanced AI Capabilities
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Experience the future of financial management with our 
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-semibold"> Nexus Agent </span>
              - your personal AI finance employee.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                animate={advancedAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -5,
                  transition: { type: "spring", stiffness: 300 }
                }}
                className="group"
              >
                <Card className="h-full relative overflow-hidden bg-white/10 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                  <CardContent className="p-6 text-center">
                    <motion.div 
                      className="mb-4 flex justify-center"
                      whileHover={{ 
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <div className={`p-3 rounded-xl ${feature.gradient} shadow-lg group-hover:shadow-xl transition-all duration-500 relative`}>
                        {feature.icon}
                        
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                    </motion.div>
                    
                    <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-cyan-200 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Nexus Agent Highlight */}
          <motion.div 
            className="mt-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={advancedAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-semibold text-sm shadow-lg">
                    <Terminal className="w-4 h-4" />
                    Premium Feature
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                  Meet Your Personal 
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Nexus Agent</span>
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4 max-w-2xl mx-auto">
                  Our most advanced feature - a dedicated AI finance employee with its own Linux environment that can perform complex research, 
                  generate detailed reports, automate browser tasks, and handle sophisticated financial analysis on your behalf.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-cyan-300 mb-2">Research Capabilities</h4>
                    {['Web browsing and data collection', 'Market research automation', 'Financial news analysis', 'Competitive intelligence'].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-300 mb-2">Output & Automation</h4>
                    {['Custom report generation', 'Document creation (.txt, .md)', 'Task automation scripts', 'Data visualization'].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Core Platform Features Section */}
      <section 
        id="core-features"
        ref={coreAnimation.ref}
        className="py-10 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #f8fafc 70%, #ffffff 100%)'
        }}
      >
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-200/25 to-blue-200/25 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-blue-200/25 to-cyan-200/25 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={coreAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #0891b2 50%, #0e7490 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Core Platform Features
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Everything you need to take control of your financial future with intelligent automation and AI-powered insights.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {coreFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaAnimation.ref}
        className="py-20 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 70%, #1e293b 100%)'
        }}
      >
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-16 left-16 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-16 right-16 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ctaAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Experience the Future of Finance?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Join thousands of users who are already using our AI-powered platform to make smarter financial decisions. 
              Start your journey today with our free trial.
            </p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              whileHover={{ scale: 1.02 }}
            >
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 border-0 group"
                >
                  Get Started Free
                  <motion.div
                    className="ml-2 inline-block"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Button>
              </Link>
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div 
              className="mt-8 flex flex-wrap justify-center items-center gap-6 text-gray-400"
              initial={{ opacity: 0 }}
              animate={ctaAnimation.isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Free 30-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span className="text-sm font-medium">Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 