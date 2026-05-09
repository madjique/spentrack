import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  currencySymbol: string;
}

export function DonutChart({ data, currencySymbol }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-600">
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => {
          const num = typeof value === 'number' ? value : parseFloat(String(value));
          return [`${currencySymbol}${isNaN(num) ? '0.00' : num.toFixed(2)}`, ''];
        }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
