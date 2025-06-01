import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mail,
  Phone,
  User,
  MessageCircle,
  Clock,
  MapPin,
  ArrowRight,
  Shield,
  Brain,
  Terminal,
  Zap
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { useRef, useEffect, useState } from "react";

// Scroll Animation Hook
const useScrollAnimation = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return { ref, isInView };
};

const contactMethods = [
  {
    icon: <Mail className="h-6 w-6 text-white" />,
    title: "Email Support",
    value: "admin@fintellectai.co",
    description: "For general inquiries, technical support, and account assistance",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    href: "mailto:admin@fintellectai.co"
  },
  {
    icon: <Phone className="h-6 w-6 text-white" />,
    title: "Phone Support",
    value: "(270) 724-2404",
    description: "Direct line for urgent support and immediate assistance",
    gradient: "bg-gradient-to-br from-green-500 to-emerald-600",
    href: "tel:+12707242404"
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-white" />,
    title: "Live Chat",
    value: "Available in-app",
    description: "Real-time support through your dashboard for logged-in users",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-600",
    href: "/dashboard"
  }
];

export default function ContactPage() {
  usePageTitle('Contact - AI-Powered Financial Management');
  const [navScrolled, setNavScrolled] = useState(false);

  // Handle scroll for navigation styling
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setNavScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const heroAnimation = useScrollAnimation();
  const contactAnimation = useScrollAnimation();
  const founderAnimation = useScrollAnimation();

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
              <Link href="/features">
                <span className={`transition-colors duration-300 font-medium tracking-wide cursor-pointer ${
                  navScrolled 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-gray-300 hover:text-cyan-400'
                }`}>
                  Features
                </span>
              </Link>
              <span className={`transition-colors duration-300 font-medium tracking-wide ${
                navScrolled 
                  ? 'text-blue-600' 
                  : 'text-cyan-400'
              }`}>
                Contact
              </span>
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
        
        {/* Floating contact icons */}
        <div className="absolute inset-0 overflow-hidden">
          {[
            { icon: Mail, top: '15%', left: '10%', delay: 0 },
            { icon: Phone, top: '25%', right: '15%', delay: 0.5 },
            { icon: MessageCircle, top: '60%', left: '8%', delay: 1 },
            { icon: User, top: '70%', right: '12%', delay: 1.5 },
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
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-full text-blue-700 font-semibold text-sm mb-6 backdrop-blur-sm">
              <MessageCircle className="w-4 h-4" />
              Get in Touch
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-cyan-800 bg-clip-text text-transparent">
                Contact Our Team
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-8 text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Have questions about Fintellect? Need technical support? Want to learn more about our AI-powered financial platform? 
              We're here to help you succeed on your financial journey.
            </p>

            {/* Quick contact preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { icon: Mail, label: "Email Us", value: "admin@fintellectai.co", color: "from-blue-500 to-blue-600" },
                { icon: Phone, label: "Call Us", value: "(270) 724-2404", color: "from-green-500 to-green-600" },
                { icon: Clock, label: "Response Time", value: "Within 24 hours", color: "from-purple-500 to-purple-600" }
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
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors mb-1">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Methods Section */}
      <section 
        ref={contactAnimation.ref}
        className="py-16 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #f8fafc 70%, #ffffff 100%)'
        }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={contactAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
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
              How to Reach Us
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Choose the contact method that works best for you. We're committed to providing excellent support and quick responses.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 50 }}
                animate={contactAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -8,
                  transition: { type: "spring", stiffness: 300 }
                }}
                className="group h-full"
              >
                <Card className="h-full relative overflow-hidden border border-blue-100/60 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:shadow-cyan-500/20">
                  <CardContent className="p-6 text-center">
                    <motion.div 
                      className="mb-4 flex justify-center"
                      whileHover={{ 
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <div className={`p-3 rounded-xl ${method.gradient} shadow-lg group-hover:shadow-xl transition-all duration-500 relative`}>
                        {method.icon}
                      </div>
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold mb-3 text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
                      {method.title}
                    </h3>
                    
                    <p className="text-lg font-semibold text-blue-600 mb-3">
                      {method.value}
                    </p>
                    
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-sm mb-4">
                      {method.description}
                    </p>

                    {method.href && (
                      <a 
                        href={method.href}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-300"
                      >
                        Contact Now
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section 
        ref={founderAnimation.ref}
        className="py-16 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 70%, #1e293b 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-16 left-16 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-16 right-16 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={founderAnimation.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-semibold text-sm shadow-lg">
                    <User className="w-4 h-4" />
                    Founder & Lead Developer
                  </div>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Reid Reusch
                </h3>
                
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl mx-auto">
                  Passionate about revolutionizing personal finance through AI technology. Reid leads the development of Fintellect's 
                  cutting-edge features and ensures every user gets the best possible financial management experience.
                </p>

                <div className="grid md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-cyan-300 mb-3">Development Expertise</h4>
                    {['Full-stack development', 'AI integration', 'Financial systems', 'User experience design'].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-300 mb-3">Vision & Goals</h4>
                    {['Democratize financial AI', 'Simplify money management', 'Empower smart decisions', 'Build trust through transparency'].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-600">
                  <p className="text-gray-400 text-sm">
                    "Our mission is to make advanced financial AI accessible to everyone, helping people make smarter money decisions with confidence."
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #f8fafc 70%, #ffffff 100%)'
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Support Hours & Response Times
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 bg-white/70 backdrop-blur-sm border border-gray-200/50">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Business Hours</h3>
                <p className="text-gray-600 text-sm">
                  Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                  Saturday: 10:00 AM - 4:00 PM EST<br />
                  Sunday: Closed
                </p>
              </Card>
              
              <Card className="p-6 bg-white/70 backdrop-blur-sm border border-gray-200/50">
                <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Response Times</h3>
                <p className="text-gray-600 text-sm">
                  Email: Within 24 hours<br />
                  Phone: Immediate during business hours<br />
                  Live Chat: Real-time when available
                </p>
              </Card>
            </div>

            <div className="text-center">
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-blue-500/25 transition-all duration-300 border-0"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 