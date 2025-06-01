import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowLeft, Shield, Lock, User, Mail, Eye, EyeOff, CheckCircle, Home } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  rememberMe: z.boolean().optional().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, refetch } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showRegister, setShowRegister] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false,
    },
    mode: "onChange",
  });

  // Track form validation status
  const { isValid: isRegisterValid } = registerForm.formState;
  const watchPassword = registerForm.watch("password");
  const watchConfirmPassword = registerForm.watch("confirmPassword");
  const watchEmail = registerForm.watch("email");

  // Validation states
  const isPasswordLengthValid = watchPassword?.length >= 8;
  const isPasswordsMatch = watchPassword === watchConfirmPassword && watchConfirmPassword !== "";
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchEmail || "");

  const handleLogin = async (values: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await login(values);
      
      if (!result.ok) {
        throw new Error(result.message);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account.",
      });

      // The redirection is now handled in the useUser hook
      // No need to manually redirect here
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (values: RegisterForm) => {
    setIsLoading(true);
    try {
      const result = await register(values);
      
      if (!result.ok) {
        throw new Error(result.message);
      }

      toast({
        title: "Account Created!",
        description: "Welcome to Fintellect! Your account has been created successfully.",
      });

      // The redirection is now handled in the useUser hook
      // No need to manually redirect here
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  usePageTitle('Sign In');

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

            {/* Back to Home Button */}
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center pt-20">
        {/* Enhanced Background with Moving Elements */}
        <div className="absolute inset-0">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900"></div>
          
          {/* Floating geometric shapes */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Large floating circles */}
            <motion.div 
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl"
              animate={{ 
                y: [0, -30, 0],
                x: [0, 20, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"
              animate={{ 
                y: [0, 40, 0],
                x: [0, -25, 0],
                scale: [1, 0.9, 1]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />
            
            {/* Smaller floating elements */}
            <motion.div 
              className="absolute top-1/3 right-1/3 w-32 h-32 bg-gradient-to-br from-cyan-400/25 to-blue-400/25 rounded-full blur-xl"
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 180, 360],
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "linear"
              }}
            />
          </div>
          
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
          
          {/* Central glow effect */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(0, 255, 225, 0.15) 0%, rgba(0, 212, 255, 0.1) 30%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <Card className="backdrop-blur-md bg-gray-900/40 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-lg"></div>
            
            {/* Animated border */}
            <div className="absolute inset-0 rounded-lg">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
            </div>
            
            <CardHeader className="relative z-10 text-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </motion.div>
              
              <div>
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Fintellect
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {showRegister ? "Create your account to get started" : "Sign in to your account"}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              <Tabs defaultValue="login" onValueChange={(value) => setShowRegister(value === "register")}>
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab Content */}
                <TabsContent value="login">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                        <div className="space-y-5">
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200 font-medium">Username</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      {...field} 
                                      className="pl-10 bg-gray-800/50 border-gray-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-500 transition-all duration-300"
                                      placeholder="Enter your username"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200 font-medium">Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      type={showPassword ? "text" : "password"}
                                      {...field} 
                                      className="pl-10 pr-10 bg-gray-800/50 border-gray-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-500 transition-all duration-300"
                                      placeholder="Enter your password"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center space-x-2">
                            <FormField
                              control={loginForm.control}
                              name="rememberMe"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="border-gray-600 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-600 data-[state=checked]:border-cyan-500"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal text-gray-300 cursor-pointer">
                                    Remember me
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              type="submit" 
                              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 border-0" 
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Signing in...</span>
                                </div>
                              ) : (
                                <span className="flex items-center justify-center space-x-2">
                                  <span>Sign In</span>
                                  <motion.div
                                    animate={{ x: [0, 3, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  >
                                    →
                                  </motion.div>
                                </span>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>

                {/* Register Tab Content */}
                <TabsContent value="register">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                        <div className="space-y-5">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200 font-medium">Username</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      {...field} 
                                      className="pl-10 bg-gray-800/50 border-gray-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-500 transition-all duration-300"
                                      placeholder="Choose a username"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200 font-medium">Email</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      type="email" 
                                      {...field} 
                                      className="pl-10 bg-gray-800/50 border-gray-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-500 transition-all duration-300"
                                      placeholder="Enter your email"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200 font-medium">Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      type={showPassword ? "text" : "password"}
                                      {...field} 
                                      className="pl-10 pr-10 bg-gray-800/50 border-gray-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-500 transition-all duration-300"
                                      placeholder="Create a password"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-200 font-medium">Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input 
                                      type={showConfirmPassword ? "text" : "password"}
                                      {...field} 
                                      className="pl-10 pr-10 bg-gray-800/50 border-gray-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-500 transition-all duration-300"
                                      placeholder="Confirm your password"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Enhanced Requirements List */}
                          {showRegister && (
                            <motion.div 
                              className="space-y-3 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <p className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</p>
                              <RequirementRow
                                text="Password must be at least 8 characters"
                                isMet={isPasswordLengthValid}
                              />
                              <RequirementRow
                                text="Passwords must match"
                                isMet={isPasswordsMatch}
                              />
                              <RequirementRow
                                text="Valid email address required"
                                isMet={isEmailValid}
                              />
                            </motion.div>
                          )}

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              type="submit" 
                              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 border-0" 
                              disabled={isLoading || !isRegisterValid}
                            >
                              {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Creating Account...</span>
                                </div>
                              ) : (
                                <span className="flex items-center justify-center space-x-2">
                                  <span>Create Account</span>
                                  <motion.div
                                    animate={{ x: [0, 3, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  >
                                    →
                                  </motion.div>
                                </span>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function RequirementRow({ text, isMet }: { text: string; isMet: boolean }) {
  return (
    <motion.div 
      className="flex items-center gap-3 text-sm"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
          isMet 
            ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 shadow-lg shadow-emerald-500/25' 
            : 'bg-gray-700/50 border-gray-600'
        }`}
        animate={isMet ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {isMet ? <CheckCircle className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-500" />}
      </motion.div>
      <span className={`transition-colors duration-300 ${isMet ? 'text-emerald-400' : 'text-gray-500'}`}>
        {text}
      </span>
    </motion.div>
  );
}
