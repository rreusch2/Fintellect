import { PieChart as Pie, Pie as PieSegment, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { normalizeCategory } from '@/lib/categories';

interface SpendingDistributionProps {
  data: Record<string, number>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function SpendingDistribution({ data }: SpendingDistributionProps) {
  // Filter out housing and normalize categories
  const chartData = Object.entries(data)
    .filter(([category]) => {
      const upperCategory = category.toUpperCase();
      return !upperCategory.includes('HOUSING') && !upperCategory.includes('HOUSE');
    })
    .reduce((acc, [category, value]) => {
      let normalizedCategory = category;
      
      // Manual category normalization with proper formatting
      if (category.includes('FOOD') || category.includes('DINING')) {
        normalizedCategory = 'Food & Dining';
      } else if (category.includes('TRANSPORTATION')) {
        normalizedCategory = 'Transportation';
      } else if (category.includes('SHOPPING') || category.includes('FUN') || category.includes('SPARKFUN')) {
        normalizedCategory = 'Shopping';
      } else if (category.includes('PAYMENT') || category.includes('CREDIT_CARD')) {
        normalizedCategory = 'Payments';
      } else {
        // Replace underscores with spaces and capitalize properly
        normalizedCategory = category
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      if (!acc[normalizedCategory]) {
        acc[normalizedCategory] = 0;
      }
      acc[normalizedCategory] += Math.abs(value);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(chartData)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = (value / totalValue) * 100;
      
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{payload[0].name}</p>
          <p className="text-blue-400 font-semibold">
            ${value.toFixed(2)}
          </p>
          <p className="text-gray-400 text-sm">
            {percentage.toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Pie data={pieData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <PieSegment
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label={({ name, percent }) => 
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
        >
          {pieData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              opacity={0.8}
            />
          ))}
        </PieSegment>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value: string) => (
            <span className="text-white/80 text-sm">{value}</span>
          )}
          wrapperStyle={{
            paddingTop: '20px'
          }}
        />
      </Pie>
    </ResponsiveContainer>
  );
} 