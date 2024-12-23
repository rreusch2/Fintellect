import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Target, TrendingUp, Landmark, Sparkles, Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const goalTypes = [
  { value: "savings", label: "Savings Goal", icon: Target },
  { value: "investment", label: "Investment Goal", icon: TrendingUp },
  { value: "custom", label: "Custom Goal", icon: Landmark },
] as const;

const goalCategories = [
  { value: "emergency_fund", label: "Emergency Fund" },
  { value: "retirement", label: "Retirement" },
  { value: "house", label: "House Down Payment" },
  { value: "education", label: "Education" },
  { value: "vacation", label: "Vacation" },
  { value: "car", label: "Car" },
  { value: "debt_payoff", label: "Debt Payoff" },
  { value: "other", label: "Other" },
] as const;

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["savings", "investment", "custom"]),
  category: z.string().min(1, "Category is required"),
  targetAmount: z.string().min(1, "Target amount is required"),
  deadline: z.string().optional(),
  description: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddGoalDialog({ open, onOpenChange }: AddGoalDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [isGettingAiSuggestion, setIsGettingAiSuggestion] = useState(false);

  const form = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      type: "savings",
      category: "",
      targetAmount: "",
      deadline: "",
      description: "",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalForm) => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          targetAmount: Math.round(parseFloat(data.targetAmount) * 100), // Convert to cents
          currentAmount: 0,
          status: "in_progress",
          aiSuggestions: aiSuggestion
            ? [
                {
                  title: "AI Recommendation",
                  description: aiSuggestion,
                },
              ]
            : [],
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal Created",
        description: "Your financial goal has been created successfully.",
      });
      form.reset();
      setAiSuggestion("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const getAiSuggestion = async () => {
    const formData = form.getValues();
    if (!formData.targetAmount || !formData.type || !formData.category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description:
          "Please fill in the target amount, type, and category to get AI suggestions.",
      });
      return;
    }

    setIsGettingAiSuggestion(true);
    try {
      const response = await fetch("/api/ai/financial-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: `I want to set a ${formData.type} goal for ${
            formData.category
          } with a target of $${
            parseFloat(formData.targetAmount).toFixed(2)
          }. Can you analyze this goal and provide personalized recommendations?`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI suggestion");
      }

      const data = await response.json();
      const advice = data.recommendations.map(rec => ({
        title: rec.title,
        description: rec.description,
        impact: rec.impact,
        priority: rec.priority
      }));
      setAiSuggestion(
        advice.map(rec => 
          `${rec.title}\n${rec.description}\n\nImpact: ${rec.impact}`
        ).join('\n\n')
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI suggestion. Please try again.",
      });
    } finally {
      setIsGettingAiSuggestion(false);
    }
  };

  const onSubmit = (data: GoalForm) => {
    createGoalMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <div className="max-h-[calc(85vh-4rem)] overflow-y-auto pr-2">
          <DialogHeader>
            <DialogTitle>Create New Financial Goal</DialogTitle>
            <DialogDescription>
              Set up a new financial goal and get AI-powered recommendations to help
              you achieve it.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter goal name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {goalTypes.map(({ value, label, icon: Icon }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {goalCategories.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter target amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add additional details about your goal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">AI Recommendations</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getAiSuggestion}
                    disabled={isGettingAiSuggestion}
                  >
                    {isGettingAiSuggestion ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Advice...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Get AI Advice
                      </>
                    )}
                  </Button>
                </div>

                {aiSuggestion && (
                  <div className="p-4 bg-muted/50 border rounded-lg space-y-3 max-h-[300px] overflow-y-auto">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-medium">AI Financial Advisor</h4>
                        <div className="text-sm prose prose-sm max-w-none">
                          {aiSuggestion.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-2">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  {aiSuggestion && (
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Sparkles className="h-4 w-4 mr-1 text-primary" />
                      AI-optimized goal
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={createGoalMutation.isPending}
                  >
                    {createGoalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Create Goal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
