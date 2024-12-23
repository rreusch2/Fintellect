import { Link } from "wouter";
import { Shield, FileText, ExternalLink } from "lucide-react";

export function LegalFooter() {
  return (
    <footer className="border-t border-border/10 bg-background/70 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/privacy">
              <a className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </a>
            </Link>
            <Link href="/terms">
              <a className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Terms of Service
              </a>
            </Link>
            <a 
              href="https://plaid.com/legal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Plaid Legal
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 