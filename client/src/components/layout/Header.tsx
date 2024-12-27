import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCircle, LogOut } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Add this button next to the logout button in the header:
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

const { logout } = useUser();
const [, setLocation] = useLocation();
const { toast } = useToast();

const handleLogout = async () => {
  try {
    const result = await logout();
    if (result.ok) {
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
      // Force reload to clear all state
      window.location.href = '/';
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to logout. Please try again."
    });
  }
};

// Update your logout button
<Button 
  variant="outline" 
  onClick={handleLogout}
  className="gap-2"
>
  <LogOut className="h-4 w-4" />
  Logout
</Button> 