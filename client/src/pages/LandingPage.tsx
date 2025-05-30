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
        <CardContent className="p-6">
          <motion.div 
            className={`mb-4 ${feature.color} group-hover:scale-110 transition-all duration-300`}
            whileHover={{ 
              rotate: [0, -10, 10, 0],
              transition: { duration: 0.5 }
            }}
          >
            {feature.icon}
          </motion.div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-300 transition-colors">
            {feature.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const heroAnimation = useScrollAnimation();
  const featuresAnimation = useScrollAnimation();
  const benefitsAnimation = useScrollAnimation();
  const securityAnimation = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <motion.section 
        ref={heroAnimation.ref}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
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
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #00FFE1 50%, #00D4FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 212, 255, 0.1)'
              }}
            >
              Your AI-Powered
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
                Financial Future
              </span>
            </motion.h1>

            <motion.p 
              {...(isReducedMotion ? {} : {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.4 }
              })}
              className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto leading-relaxed"
              style={{
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 20px rgba(10, 27, 61, 0.3)'
              }}
            >
              Harness the power of artificial intelligence to revolutionize your personal finances.
              <br className="hidden md:block" />
              Smart budgeting, predictive analytics, and personalized insights at your fingertips.
            </motion.p>
          </div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
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
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 border-0 group"
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
                    <ArrowRight className="w-5 h-5" />
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
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200 px-8 py-4 text-lg font-semibold transition-all duration-300 bg-transparent backdrop-blur-sm"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                }}
              >
                Explore Features
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Enhanced Stats with better text contrast */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            {...(isReducedMotion ? {} : {
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 1, delay: 0.8, staggerChildren: 0.2 }
            })}
          >
            {[
              { number: "50K+", label: "Active Users", icon: Brain, color: "from-cyan-400 to-blue-500" },
              { number: "$2M+", label: "Managed Assets", icon: LineChart, color: "from-blue-400 to-cyan-500" },
              { number: "98%", label: "User Satisfaction", icon: Sparkles, color: "from-cyan-300 to-blue-400" }
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
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300`}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
                  >
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors"
                    style={{
                      textShadow: '0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.6)',
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                    }}
                  >
                    {stat.number}
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-300 transition-colors"
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
      <section className="py-24 bg-background" ref={featuresAnimation.ref}>
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Intelligent Financial Management</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with comprehensive financial tools
              to provide you with the smartest way to manage your money.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
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
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05 }}
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
      <section className="py-24 bg-background" ref={benefitsAnimation.ref}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.h2 
              className="text-3xl font-bold text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={benefitsAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              Why Choose Our Platform?
            </motion.h2>
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
                  initial={{ opacity: 0, x: -30 }}
                  animate={benefitsAnimation.isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 group hover:bg-muted/70 transition-all duration-300"
                >
                  <CustomCheckmark />
                  <span className="text-lg group-hover:text-primary transition-colors">{benefit}</span>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Your Finances?</h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join our community of users leveraging AI to revolutionize their financial management.
            </p>
            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="secondary" className="min-w-[200px] group">
                  Start Your Journey
                  <motion.div
                    className="ml-2"
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Security and Compliance Section */}
      <section className="py-20 bg-muted/50" ref={securityAnimation.ref}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              className="text-3xl font-bold mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={securityAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              Enterprise-Grade Security
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-6">
              <SecurityCard
                icon={<Shield className="h-8 w-8 text-primary" />}
                title="Secure Bank Integration"
                description="Bank connections powered by Plaid with end-to-end encryption and read-only access to your financial data."
                gradient="bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
              />
              <SecurityCard
                icon={<Lock className="h-8 w-8 text-primary" />}
                title="Data Protection"
                description="SOC2 compliant with 256-bit encryption, regular security audits, and strict data privacy controls."
                gradient="bg-gradient-to-br from-green-500/10 to-emerald-500/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Replace the old footer with our consistent Footer component */}
      <Footer />
    </div>
  );
}
