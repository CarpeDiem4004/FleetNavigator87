import React from 'react';
import { useBasePermission } from '@/hooks/use-base-permission';
import { Building2 } from 'lucide-react';

export const BaseInfo: React.FC = () => {
  const { getUserBase } = useBasePermission();
  const { id, name } = getUserBase();
  
  if (!id || !name) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Building2 className="mr-1 h-4 w-4" />
        <span>Acesso Global</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <Building2 className="mr-1 h-4 w-4" />
      <span>Base: {name}</span>
    </div>
  );
};