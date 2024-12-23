import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LayoutDashboard, Receipt, Target, Sparkles, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export function Navigation() {
  const { user, logout } = useUser();
  const [location] = useLocation();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/ai/hub", label: "AI Hub", icon: Sparkles },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/10 backdrop-blur-md bg-background/70">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <a className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
                Finflow
              </a>
            </Link>
            <div className="flex items-center gap-2">
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
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <Link href="/profile">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </Button>
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