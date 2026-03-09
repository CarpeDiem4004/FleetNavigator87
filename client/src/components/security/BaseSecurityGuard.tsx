import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useBaseAuth } from '@/hooks/useBaseAuth';
import { Loader2, ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BaseSecurityGuardProps {
  children: React.ReactNode;
  baseId: number;
}

export function BaseSecurityGuard({ children, baseId }: BaseSecurityGuardProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, hasAccess, error, user } = useBaseAuth(baseId);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setCheckComplete(true);
      
      if (!isAuthenticated || !hasAccess) {
        console.log('[BaseSecurityGuard] Acesso negado, redirecionando para login...');
      }
    }
  }, [isLoading, isAuthenticated, hasAccess]);

  if (isLoading || !checkComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Verificando permissões de acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-red-500/30 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-white">
              Acesso Negado
            </CardTitle>
            <CardDescription className="text-gray-300">
              {error || 'Você não tem permissão para acessar esta base'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Base #{baseId}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Para acessar esta base, você precisa estar autenticado e ter as permissões necessárias.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setLocation(`/bases/${baseId}/public/login`)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                data-testid="button-go-to-login"
              >
                <Lock className="mr-2 h-4 w-4" />
                Fazer Login
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                data-testid="button-go-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

interface ProtectedBaseRouteProps {
  component: React.ComponentType<any>;
  baseIdParam?: string;
}

export function ProtectedBaseRoute({ component: Component, baseIdParam }: ProtectedBaseRouteProps) {
  const [match, params] = useRoute('/bases/:baseId/public');
  const [matchWithSlug, paramsWithSlug] = useRoute('/bases/:baseId/:slug/public');
  
  const baseId = params?.baseId || paramsWithSlug?.baseId || baseIdParam;
  
  if (!baseId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-red-500/30">
          <CardHeader className="text-center">
            <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <CardTitle className="text-2xl text-white">Erro de Rota</CardTitle>
            <CardDescription className="text-gray-300">
              Não foi possível identificar a base solicitada.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <BaseSecurityGuard baseId={parseInt(baseId)}>
      <Component />
    </BaseSecurityGuard>
  );
}

export default BaseSecurityGuard;
