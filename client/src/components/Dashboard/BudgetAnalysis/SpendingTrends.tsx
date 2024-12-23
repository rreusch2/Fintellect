import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface SpendingTrend {
  date: string;
  amount: number;
}

interface SpendingTrendsProps {
  data: SpendingTrend[];
}

export default function SpendingTrends({ data }: SpendingTrendsProps) {
  // If no data or empty data array, show placeholder
  if (!data || data.length === 0) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Monthly Spending Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No spending trend data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Monthly Spending Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => `$${(value/100).toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => `$${(value/100).toFixed(2)}`}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
