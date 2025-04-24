import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Valores padrão para desenvolvimento
// Usando exatamente as mesmas chaves do .env
const SUPABASE_URL = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Usar variáveis de ambiente se disponíveis (debug para depuração)
console.log('Verificando variáveis de ambiente do Supabase:');
console.log('- VITE_SUPABASE_URL disponível:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_ANON_KEY disponível:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('- VITE_SUPABASE_SERVICE_KEY disponível:', !!import.meta.env.VITE_SUPABASE_SERVICE_KEY);

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
// Garantir que estamos usando a chave de serviço correta, priorizando a variável de ambiente
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY;
console.log('Supabase Service Key (primeiros 10 caracteres):', supabaseServiceKey.substring(0, 10) + '...');

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function createSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export const supabase = createSupabaseClient();

export function createSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminInstance;
}

export const supabaseAdmin = createSupabaseAdmin();

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log('Verificando conexão com Supabase...');
    
    // Usamos uma tabela simples para verificar a conexão que é menos provável de ter problemas de permissão
    const client = createSupabaseClient();
    
    // Tentamos primeiro com uma tabela comum com baixa chance de erro de permissão
    try {
      const { data, error } = await client.from('abastecimentos_postos').select('count()', { count: 'exact' });
      if (!error) {
        console.log('Conexão com Supabase estabelecida com sucesso (abastecimentos_postos)');
        return true;
      }
    } catch (firstError) {
      console.log('Primeiro método de verificação falhou, tentando alternativa:', firstError);
    }
    
    // Se o primeiro método falhar, tenta com outra tabela
    try {
      const { data, error } = await client.from('veiculos').select('count()', { count: 'exact' });
      if (!error) {
        console.log('Conexão com Supabase estabelecida com sucesso (veiculos)');
        return true;
      }
    } catch (secondError) {
      console.log('Segundo método de verificação falhou:', secondError);
    }
    
    // Se ainda falhar, tenta com ping simples
    try {
      const { data, error } = await client.rpc('ping');
      if (!error) {
        console.log('Conexão com Supabase estabelecida com sucesso (ping)');
        return true;
      }
    } catch (thirdError) {
      console.log('Terceiro método de verificação falhou:', thirdError);
    }
    
    console.error('Todos os métodos de verificação de conexão falharam');
    return false;
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
}

export const checkConnection = checkSupabaseConnection;

export async function getSupabaseTables(): Promise<string[]> {
  try {
    const client = createSupabaseClient();
    const { data, error } = await client.rpc('get_tables');
    
    if (error) {
      console.error('Erro ao buscar tabelas do Supabase:', error);
      return [];
    }
    
    return Array.isArray(data) ? data.map((item: any) => item.table_name) : [];
  } catch (error) {
    console.error('Erro ao obter lista de tabelas:', error);
    return [];
  }
}

export async function checkAllConnections(): Promise<{
  supabase: boolean;
  baseConnection: boolean; // Adicionado para compatibilidade com o código existente
}> {
  const supabaseConnected = await checkSupabaseConnection();
  
  return {
    supabase: supabaseConnected,
    baseConnection: supabaseConnected // Usa o mesmo valor para manter compatibilidade
  };
}

export async function insertRecord(
  table: string, 
  data: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    console.log(`Tentando inserir registro em ${table} com cliente padrão`);
    const client = createSupabaseClient();
    
    // Timeout para evitar que a operação fique presa indefinidamente
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: A operação demorou muito para responder')), 15000);
    });
    
    // Tentativa com cliente padrão
    const insertPromise = client.from(table).insert([data]).select();
    
    // Race entre o timeout e a inserção
    const result = await Promise.race([insertPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error(`Erro ao inserir registro em ${table} com cliente padrão:`, result.error);
      
      // Tentativa com cliente admin como fallback
      console.log(`Tentando inserir registro em ${table} com cliente admin`);
      const admin = createSupabaseAdmin();
      const { data: adminResult, error: adminError } = await admin
        .from(table)
        .insert([data])
        .select();
      
      if (adminError) {
        console.error(`Erro ao inserir registro em ${table} com cliente admin:`, adminError);
        return { success: false, error: adminError };
      }
      
      return { success: true, data: adminResult };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`Exceção ao inserir registro em ${table}:`, error);
    
    // Última tentativa com cliente admin sem select para minimizar erros
    try {
      console.log(`Tentativa final: inserir registro em ${table} com cliente admin sem select`);
      const admin = createSupabaseAdmin();
      const { error: finalError } = await admin
        .from(table)
        .insert([data]);
      
      if (finalError) {
        return { success: false, error: finalError };
      }
      
      return { success: true, data: { ...data, id: 'desconhecido' } };
    } catch (finalError) {
      return { success: false, error: finalError instanceof Error ? finalError.message : finalError };
    }
  }
}

