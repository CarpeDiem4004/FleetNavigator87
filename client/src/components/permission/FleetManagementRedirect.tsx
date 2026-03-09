import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2, TruckIcon } from 'lucide-react';

/**
 * Componente para redirecionar usuários da Gestão de Frotas para a página correta
 * quando tentam acessar o Dashboard (/) que é restrito para eles
 */
export const FleetManagementRedirect: React.FC = () => {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    console.log("Componente de redirecionamento ativo para Gestão de Frotas");
    
    // Redirecionar imediatamente para área de gestão de frotas
    const redirectTimer = setTimeout(() => {
      navigate('/fleet-management');
    }, 1000);
    
    return () => clearTimeout(redirectTimer);
  }, [navigate]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="flex flex-col items-center space-y-6 text-center p-8 rounded-lg border border-gray-100 shadow-sm bg-white">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <TruckIcon className="h-8 w-8 text-primary-foreground absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">Redirecionando...</h2>
          <p className="text-muted-foreground max-w-md">
            Você está sendo direcionado para a área de <strong>Gestão de Frotas</strong>, 
            conforme as permissões do seu perfil.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FleetManagementRedirect;