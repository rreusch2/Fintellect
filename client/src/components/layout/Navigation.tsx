import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Target, 
  Sparkles, 
  LogOut, 
  UserCircle, 
  WalletCards,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavigationProps {
  isComputerSidebarOpen?: boolean;
}

export function Navigation({ isComputerSidebarOpen = false }: NavigationProps = {}) {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      localStorage.removeItem('demoMode');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: WalletCards },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/ai/hub", label: "AI Hub", icon: Sparkles },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/10 backdrop-blur-md bg-background/70">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo - Always visible */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient tracking-tight">
              Fintellect
            </span>
            <div className="hidden sm:flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
              <span className="text-[11px] font-semibold tracking-wider text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                BETA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className={cn(
            "hidden md:flex items-center gap-2 transition-all duration-300 ease-in-out",
            isComputerSidebarOpen ? "mr-[28rem]" : "mr-0"
          )}>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Button
                key={href}
                variant={location === href ? "secondary" : "ghost"}
                className={cn(
                  "gap-2",
                  location === href && "bg-primary/10 text-primary"
                )}
                asChild
              >
                <Link href={href}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* Mobile Navigation Items */}
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Button
                    key={href}
                    variant={location === href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      location === href && "bg-primary/10 text-primary"
                    )}
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = href;
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Button>
                ))}
                
                {/* Mobile User Actions */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-muted-foreground mb-4">
                    Welcome, {user?.username}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = '/profile';
                    }}
                  >
                    <UserCircle className="h-5 w-5" />
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 mt-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
} 