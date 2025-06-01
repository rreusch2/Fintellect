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
import { motion, useInView } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { FinancialParticles } from "@/components/ui/FinancialParticles";
import { useRef, useEffect, useState } from "react";

// TypeScript Interfaces
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

interface SecurityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

// Custom Checkmark Component
const CustomCheckmark = ({ className = "" }) => (
  <motion.div 
    className={`flex-shrink-0 ${className}`}
    whileHover={{ scale: 1.1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      className="text-emerald-400"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="rgba(16, 185, 129, 0.1)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      />
      <motion.path
        d="M8 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </svg>
  </motion.div>
);

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
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 group border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
        <CardContent className="p-6 relative z-10 text-center">
          {/* Fixed and centered icon container */}
          <motion.div 
            className="mb-4 flex justify-center"
            whileHover={{ 
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.5 }
            }}
          >
            <div className={`p-3 rounded-xl bg-gradient-to-br from-white to-blue-50 shadow-lg group-hover:shadow-xl transition-all duration-500 ${feature.color} relative`}>
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
          
          <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
            {feature.title}
          </h3>
          <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-sm">
            {feature.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced Security Card Component
const SecurityCard = ({ icon, title, description, gradient }: SecurityCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <Card className="bg-background/50 hover:bg-background/70 transition-all duration-300 group border-gray-700/50">
        <CardContent className="p-6">
          <motion.div 
            className={`p-4 rounded-full ${gradient} mb-4 inline-block group-hover:scale-110 transition-all duration-300`}
            whileHover={{ 
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
              transition: { duration: 0.3 }
            }}
          >
            {icon}
          </motion.div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-300 transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
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

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Smart Transaction Analysis",
    description: "AI-powered analysis of your spending patterns with real-time insights and personalized recommendations",
    color: "text-blue-500"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Plaid Bank Integration",
    description: "Secure bank connections with end-to-end encryption, real-time transaction syncing and account balance monitoring",
    color: "text-green-500"
  },
  {
    icon: <Bot className="h-6 w-6" />,
    title: "AI Financial Advisor",
    description: "Intelligent chatbot that reads and analyzes your transactions to provide personalized financial advice and insights",
    color: "text-purple-500"
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Nexus Agent (Premium)",
    description: "Advanced AI finance employee with Linux environment for automated research, report generation, and web-based analysis",
    color: "text-orange-500"
  },
];

const stats = [
  { value: "256-bit", label: "Bank-Level Encryption" },
  { value: "Plaid", label: "Secure Integration" },
  { value: "Real-time", label: "Transaction Analysis" },
  { value: "Linux", label: "Nexus Environment" },
];

export default function LandingPage() {
  usePageTitle('AI-Powered Financial Management');
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
      // Check if we've scrolled past the hero section (approximately)
      const scrolled = window.scrollY > window.innerHeight * 0.7;
      setNavScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const heroAnimation = useScrollAnimation();
  const featuresAnimation = useScrollAnimation();
  const benefitsAnimation = useScrollAnimation();
  const securityAnimation = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
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
              <Link href="/features">
                <span className={`transition-colors duration-300 font-medium tracking-wide cursor-pointer ${
                  navScrolled 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-gray-300 hover:text-cyan-400'
                }`}>
                  Features
                </span>
              </Link>
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
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      >
        {/* Enhanced Interactive Background with Particles */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-gray-900/40">
          <FinancialParticles />
          
          {/* Subtle gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
          
          {/* Enhanced central glow effect for focus */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(0, 255, 225, 0.15) 0%, rgba(0, 212, 255, 0.1) 30%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Enhanced background overlay for text area */}
          <div className="absolute inset-0 -m-8 rounded-3xl" style={{
            background: 'radial-gradient(ellipse at center, rgba(15, 20, 25, 0.12) 0%, transparent 70%)'
          }} />
          
          {/* Main Content */}
          <div className="relative z-20">
            <motion.h1 
              {...(isReducedMotion ? {} : { 
                initial: { opacity: 0, y: 30 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.2 }
              })}
              className="text-5xl md:text-6xl font-bold mb-4 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #00FFE1 50%, #00D4FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 212, 255, 0.1)'
              }}
            >
              Your AI Financial
              <br />
              <span 
                className="inline-block"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFE1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Control Center
              </span>
            </motion.h1>

            <motion.p 
              {...(isReducedMotion ? {} : {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.4 }
              })}
              className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed"
              style={{
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 20px rgba(10, 27, 61, 0.3)'
              }}
            >
              Connect your bank accounts and unleash the power of our Nexus Agent.
              <br className="hidden md:block" />
              AI-powered transaction analysis, automated research, and personalized financial guidance.
            </motion.p>
          </div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
            {...(isReducedMotion ? {} : {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 1, delay: 0.6 }
            })}
          >
            <motion.div
              {...(isReducedMotion ? {} : {
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.98 }
              })}
            >
              <Link href="/auth">
                <Button 
                  size="default" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 text-sm font-semibold shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 border-0 group"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  Get Started Free
                  <motion.div
                    className="ml-2 inline-block"
                    {...(isReducedMotion ? {} : {
                      initial: { x: 0 },
                      whileHover: { x: 5 },
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    })}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.div>
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              {...(isReducedMotion ? {} : {
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.98 }
              })}
            >
              <Link href="/features">
                <Button 
                  variant="outline" 
                  size="default"
                  className="border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200 px-5 py-2.5 text-sm font-semibold transition-all duration-300 bg-transparent backdrop-blur-sm"
                  style={{
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                  }}
                >
                  Explore Features
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Enhanced Stats with better text contrast */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            {...(isReducedMotion ? {} : {
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 1, delay: 0.8, staggerChildren: 0.2 }
            })}
          >
            {[
              { number: "Instant", label: "Transaction Analysis", icon: Brain, color: "from-cyan-400 to-blue-500" },
              { number: "Bank-grade", label: "Security Standards", icon: LineChart, color: "from-blue-400 to-cyan-500" },
              { number: "24/7", label: "Nexus Agent Available", icon: Sparkles, color: "from-cyan-300 to-blue-400" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center group cursor-default relative"
                {...(isReducedMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.8, delay: 0.8 + index * 0.1 },
                  whileHover: { scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 10 } }
                })}
              >
                {/* Subtle background for stats */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/12 via-black/8 to-transparent rounded-xl blur-md opacity-60" />
                
                <div className="relative">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300`}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1 group-hover:text-cyan-200 transition-colors"
                    style={{
                      textShadow: '0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.6)',
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                    }}
                  >
                    {stat.number}
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm"
                    style={{
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                      filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Scroll indicator with enhanced visibility */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={isReducedMotion ? {} : {
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
          }}
        >
          <div className="w-6 h-10 border-2 border-blue-400/70 rounded-full flex justify-center backdrop-blur-sm bg-black/5">
            <motion.div 
              className="w-1 h-3 bg-blue-400 rounded-full mt-2"
              animate={isReducedMotion ? {} : {
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section 
        id="features"
        ref={featuresAnimation.ref}
        className="py-24 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #f8fafc 70%, #ffffff 100%)'
        }}
      >
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-200/25 to-blue-200/25 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-blue-200/25 to-cyan-200/25 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-cyan-300/25 to-blue-300/25 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #0891b2 50%, #0e7490 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Intelligent Financial Management
            </h2>
            <p className="text-lg text-gray-700 max-w-xl mx-auto leading-relaxed">
              Our platform combines cutting-edge{' '}
              <span 
                className="font-bold"
                style={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                AI technology
              </span>
              {' '}with comprehensive financial tools
              to provide you with the smartest way to manage your money.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -8,
                  transition: { type: "spring", stiffness: 300 }
                }}
                className="group"
              >
                <Card className="h-full relative overflow-hidden border border-blue-100/60 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:shadow-cyan-500/20">
                  {/* Animated gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-cyan-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-[1px] bg-white rounded-lg"></div>
                  
                  {/* Shine effect - moved outside CardContent to cover entire card */}
                  <div className="absolute inset-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000 ease-out overflow-hidden"></div>
                  
                  <CardContent className="p-6 relative z-10 text-center">
                    {/* Fixed and centered icon container */}
                    <motion.div 
                      className="mb-4 flex justify-center"
                      whileHover={{ 
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-br from-white to-blue-50 shadow-lg group-hover:shadow-xl transition-all duration-500 ${feature.color} relative`}>
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
                    
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Bottom accent line */}
          <motion.div 
            className="mt-16 mx-auto max-w-xs h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={featuresAnimation.isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          ></motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 70%, #1e293b 100%)'
      }}>
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-16 left-16 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-16 right-16 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: index * 0.15, 
                  type: "spring", 
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ 
                  scale: 1.02,
                  y: -4,
                  transition: { duration: 0.2 }
                }}
                className="text-center group cursor-default"
              >
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-cyan-400/30 group-hover:border-cyan-400/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/20 h-full flex flex-col justify-center min-h-[140px]">
                  
                  <div className="text-3xl md:text-4xl font-bold mb-3 group-hover:text-cyan-300 transition-colors duration-300 leading-none"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #00FFE1 50%, #00D4FF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-gray-300 group-hover:text-cyan-100 transition-colors duration-300 font-medium text-sm leading-tight">
                    {stat.label}
                  </div>
                  
                  {/* Simplified glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Add a subtitle for context */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              Powered by 
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-semibold"> Plaid integration </span>
              and featuring our advanced 
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-semibold"> Nexus Agent </span>
              with full Linux environment capabilities
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section 
        ref={benefitsAnimation.ref}
        className="py-16 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #f8fafc 70%, #ffffff 100%)'
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-16 right-16 w-48 h-48 bg-gradient-to-br from-cyan-200/25 to-blue-200/25 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-32 h-32 bg-gradient-to-br from-blue-200/25 to-cyan-200/25 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-gradient-to-br from-cyan-300/20 to-blue-300/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.h2 
              className="text-3xl font-bold text-center mb-12"
              style={{
                background: 'linear-gradient(135deg, #374151 0%, #0891b2 50%, #0e7490 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={benefitsAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              Why Choose Our Platform?
            </motion.h2>
            <div className="space-y-4">
              {[
                { text: "Real-time transaction analysis and spending pattern insights", highlight: "transaction analysis" },
                { text: "Secure Plaid bank account integration with instant syncing", highlight: "Plaid integration" },
                { text: "AI-powered spending insights with personalized recommendations", highlight: "AI-powered insights" }, 
                { text: "Nexus Agent for automated research and report generation", highlight: "Nexus Agent" },
                { text: "Bank-level security with end-to-end encryption", highlight: "Bank-level security" },
                { text: "Interactive dashboard with spending distribution charts", highlight: "Interactive dashboard" }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={benefitsAnimation.isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ 
                    x: 8, 
                    scale: 1.01,
                    transition: { duration: 0.2 }
                  }}
                  className="group cursor-default"
                >
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-blue-100/60 group-hover:border-blue-300/70 group-hover:bg-white/95 transition-all duration-300 group-hover:shadow-md group-hover:shadow-blue-500/15">
                    {/* Enhanced checkmark with cyan theme */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)'
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          className="text-white"
                        >
                          <path
                            d="M8 12l2 2 4-4"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                        
                        {/* Simple glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    
                    <span className="text-base font-medium text-gray-700 group-hover:text-blue-800 transition-colors duration-300 leading-relaxed flex-1">
                      {benefit.text.split(benefit.highlight).map((part, i) => (
                        i === 0 ? part : (
                          <span key={i}>
                            <span 
                              className="font-bold"
                              style={{
                                background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              }}
                            >
                              {benefit.highlight}
                            </span>
                            {part}
                          </span>
                        )
                      ))}
                    </span>
                    
                    {/* Simple arrow indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-white">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #334155 60%, #1e293b 100%)'
      }}>
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: window.innerHeight + 10,
                opacity: 0
              }}
              animate={{ 
                y: -10, 
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Ready to Transform Your 
              <span className="block"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFE1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Financial Management?
              </span>
            </h2>
            <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Connect your bank accounts securely with 
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-semibold"> Plaid integration </span>
              and unlock the full power of our platform.
              <span className="block mt-2 font-medium"
                style={{
                  background: 'linear-gradient(135deg, #00FFE1 0%, #00D4FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Access your personal Nexus Agent and AI-powered financial insights.
              </span>
            </p>
            
            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button 
                  size="lg" 
                  className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-400 text-white px-10 py-5 text-xl font-semibold shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 border-0 group min-w-[260px]"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Your Journey
                    <motion.div
                      className="inline-block"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </span>
                  
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-700 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Shine effect */}
                  <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 group-hover:left-full transition-all duration-700 ease-out"></div>
                  
                  {/* Floating particles on hover */}
                  <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-ping"
                        style={{ 
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </Button>
              </motion.div>
            </Link>
            
            {/* Trust indicators */}
            <motion.div 
              className="mt-10 flex flex-wrap justify-center items-center gap-8 text-gray-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Bank-Grade</span> Security
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-sm font-medium">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI-Powered</span> Insights
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span className="text-sm font-medium">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Free</span> to Start
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Security and Compliance Section */}
      <section 
        ref={securityAnimation.ref}
        className="py-16 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #cbd5e1 70%, #94a3b8 100%)'
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/25 to-slate-300/25 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-56 h-56 bg-gradient-to-br from-slate-300/25 to-blue-300/25 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              className="text-3xl font-bold mb-8 text-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={securityAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              Enterprise-Grade Security
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={securityAnimation.isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full relative overflow-hidden border border-blue-200/60 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/20">
                  {/* Animated border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-slate-400/20 to-blue-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-[1px] bg-white rounded-lg"></div>
                  
                  <CardContent className="p-6 relative z-10 text-center">
                    <motion.div
                      className="mb-4 flex justify-center"
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-slate-500/10 shadow-lg group-hover:shadow-xl transition-all duration-500 relative">
                        <Shield className="h-8 w-8 text-blue-600" />
                        
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/10 to-slate-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Security particles */}
                        <div className="absolute -inset-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute top-0 left-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                          <div className="absolute top-2 right-0 w-1 h-1 bg-slate-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                          <div className="absolute bottom-1 left-0 w-1 h-1 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.8s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold mb-3 text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
                      Secure Bank Integration
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-sm">
                      Bank connections powered by Plaid with end-to-end encryption and read-only access to your financial data.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={securityAnimation.isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full relative overflow-hidden border border-green-200/60 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:shadow-emerald-500/20">
                  {/* Animated border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-green-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-[1px] bg-white rounded-lg"></div>
                  
                  <CardContent className="p-6 relative z-10 text-center">
                    <motion.div
                      className="mb-4 flex justify-center"
                      whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 shadow-lg group-hover:shadow-xl transition-all duration-500 relative">
                        <Lock className="h-8 w-8 text-emerald-600" />
                        
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Security particles */}
                        <div className="absolute -inset-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                          <div className="absolute top-0 left-2 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                          <div className="absolute bottom-0 right-0 w-1 h-1 bg-emerald-500 rounded-full animate-ping" style={{ animationDelay: '0.8s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold mb-3 text-gray-800 group-hover:text-emerald-800 transition-colors duration-300">
                      Data Protection
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-sm">
                      SOC2 compliant with 256-bit encryption, regular security audits, and strict data privacy controls.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            {/* Security badges */}
            <motion.div 
              className="mt-10 flex flex-wrap justify-center items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={securityAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {['SOC2 Compliant', '256-bit Encryption', 'GDPR Ready', 'ISO 27001'].map((badge, index) => (
                <motion.div
                  key={badge}
                  className="px-3 py-1.5 bg-white/80 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  {badge}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Replace the old footer with our consistent Footer component */}
      <Footer />
    </div>
  );
}
