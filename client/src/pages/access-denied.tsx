import React from 'react';
import { useLocation, Link } from 'wouter';
import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const AccessDeniedPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  
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
            onClick={() => logout()}
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