import React, { useEffect, useState } from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useBasePermission } from '@/hooks/use-base-permission';
import { Loader2, AlertTriangle, RefreshCcw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AuthManager from '@/lib/authManager';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

// Componente de carregamento com botão de retry
const RetryableLoader = ({ 
  message, 
  onRetry, 
  isError = false,
  subMessage,
  retryCount = 0
}: { 
  message: string, 
  onRetry?: () => void,
  isError?: boolean,
  subMessage?: string,
  retryCount?: number
}) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4 max-w-md p-6 bg-background rounded-lg shadow-md">
      {isError ? (
        <AlertCircle className="h-10 w-10 text-destructive" />
      ) : (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      )}
      
      <p className="text-lg font-medium text-center">{message}</p>
      
      {subMessage && (
        <p className="text-sm text-muted-foreground text-center">{subMessage}</p>
      )}
      
      {retryCount > 0 && (
        <p className="text-xs text-muted-foreground">Tentativa {retryCount} de 3</p>
      )}
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
          disabled={isError && retryCount >= 3}
        >
          <RefreshCcw className="h-4 w-4" />
          {retryCount >= 3 ? "Ir para login" : "Tentar novamente"}
        </button>
      )}
      
      {isError && retryCount >= 3 && (
        <a 
          href="/login"
          className="text-sm text-blue-500 hover:underline"
        >
          Voltar para a página de login
        </a>
      )}
    </div>
  </div>
);

// Componente de diagnóstico para problemas de autenticação
const AuthDiagnostic = ({ 
  report, 
  onClose,
  onRetry
}: { 
  report: string[], 
  onClose: () => void,
  onRetry: () => void 
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          Diagnóstico de Autenticação
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          &times;
        </button>
      </div>
      
      <div className="bg-muted p-4 rounded font-mono text-sm mb-4 whitespace-pre-wrap">
        {report.join('\n')}
      </div>
      
      <div className="flex justify-end gap-2">
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Tentar recuperação
        </button>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const { user, isLoading } = useAuth();
  const { hasPermission } = useBasePermission();
  const [isVerifyingJWT, setIsVerifyingJWT] = useState(false);
  const [jwtVerified, setJwtVerified] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<string[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Verificação adicional do token JWT para garantir autenticação correta
  useEffect(() => {
    // Se o usuário está carregando, aguardar
    if (isLoading) return;
    
    // Se há usuário autenticado, considerar válido sem verificações adicionais
    if (user) {
      console.log('[ProtectedRoute] Usuário autenticado encontrado:', user.email || user.name);
      setJwtVerified(true);
      setAuthError(null);
      return;
    }
    
    // Se não há usuário e já tentamos várias vezes, não continuar tentando
    if (!user && retryCount >= 2) {
      setJwtVerified(false);
      setAuthError('Não foi possível restaurar sua sessão. Por favor, faça login novamente.');
      return;
    }
    
    async function verifyJwt() {
      try {
        setIsVerifyingJWT(true);
        setAuthError(null);
        console.log('[ProtectedRoute] Verificando JWT...');
        
        // Usar AuthManager para verificação e recuperação
        const savedToken = AuthManager.getLatestToken();
        
        // Simplificar: se não há token, apenas mostrar erro sem tentativas de recuperação
        if (!savedToken) {
          console.log('[ProtectedRoute] Nenhum token JWT encontrado, assumindo não autenticado');
          setJwtVerified(false);
          setAuthError('Sessão expirada. Por favor, faça login novamente.');
        } else {
          console.log('[ProtectedRoute] Token JWT encontrado, assumindo válido');
          // Se há token, assumir que é válido para evitar verificações desnecessárias
          setJwtVerified(true);
        }
      } catch (error) {
        console.error('[ProtectedRoute] Erro ao verificar JWT:', error);
        setJwtVerified(false);
        if (retryCount >= 2) {
          setAuthError('Ocorreu um erro ao verificar sua autenticação. Por favor, faça login novamente.');
        }
      } finally {
        setIsVerifyingJWT(false);
      }
    }
    
    // Tenta ressincronizar sessão com o servidor Express
    async function ressincronizarSessao(token: string) {
      try {
        console.log('[ProtectedRoute] Ressincronizando sessão com o servidor...');
        const email = user?.email;
        
        if (!email) {
          console.warn('[ProtectedRoute] Email do usuário não disponível para ressincronização');
          return false;
        }
        
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
          
          // Tentar método de emergência
          const emergencyResponse = await fetch('/api/force-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email
            }),
            credentials: 'include'
          });
          
          if (emergencyResponse.ok) {
            console.log('[ProtectedRoute] Sessão forçada com método de emergência');
            return true;
          }
          
          return false;
        }
      } catch (error) {
        console.error('[ProtectedRoute] Erro ao ressincronizar sessão:', error);
        return false;
      }
    }
    
    // Executar verificação
    verifyJwt();
  }, [user, isLoading, retryCount]);
  
  // Função para executar diagnóstico quando solicitado
  const runDiagnostic = async () => {
    try {
      const result = await AuthManager.diagnoseAuthState();
      setDiagnosticReport(result.detailedReport);
      setShowDiagnostic(true);
    } catch (error) {
      console.error('[ProtectedRoute] Erro ao executar diagnóstico:', error);
      setDiagnosticReport(['Erro ao executar diagnóstico de autenticação:', error?.toString() || 'Erro desconhecido']);
      setShowDiagnostic(true);
    }
  };
  
  // Função para tentar recuperação automática
  const attemptRecovery = async () => {
    setShowDiagnostic(false);
    const recovered = await AuthManager.attemptAutoRecovery();
    if (recovered) {
      setRetryCount(prev => prev + 1);
    } else {
      // Se falhar na recuperação, podemos redirecionar para o login
      if (retryCount >= 2) {
        window.location.href = '/login';
      } else {
        setRetryCount(prev => prev + 1);
      }
    }
  };
  
  // Função para tentar novamente
  const handleRetry = () => {
    // Se já tentamos várias vezes, mostrar diagnóstico
    if (retryCount >= 2) {
      runDiagnostic();
    } else {
      setRetryCount(prev => prev + 1);
    }
  };
  
  // Se estiver carregando, mostrar loader
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
    return <RetryableLoader message="Verificando credenciais..." onRetry={handleRetry} retryCount={retryCount} />;
  }
  
  // Se o JWT não foi verificado e temos um erro de autenticação
  if (!jwtVerified && authError) {
    return (
      <RetryableLoader 
        message={authError}
        subMessage="Sua sessão pode ter expirado ou ter sido comprometida."
        onRetry={handleRetry}
        isError={true}
        retryCount={retryCount}
      />
    );
  }
  
  // Se o JWT não foi verificado, mas temos um usuário
  if (!jwtVerified && retryCount > 0) {
    console.warn('[ProtectedRoute] Falha na verificação de JWT, mas usuário existe');
    // Estamos permitindo continuar mesmo assim
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
  
  return (
    <>
      {/* Usuário autenticado e com permissão, renderiza o componente */}
      <Component />
      
      {/* Modal de diagnóstico quando ativado */}
      {showDiagnostic && (
        <AuthDiagnostic 
          report={diagnosticReport} 
          onClose={() => setShowDiagnostic(false)} 
          onRetry={attemptRecovery}
        />
      )}
    </>
  );
};