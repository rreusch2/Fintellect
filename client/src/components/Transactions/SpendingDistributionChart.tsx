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
        <div className="bg-background/95 backdrop-blur-sm border border-gray-800 rounded-lg p-3 shadow-lg">
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
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            startAngle={180}
            endAngle={-180}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="stroke-background/10 hover:opacity-80 transition-opacity cursor-pointer"
                strokeWidth={1}
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />} 
            wrapperStyle={{
              zIndex: 100,
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Enhanced Legend Below Chart */}
      <div className="mt-4 grid grid-cols-2 gap-2 px-2">
        {chartData.map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group"
          >
            <div 
              className="w-2 h-2 rounded-full transition-transform group-hover:scale-125" 
              style={{ backgroundColor: item.color }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium group-hover:text-primary transition-colors">
                {formatCategoryName(item.name)}
              </span>
              <span className="text-[11px] text-muted-foreground group-hover:text-primary/70">
                ${(item.value / 100).toFixed(2)} ({((item.value / totalValue) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 