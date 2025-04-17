import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
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
): Promise<Response> {
  try {
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
    try {
      console.log(`Fazendo requisição para ${url}...`);
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      
      console.log(`Resposta recebida de ${url}: status ${res.status}`);
      await throwIfResNotOk(res);
      return res;
    } catch (error: any) {
      // Captura erros específicos de rede (connection refused, etc)
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        console.error('Erro de conexão ao fazer requisição:', error);
        // Cria um objeto de erro customizado com mais detalhes
        const connectionError = new Error('Erro de conexão com o servidor. Verifique se o servidor está ativo e acessível.');
        connectionError.name = 'ERR_CONNECTION_REFUSED';
        throw connectionError;
      }
      // Passa o erro adiante
      throw error;
    }
  } catch (error) {
    console.error('Erro ao fazer requisição API:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
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
      try {
        console.log(`Fazendo consulta para ${urlOrTable}...`);
        const res = await fetch(urlOrTable, {
          credentials: "include",
        });
        
        console.log(`Resposta recebida de consulta ${urlOrTable}: status ${res.status}`);
        
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }
        
        await throwIfResNotOk(res);
        return await res.json();
      } catch (error: any) {
        // Captura erros específicos de rede (connection refused, etc)
        if (error.name === 'TypeError' || 
            (error.message && error.message.includes('Failed to fetch'))) {
          console.error('Erro de conexão ao fazer consulta:', error);
          // Cria um objeto de erro customizado com mais detalhes
          const connectionError = new Error('Erro de conexão com o servidor. Verifique se o servidor está ativo e acessível.');
          connectionError.name = 'ERR_CONNECTION_REFUSED';
          throw connectionError;
        }
        // Passa o erro adiante
        throw error;
      }
    } catch (error) {
      console.error('Erro ao fazer consulta:', error);
      throw error;
    }
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
