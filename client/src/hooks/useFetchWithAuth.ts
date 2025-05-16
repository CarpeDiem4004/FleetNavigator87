import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para substituir a função fetch global por uma versão que automaticamente
 * adiciona o token de autenticação em todas as requisições.
 * Não precisa ser usado diretamente - apenas importado uma vez no componente raiz.
 */
export function useFetchWithAuth() {
  const [initialized, setInitialized] = useState(false);
  
  // Função para obter o token JWT da sessão Supabase, localStorage ou novo endpoint de JWT
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    // Primeiro, tenta obter do localStorage
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      console.log('[FetchWithAuth] Token encontrado no localStorage');
      return localToken;
    }

    // Se não encontrou no localStorage, tenta obter da sessão do Supabase
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
    
    // Nova funcionalidade: tenta obter um token JWT do endpoint Express
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
        
        // Se falhou, tenta com o header de emergência
        console.log('[FetchWithAuth] Tentando obter token de emergência');
        const emergencyResponse = await fetch('/api/get-jwt-token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Emergency-Auth': 'true'
          }
        });
        
        if (emergencyResponse.ok) {
          const emergencyData = await emergencyResponse.json();
          if (emergencyData.token) {
            localStorage.setItem('authToken', emergencyData.token);
            console.log('[FetchWithAuth] Token de emergência obtido com sucesso!');
            return emergencyData.token;
          }
        } else {
          console.warn('[FetchWithAuth] Falha ao obter token de emergência:', emergencyResponse.status);
        }
      }
    } catch (error) {
      console.error('[FetchWithAuth] Erro ao solicitar token JWT do Express:', error);
      
      // Última tentativa com o header de emergência em caso de erro
      try {
        console.log('[FetchWithAuth] Tentando obter token de emergência após erro');
        const emergencyResponse = await fetch('/api/get-jwt-token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Emergency-Auth': 'true'
          }
        });
        
        if (emergencyResponse.ok) {
          const emergencyData = await emergencyResponse.json();
          if (emergencyData.token) {
            localStorage.setItem('authToken', emergencyData.token);
            console.log('[FetchWithAuth] Token de emergência obtido com sucesso após erro!');
            return emergencyData.token;
          }
        }
      } catch (emergencyError) {
        console.error('[FetchWithAuth] Erro ao solicitar token de emergência:', emergencyError);
      }
    }

    return null;
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
          const inputUrl = typeof input === 'string' ? input : input.url;
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
        console.log(`[FetchWithAuth] Requisição para ${typeof input === 'string' ? input : input.url}`, {
          hasAuthHeader: hasAuthHeader || (init.headers as Record<string, string>)['Authorization'] ? true : false,
          credentials: init.credentials,
        });
      }

      // Chamar o fetch original com os headers modificados
      try {
        const response = await originalFetch(input, init);
        
        // Se for uma rota protegida e recebemos 401, redirecionar para o login
        if (response.status === 401 && isInternalRequest) {
          const inputUrl = typeof input === 'string' ? input : input.url;
          if (inputUrl.includes('/api/frota/')) {
            console.warn('[FetchWithAuth] Recebeu 401 de uma rota protegida:', inputUrl);
            setTimeout(() => {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }, 100);
          }
        }
        
        return response;
      } catch (error) {
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