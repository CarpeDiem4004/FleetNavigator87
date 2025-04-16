import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2 } from 'lucide-react';

// Definindo o tipo específico para o componente
interface User {
  baseId?: number;
  basename?: string;
  bases?: {
    id: number;
    name: string;
  };
}

export const BaseInfo: React.FC = () => {
  const { user } = useAuth();
  
  // Cast para o tipo que esperamos
  const userWithBase = user as User | null;
  
  // Verifica se o usuário tem base associada
  const baseName = userWithBase?.bases?.name || userWithBase?.basename;
  
  if (!userWithBase?.baseId || !baseName) {
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