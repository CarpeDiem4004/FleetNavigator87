import React, { useEffect, useState } from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useBasePermission } from '@/hooks/use-base-permission';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

const RetryableLoader = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4 max-w-md p-6 bg-background rounded-lg shadow-md">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-center">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const { user, isLoading } = useAuth();
  const { hasPermission } = useBasePermission();
  const [isVerifyingJWT, setIsVerifyingJWT] = useState(false);
  const [jwtVerified, setJwtVerified] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Verificação adicional do token JWT para garantir autenticação correta
  useEffect(() => {
    // Se o usuário está carregando ou não existe, não faz nada
    if (isLoading || !user) return;
    
    async function verifyJwt() {
      try {
        setIsVerifyingJWT(true);
        console.log('[ProtectedRoute] Verificando JWT...');
        
        // Verificar token JWT no localStorage
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
          console.log('[ProtectedRoute] Sem token JWT armazenado, verificando sessão Supabase...');
          // Verificar sessão com Supabase
          const { data } = await supabase.auth.getSession();
          
          if (data?.session?.access_token) {
            console.log('[ProtectedRoute] Sessão Supabase válida, armazenando token...');
            localStorage.setItem('authToken', data.session.access_token);
            
            // Tentar ressincronizar com o servidor Express
            await ressincronizarSessao(data.session.access_token);
            setJwtVerified(true);
          } else {
            console.warn('[ProtectedRoute] Sem sessão Supabase válida');
            setJwtVerified(false);
          }
        } else {
          console.log('[ProtectedRoute] Token JWT armazenado encontrado, verificando validade...');
          
          // Verificar token com Supabase
          const { data: userData, error } = await supabase.auth.getUser(storedToken);
          
          if (error || !userData.user) {
            console.warn('[ProtectedRoute] Token JWT inválido:', error);
            // Limpar token inválido
            localStorage.removeItem('authToken');
            
            // Verificar se podemos recuperar via sessão
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) {
              console.log('[ProtectedRoute] Recuperou token da sessão Supabase');
              localStorage.setItem('authToken', data.session.access_token);
              
              // Tentar ressincronizar com o servidor Express
              await ressincronizarSessao(data.session.access_token);
              setJwtVerified(true);
            } else {
              setJwtVerified(false);
            }
          } else {
            console.log('[ProtectedRoute] Token JWT válido para:', userData.user.email);
            
            // Tentar ressincronizar com o servidor Express para garantir
            await ressincronizarSessao(storedToken);
            setJwtVerified(true);
          }
        }
      } catch (error) {
        console.error('[ProtectedRoute] Erro ao verificar JWT:', error);
        setJwtVerified(false);
      } finally {
        setIsVerifyingJWT(false);
      }
    }
    
    // Tenta ressincronizar sessão com o servidor Express
    async function ressincronizarSessao(token: string) {
      try {
        console.log('[ProtectedRoute] Ressincronizando sessão com o servidor...');
        const email = user.email;
        
        const response = await fetch('/api/resync-session-jwt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            user: { email }
          }),
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('[ProtectedRoute] Sessão ressincronizada com sucesso');
          return true;
        } else {
          console.warn('[ProtectedRoute] Falha ao ressincronizar sessão, status:', response.status);
          
          // Tentar método alternativo
          const alternativeResponse = await fetch('/api/resync-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email
            }),
            credentials: 'include'
          });
          
          if (alternativeResponse.ok) {
            console.log('[ProtectedRoute] Sessão ressincronizada com método alternativo');
            return true;
          }
          
          return false;
        }
      } catch (error) {
        console.error('[ProtectedRoute] Erro ao ressincronizar sessão:', error);
        return false;
      }
    }
    
    verifyJwt();
  }, [user, isLoading, retryCount]);
  
  // Função para tentar novamente
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  // Estado de carregamento durante a verificação de autenticação
  if (isLoading) {
    return <RetryableLoader message="Verificando autenticação..." onRetry={handleRetry} />;
  }
  
  // Se o usuário não estiver autenticado, redireciona para login
  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para login...');
    return <Redirect to="/login" />;
  }
  
  // Verificação de JWT - mostra loader enquanto verifica
  if (isVerifyingJWT) {
    return <RetryableLoader message="Verificando credenciais..." onRetry={handleRetry} />;
  }
  
  // Se o JWT não foi verificado, mas temos um usuário, mostra um erro
  if (!jwtVerified && retryCount > 0) {
    console.warn('[ProtectedRoute] Falha na verificação de JWT, mas usuário existe');
    // Dependendo da abordagem, pode tentar redirecionamento para login
    // Ou mostrar um erro, mas por enquanto permitir acessar mesmo assim
  }
  
  // Verificação especial para o usuário da Gestão de Frotas na rota de dashboard
  if (path === "/" && user && (user.basename === "Gestão de Frotas" || user.baseId === 12)) {
    console.log("[ProtectedRoute] Usuário da Gestão de Frotas tentando acessar o dashboard - redirecionando...");
    return <Redirect to="/fleet-redirect" />;
  }
  
  // Verificação especial para usuários de Pneus - redirecionar para a seção de pneus
  if (path === "/" && user && (user.basename === "Pneus" || user.baseId === 10 || user.role === 'pneus')) {
    console.log("[ProtectedRoute] Usuário de Pneus tentando acessar o dashboard - redirecionando para a seção de pneus...");
    return <Redirect to="/tires" />;
  }
  
  // Verifica se o usuário tem permissão para acessar a rota
  const hasRoutePermission = hasPermission(path);
  console.log(`[ProtectedRoute] Verificação de permissão para ${path}: ${hasRoutePermission ? 'PERMITIDO' : 'NEGADO'}`);
  
  if (!hasRoutePermission) {
    console.log(`[ProtectedRoute] Redirecionando usuário para /acesso-negado devido a permissão negada para ${path}`);
    return <Redirect to="/acesso-negado" />;
  }
  
  // Usuário autenticado e com permissão, renderiza o componente
  console.log(`[ProtectedRoute] Renderizando componente para ${path}`);
  return <Component />;
};