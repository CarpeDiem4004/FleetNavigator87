import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Componente para redirecionar usuários da Gestão de Frotas para a página correta
 * quando tentam acessar o Dashboard (/) que é restrito para eles
 */
export const FleetManagementRedirect: React.FC = () => {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // Verificar se é usuário de Gestão de Frotas
    if (user && (user.basename === "Gestão de Frotas" || user.baseId === 12)) {
      console.log("Redirecionando usuário de Gestão de Frotas para /fleet-management");
      
      // Adicionar um pequeno delay para garantir que a navegação aconteça
      const redirectTimer = setTimeout(() => {
        navigate('/fleet-management');
      }, 500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, navigate]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold">Redirecionando...</h2>
        <p className="text-muted-foreground">
          Estamos direcionando você para a área de gestão de frotas.
        </p>
      </div>
    </div>
  );
};

export default FleetManagementRedirect;