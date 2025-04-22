import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  previousValue?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  isPositive?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
  color?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit = '',
  previousValue,
  changePercentage,
  trend = 'neutral',
  isPositive = true,
  icon,
  loading = false,
  color = 'primary'
}) => {
  // Função para formatar os valores numéricos
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      // Se o valor for muito grande, formatar com K, M, etc.
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString('pt-BR');
    }
    return val.toString();
  };

  const getTrendColor = () => {
    if (trend === 'neutral') return 'text-gray-500';
    return isPositive 
      ? (trend === 'up' ? 'text-green-600' : 'text-red-600')
      : (trend === 'up' ? 'text-red-600' : 'text-green-600');
  };

  const getBgColor = () => {
    if (color === 'primary') return 'bg-blue-50';
    if (color === 'success') return 'bg-green-50';
    if (color === 'warning') return 'bg-yellow-50';
    if (color === 'danger') return 'bg-red-50';
    if (color === 'info') return 'bg-sky-50';
    return `bg-${color}-50`;
  };
  
  const borderColor = () => {
    if (color === 'primary') return 'border-blue-500';
    if (color === 'success') return 'border-green-500';
    if (color === 'warning') return 'border-yellow-500';
    if (color === 'danger') return 'border-red-500';
    if (color === 'info') return 'border-sky-500';
    return `border-${color}-500`;
  };

  return (
    <Card className={`overflow-hidden border ${borderColor()}`}>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            {icon && <div className="text-gray-400">{icon}</div>}
          </div>
          
          {loading ? (
            <div className="h-8 animate-pulse bg-gray-200 rounded mt-2"></div>
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {formatValue(value)}
                {unit && <span className="text-sm ml-1">{unit}</span>}
              </div>
              
              {changePercentage !== undefined && (
                <div className="flex items-center mt-1">
                  {trend === 'up' && <ArrowUp className="h-4 w-4 mr-1" />}
                  {trend === 'down' && <ArrowDown className="h-4 w-4 mr-1" />}
                  <span className={`text-sm ${getTrendColor()}`}>
                    {changePercentage > 0 ? '+' : ''}{changePercentage}%
                  </span>
                  {previousValue !== undefined && (
                    <span className="text-xs text-gray-500 ml-1">
                      vs {formatValue(previousValue)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;