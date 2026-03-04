'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EmissionsChartProps {
  data: any[];
}

export default function EmissionsChart({ data }: EmissionsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Няма данни за показване
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          stroke="#888888"
          fontSize={12}
        />
        <YAxis 
          stroke="#888888"
          fontSize={12}
          label={{ value: 'tCO₂e', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(value: any) => [`${parseFloat(value).toFixed(2)} tCO₂e`, '']}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar 
          dataKey="scope1" 
          name="Обхват 1" 
          fill="#4A7729" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="scope2" 
          name="Обхват 2" 
          fill="#2563eb" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}


