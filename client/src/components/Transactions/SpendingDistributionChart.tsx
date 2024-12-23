import React from 'react';
import { PieChart as Pie, Pie as PieSegment, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { COLORS } from '@/lib/categories';

interface SpendingDistributionChartProps {
  data: Record<string, number>;
}

export function SpendingDistributionChart({ data }: SpendingDistributionChartProps) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value: Math.abs(value),
    }))
    .sort((a, b) => b.value - a.value);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = (data.value / totalValue) * 100;
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="font-medium mb-1">{data.name}</p>
          <p className="text-primary font-semibold">
            ${(data.value / 100).toFixed(2)}
          </p>
          <p className="text-muted-foreground text-sm">
            {percentage.toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Pie>
        <PieSegment
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={4}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.OTHER}
              opacity={0.8}
            />
          ))}
        </PieSegment>
        <Tooltip 
          content={<CustomTooltip />}
          cursor={false}
        />
      </Pie>
    </ResponsiveContainer>
  );
} 