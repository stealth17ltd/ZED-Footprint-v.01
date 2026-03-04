'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface MonthlyTrendChartProps {
  data: any[];
  showTarget?: boolean;
  targetValue?: number;
}

export default function MonthlyTrendChart({ 
  data, 
  showTarget = false, 
  targetValue = 0 
}: MonthlyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Няма данни за показване
      </div>
    );
  }

  // Calculate cumulative totals
  let cumulative = 0;
  const enrichedData = data.map((item, index) => {
    cumulative += item.total || 0;
    return {
      ...item,
      cumulative,
      // Calculate moving average (last 3 months)
      movingAvg: index >= 2 
        ? (data[index].total + data[index-1].total + data[index-2].total) / 3 
        : item.total,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {parseFloat(entry.value).toFixed(2)} tCO₂e
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={enrichedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4A7729" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#4A7729" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          stroke="#888888"
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value.toFixed(1)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
        />
        {showTarget && targetValue > 0 && (
          <ReferenceLine 
            y={targetValue} 
            stroke="#E53935" 
            strokeDasharray="5 5"
            label={{ value: 'Цел', position: 'right', fill: '#E53935', fontSize: 12 }}
          />
        )}
        <Area 
          type="monotone"
          dataKey="scope1" 
          name="Обхват 1" 
          stroke="#4A7729"
          fill="url(#colorScope1)"
          strokeWidth={2}
          stackId="1"
        />
        <Area 
          type="monotone"
          dataKey="scope2" 
          name="Обхват 2" 
          stroke="#2563eb"
          fill="url(#colorScope2)"
          strokeWidth={2}
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}


