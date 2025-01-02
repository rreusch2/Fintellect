import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LayoutDashboard, Wallet, Target, Bot, LogOut, UserCircle } from "lucide-react";

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const { user, logout } = useUser();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b border-border/10 backdrop-blur-md bg-background/70 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
                Fintellect
              </a>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/transactions" className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Transactions
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/goals" className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/ai/hub" className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Hub
                </Link>
              </Button>
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
    </header>
  );
} 