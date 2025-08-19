import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getDeploymentConfig, getAuthenticationStrategy } from '@/utils/deployment-detector';

/**
 * Hook para substituir a função fetch global por uma versão que automaticamente
 * adiciona o token de autenticação em todas as requisições.
 * Não precisa ser usado diretamente - apenas importado uma vez no componente raiz.
 */
export function useFetchWithAuth() {
  // Controle simples de inicialização sem React state
  let isInitialized = false;
  
  // Função para obter token JWT
  const getAuthToken = async (): Promise<string | null> => {
    // Verificar se estamos em uma página de login
    const currentPath = window.location.pathname;
    if (currentPath.includes('/login') || currentPath.includes('/register') || 
        currentPath.includes('/fuel-card/solicitation')) {
      console.log('[FetchWithAuth] Página pública detectada, pulando autenticação');
      return null;
    }
    
    // Detectar configuração de deployment
    const deploymentConfig = getDeploymentConfig();
    
    // Para deployment externo, usar sempre autenticação JWT
    if (deploymentConfig.isProduction) {
      console.log('[FetchWithAuth] Ambiente de produção detectado');
      return await getExternalProductionToken();
    }
    
    // Tentar obter token do Supabase primeiro
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('[FetchWithAuth] Token Supabase obtido');
        return session.access_token;
      }
    } catch (error) {
      console.warn('[FetchWithAuth] Erro ao obter sessão Supabase:', error);
    }
    
    // Se não conseguiu do Supabase, tentar localStorage
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      console.log('[FetchWithAuth] Token do localStorage obtido');
      return localToken;
    }
    
    // Como última opção, tentar endpoint do Express
    try {
      const response = await fetch('/api/get-jwt-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          console.log('[FetchWithAuth] Token JWT obtido do Express');
          return data.token;
        }
      }
    } catch (error) {
      console.warn('[FetchWithAuth] Erro ao obter token do Express:', error);
    }
    
    console.warn('[FetchWithAuth] Nenhum token disponível');
    return null;
  };
  
  // Função para produção externa
  const getExternalProductionToken = async (): Promise<string | null> => {
    console.log('[FetchWithAuth] Obtendo token para produção externa');
    
    // Verificar token local primeiro
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      try {
        const response = await fetch('/api/test-auth-jwt', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('[FetchWithAuth] Token local válido');
          return localToken;
        }
      } catch (error) {
        console.warn('[FetchWithAuth] Token local inválido:', error);
        localStorage.removeItem('authToken');
      }
    }
    
    // Usar endpoint de autenticação externa
    try {
      const authResponse = await fetch('/api/external-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deployment: 'external',
          timestamp: Date.now()
        })
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.success && authData.token) {
          localStorage.setItem('authToken', authData.token);
          console.log('[FetchWithAuth] Token externo obtido');
          return authData.token;
        }
      }
    } catch (error) {
      console.error('[FetchWithAuth] Erro na autenticação externa:', error);
    }
    
    return null;
  };

  // Inicializar apenas uma vez quando o hook é chamado
  useEffect(() => {
    if (isInitialized) return;
    
    console.log('[FetchWithAuth] Inicializando sistema de autenticação');
    
    // Armazenar referência original do fetch
    const originalFetch = window.fetch;
    
    // Substituir fetch global
    window.fetch = async (input, init?: RequestInit) => {
      // Inicializar parâmetros
      init = init || {};
      init.headers = init.headers || {};
      
      // Converter Headers para objeto se necessário
      if (init.headers instanceof Headers) {
        const headersObj: Record<string, string> = {};
        init.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        init.headers = headersObj;
      }
      
      // Verificar se já tem Authorization
      const hasAuthHeader = 
        (init.headers as Record<string, string>)['Authorization'] || 
        (init.headers as Record<string, string>)['authorization'];
      
      // Determinar se é requisição interna
      let isInternalRequest = false;
      if (typeof input === 'string') {
        isInternalRequest = 
          input.startsWith('/api') || 
          input.startsWith('./api') || 
          input.includes('/api/') ||
          input.startsWith(window.location.origin);
      } else if (input instanceof Request) {
        const url = input.url;
        isInternalRequest = 
          url.startsWith('/api') || 
          url.startsWith('./api') || 
          url.includes('/api/') ||
          url.startsWith(window.location.origin);
      }
      
      // Adicionar token se necessário
      if (!hasAuthHeader && isInternalRequest) {
        const token = await getAuthToken();
        if (token) {
          (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          console.log('[FetchWithAuth] Token adicionado à requisição');
        }
      }
      
      // Incluir credenciais para requisições internas
      if (isInternalRequest && init.credentials === undefined) {
        init.credentials = 'include';
      }
      
      // Chamar fetch original
      try {
        const response = await originalFetch(input, init);
        
        // Verificar 401 em rotas protegidas
        if (response && response.status === 401 && isInternalRequest) {
          const inputUrl = typeof input === 'string' ? input : 
                          input instanceof Request ? input.url : input.toString();
          if (inputUrl.includes('/api/frota/')) {
            console.warn('[FetchWithAuth] 401 em rota protegida:', inputUrl);
            setTimeout(() => {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 100);
          }
        }
        
        return response;
      } catch (error) {
        console.error('[FetchWithAuth] Erro na requisição:', error);
        throw error;
      }
    };
    
    isInitialized = true;
    console.log('[FetchWithAuth] Sistema inicializado com sucesso');
    
    // Cleanup quando desmonta
    return () => {
      console.log('[FetchWithAuth] Restaurando fetch original');
      window.fetch = originalFetch;
    };
  }, []);

  // Listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken') {
        console.log('[FetchWithAuth] Token JWT atualizado no localStorage');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
}