'use client';

import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface YearComparisonChartProps {
  currentYearData: any[];
  previousYearData?: any[];
}

export default function YearComparisonChart({ 
  currentYearData, 
  previousYearData = [] 
}: YearComparisonChartProps) {
  // Merge data by month
  const months = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
  
  const chartData = months.map((month, index) => {
    const currentMonth = currentYearData.find(d => {
      const date = new Date(d.reporting_period);
      return date.getMonth() === index;
    });
    
    const previousMonth = previousYearData.find(d => {
      const date = new Date(d.reporting_period);
      return date.getMonth() === index;
    });
    
    return {
      month,
      current: currentMonth?.total || 0,
      previous: previousMonth?.total || 0,
      change: currentMonth && previousMonth 
        ? ((currentMonth.total - previousMonth.total) / previousMonth.total * 100).toFixed(1)
        : null,
    };
  });

  // Filter to only show months with data
  const filteredData = chartData.filter(d => d.current > 0 || d.previous > 0);

  if (filteredData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Няма данни за сравнение
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-earth-400">
            Текуща година: {parseFloat(data.current).toFixed(2)} tCO₂e
          </p>
          {data.previous > 0 && (
            <>
              <p className="text-sm text-gray-500">
                Предишна година: {parseFloat(data.previous).toFixed(2)} tCO₂e
              </p>
              {data.change && (
                <p className={`text-sm font-medium ${parseFloat(data.change) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(data.change) > 0 ? '+' : ''}{data.change}%
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          stroke="#888888"
          fontSize={12}
        />
        <YAxis 
          stroke="#888888"
          fontSize={12}
          tickFormatter={(value) => `${value.toFixed(1)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar 
          dataKey="current" 
          name="Текуща година" 
          fill="#4A7729" 
          radius={[4, 4, 0, 0]}
          barSize={30}
        />
        {previousYearData.length > 0 && (
          <Line 
            type="monotone"
            dataKey="previous" 
            name="Предишна година" 
            stroke="#9CA3AF"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#9CA3AF', r: 4 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}


