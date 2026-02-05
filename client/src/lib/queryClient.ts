import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from "./supabaseClient";

/**
 * AUTENTICAÇÃO BASEADA EM BEARER TOKEN (Supabase Auth)
 * 
 * Por que NÃO usar cookies:
 * - Cookies são vinculados ao domínio onde são criados (*.replit.dev)
 * - Quando acessado via domínio customizado (gestaoonfleet.com.br), cookies não são enviados
 * - Navegadores modernos bloqueiam cookies third-party por segurança
 * - SameSite e Secure flags criam incompatibilidades entre domínios
 * 
 * Por que Bearer Token resolve definitivamente:
 * - Token armazenado no localStorage do cliente (persistSession do Supabase)
 * - Enviado explicitamente no header Authorization a cada requisição
 * - NÃO depende de domínio ou cookies
 * - Funciona igualmente em QUALQUER ambiente
 */

/**
 * Obtém o access_token atual do Supabase
 * O Supabase gerencia automaticamente:
 * - Refresh do token antes de expirar
 * - Persistência no localStorage
 * - Validação do token
 */
async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('[Auth] Erro ao obter sessão Supabase:', error.message);
      return null;
    }
    
    if (!session?.access_token) {
      console.log('[Auth] Nenhuma sessão Supabase ativa');
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('[Auth] Exceção ao obter token:', error);
    return null;
  }
}

/**
 * Processa resposta de erro
 * NÃO faz logout automático baseado apenas em 401
 * Deixa o AuthContext lidar com estados de autenticação
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Para 401, apenas loggar - NÃO fazer logout automático
    // O AuthContext é responsável por gerenciar o estado de autenticação
    if (res.status === 401) {
      console.log('[QueryClient] Resposta 401 - Requisição não autorizada:', res.url);
      // NÃO limpar localStorage ou redirecionar aqui
      // Isso causava o loop de login
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface DataWithId {
  id: number | string;
  [key: string]: any;
}

/**
 * Função principal para requisições à API
 * SEMPRE envia Bearer Token do Supabase quando disponível
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  forceAuth: boolean = false,
  isFormData: boolean = false,
): Promise<Response> {
  // Se for endpoint Supabase direto, usar o cliente Supabase
  if (url.startsWith('/api/supabase/')) {
    const endpoint = url.replace('/api/supabase/', '');
    const [table, action] = endpoint.split('/');
    
    let result: PostgrestResponse<any> | undefined;
    
    switch (action) {
      case 'list':
        result = await supabase.from(table).select('*');
        break;
      case 'get':
        if (data && typeof data === 'object' && 'id' in (data as DataWithId)) {
          result = await supabase.from(table).select('*').eq('id', (data as DataWithId).id).single();
        }
        break;
      case 'create':
        result = await supabase.from(table).insert(data).select();
        break;
      case 'update':
        if (data && typeof data === 'object' && 'id' in (data as DataWithId)) {
          const { id, ...updateData } = data as DataWithId;
          result = await supabase.from(table).update(updateData).eq('id', id).select();
        }
        break;
      case 'delete':
        if (data && typeof data === 'object' && 'id' in (data as DataWithId)) {
          result = await supabase.from(table).delete().eq('id', (data as DataWithId).id).select() as PostgrestResponse<any>;
        }
        break;
      default:
        throw new Error(`Unknown Supabase action: ${action}`);
    }
    
    if (result && result.error) {
      throw new Error(result.error.message);
    }
    
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => result?.data || null,
      text: async () => JSON.stringify(result?.data || null),
    } as Response;
    
    return mockResponse;
  }
  
  // Para API backend: SEMPRE usar Bearer Token do Supabase
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  // Obter e adicionar Bearer Token do Supabase
  const accessToken = await getSupabaseAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    console.log('[apiRequest] Bearer Token adicionado para:', url);
  } else {
    console.log('[apiRequest] Sem token Supabase disponível para:', url);
  }
  
  const requestConfig: RequestInit = {
    method,
    headers,
    // Manter credentials para compatibilidade, mas autenticação é via Bearer Token
    credentials: "include",
  };
  
  if (data) {
    if (isFormData && data instanceof FormData) {
      requestConfig.body = data;
    } else if (!isFormData) {
      requestConfig.body = JSON.stringify(data);
    }
  }
  
  console.log(`[apiRequest] ${method} ${url}`);
  
  const res = await fetch(url, requestConfig);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Query function para TanStack Query
 * SEMPRE envia Bearer Token do Supabase quando disponível
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [urlOrTable, ...params] = queryKey as [string, ...any[]];
    
    // Se for Supabase, usar cliente direto
    if (typeof urlOrTable === 'string' && urlOrTable.startsWith('/api/supabase/')) {
      const table = urlOrTable.replace('/api/supabase/', '');
      let query = supabase.from(table).select('*');
      
      if (params.length > 0 && typeof params[0] === 'object' && params[0] !== null) {
        const filters = params[0] as Record<string, any>;
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (unauthorizedBehavior === "returnNull" && error.code === "PGRST116") {
          return null;
        }
        throw new Error(error.message);
      }
      
      return data;
    }
    
    // Para API backend: SEMPRE usar Bearer Token do Supabase
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };
    
    // Obter e adicionar Bearer Token do Supabase
    const accessToken = await getSupabaseAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    // Construir URL com parâmetros da queryKey
    let finalUrl = urlOrTable;
    if (params.length > 0 && typeof params[0] === 'object' && params[0] !== null) {
      const queryParams = new URLSearchParams();
      Object.entries(params[0] as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        finalUrl = urlOrTable.includes('?') 
          ? `${urlOrTable}&${queryString}`
          : `${urlOrTable}?${queryString}`;
      }
    }
    
    // Adicionar timestamp para evitar cache
    const urlWithTimestamp = finalUrl.includes('?') 
      ? `${finalUrl}&_t=${Date.now()}`
      : `${finalUrl}?_t=${Date.now()}`;
    
    const res = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers,
      credentials: "include",
    });

    // Para 401 em verificação de usuário, retornar null ao invés de erro
    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // Não fazer logout automático - deixar AuthContext lidar
      throw new Error("401: Não autorizado");
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 segundos
      retry: (failureCount, error) => {
        // Não retry para erros de autenticação
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
