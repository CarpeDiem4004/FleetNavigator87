import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

interface PieChartComponentProps {
  data: PieChartData[];
  nameKey?: string;
  dataKey?: string;
  colors?: string[];
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string];
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  nameKey = 'name',
  dataKey = 'value',
  colors = DEFAULT_COLORS,
  height = 300,
  innerRadius = 0,
  outerRadius = '80%',
  legendPosition = 'bottom',
  tooltipFormatter
}) => {
  // Atribuir cores se não estiverem definidas nos dados
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length]
  }));

  const CustomTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload } = props;
    
    if (active && payload && payload.length) {
      const entry = payload[0];
      const color = entry.payload.color || colors[0];
      
      return (
        <div className="custom-tooltip bg-white p-3 border rounded shadow-lg">
          <p className="font-medium" style={{ color }}>
            {entry.name}
          </p>
          <p className="text-gray-700">
            {tooltipFormatter 
              ? tooltipFormatter(entry.value as number, entry.name as string, entry.payload)[0]
              : entry.value
            }
          </p>
        </div>
      );
    }
    
    return null;
  };

  const legendVertical = legendPosition === 'left' || legendPosition === 'right';
  const legendLayout = legendVertical ? 'vertical' : 'horizontal';
  const legendAlign = legendPosition === 'top' || legendPosition === 'bottom' ? 'center' : legendPosition;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout={legendLayout}
          align={legendAlign}
          verticalAlign={legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle'}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;