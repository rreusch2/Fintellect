import { Shield, Lock, Database, Bot, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { getLatestVersion } from "@/lib/legal/versions";
import { VersionInfo } from "@/components/legal/VersionInfo";

export default function PrivacyPolicyPage() {
  const version = getLatestVersion('privacy-policy');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            {version && <VersionInfo version={version} showChangelog />}
          </div>

          <div className="grid gap-6">
            {/* Data Collection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Data Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-semibold">Information We Collect</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Account information (username, encrypted password)</li>
                  <li>Financial data through Plaid integration</li>
                  <li>Transaction history and spending patterns</li>
                  <li>User preferences and financial goals</li>
                  <li>Usage data and interaction with our services</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Data Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We use your data to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Provide personalized financial insights and recommendations</li>
                  <li>Improve our AI models and service accuracy</li>
                  <li>Maintain and enhance our services</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
                <div className="bg-primary/5 p-4 rounded-lg mt-4">
                  <p className="text-sm font-medium">Important Notice</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We never sell your personal data to third parties. Your financial information is used solely for providing our services.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We implement industry-standard security measures:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>End-to-end encryption for all sensitive data</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Secure infrastructure and access controls</li>
                  <li>Employee security training and access limitations</li>
                </ul>
              </CardContent>
            </Card>

            {/* Plaid Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Plaid Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We use Plaid to securely connect to your financial institutions. Your banking credentials are never stored on our servers and are handled directly by Plaid.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://plaid.com/legal" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Plaid Privacy Policy
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card>
              <CardHeader>
                <CardTitle>Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You have the right to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Access your personal data</li>
                  <li>Request data deletion</li>
                  <li>Opt-out of certain data processing</li>
                  <li>Update your information</li>
                  <li>Disconnect financial accounts</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Contact us at privacy@yourcompany.com to exercise these rights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
} 