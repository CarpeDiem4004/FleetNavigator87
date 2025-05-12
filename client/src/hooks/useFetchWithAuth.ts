import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para substituir a função fetch global por uma versão que automaticamente
 * adiciona o token de autenticação em todas as requisições.
 * Não precisa ser usado diretamente - apenas importado uma vez no componente raiz.
 */
export function useFetchWithAuth() {
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

  // Sobrescreve o fetch global para adicionar o token automaticamente
  useEffect(() => {
    // Armazenar a referência original do fetch
    const originalFetch = window.fetch;

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

      // Apenas adicionar o token se não tiver o header Authorization e for uma requisição para o servidor
      const isInternalRequest = typeof input === 'string' && (
        input.startsWith('/api') || 
        input.startsWith('./api') || 
        input.startsWith(window.location.origin)
      );

      // Se ainda não tiver um header de autorização em uma requisição interna, adicione-o
      if (!hasAuthHeader && isInternalRequest) {
        const token = await getAuthToken();
        if (token) {
          (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          console.log('[FetchWithAuth] Token JWT adicionado automaticamente a:', 
            typeof input === 'string' ? input : 'Request object');
        }
      }
      
      // Garantir que as credenciais são incluídas para requisições internas
      if (isInternalRequest && init.credentials === undefined) {
        init.credentials = 'include';
      }

      // Chamar o fetch original com os headers modificados
      return originalFetch(input, init);
    };

    // Limpeza: restaurar o fetch original quando o componente for desmontado
    return () => {
      window.fetch = originalFetch;
    };
  }, [getAuthToken]);
}