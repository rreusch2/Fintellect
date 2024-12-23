import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { 
  UserCircle, 
  LogOut, 
  CreditCard, 
  Settings, 
  Shield, 
  Bot,
  LayoutDashboard,
  Target,
  Wallet,
  Unlink,
  Bell,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfileSettingsPage() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleDisconnectPlaid = async () => {
    setIsLoading(true);
    try {
      console.log("Starting Plaid disconnect...");
      const response = await fetch("/api/plaid/disconnect", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Disconnect response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect account");
      }

      // Invalidate all relevant queries
      console.log("Invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/transactions/summary"] });
      
      toast({
        title: "Account Disconnected",
        description: "Your bank account has been successfully disconnected. All related data has been cleared.",
        type: "success"
      });

      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect bank account. Please try again.",
        type: "error",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      <header className="border-b border-border/10 backdrop-blur-md bg-background/70 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
            </Button>
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Username</label>
                <p className="text-muted-foreground">{user?.username}</p>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Manage your connected bank accounts and financial services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Plaid Connection</h3>
                    <p className="text-sm text-muted-foreground">
                      Connected to your bank accounts
                    </p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDisconnectPlaid}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Email Notifications</label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your accounts and transactions
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">AI Suggestions</label>
                  <p className="text-sm text-muted-foreground">
                    Get personalized AI-powered financial insights
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <BetaFeedback />
    </div>
  );
} 