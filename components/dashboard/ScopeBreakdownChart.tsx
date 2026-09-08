'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ScopeBreakdownChartProps {
  scope1: number;
  scope2: number;
  scope3?: number;
}

const COLORS = {
  scope1: '#4A7729',
  scope2: '#2563eb',
  scope3: '#ea580c',
};

export default function ScopeBreakdownChart({ scope1, scope2, scope3 = 0 }: ScopeBreakdownChartProps) {
  const total = scope1 + scope2 + scope3;

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Няма данни за показване
      </div>
    );
  }

  const data = [
    { name: 'Обхват 1 — Директни', value: scope1, percentage: ((scope1 / total) * 100).toFixed(1) },
    { name: 'Обхват 2 — Индиректни', value: scope2, percentage: ((scope2 / total) * 100).toFixed(1) },
    ...(scope3 > 0
      ? [{ name: 'Обхват 3 — Верига', value: scope3, percentage: ((scope3 / total) * 100).toFixed(1) }]
      : []),
  ];

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props) => {
              const pct = (props as { payload?: { percentage?: string } }).payload?.percentage ?? '0';
              return `${pct}%`;
            }}
            outerRadius={80}
            innerRadius={50}
            fill="#8884d8"
            dataKey="value"
          >
            <Cell fill={COLORS.scope1} />
            <Cell fill={COLORS.scope2} />
            {scope3 > 0 && <Cell fill={COLORS.scope3} />}
          </Pie>
          <Tooltip
            formatter={(value: number | string) => `${parseFloat(String(value)).toFixed(2)} tCO₂e`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => {
              const pct = (entry as { payload?: { percentage?: string } }).payload?.percentage ?? '0';
              return `${value} (${pct}%)`;
            }}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
