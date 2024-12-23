import { FileText, Shield, Bot, AlertCircle, Lock, UserCheck, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalFooter } from "@/components/legal/LegalFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="grid gap-6">
            {/* Agreement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Agreement to Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                </p>
              </CardContent>
            </Card>

            {/* AI Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI Financial Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm font-medium">Important Disclaimer</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our AI-powered insights and recommendations are for informational purposes only and do not constitute financial advice. Always consult with qualified financial professionals for important financial decisions.
                  </p>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>AI analysis is based on available data and historical patterns</li>
                  <li>Predictions and insights may not be accurate</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>Users should verify all information independently</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  User Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are responsible for:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                  <li>Ensuring your account information is accurate and up-to-date</li>
                </ul>
              </CardContent>
            </Card>

            {/* Financial Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Financial Data & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  By using our service, you acknowledge that:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Your financial data is processed according to our Privacy Policy</li>
                  <li>We use Plaid to securely access your financial institution data</li>
                  <li>You authorize us to retrieve your financial information through Plaid</li>
                  <li>You can revoke access to your financial data at any time</li>
                </ul>
              </CardContent>
            </Card>

            {/* Limitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Limitations of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm font-medium">Important Notice</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We are not liable for any financial decisions you make based on our service. Our AI insights are for informational purposes only.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  We are not liable for:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Financial losses resulting from using our services</li>
                  <li>Accuracy of third-party data or AI predictions</li>
                  <li>Service interruptions or data unavailability</li>
                  <li>Actions taken based on AI recommendations</li>
                </ul>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Legal Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Our service complies with:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Financial data protection regulations</li>
                  <li>Consumer privacy laws</li>
                  <li>AI transparency requirements</li>
                  <li>Electronic communication standards</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  For regulatory inquiries, contact compliance@yourcompany.com
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Account Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We reserve the right to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>Suspend or terminate accounts for violations of these terms</li>
                  <li>Modify or discontinue services with reasonable notice</li>
                  <li>Delete inactive accounts after extended periods</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  You can terminate your account at any time by contacting support.
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