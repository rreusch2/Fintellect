import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LayoutDashboard, Target, Sparkles, LogOut, UserCircle, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useMemo } from "react";

export function Navigation() {
  const [location] = useLocation();
  const { user } = useUser();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: WalletCards },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/ai/hub", label: "AI Hub", icon: Sparkles },
  ];

  const navigationItems = useMemo(() => navItems, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/10 backdrop-blur-md bg-background/70">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <a className="flex items-center gap-2.5">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
                  Fintellect
                </span>
                <div className="flex items-center px-1.5 py-[2px] rounded-full bg-primary/5 border border-primary/20 translate-y-[1px]">
                  <span className="text-[10px] font-semibold tracking-wide text-primary">
                    BETA
                  </span>
                </div>
              </a>
            </Link>
            <div className="flex items-center gap-2">
              {navigationItems.map(({ href, label, icon: Icon }) => (
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
          </div>
          <div className="flex items-center gap-4">
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
        </div>
      </div>
    </nav>
  );
} 