// Alias para insertRecord
export const insertData = insertRecord;

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
    const client = createSupabaseClient();
    let query = client.from(table).select(options.columns || '*');
    
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
      console.error(`Erro ao buscar registros de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`Exceção ao buscar registros de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

export async function updateData(
  table: string,
  id: number | string,
  data: Record<string, any>,
  idField: string = 'id'
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const client = createSupabaseClient();
    const { data: result, error } = await client
      .from(table)
      .update(data)
      .eq(idField, id)
      .select();
      
    if (error) {
      console.error(`Erro ao atualizar registro em ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Exceção ao atualizar registro em ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

export async function deleteRecord(
  table: string,
  id: number | string,
  idField: string = 'id'
): Promise<{ success: boolean; error?: any }> {
  try {
    const client = createSupabaseClient();
    const { error } = await client
      .from(table)
      .delete()
      .eq(idField, id);
      
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

export async function deleteRecords(
  table: string,
  filter?: Record<string, any>
): Promise<{ success: boolean; error?: any }> {
  try {
    const client = createSupabaseClient();
    let query = client.from(table).delete();
    
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

/**
 * Função para limpar várias tabelas no Supabase de forma otimizada
 * Leva em consideração a ordem correta para evitar problemas com chaves estrangeiras
 * @param tables Array de nomes de tabelas para limpar
 * @returns Objeto com resultados por tabela
 */
export async function limparTodosOsDados(
  tables: string[]
): Promise<Record<string, { success: boolean; message?: string }>> {
  // Ordem otimizada para limpeza respeitando chaves estrangeiras
  const orderForDeletion = [
    // Primeiro tabelas dependentes
    'multas', 'fines',
    'abastecimentos', 'refueling',
    'abastecimentos_postos',
    'movimentacoes_patio',
    'recebimentos_combustivel',
    'manutencao', 'maintenance',
    'linha_corredor', 'line_hall',
    // Depois tabelas principais
    'pneus', 'tires',
    'veiculos', 'vehicles',
    'oficinas', 'workshops',
    'bases', 'bases',
    // Por último tabelas de configuração
    'controle_tanques',
    'status_tanques',
    'configuracao_tanques'
  ];
  
  // Filtrar as tabelas solicitadas pela ordem otimizada
  const orderedTablesToDelete = orderForDeletion.filter(t => tables.includes(t));
  
  // Adicionar no final qualquer tabela que não estiver na lista predefinida
  const remainingTables = tables.filter(t => !orderForDeletion.includes(t));
  const finalOrderedTables = [...orderedTablesToDelete, ...remainingTables];
  
  const results: Record<string, { success: boolean; message?: string }> = {};
  
  // Usar cliente administrativo para garantir permissões
  const admin = createSupabaseAdmin();
  
  // Processar tabelas na ordem correta
  for (const table of finalOrderedTables) {
    try {
      console.log(`Limpando tabela: ${table}`);
      
      // Tentar excluir todos os registros
      const { error } = await admin
        .from(table)
        .delete()
        .neq('id', -1); // condição sempre verdadeira para excluir tudo
      
      if (error) {
        results[table] = { 
          success: false, 
          message: error.message || 'Erro desconhecido'
        };
        console.error(`Erro ao limpar tabela ${table}:`, error);
      } else {
        results[table] = { success: true };
        console.log(`Tabela ${table} limpa com sucesso!`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      results[table] = { success: false, message: errorMessage };
      console.error(`Exceção ao limpar tabela ${table}:`, error);
    }
  }
  
  return results;
}