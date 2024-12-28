import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getCategoryColor, formatCategoryName } from '@/lib/categories';

interface SpendingDistributionChartProps {
  data: Record<string, number>;
  showLegend?: boolean;
}

export function SpendingDistributionChart({ data, showLegend = true }: SpendingDistributionChartProps) {
  const chartData = Object.entries(data)
    .filter(([category]) => (
      category !== 'INCOME' && 
      !category.includes('TRANSFER') &&
      !['OTHER', 'UNCATEGORIZED'].includes(category)
    ))
    .map(([category, value]) => ({
      name: category,
      value: Math.abs(value),
      color: getCategoryColor(category.toUpperCase())
    }))
    .sort((a, b) => b.value - a.value);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const data = payload[0].payload;
      const percentage = (data.value / totalValue) * 100;
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <p className="font-medium">{formatCategoryName(data.name)}</p>
          </div>
          <p className="text-primary font-semibold">
            ${(data.value / 100).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage.toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="stroke-background hover:opacity-80 transition-opacity"
                strokeWidth={2}
              />
            ))}
          </Pie>
          {showLegend && (
            <Legend 
              layout="vertical" 
              align="right"
              verticalAlign="middle"
              formatter={(value) => formatCategoryName(value as string)}
              wrapperStyle={{
                paddingLeft: '20px',
              }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 