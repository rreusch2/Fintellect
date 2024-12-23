import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCircle } from "lucide-react";

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