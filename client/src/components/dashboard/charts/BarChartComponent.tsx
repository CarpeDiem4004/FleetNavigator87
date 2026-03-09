import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface BarChartData {
  name: string;
  value: number;
  previousValue?: number;
  [key: string]: any;
}

interface BarChartComponentProps {
  data: BarChartData[];
  dataKey: string;
  previousDataKey?: string;
  xAxisKey?: string;
  barColor?: string;
  previousBarColor?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  height?: number;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string];
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  dataKey,
  previousDataKey,
  xAxisKey = 'name',
  barColor = '#3B82F6',
  previousBarColor = '#93C5FD',
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  height = 300,
  yAxisFormatter,
  tooltipFormatter
}) => {
  const CustomTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {tooltipFormatter 
                ? tooltipFormatter(entry.value as number, entry.name as string, entry.payload)[0]
                : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        <XAxis 
          dataKey={xAxisKey} 
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={yAxisFormatter}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey={dataKey} 
          fill={barColor} 
          name={dataKey}
          radius={[4, 4, 0, 0]}
        />
        {previousDataKey && (
          <Bar 
            dataKey={previousDataKey} 
            fill={previousBarColor} 
            name={previousDataKey}
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;