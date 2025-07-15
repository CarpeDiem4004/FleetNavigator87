import React from 'react';
import { useLocation, Link } from 'wouter';
import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const AccessDeniedPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  
  // Detectar de onde o usuário veio para redirecionar para login específico
  const getContextualLoginUrl = () => {
    const currentUrl = window.location.pathname;
    
    // Se estava tentando acessar uma base específica, redirecionar para login da base
    if (currentUrl.includes('/bases/')) {
      const baseMatch = currentUrl.match(/\/bases\/([^\/]+)/);
      if (baseMatch) {
        const baseName = baseMatch[1];
        return `/bases/${baseName}/login`;
      }
    }
    
    // Se estava tentando acessar GP01, GP02, GP03
    if (currentUrl.includes('/gp01')) return '/bases/gp01/login';
    if (currentUrl.includes('/gp02')) return '/bases/gp02/login';
    if (currentUrl.includes('/gp03')) return '/bases/gp03/login';
    
    // Se estava tentando acessar Campinas
    if (currentUrl.includes('/campinas')) return '/bases/campinas/login';
    
    // Se estava tentando acessar Brasília
    if (currentUrl.includes('/brasilia')) return '/bases/brasilia/login';
    
    // Para outros casos, usar logout (vai para login principal)
    return null;
  };
  
  const handleLoginRedirect = () => {
    const contextualUrl = getContextualLoginUrl();
    if (contextualUrl) {
      navigate(contextualUrl);
    } else {
      logout();
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight">Acesso Negado</h1>
        
        <div className="space-y-3">
          <p className="text-lg">
            Você não tem permissão para acessar esta página. Este recurso está disponível apenas para usuários com acesso à base correspondente.
          </p>
          
          {user?.baseId && user?.basename && (
            <p className="text-muted-foreground">
              Seu acesso está limitado à base: <span className="font-medium">{user.basename}</span>
            </p>
          )}
          
          {user?.role === 'admin' ? (
            <p className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 mt-4">
              Algo está errado! Como administrador, você deveria ter acesso a todas as páginas. Por favor, contate o suporte técnico.
            </p>
          ) : null}
        </div>
        
        <div className="pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
          <Button 
            onClick={handleLoginRedirect}
            className="gap-2"
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
            Ir para Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;