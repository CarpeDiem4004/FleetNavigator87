import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { KPI } from '@/types/dashboard';
import { ArrowDown, ArrowUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  kpi: KPI;
}

const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const {
    name,
    value,
    previousValue,
    unit,
    target,
    trend,
    isPositive,
    changePercentage
  } = kpi;

  // Formatar número conforme a unidade
  const formatValue = (val: number) => {
    if (unit === 'R$') {
      return val.toFixed(2).replace('.', ',');
    }
    if (unit === '%') {
      return val.toFixed(1);
    }
    if (val % 1 === 0) {
      return val.toString();
    }
    return val.toFixed(1);
  };

  return (
    <Card className="relative z-20">
      <CardContent className="p-4 relative z-20">
        <div className="flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{name}</h3>
            {target && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Target className="h-3 w-3 mr-1" />
                <span>{formatValue(target)}{unit}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">
                {formatValue(value)}{unit}
              </span>
              <span className="text-xs text-muted-foreground">
                Anterior: {formatValue(previousValue)}{unit}
              </span>
            </div>
            
            <div className={cn(
              "flex items-center px-2 py-1 rounded-full relative z-20",
              isPositive 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            )}>
              {trend === 'up' ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              <span className="text-xs font-medium">
                {changePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;