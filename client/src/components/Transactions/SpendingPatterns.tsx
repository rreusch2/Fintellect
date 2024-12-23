import { PieChart, Cell, Pie, ResponsiveContainer, Legend } from 'recharts';

interface Category {
  name: string;
  value: number;
  color: string;
}

interface SpendingPatternsProps {
  data: {
    entertainment?: number;
    transportation?: number;
    // Add other categories as needed
    [key: string]: number | undefined;
  } | undefined;
}

export default function SpendingPatterns({ data }: SpendingPatternsProps) {
  const chartData: Category[] = [
    { name: 'Entertainment', value: data?.entertainment || 0, color: '#3B82F6' },
    { name: 'Transportation', value: data?.transportation || 0, color: '#10B981' },
    // Add other categories as needed
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            content={({ payload }) => {
              if (!payload) return null;
              
              return (
                <div className="flex justify-center gap-6 mt-4">
                  {payload.map((entry: any, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: chartData[index].color }}
                      />
                      <span className="text-sm font-medium text-white/80">
                        {chartData[index].name}
                      </span>
                      <span className="text-sm text-white/60">
                        ({((chartData[index].value / total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
