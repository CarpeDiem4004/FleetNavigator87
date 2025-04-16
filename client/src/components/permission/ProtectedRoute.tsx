import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useBasePermission } from '@/hooks/use-base-permission';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const { user, isLoading } = useAuth();
  const { hasPermission } = useBasePermission();
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  // Se o usuário não estiver autenticado, redireciona para login
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Verifica se o usuário tem permissão para acessar a rota
  if (!hasPermission(path)) {
    return <Redirect to="/acesso-negado" />;
  }
  
  // Usuário autenticado e com permissão, renderiza o componente
  return <Component />;
};

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-5xl font-bold text-red-500 mb-4">Acesso Negado</div>
      <p className="text-lg mb-6">Você não tem permissão para acessar esta página.</p>
      <p className="text-gray-600">
        Este recurso está disponível apenas para usuários com acesso à base correspondente.
      </p>
    </div>
  );
};