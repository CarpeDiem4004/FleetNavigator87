import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2 } from 'lucide-react';

export const BaseInfo: React.FC = () => {
  const { user } = useAuth();
  
  // Verifica se o usuário tem base associada
  const baseName = user?.bases?.name || user?.baseName;
  
  if (!user?.baseId || !baseName) {
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
      <span>Base: {baseName}</span>
    </div>
  );
};