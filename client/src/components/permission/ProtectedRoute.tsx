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

  // Para rotas públicas de postos, usaremos uma abordagem diferente:
  // Não usamos mais este redirecionamento aqui para evitar conflitos com a rota nomeada de posto
  // O redirecionamento agora é feito diretamente pelo acesso à URL, com a rota de posto tendo prioridade
  
  // Se o usuário não estiver autenticado, redireciona para login
  if (!user) {
    console.log(`Redirecionando de ${path} para /login (não autenticado)`);
    return <Route path={path}><Redirect to="/login" /></Route>;
  }
  
  // Verifica se o usuário tem permissão para acessar a rota
  if (!hasPermission(path)) {
    console.log(`Redirecionando de ${path} para /acesso-negado (sem permissão)`);
    return <Route path={path}><Redirect to="/acesso-negado" /></Route>;
  }
  
  // Usuário autenticado e com permissão, renderiza o componente
  console.log(`Renderizando componente para ${path} (usuário autenticado)`);
  return <Route path={path}><Component /></Route>;
};