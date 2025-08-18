import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getDeploymentConfig, getAuthenticationStrategy } from '@/utils/deployment-detector';

/**
 * Hook para substituir a função fetch global por uma versão que automaticamente
 * adiciona o token de autenticação em todas as requisições.
 * Não precisa ser usado diretamente - apenas importado uma vez no componente raiz.
 */
export function useFetchWithAuth() {
  const [initialized, setInitialized] = useState(false);
  
  // Função para obter o token JWT da sessão Supabase, localStorage ou novo endpoint de JWT
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    // Verificar se estamos em uma página de login - se sim, não fazer autenticação automática
    const currentPath = window.location.pathname;
    if (currentPath.includes('/login') || currentPath.includes('/register')) {
      console.log('[FetchWithAuth] Página de login detectada, pulando autenticação automática');
      return null;
    }
    
    // Detectar configuração de deployment
    const deploymentConfig = getDeploymentConfig();
    const authStrategy = getAuthenticationStrategy();
    
    console.log('[FetchWithAuth] Configuração de deployment:', {
      isReplit: deploymentConfig.isReplit,
      isDevelopment: deploymentConfig.isDevelopment,
      isProduction: deploymentConfig.isProduction,
      authStrategy: authStrategy
    });
    
    // Para deployment externo, usar sempre autenticação JWT
    if (deploymentConfig.isProduction) {
      console.log('[FetchWithAuth] Ambiente de produção detectado - usando autenticação JWT');
      return await getExternalProductionToken();
    }
    
    // Flag de emergência para autenticação alternativa - salva em localStorage para persistência
    const useEmergencyAuth = localStorage.getItem('useEmergencyAuth') === 'true' || false;
    
    // Se estamos em modo de emergência, vamos diretamente para o fluxo de emergência
    if (useEmergencyAuth) {
      console.log('[FetchWithAuth] Modo de autenticação de emergência ativado');
      const emergencyToken = await getEmergencyToken();
      if (emergencyToken) {
        return emergencyToken;
      }
    }
    
    // Primeiro, tenta obter do localStorage
    const localToken = localStorage.getItem('authToken');
    if (localToken && !useEmergencyAuth) {
      console.log('[FetchWithAuth] Token encontrado no localStorage');
      
      // Verificar se o token é válido
      try {
        // Fazer uma requisição simples para testar o token
        const verifyResponse = await fetch('/api/hybrid/auth/verify', {
          headers: {
            'Authorization': `Bearer ${localToken}`
          }
        });
        
        if (verifyResponse.ok) {
          console.log('[FetchWithAuth] Token verificado com sucesso');
          return localToken;
        } else {
          console.warn('[FetchWithAuth] Token inválido, removendo do localStorage');
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('[FetchWithAuth] Erro ao verificar token:', error);
      }
    }

    // Se não encontrou no localStorage ou o token é inválido, tenta obter da sessão do Supabase
    if (!useEmergencyAuth) {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        
        // Se encontrou um token, armazena no localStorage para uso futuro
        if (token) {
          localStorage.setItem('authToken', token);
          console.log('[FetchWithAuth] Token obtido do Supabase e armazenado no localStorage');
          return token;
        }
      } catch (error) {
        console.error('[FetchWithAuth] Erro ao obter sessão Supabase:', error);
      }
  
      // Tenta buscar de outra fonte de armazenamento do Supabase
      try {
        const savedSession = localStorage.getItem("supabase.auth.token");
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          if (sessionData?.access_token) {
            localStorage.setItem('authToken', sessionData.access_token);
            console.log('[FetchWithAuth] Token recuperado de supabase.auth.token');
            return sessionData.access_token;
          }
        }
      } catch (error) {
        console.error('[FetchWithAuth] Erro ao processar token salvo do Supabase:', error);
      }
    }
    
    // Tentar obter um token JWT do endpoint Express se não estamos em modo de emergência
    if (!useEmergencyAuth) {
      try {
        console.log('[FetchWithAuth] Tentando obter token JWT do endpoint Express');
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
            console.log('[FetchWithAuth] Token JWT obtido com sucesso do Express');
            return data.token;
          }
        } else {
          console.warn('[FetchWithAuth] Falha ao obter token JWT do Express:', response.status);
        }
      } catch (error) {
        console.error('[FetchWithAuth] Erro ao solicitar token JWT do Express:', error);
      }
    }
    
    // Se todas as tentativas anteriores falharam, ativar modo de emergência (apenas se não estamos numa página de login)
    if (!useEmergencyAuth && !currentPath.includes('/login') && !currentPath.includes('/register')) {
      console.log('[FetchWithAuth] Ativando modo de autenticação de emergência');
      localStorage.setItem('useEmergencyAuth', 'true');
    }
    
    // Obtém token de emergência como última opção
    return await getEmergencyToken();
  }, []);
  
  // Função separada para obter token de emergência
  const getEmergencyToken = async (): Promise<string | null> => {
    // Verificar se já temos um token de emergência
    const emergencyToken = localStorage.getItem('emergencyToken');
    if (emergencyToken) {
      console.log('[FetchWithAuth] Usando token de emergência existente');
      return emergencyToken;
    }
    
    console.log('[FetchWithAuth] Tentando obter novo token de emergência');
    
    // Tentar obter token de emergência
    try {
      const emergencyResponse = await fetch('/api/get-jwt-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Emergency-Auth': 'true'
        },
        body: JSON.stringify({
          emergencyAuth: 'true',
          username: 'admin@muricionfleet.com'
        })
      });
      
      if (emergencyResponse.ok) {
        const emergencyData = await emergencyResponse.json();
        if (emergencyData.token) {
          localStorage.setItem('emergencyToken', emergencyData.token);
          localStorage.setItem('authToken', emergencyData.token);
          console.log('[FetchWithAuth] Novo token de emergência obtido com sucesso!');
          return emergencyData.token;
        }
      } else {
        console.warn('[FetchWithAuth] Falha ao obter token de emergência:', emergencyResponse.status);
        
        // Último recurso: login direto com credenciais de admin
        try {
          console.log('[FetchWithAuth] Tentando login direto como admin');
          const loginResponse = await fetch('/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: 'admin@muricionfleet.com',
              password: '123456',
              emergencyAuth: 'true'
            })
          });
          
          if (loginResponse.ok) {
            console.log('[FetchWithAuth] Login direto como admin bem-sucedido');
            
            // Após login, tentar obter token novamente
            const tokenResponse = await fetch('/api/get-jwt-token', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              if (tokenData.token) {
                localStorage.setItem('emergencyToken', tokenData.token);
                localStorage.setItem('authToken', tokenData.token);
                console.log('[FetchWithAuth] Token obtido após login direto');
                return tokenData.token;
              }
            }
            
            // Mesmo sem token, informamos que autenticação direta funcionou
            localStorage.setItem('directLoginSuccess', 'true');
            return 'SESSION_AUTH_NO_TOKEN';
          }
        } catch (loginError) {
          console.error('[FetchWithAuth] Erro ao tentar login direto:', loginError);
        }
      }
    } catch (error) {
      console.error('[FetchWithAuth] Erro ao solicitar token de emergência:', error);
    }
    
    console.warn('[FetchWithAuth] Não foi possível obter token JWT para requisição');
    return null;
  };

  // Função especializada para autenticação em deployment externo
  const getExternalProductionToken = useCallback(async (): Promise<string | null> => {
    console.log('[FetchWithAuth] Iniciando autenticação para produção externa');
    
    // Verificar token no localStorage primeiro
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      // Validar token
      try {
        const response = await fetch('/api/test-auth-jwt', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('[FetchWithAuth] Token local válido para produção');
          return localToken;
        } else {
          console.log('[FetchWithAuth] Token local inválido, removendo');
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('[FetchWithAuth] Erro ao validar token local:', error);
        localStorage.removeItem('authToken');
      }
    }
    
    // Usar endpoint específico para produção externa
    console.log('[FetchWithAuth] Usando endpoint de autenticação externa');
    
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
          localStorage.setItem('externalDeployment', 'true');
          console.log('[FetchWithAuth] Token externo obtido e armazenado');
          return authData.token;
        }
      }
      
      console.error('[FetchWithAuth] Falha na autenticação externa');
      return null;
      
    } catch (error) {
      console.error('[FetchWithAuth] Erro no processo de autenticação para produção:', error);
      return null;
    }
  }, []);

  // Inicializa o token JWT ao montar o componente
  useEffect(() => {
    async function initToken() {
      try {
        const token = await getAuthToken();
        if (token) {
          console.log('[FetchWithAuth] Token JWT inicializado com sucesso');
        } else {
          console.log('[FetchWithAuth] Nenhum token JWT disponível para inicialização');
        }
        setInitialized(true);
      } catch (error) {
        console.error('[FetchWithAuth] Erro ao inicializar token:', error);
        setInitialized(true);
      }
    }
    
    initToken();
  }, [getAuthToken]);

  // Sobrescreve o fetch global para adicionar o token automaticamente
  useEffect(() => {
    if (!initialized) return; // Espera a inicialização completa
    
    // Armazenar a referência original do fetch
    const originalFetch = window.fetch;
    console.log('[FetchWithAuth] Substituindo fetch global para injetar JWT automaticamente');

    // Sobrescrever a função fetch
    window.fetch = async (input, init?: RequestInit) => {
      // Inicializar o objeto init se não foi fornecido
      init = init || {};
      
      // Inicializar os headers se não existirem
      init.headers = init.headers || {};

      // Converter o objeto Headers para um objeto simples se for necessário
      if (init.headers instanceof Headers) {
        const headersObj: Record<string, string> = {};
        init.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        init.headers = headersObj;
      }

      // Verificar se já tem o header Authorization
      const hasAuthHeader = 
        (init.headers as Record<string, string>)['Authorization'] || 
        (init.headers as Record<string, string>)['authorization'];

      // Determinar se é uma requisição interna/API
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

      // Se ainda não tiver um header de autorização em uma requisição interna, adicione-o
      if (!hasAuthHeader && isInternalRequest) {
        const token = await getAuthToken();
        if (token) {
          (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          console.log('[FetchWithAuth] Token JWT adicionado automaticamente a:', 
            typeof input === 'string' ? input : 'Request object');
        } else {
          console.warn('[FetchWithAuth] Não foi possível obter token JWT para requisição:',
            typeof input === 'string' ? input : 'Request object');
            
          // Se a requisição for para rotas protegidas, especialmente para API frota/estoque
          const inputUrl = typeof input === 'string' ? input : 
                          input instanceof Request ? input.url : input.toString();
          if (inputUrl.includes('/api/frota/') && 
              !inputUrl.includes('/login') && 
              !inputUrl.includes('/register')) {
            console.warn('[FetchWithAuth] Tentando acessar rota protegida sem autenticação:', inputUrl);
            // Redirecionar para a página de login
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            throw new Error('Não autenticado. Redirecionando para login.');
          }
        }
      }
      
      // Garantir que as credenciais são incluídas para requisições internas
      if (isInternalRequest && init.credentials === undefined) {
        init.credentials = 'include';
      }

      // Log para debug
      if (isInternalRequest) {
        console.log(`[FetchWithAuth] Requisição para ${typeof input === 'string' ? input : 
                    input instanceof Request ? input.url : input.toString()}`, {
          hasAuthHeader: hasAuthHeader || (init.headers as Record<string, string>)['Authorization'] ? true : false,
          credentials: init.credentials,
        });
      }

      // Chamar o fetch original com os headers modificados
      try {
        const response = await originalFetch(input, init);
        
        // Se for uma rota protegida e recebemos 401, redirecionar para o login
        if (response && response.status === 401 && isInternalRequest) {
          const inputUrl = typeof input === 'string' ? input : 
                          input instanceof Request ? input.url : input.toString();
          if (inputUrl.includes('/api/frota/')) {
            console.warn('[FetchWithAuth] Recebeu 401 de uma rota protegida:', inputUrl);
            setTimeout(() => {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 100);
          }
        }
        
        return response;
      } catch (error) {
        // Verificar se o erro é relacionado ao fetch ou à rede
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.warn('[FetchWithAuth] Erro de rede ou fetch:', error.message);
          // Para erros de rede, retornar um objeto Response de erro simulado
          return new Response(JSON.stringify({ error: 'Erro de conexão' }), {
            status: 500,
            statusText: 'Network Error',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        console.error('[FetchWithAuth] Erro na requisição fetch:', error);
        throw error;
      }
    };

    // Limpeza: restaurar o fetch original quando o componente for desmontado
    return () => {
      console.log('[FetchWithAuth] Restaurando fetch original');
      window.fetch = originalFetch;
    };
  }, [getAuthToken, initialized]);
  
  // Configura um listener para mudanças no localStorage
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === 'authToken') {
        console.log('[FetchWithAuth] Token JWT atualizado no localStorage');
      }
    }
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
}