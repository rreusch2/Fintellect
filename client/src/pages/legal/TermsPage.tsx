import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { FileText, Shield, Bot, AlertCircle, Lock, UserCheck, Scale, ArrowLeft, CheckCircle, Globe, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { useRef } from "react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function TermsPage() {
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const contentInView = useInView(contentRef, { once: true });

  usePageTitle('Terms of Service');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20 border-b border-cyan-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">
                Fintellect
              </span>
              <div className="hidden sm:flex items-center px-2 py-1 rounded-full border bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-sm">
                <span className="text-[11px] font-semibold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  BETA
                </span>
              </div>
            </Link>

            {/* Back Button */}
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="relative pt-24 pb-16 overflow-hidden"
      >
        {/* Enhanced Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900"></div>
          
          {/* Floating shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute top-1/4 left-1/6 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
              animate={{ 
                y: [0, -20, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute bottom-1/4 right-1/6 w-32 h-32 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl"
              animate={{ 
                y: [0, 25, 0],
                x: [0, -20, 0],
                scale: [1, 0.9, 1]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />
          </div>
          
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        </div>

        {/* Floating Legal Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/12"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 3, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut"
            }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 flex items-center justify-center">
              <Scale className="w-6 h-6 text-cyan-400" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute top-1/3 right-1/12"
            animate={{ 
              y: [0, 12, 0],
              rotate: [0, -3, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={heroInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center backdrop-blur-sm mb-8"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Terms of{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Service
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Please review our terms of service carefully. These terms govern your use of Fintellect's 
              AI-powered financial management platform and services.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Light background transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-50 to-white"></div>
        
        <div className="relative z-10">
          <motion.div 
            ref={contentRef}
            className="container mx-auto px-4 py-16"
            initial={{ opacity: 0 }}
            animate={contentInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="grid gap-8">
                {/* Agreement */}
                <TermsCard
                  icon={<FileText className="h-6 w-6 text-cyan-600" />}
                  title="Agreement to Terms"
                  delay={0}
                >
                  <p className="text-gray-600 leading-relaxed">
                    By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                  </p>
                </TermsCard>

                {/* AI Services */}
                <TermsCard
                  icon={<Bot className="h-6 w-6 text-blue-600" />}
                  title="AI Financial Services"
                  delay={0.1}
                >
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-orange-800 mb-1">Important Disclaimer</p>
                        <p className="text-sm text-orange-700 leading-relaxed">
                          Our AI-powered insights and recommendations are for informational purposes only and do not constitute financial advice. Always consult with qualified financial professionals for important financial decisions.
                        </p>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    {[
                      "AI analysis is based on available data and historical patterns",
                      "Predictions and insights may not be accurate",
                      "Past performance does not guarantee future results", 
                      "Users should verify all information independently"
                    ].map((item, index) => (
                      <motion.li 
                        key={index}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <CheckCircle className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </TermsCard>

                {/* User Accounts */}
                <TermsCard
                  icon={<UserCheck className="h-6 w-6 text-emerald-600" />}
                  title="User Accounts"
                  delay={0.2}
                >
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    You are responsible for:
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    {[
                      "Maintaining the confidentiality of your account credentials",
                      "All activities that occur under your account", 
                      "Notifying us immediately of any unauthorized access",
                      "Ensuring your account information is accurate and up-to-date"
                    ].map((item, index) => (
                      <motion.li 
                        key={index}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </TermsCard>

                {/* Financial Data */}
                <TermsCard
                  icon={<Lock className="h-6 w-6 text-blue-600" />}
                  title="Financial Data & Privacy"
                  delay={0.3}
                >
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    By using our service, you acknowledge that:
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    {[
                      "Your financial data is processed according to our Privacy Policy",
                      "We use Plaid to securely access your financial institution data",
                      "You authorize us to retrieve your financial information through Plaid", 
                      "You can revoke access to your financial data at any time"
                    ].map((item, index) => (
                      <motion.li 
                        key={index}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </TermsCard>

                {/* Limitations */}
                <TermsCard
                  icon={<AlertCircle className="h-6 w-6 text-orange-600" />}
                  title="Limitations & Disclaimers"
                  delay={0.4}
                >
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed">
                      While we strive to provide accurate and helpful financial insights, please note:
                    </p>
                    <ul className="space-y-3 text-gray-600">
                      {[
                        "Service availability may be interrupted for maintenance or updates",
                        "AI predictions and analysis are not guaranteed to be accurate",
                        "We are not liable for financial decisions made based on our insights",
                        "Third-party integrations (like Plaid) may have their own limitations"
                      ].map((item, index) => (
                        <motion.li 
                          key={index}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </TermsCard>

                {/* Contact Information */}
                <TermsCard
                  icon={<Globe className="h-6 w-6 text-purple-600" />}
                  title="Contact & Support"
                  delay={0.5}
                >
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-gray-600 leading-relaxed mb-3">
                      If you have questions about these Terms of Service, please contact us:
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700"><strong>Email:</strong> admin@fintellectai.co</p>
                      <p className="text-gray-700"><strong>Phone:</strong> (270) 724-2404</p>
                    </div>
                  </div>
                </TermsCard>
              </div>

              {/* Call to Action */}
              <motion.div
                className="text-center pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8 rounded-xl border border-cyan-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Ready to Get Started?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                    By creating an account, you agree to these terms and can start managing your finances with AI-powered insights.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-3 font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
                          Create Account
                        </Button>
                      </motion.div>
                    </Link>
                    <Link href="/contact">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" className="border-gray-300 hover:border-cyan-400 hover:text-cyan-600 px-6 py-3 font-semibold transition-all duration-300">
                          Contact Us
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}

interface TermsCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay: number;
}

function TermsCard({ icon, title, children, delay }: TermsCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group">
        {/* Subtle hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-50/0 via-blue-50/0 to-cyan-50/0 group-hover:from-cyan-50/50 group-hover:via-blue-50/50 group-hover:to-cyan-50/50 transition-all duration-500"></div>
        
        {/* Animated border */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-200/0 via-blue-200/0 to-cyan-200/0 group-hover:from-cyan-200/30 group-hover:via-blue-200/30 group-hover:to-cyan-200/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors duration-300">
            <motion.div
              className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-cyan-50 group-hover:to-blue-50 transition-all duration-300"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              {icon}
            </motion.div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
} 