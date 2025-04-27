import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from "./supabase";

// Estado para controlar tentativas de ressincronização
let isAttemptingResync = false;
let lastResyncAttempt = 0;
const RESYNC_COOLDOWN = 10000; // 10 segundos entre tentativas

// Função para tentar ressincronizar a sessão
async function trySessionResync(): Promise<boolean> {
  // Evitar chamadas múltiplas simultaneamente
  if (isAttemptingResync) {
    return false;
  }
  
  // Evitar chamadas frequentes demais
  const now = Date.now();
  if (now - lastResyncAttempt < RESYNC_COOLDOWN) {
    return false;
  }
  
  console.log('[QueryClient] Tentando ressincronizar a sessão após erro 401...');
  isAttemptingResync = true;
  lastResyncAttempt = now;
  
  try {
    // Tentar importar o contexto de autenticação do Supabase
    // Precisamos usar dynamic import para evitar dependência circular
    const authModule = await import('../context/SupabaseAuthContext');
    
    if (typeof window !== 'undefined') {
      // @ts-ignore - Acessando uma variável global definida pelo hook de autenticação
      const authContext = window.__SUPABASE_AUTH_CONTEXT__;
      
      if (authContext && authContext.resyncSession) {
        const success = await authContext.resyncSession();
        console.log(`[QueryClient] Ressincronização ${success ? 'bem-sucedida' : 'falhou'}`);
        return success;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[QueryClient] Erro ao tentar ressincronizar sessão:', error);
    return false;
  } finally {
    isAttemptingResync = false;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Tentar ressincronizar sessão em caso de erro 401
    if (res.status === 401) {
      const resyncSuccessful = await trySessionResync();
      if (resyncSuccessful) {
        // Optamos por não repetir automaticamente a requisição aqui
        // Em vez disso, o usuário ou o código que chamou a API pode decidir tentar novamente
        throw new Error(`401: Sessão ressincronizada, tente novamente`);
      }
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface DataWithId {
  id: number | string;
  [key: string]: any;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
): Promise<Response> {
  // If it's a Supabase endpoint, use Supabase client
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
          result = await supabase.from(table).delete().eq('id', (data as DataWithId).id);
        }
        break;
      default:
        throw new Error(`Unknown Supabase action: ${action}`);
    }
    
    if (result && result.error) {
      throw new Error(result.error.message);
    }
    
    // Create a mock Response object to maintain compatibility
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => result?.data || null,
      text: async () => JSON.stringify(result?.data || null),
    } as Response;
    
    return mockResponse;
  }
  
  // Otherwise use regular fetch for backend API
  // Verificar se temos um token JWT armazenado para autenticação
  const authToken = localStorage.getItem('authToken');
  
  // Configurar os cabeçalhos - sempre incluir Content-Type para consistência
  // exceto se estiver enviando FormData
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  // Adicionar o token JWT se estiver disponível
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
    console.log('[apiRequest] Adicionando token JWT ao cabeçalho da requisição:', url);
  } else {
    console.log('[apiRequest] Sem token JWT disponível para a requisição:', url);
  }
  
  // Configuração da requisição
  const requestConfig: RequestInit = {
    method,
    headers,
    credentials: "include", // Importante para manter a sessão
  };
  
  // Adicionar corpo apenas se necessário
  if (data) {
    if (isFormData && data instanceof FormData) {
      requestConfig.body = data;
    } else if (!isFormData) {
      requestConfig.body = JSON.stringify(data);
    }
  }
  
  console.log(`[apiRequest] Enviando requisição ${method} para ${url} ${isFormData ? 'com FormData' : ''}`);
  
  // Fazer a requisição
  const res = await fetch(url, requestConfig);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [urlOrTable, ...params] = queryKey as [string, ...any[]];
    
    // If the query key starts with '/api/supabase/', use Supabase client
    if (typeof urlOrTable === 'string' && urlOrTable.startsWith('/api/supabase/')) {
      const table = urlOrTable.replace('/api/supabase/', '');
      let query = supabase.from(table).select('*');
      
      // Apply filters if params contains filter object
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
    
    // Otherwise use regular fetch for backend API
    // Verificar se temos um token JWT armazenado para autenticação
    const authToken = localStorage.getItem('authToken');
    
    // Configurar os cabeçalhos com token JWT quando disponível
    const headers: HeadersInit = {
      "Content-Type": "application/json" // Adicionar Content-Type para consistência
    };
    
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
      console.log('[QueryClient] Adicionando token JWT à requisição GET:', urlOrTable);
    } else {
      console.log('[QueryClient] Sem token JWT disponível para GET:', urlOrTable);
    }
    
    console.log(`[QueryClient] Enviando requisição GET para ${urlOrTable}`);
    let res = await fetch(urlOrTable, {
      credentials: "include",
      headers
    });

    // Se receber 401, tenta ressincronizar a sessão e repetir a requisição
    if (res.status === 401) {
      // Para o modo returnNull, retornar null sem tentar ressincronizar
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      // Tenta ressincronizar a sessão
      const resyncSuccessful = await trySessionResync();
      
      // Se a ressincronização for bem-sucedida, tenta a requisição novamente
      if (resyncSuccessful) {
        console.log('[QueryClient] Sessão ressincronizada com sucesso, repetindo requisição:', urlOrTable);
        // Repetir a requisição com o mesmo token JWT se disponível
        res = await fetch(urlOrTable, {
          credentials: "include",
          headers // Reutilizar o mesmo objeto de cabeçalhos com o token
        });
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
