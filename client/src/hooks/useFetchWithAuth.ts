import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para substituir a função fetch global por uma versão que automaticamente
 * adiciona o token de autenticação em todas as requisições.
 * Não precisa ser usado diretamente - apenas importado uma vez no componente raiz.
 */
export function useFetchWithAuth() {
  const [initialized, setInitialized] = useState(false);
  
  // Função para obter o token JWT da sessão Supabase ou localStorage
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    // Primeiro, tenta obter do localStorage
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      return localToken;
    }

    // Se não encontrou no localStorage, tenta obter da sessão do Supabase
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      
      // Se encontrou um token, armazena no localStorage para uso futuro
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('[FetchWithAuth] Token obtido do Supabase e armazenado');
        return token;
      }
    } catch (error) {
      console.error('[FetchWithAuth] Erro ao obter sessão Supabase:', error);
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
      return originalFetch(input, init);
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