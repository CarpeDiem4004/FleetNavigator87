/**
 * Componente ProtectedRoute
 * Este componente verifica se o usuário tem as permissões necessárias para acessar uma rota
 * Se o usuário não estiver autenticado, redireciona para o login
 * Se o usuário não tiver as permissões adequadas, exibe uma mensagem de acesso negado
 */

import React, { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { Redirect } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

/**
 * Componente que protege rotas com base em papéis (roles) de usuário
 * 
 * @param children O conteúdo a ser renderizado se o usuário tiver permissão
 * @param allowedRoles Array de papéis permitidos para acessar esta rota
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Se estiver carregando, exibe uma mensagem de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Verifica se o usuário tem permissão (admin sempre tem acesso completo)
  const hasPermission = user.role === 'admin' || allowedRoles.includes(user.role);

  // Se não tiver permissão, exibe uma mensagem de acesso negado
  if (!hasPermission) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
              <p className="text-gray-600 mb-4">
                Você não tem permissão para acessar esta página.
                <br />
                Seu papel atual: <span className="font-semibold">{user.role}</span>
              </p>
              <p className="text-sm text-gray-500">
                Papéis permitidos: {allowedRoles.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tiver permissão, renderiza o conteúdo
  return <>{children}</>;
}