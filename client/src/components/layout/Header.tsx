import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCircle, LogOut } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      // Clear any stored demo mode
      localStorage.removeItem('demoMode');
      
      // Clear any stored user data
      localStorage.removeItem('user');
      
      // Show success message
      toast({
        title: "Success",
        description: "Logged out successfully"
      });

      // Force a full page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again."
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              Fintellect
            </span>
            <span className="text-xs bg-blue-500/10 text-blue-500 rounded-md px-1.5 py-0.5">BETA</span>
          </Link>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full"
            >
              <Link href="/profile">
                <UserCircle className="h-6 w-6" />
              </Link>
            </Button>

            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 