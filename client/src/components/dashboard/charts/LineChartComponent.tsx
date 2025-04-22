import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface LineChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface LineChartComponentProps {
  data: LineChartData[];
  lines: Array<{
    dataKey: string;
    color: string;
    name?: string;
  }>;
  xAxisKey?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  height?: number;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string];
  connectNulls?: boolean;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  lines,
  xAxisKey = 'name',
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  height = 300,
  yAxisFormatter,
  tooltipFormatter,
  connectNulls = true
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
      <LineChart
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
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            name={line.name || line.dataKey}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={connectNulls}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;