import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface InvestmentProfile {
  riskTolerance: number;
  investmentGoal: string;
  monthlyInvestment: number;
  investmentTimeframe: string;
  existingInvestments: string[];
  preferredSectors: string[];
  emergencyFund: boolean;
  retirementPlan: boolean;
}

const INVESTMENT_GOALS = [
  { value: "retirement", label: "Retirement Planning" },
  { value: "wealth", label: "Wealth Building" },
  { value: "passive", label: "Passive Income" },
  { value: "shortTerm", label: "Short-term Growth" },
];

const TIMEFRAMES = [
  { value: "0-2", label: "0-2 years (Short Term)" },
  { value: "3-5", label: "3-5 years (Medium Term)" },
  { value: "5-10", label: "5-10 years (Long Term)" },
  { value: "10+", label: "10+ years (Very Long Term)" },
];

const SECTORS = [
  { value: "tech", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Financial Services" },
  { value: "consumer", label: "Consumer Goods" },
  { value: "energy", label: "Energy" },
  { value: "real-estate", label: "Real Estate" },
];

export default function InvestmentProfileForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<InvestmentProfile>({
    riskTolerance: 5,
    investmentGoal: "",
    monthlyInvestment: 0,
    investmentTimeframe: "",
    existingInvestments: [],
    preferredSectors: [],
    emergencyFund: false,
    retirementPlan: false,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: InvestmentProfile) => {
      console.log("Submitting profile data:", data);
      try {
        const response = await fetch("/api/investment/profile", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server error - received non-JSON response");
        }

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || "Failed to update profile");
        }
        
        return responseData;
      } catch (error) {
        console.error("Profile update error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to update profile");
      }
    },
    onSuccess: (data) => {
      console.log("Profile update success:", data);
      queryClient.invalidateQueries({ queryKey: ["investment-profile"] });
      queryClient.invalidateQueries({ queryKey: ["investment-advice"] });
      
      if (data.advice) {
        queryClient.setQueryData(["investment-advice"], data.advice);
      }
      
      toast({
        title: "Profile Updated",
        description: "Your investment profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update investment profile. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!profile.investmentGoal) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select an investment goal.",
      });
      return;
    }
    if (!profile.investmentTimeframe) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select an investment timeframe.",
      });
      return;
    }
    if (profile.preferredSectors.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select at least one preferred sector.",
      });
      return;
    }
    
    console.log("Submitting profile:", profile);
    updateProfile.mutate(profile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Risk Tolerance */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Risk Tolerance: {profile.riskTolerance}/10
            </label>
            <Slider
              value={[profile.riskTolerance]}
              onValueChange={([value]) =>
                setProfile((prev) => ({ ...prev, riskTolerance: value }))
              }
              max={10}
              step={1}
            />
            <p className="text-sm text-muted-foreground">
              {profile.riskTolerance <= 3
                ? "Conservative: Focus on capital preservation"
                : profile.riskTolerance <= 7
                ? "Moderate: Balance between growth and stability"
                : "Aggressive: Maximum growth potential"}
            </p>
          </div>

          {/* Investment Goal */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Investment Goal</label>
            <Select
              value={profile.investmentGoal}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, investmentGoal: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your primary investment goal" />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_GOALS.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Investment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly Investment ($)</label>
            <Input
              type="number"
              min="0"
              step="100"
              value={profile.monthlyInvestment}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  monthlyInvestment: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="Enter amount"
            />
          </div>

          {/* Investment Timeframe */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Investment Timeframe</label>
            <Select
              value={profile.investmentTimeframe}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, investmentTimeframe: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your investment timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((timeframe) => (
                  <SelectItem key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Sectors */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred Sectors</label>
            <Select
              value={profile.preferredSectors[0]}
              onValueChange={(value) =>
                setProfile((prev) => ({
                  ...prev,
                  preferredSectors: [...prev.preferredSectors, value],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred sectors" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.preferredSectors.map((sector) => (
                <Button
                  key={sector}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      preferredSectors: prev.preferredSectors.filter(
                        (s) => s !== sector
                      ),
                    }))
                  }
                >
                  {SECTORS.find((s) => s.value === sector)?.label} ×
                </Button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 