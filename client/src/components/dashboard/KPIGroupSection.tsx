import React from 'react';
import { KPIGroup } from '@/types/dashboard';
import KPICard from './KPICard';

interface KPIGroupSectionProps {
  group: KPIGroup;
}

const KPIGroupSection: React.FC<KPIGroupSectionProps> = ({ group }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{group.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {group.metrics.map((kpi, index) => (
          <KPICard key={`${group.title}-${index}`} kpi={kpi} />
        ))}
      </div>
    </div>
  );
};

export default KPIGroupSection;