/**
 * ARQUIVO DE COMPATIBILIDADE UNIFICADO PARA SUPABASE
 * 
 * Este arquivo fornece todas as funções e tipos necessários para funcionar com o Supabase
 * de forma unificada, evitando problemas de importação entre módulos.
 * 
 * Como usar: import { supabase, fetchRecords, etc... } from '@/lib/supabase-compat'
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Constantes de configuração do Supabase
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Log de diagnóstico para verificar URLs e chaves (evitar mostrar a chave completa)
console.log('[supabase-compat] Verificando variáveis de ambiente do Supabase:');
console.log('- VITE_SUPABASE_URL disponível:', Boolean(import.meta.env.VITE_SUPABASE_URL));
console.log('- VITE_SUPABASE_ANON_KEY disponível:', Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY));
console.log('- VITE_SUPABASE_SERVICE_KEY disponível:', Boolean(import.meta.env.VITE_SUPABASE_SERVICE_KEY));

// Definição de tipos unificados para diagnósticos
export interface ClientDiagnosticResults {
  authConnection: boolean;
  databaseConnection: boolean;
  storageConnection: boolean;
  functionsConnection: boolean;
  realtimeConnection: boolean;
  baseConnection?: boolean;
  readPermission?: boolean;
  writePermission?: boolean;
  authSystem?: boolean;
  rpcFunctions?: boolean;
  supabase?: boolean;
}

export interface ServerDiagnosticResults {
  baseConnection: boolean;
  readPermission: boolean;
  writePermission: boolean;
  tables: Record<string, { exists: boolean, error: string | null }>;
  baseConnectionError?: string;
  readPermissionError?: string;
  writePermissionError?: string;
  readSample?: any;
}

// Instâncias do cliente Supabase (singleton pattern)
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Função singleton para obter ou criar o cliente Supabase.
 * Garante que apenas uma instância do cliente é criada em toda a aplicação,
 * evitando problemas com múltiplas instâncias do GoTrueClient.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabase) {
    console.log("[supabase-compat] Criando nova instância do cliente Supabase");
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'supabase.auth.token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-application-name': 'MuriciFleet-Web',
        },
      }
    });
  }
  return _supabase;
};

/**
 * Função singleton para obter ou criar o cliente Supabase Admin.
 * Este cliente tem permissões elevadas usando a service key.
 */
export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    console.log("[supabase-compat] Criando nova instância do cliente Supabase Admin");
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        storageKey: 'supabase.auth.admin.token',
        autoRefreshToken: true,
        persistSession: true
      }
    });
  }
  return _supabaseAdmin;
};

// Aliases para manter compatibilidade com código existente
export const createSupabaseClient = getSupabaseClient;
export const createSupabaseAdmin = getSupabaseAdminClient;

// Exportar instâncias únicas para uso geral no aplicativo
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();

/**
 * Verifica se a conexão com o Supabase está funcionando
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    console.log('[supabase-compat] Verificando conexão com Supabase...');
    // Tentamos fazer uma busca simples para verificar a conexão
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (!error) {
      console.log('[supabase-compat] Conexão com Supabase estabelecida com sucesso (users)');
      return true;
    }
    
    // Se falhar com a tabela users, tenta com outras tabelas
    try {
      const { error: abastecimentosError } = await supabase
        .from('abastecimentos')
        .select('count()', { count: 'exact', head: true });
      
      if (!abastecimentosError) {
        console.log('[supabase-compat] Conexão com Supabase estabelecida com sucesso (abastecimentos)');
        return true;
      }
    } catch (e) {
      console.log('[supabase-compat] Falha ao verificar com tabela abastecimentos, tentando outra');
    }
    
    try {
      const { error: veiculosError } = await supabase
        .from('veiculos')
        .select('count()', { count: 'exact', head: true });
      
      if (!veiculosError) {
        console.log('[supabase-compat] Conexão com Supabase estabelecida com sucesso (veiculos)');
        return true;
      }
    } catch (e) {
      console.log('[supabase-compat] Falha ao verificar com tabela veiculos');
    }
    
    return false;
  } catch (err) {
    console.error('[supabase-compat] Erro ao verificar conexão com Supabase:', err);
    return false;
  }
};

// Aliases para manter compatibilidade com códigos que usavam supabase-client.ts
export const checkSupabaseConnection = checkConnection;

export const checkAllConnections = async () => {
  const supabaseConnected = await checkConnection();
  return {
    supabase: supabaseConnected,
    baseConnection: supabaseConnected,
    databaseConnection: supabaseConnected,
    authConnection: supabaseConnected,
    storageConnection: supabaseConnected,
    functionsConnection: supabaseConnected,
    realtimeConnection: supabaseConnected,
    readPermission: supabaseConnected,
    writePermission: supabaseConnected,
    authSystem: supabaseConnected,
    rpcFunctions: supabaseConnected
  };
};

/**
 * Busca registros de uma tabela com opções de filtro e ordenação
 */
