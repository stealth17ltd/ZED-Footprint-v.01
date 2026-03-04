'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ScopeBreakdownChartProps {
  scope1: number;
  scope2: number;
}

const COLORS = {
  scope1: '#4A7729',  // Earth green
  scope2: '#2563eb',  // Blue
};

export default function ScopeBreakdownChart({ scope1, scope2 }: ScopeBreakdownChartProps) {
  const total = scope1 + scope2;
  
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Няма данни за показване
      </div>
    );
  }

  const data = [
    { name: 'Обхват 1 - Директни', value: scope1, percentage: ((scope1 / total) * 100).toFixed(1) },
    { name: 'Обхват 2 - Индиректни', value: scope2, percentage: ((scope2 / total) * 100).toFixed(1) },
  ];

  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            innerRadius={50}
            fill="#8884d8"
            dataKey="value"
          >
            <Cell fill={COLORS.scope1} />
            <Cell fill={COLORS.scope2} />
          </Pie>
          <Tooltip 
            formatter={(value: any) => `${parseFloat(value).toFixed(2)} tCO₂e`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => `${value} (${entry.payload.percentage}%)`}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}


