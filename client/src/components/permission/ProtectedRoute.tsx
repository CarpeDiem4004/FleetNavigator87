import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useBasePermission } from '@/hooks/use-base-permission';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const { user, isLoading } = useAuth();
  const { hasPermission } = useBasePermission();
  
  // Estado de carregamento durante a verificação de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }
  
  // Se o usuário não estiver autenticado, redireciona para login
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Verifica se o usuário tem permissão para acessar a rota
  const hasRoutePermission = hasPermission(path);
  console.log(`Verificação de permissão para ${path}: ${hasRoutePermission ? 'PERMITIDO' : 'NEGADO'}`);
  
  if (!hasRoutePermission) {
    console.log(`Redirecionando usuário para /acesso-negado devido a permissão negada para ${path}`);
    return <Redirect to="/acesso-negado" />;
  }
  
  // Usuário autenticado e com permissão, renderiza o componente
  return <Component />;
};