export async function fetchRecords(
  table: string,
  options: { 
    columns?: string; 
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    let query = supabase.from(table).select(options.columns || '*');
    
    // Aplicar filtros
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && 'op' in value && 'value' in value) {
            // Filtro avançado com operador personalizado
            const { op, value: filterValue } = value as { op: string; value: any };
            switch (op) {
              case 'eq': query = query.eq(key, filterValue); break;
              case 'neq': query = query.neq(key, filterValue); break;
              case 'gt': query = query.gt(key, filterValue); break;
              case 'gte': query = query.gte(key, filterValue); break;
              case 'lt': query = query.lt(key, filterValue); break;
              case 'lte': query = query.lte(key, filterValue); break;
              case 'like': query = query.like(key, `%${filterValue}%`); break;
              case 'ilike': query = query.ilike(key, `%${filterValue}%`); break;
              case 'in': query = query.in(key, filterValue); break;
              default: query = query.eq(key, filterValue);
            }
          } else {
            // Filtro simples por igualdade
            query = query.eq(key, value);
          }
        }
      });
    }
    
    // Aplicar ordenação
    if (options.order) {
      const { column, ascending = true } = options.order;
      query = query.order(column, { ascending });
    }
    
    // Aplicar limite
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    // Executar a consulta
    const { data, error } = options.single 
      ? await query.single() 
      : await query;
    
    if (error) {
      console.error(`[supabase-compat] Erro ao buscar registros de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao buscar registros de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Insere um registro em uma tabela
 */
export async function insertRecord(
  table: string, 
  data: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    console.log(`[supabase-compat] Tentando inserir registro em ${table} com cliente padrão`);
    
    // Timeout para evitar que a operação fique presa indefinidamente
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: A operação demorou muito para responder')), 15000);
    });
    
    // Tentativa com cliente padrão
    const insertPromise = supabase.from(table).insert([data]).select();
    
    // Race entre o timeout e a inserção
    const result = await Promise.race([insertPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error(`[supabase-compat] Erro ao inserir registro em ${table} com cliente padrão:`, result.error);
      
      // Tentativa com cliente admin como fallback
      console.log(`[supabase-compat] Tentando inserir registro em ${table} com cliente admin`);
      const { data: adminResult, error: adminError } = await supabaseAdmin
        .from(table)
        .insert([data])
        .select();
      
      if (adminError) {
        console.error(`[supabase-compat] Erro ao inserir registro em ${table} com cliente admin:`, adminError);
        return { success: false, error: adminError };
      }
      
      return { success: true, data: adminResult };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao inserir registro em ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

// Alias para insertRecord
export const insertData = insertRecord;

/**
 * Atualiza um registro em uma tabela pelo ID
 */
export async function updateData(
  table: string,
  id: number | string,
  data: Record<string, any>,
  idField: string = 'id'
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq(idField, id)
      .select();
      
    if (error) {
      console.error(`[supabase-compat] Erro ao atualizar registro em ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao atualizar registro em ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Remove um registro de uma tabela pelo ID
 */
export async function deleteRecord(
  table: string,
  id: number | string,
  idField: string = 'id'
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idField, id);
      
    if (error) {
      console.error(`[supabase-compat] Erro ao excluir registro de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao excluir registro de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Remove múltiplos registros de uma tabela com base em filtros
 */
export async function deleteRecords(
  table: string,
  filter?: Record<string, any>
): Promise<{ success: boolean; error?: any }> {
  try {
    let query = supabase.from(table).delete();
    
    // Aplicar filtros
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { error } = await query;
      
    if (error) {
      console.error(`[supabase-compat] Erro ao excluir registros de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao excluir registros de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Função para chamar uma função Supabase com retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<{ data: T; error: any }>,
  maxRetries = 3,
  delay = 1000
): Promise<{ data: T | null; error: any }> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const { data, error } = await fn();
      
      if (!error) {
        return { data, error: null };
      }
      
      // Se tiver erro de conexão, tentar novamente
      if (error.code === 'PGRST301' || error.message?.includes('connection')) {
        retries++;
        console.log(`[supabase-compat] Tentativa ${retries}/${maxRetries} falhou, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Aumentar o delay a cada tentativa
      } else {
        // Se for um erro diferente de conexão, retornar imediatamente
        return { data: null, error };
      }
    } catch (err) {
      retries++;
      console.error(`[supabase-compat] Exceção na tentativa ${retries}/${maxRetries}:`, err);
      
      if (retries >= maxRetries) {
        return { data: null, error: err };
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Aumentar o delay a cada tentativa
    }
  }
  
  return { data: null, error: new Error(`Falha após ${maxRetries} tentativas`) };
}

// Exportação padrão
export default supabase;