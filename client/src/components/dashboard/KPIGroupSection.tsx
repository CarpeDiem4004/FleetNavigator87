import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import KpiCard from './KpiCard';

interface KPI {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  target?: number;
  trend: 'up' | 'down';
  isPositive: boolean;
  changePercentage: number;
}

interface KPIGroup {
  title: string;
  metrics: KPI[];
}

interface KPIGroupSectionProps {
  group: KPIGroup;
}

const KPIGroupSection: React.FC<KPIGroupSectionProps> = ({ group }) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">{group.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {group.metrics.map((kpi, index) => (
          <KpiCard
            key={`${group.title}-${index}`}
            title={kpi.name}
            value={kpi.value}
            unit={kpi.unit}
            previousValue={kpi.previousValue}
            changePercentage={kpi.changePercentage}
            trend={kpi.trend}
            isPositive={kpi.isPositive}
          />
        ))}
      </div>
    </div>
  );
};

export default KPIGroupSection;
