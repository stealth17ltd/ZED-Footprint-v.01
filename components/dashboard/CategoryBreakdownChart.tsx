'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryBreakdownChartProps {
  data: Record<string, number>;
  labels: Record<string, string>;
}

export default function CategoryBreakdownChart({ data, labels }: CategoryBreakdownChartProps) {
  // Transform data for chart
  const chartData = Object.entries(data)
    .map(([category, value]) => ({
      category: labels[category] || category,
      value: value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 categories

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Няма данни за показване
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          type="number"
          stroke="#888888"
          fontSize={12}
          label={{ value: 'tCO₂e', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
        />
        <YAxis 
          type="category"
          dataKey="category" 
          stroke="#888888"
          fontSize={11}
          width={150}
        />
        <Tooltip 
          formatter={(value: any) => [`${parseFloat(value).toFixed(2)} tCO₂e`, 'Емисии']}
          contentStyle={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Bar 
          dataKey="value" 
          fill="#4A7729"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}


