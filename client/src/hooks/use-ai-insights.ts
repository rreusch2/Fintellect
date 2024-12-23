import { useQuery } from "@tanstack/react-query";

interface Insight {
  type: "action" | "tip";
  title: string;
  description: string;
  impact?: string;
  priority: "high" | "medium" | "low";  // Make priority required to match backend
}

export function useAIInsights() {
  const { data: insights = [], isLoading } = useQuery<Insight[]>({
    queryKey: ["/api/ai/insights"],
    queryFn: async () => {
      const response = await fetch("/api/ai/insights", {
        credentials: "include",
      });

      if (!response.ok) {
        // Fallback insights if the API fails
        return [
          {
            type: "action",
            title: "Connect Your Bank Account",
            description: "Link your accounts to receive personalized insights based on your actual spending patterns.",
            impact: "Get tailored savings recommendations",
            priority: "high",
          },
          {
            type: "tip",
            title: "Enable Smart Categorization",
            description: "Use our AI-powered expense categorization to track spending more effectively.",
            priority: "medium",
          },
        ];
      }

      return response.json();
    },
  });

  return {
    insights,
    isLoading,
  };
}
