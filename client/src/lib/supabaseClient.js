import { createClient } from '@supabase/supabase-js';

// Obtém variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não definidas!');
}

// Cria o cliente Supabase com persistência automática de sessão
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});

// Cliente com chave de serviço para operações administrativas (apenas no servidor)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Função para obter cliente admin (compatibilidade com supabaseClient.ts)
export const getSupabaseAdminClient = () => supabaseAdmin;

// Função para tentar novamente uma operação em caso de falha
export async function withRetry(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      console.log(`Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`, error);
      lastError = error;
      
      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Aumentar o tempo de espera para a próxima tentativa (backoff exponencial)
      delay = delay * 1.5;
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  console.error(`Todas as ${maxRetries} tentativas falharam`, lastError);
  throw lastError;
}

// Função para verificar conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    return !error;
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
}

// Alias para compatibilidade com código importando checkConnection
export const checkConnection = checkSupabaseConnection;

/**
 * Busca registros de uma tabela com opções de filtro e ordenação
 */
export async function fetchRecords(
  table,
  options = {}
) {
  try {
    let query = supabase.from(table).select(options.columns || '*');
    
    // Aplicar filtros
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && 'op' in value && 'value' in value) {
            // Filtro avançado com operador personalizado
            const { op, value: filterValue } = value;
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
      console.error(`Erro ao buscar registros de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`Exceção ao buscar registros de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}