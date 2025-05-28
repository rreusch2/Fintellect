import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
        title: "Success!",
        description: "Welcome back!",
      });

      // The redirection is now handled in the useUser hook
      // No need to manually redirect here
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
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
        title: "Success!",
        description: "Account created successfully",
      });

      // The redirection is now handled in the useUser hook
      // No need to manually redirect here
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  usePageTitle('Sign In');

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-black"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      <Card className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm border-gray-800 relative z-10">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
            Welcome
          </CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" onValueChange={(value) => setShowRegister(value === "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            {/* Login Tab Content */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <div className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-gray-800/50 border-gray-700 focus:border-blue-500 text-white placeholder:text-gray-500"
                            />
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              className="bg-gray-800/50 border-gray-700 focus:border-blue-500 text-white placeholder:text-gray-500"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center space-x-2 mb-4">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="border-gray-600 data-[state=checked]:bg-blue-600"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal text-gray-300">
                              Remember me
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Logging in...</span>
                        </div>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Register Tab Content */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                  <div className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Username</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-gray-800/50 border-gray-700 focus:border-blue-500"
                              placeholder="Choose a username"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              {...field} 
                              className="bg-gray-800/50 border-gray-700 focus:border-blue-500"
                              placeholder="Enter your email"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              className="bg-gray-800/50 border-gray-700 focus:border-blue-500"
                              placeholder="Create a password"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              className="bg-gray-800/50 border-gray-700 focus:border-blue-500"
                              placeholder="Confirm your password"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Requirements List */}
                    {showRegister && (
                      <div className="space-y-2 mt-4">
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
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors" 
                      disabled={isLoading || !isRegisterValid}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function RequirementRow({ text, isMet }: { text: string; isMet: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isMet ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
        {isMet ? '✓' : '○'}
      </div>
      <span className={isMet ? 'text-green-500' : 'text-gray-500'}>{text}</span>
    </div>
  );
}
