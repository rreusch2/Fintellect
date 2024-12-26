import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Target, 
  Hourglass, 
  TrendingUp, 
  AlertCircle,
  Bot,
  LayoutDashboard,
  PencilLine
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AddGoalDialog from "@/components/Goals/AddGoalDialog";
import UpdateGoalDialog from "@/components/Goals/UpdateGoalDialog";
import { Footer } from "@/components/layout/Footer";
import { BetaFeedback } from "@/components/feedback/BetaFeedback";
import { Navigation } from "@/components/layout/Navigation";

interface Goal {
  id: number;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  status: string;
  category: string;
  description?: string;
  aiSuggestions?: {
    title: string;
    description: string;
    type: string;
    impact?: string;
  }[];
}

export default function GoalsPage() {
  const { toast } = useToast();
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const activeGoals = goals.filter((goal) => goal.status === "in_progress");
  const completedGoals = goals.filter((goal) => goal.status === "completed");

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden dark flex flex-col">
      <Navigation />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Your Goals</h2>
            <p className="text-muted-foreground">
              Track and manage your financial goals
            </p>
          </div>
          <Button onClick={() => setShowAddGoal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Goal
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading goals...</div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <Target className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No Goals Set Yet</h3>
                  <p className="text-muted-foreground">
                    Start by setting your first financial goal. Our AI assistant will help
                    you create realistic and achievable targets.
                  </p>
                  <Button onClick={() => setShowAddGoal(true)}>
                    Create Your First Goal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeGoals.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Active Goals</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            )}

            {completedGoals.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Completed Goals</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <AddGoalDialog open={showAddGoal} onOpenChange={setShowAddGoal} />
      </main>
      <Footer />
      <BetaFeedback />
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
const getUpdatedAdvice = async (goal: Goal) => {
  try {
    const response = await fetch("/api/ai/financial-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        query: `Please analyze my ${goal.type} goal for ${goal.category}. Current progress: $${(goal.currentAmount/100).toFixed(2)} of $${(goal.targetAmount/100).toFixed(2)}. ${goal.deadline ? `Deadline: ${goal.deadline}` : ''}`
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI advice");
    }

    const data = await response.json();
    // We'll implement the goal update logic in the next step
    console.log("Received updated advice:", data);
  } catch (error) {
    console.error("Error getting AI advice:", error);
  }
};

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;

  const getGoalIcon = (type: string) => {
    switch (type) {
      case "savings":
        return <Target className="h-5 w-5" />;
      case "investment":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Hourglass className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getGoalIcon(goal.type)}
            <CardTitle className="text-lg">{goal.name}</CardTitle>
          </div>
          <span className="text-sm font-medium">
            {goal.status === "completed" ? (
              "Completed!"
            ) : goal.deadline ? (
              `Due ${formatDistanceToNow(new Date(goal.deadline), {
                addSuffix: true,
              })}`
            ) : null}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-3" />
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="font-medium">${(goal.currentAmount / 100).toLocaleString()}</span>
                <span className="text-muted-foreground"> saved of </span>
                <span className="font-medium">${(goal.targetAmount / 100).toLocaleString()}</span>
              </div>
            </div>
          {goal.status !== "completed" && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                ${remaining / 100} remaining to reach your goal
              </p>
              {goal.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpdateDialog(true)}
                >
                  <PencilLine className="h-4 w-4 mr-2" />
                  Quick Update
                </Button>
              )}
            </div>
          )}
          {goal.aiSuggestions && goal.aiSuggestions.length > 0 && (
            <div className="mt-4 p-4 bg-primary/5 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-primary">
                      AI Financial Advisor
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => getUpdatedAdvice(goal)}
                    >
                      <PencilLine className="h-3 w-3 mr-1" />
                      Update Advice
                    </Button>
                  </div>
                  {goal.aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="mt-2">
                      <h5 className="font-medium text-sm">{suggestion.title}</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {suggestion.description}
                      </p>
                      {suggestion.impact && (
                        <p className="text-sm font-medium text-primary mt-1">
                          Expected Impact: {suggestion.impact}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <UpdateGoalDialog 
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        goal={goal}
      />
    </Card>
  );
}