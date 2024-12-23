import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Target, Wallet, LayoutDashboard, Brain, Send, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useLocation, Link } from "wouter";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  message: string;
  suggestions?: {
    title: string;
    description: string;
  }[];
}

interface QuickAction {
  label: string;
  message: string;
}

const quickActions: QuickAction[] = [
  { label: "💰 Spending Analysis", message: "Can you analyze my recent spending patterns?" },
  { label: "🎯 Financial Goals", message: "Help me set and track financial goals" },
  { label: "💡 Saving Tips", message: "What are some personalized saving tips for me?" },
  { label: "📊 Investment Advice", message: "Give me investment recommendations based on my profile" },
  { label: "🤖 AI Advisor", message: "I'd like some comprehensive financial advice from the AI Financial Advisor" },
];

export default function AIAssistantPage() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI financial assistant. I analyze your spending patterns, transactions, and financial goals to provide personalized advice. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, userId: user?.id }),
      });
      
      if (!response.ok) throw new Error("Failed to send message");
      return response.json() as Promise<AIResponse>;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      const suggestions = data.suggestions || [];
      if (suggestions.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Here are some suggestions based on your question:\n" +
              suggestions.map(s => `• ${s.title}: ${s.description}`).join("\n"),
          },
        ]);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    sendMessage.mutate(input);
    setInput("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickAction = (action: QuickAction) => {
    setMessages(prev => [...prev, { role: "user", content: action.message }]);
    sendMessage.mutate(action.message);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-float-medium"></div>
      </div>

      {/* Header */}
      <header className="border-b border-border/10 backdrop-blur-md bg-background/70 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient">
            AI Financial Assistant
          </h1>
          <div className="flex items-center gap-4">
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
            </div>
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Title Section with AI Disclaimer */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Brain className="h-8 w-8 text-blue-500" />
              </div>
              <h2 className="text-3xl font-bold">AI Financial Assistant</h2>
            </div>
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-400 mb-4">
                Get personalized financial guidance and insights through natural conversation with our AI assistant.
              </p>
              <div className="inline-block bg-blue-500/5 backdrop-blur-sm border border-blue-500/10 rounded-full px-4 py-1.5">
                <AIDisclaimer variant="minimal" className="text-blue-400/80" />
              </div>
            </div>
          </div>

          {/* Chat Card */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action)}
                      className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto p-4 rounded-lg bg-background/50">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 text-blue-500" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800"
                        }`}
                      >
                        <pre className="whitespace-pre-wrap font-sans">
                          {message.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex justify-start animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="pt-4 border-t border-gray-800">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your finances, goals, or get personalized advice..."
                    disabled={sendMessage.isPending}
                    className="flex-1 bg-gray-800/50 border-gray-700"
                  />
                  <Button 
                    type="submit" 
                    disabled={sendMessage.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <BetaFeedback />
    </div>
  );
}
