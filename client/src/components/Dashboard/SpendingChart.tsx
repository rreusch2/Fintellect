import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface SpendingChartProps {
  spendingByCategory?: {
    category: string;
    amount: number;
  }[];
}

const CATEGORY_COLORS = {
  'FOOD_AND_DRINK': '#f97316', // orange-500
  'TRANSPORTATION': '#3b82f6', // blue-500
  'SHOPPING': '#ec4899', // pink-500
  'ENTERTAINMENT': '#6366f1', // indigo-500
  'BUSINESS': '#6b7280', // gray-500
  'EDUCATION': '#eab308', // yellow-500
  'HEALTHCARE': '#14b8a6', // teal-500
  'RECREATION': '#8b5cf6', // violet-500
  'UNCATEGORIZED': '#9ca3af', // gray-400
};

const DEFAULT_COLOR = '#9ca3af'; // gray-400

// Categories to exclude from spending distribution
const EXCLUDED_CATEGORIES = ['TRANSFER_IN', 'TRANSFER_OUT', 'UNCATEGORIZED'];

function normalizeCategory(category: string) {
  return category.toUpperCase().replace(/\s+/g, '_');
}

function getCategoryColor(category: string) {
  const normalizedCategory = normalizeCategory(category);
  return CATEGORY_COLORS[normalizedCategory as keyof typeof CATEGORY_COLORS] || DEFAULT_COLOR;
}

function formatAmount(amount: number) {
  return `$${Math.abs(amount / 100).toFixed(2)}`;
}

function formatPercentage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCategoryName(category: string) {
  return category.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}

export default function SpendingChart({ spendingByCategory = [] }: SpendingChartProps) {
  // Filter out transfers and credits, only include actual spending
  const filteredCategories = spendingByCategory
    .filter(Boolean) // Remove any null/undefined items
    .filter(item => 
      !EXCLUDED_CATEGORIES.includes(item.category) && item.amount > 0
    );

  if (filteredCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No spending data available
        </CardContent>
      </Card>
    );
  }

  const totalSpending = filteredCategories.reduce((sum, item) => sum + Math.abs(item.amount), 0);
  
  const data = filteredCategories
    .map(item => ({
      name: item.category,
      value: Math.abs(item.amount),
      percentage: Math.abs(item.amount) / totalSpending
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{formatCategoryName(data.name)}</p>
          <p className="text-sm text-muted-foreground">
            {formatAmount(data.value)} ({formatPercentage(data.percentage)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={getCategoryColor(entry.name)}
                    className="stroke-background dark:stroke-background"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right"
                verticalAlign="middle"
                formatter={(value: string) => (
                  <span className="text-sm">
                    {formatCategoryName(value)}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item) => {
            const formattedCategory = formatCategoryName(item.name);
            const categoryColor = getCategoryColor(item.name);
            
            return (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: categoryColor,
                      opacity: 0.8 
                    }}
                  />
                  <span className="text-sm font-medium">{formattedCategory}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatAmount(item.value)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({formatPercentage(item.percentage)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
