import { createClient } from '@supabase/supabase-js';

// Obtém variáveis de ambiente do Vite
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não definidas!');
}

// Evitar múltiplas instâncias do cliente Supabase
let _supabaseClient = null;
let _supabaseAdminClient = null;

// Função singleton para obter ou criar o cliente Supabase
export const getSupabaseClient = () => {
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
      },
    });
  }
  return _supabaseClient;
};

// Função singleton para obter ou criar o cliente Supabase Admin
export const getSupabaseAdminClient = () => {
  if (!_supabaseAdminClient) {
    _supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabaseAdminClient;
};

// Criar instâncias de clientes
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();

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

// Verificar todas as conexões
export async function checkAllConnections() {
  const results = {
    authConnection: false,
    databaseConnection: false,
    storageConnection: false,
    functionsConnection: false,
    realtimeConnection: false,
    baseConnection: false,
    readPermission: false,
    writePermission: false,
    authSystem: false,
    rpcFunctions: false,
    supabase: false
  };
  
  try {
    // Verifica conexão com o serviço Auth
    try {
      await supabase.auth.getSession();
      results.authConnection = true;
    } catch (error) {
      console.error('Erro na conexão Auth:', error);
    }
    
    // Verifica conexão com o banco de dados
    try {
      const { error } = await supabase.from('health_check').select('*').limit(1);
      results.databaseConnection = !error;
    } catch (error) {
      console.error('Erro na conexão Database:', error);
    }
    
    // Verifica conexão com o storage
    try {
      const { error } = await supabase.storage.listBuckets();
      results.storageConnection = !error;
    } catch (error) {
      console.error('Erro na conexão Storage:', error);
    }
    
    // Verifica conexão com functions
    try {
      const { error } = await supabase.functions.listFunctions();
      results.functionsConnection = !error;
    } catch (error) {
      console.error('Erro na conexão Functions:', error);
    }
    
    // Verifica conexão com realtime
    results.realtimeConnection = supabase.realtime.getSubscriptions().length >= 0;
    
    // Status geral do supabase (se pelo menos uma conexão funciona)
    results.supabase = results.authConnection || 
                      results.databaseConnection || 
                      results.storageConnection || 
                      results.functionsConnection ||
                      results.realtimeConnection;
    
    return results;
  } catch (error) {
    console.error('Erro ao verificar conexões:', error);
    return results;
  }
}

// Busca registros de uma tabela com opções de filtro e ordenação
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
          query = query.eq(key, value);
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

// Atualiza um registro em uma tabela pelo ID
export async function updateData(
  table,
  id,
  data
) {
  try {
    const { error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id);
      
    if (error) {
      console.error(`Erro ao atualizar registro em ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Exceção ao atualizar registro em ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

// Insere um registro em uma tabela
export async function insertRecord(
  table,
  data
) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
      
    if (error) {
      console.error(`Erro ao inserir registro em ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data: result[0] };
  } catch (error) {
    console.error(`Exceção ao inserir registro em ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

// Remove um registro de uma tabela pelo ID
export async function deleteRecord(
  table,
  id
) {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Erro ao excluir registro de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Exceção ao excluir registro de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

// Remove múltiplos registros de uma tabela com base em filtros
export async function deleteRecords(
  table,
  filter
) {
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
      console.error(`Erro ao excluir registros de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Exceção ao excluir registros de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

// Alias para funções comuns
export const insertData = insertRecord;
export const checkConnection = checkSupabaseConnection;
export const createSupabaseClient = getSupabaseClient;
export const createSupabaseAdmin = getSupabaseAdminClient;