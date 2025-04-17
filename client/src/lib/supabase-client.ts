import { createClient } from '@supabase/supabase-js';

// URL do Supabase
const supabaseUrl = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';

// Chave anônima para autenticação e operações permitidas pelo RLS
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Chave de serviço para operações administrativas (contorna RLS)
// NOTA: A chave de serviço está inválida, então estamos usando temporariamente a chave anônima 
// até que uma chave de serviço válida seja fornecida
const supabaseServiceKey = supabaseAnonKey; // Usando a mesma chave temporariamente

// Cliente Supabase padrão com chave anônima (para autenticação e operações com RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase com chave "de serviço" (temporariamente usando a chave anônima)
// Importante: isso NÃO vai contornar as políticas de RLS até que uma chave de serviço válida seja usada
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Insere dados em uma tabela Supabase usando o cliente administrativo (contorna RLS)
 * @param table Nome da tabela
 * @param data Dados a serem inseridos
 * @returns Resultado da operação
 */
export async function insertData(table: string, data: any) {
  const timestamp = new Date().getTime();
  
  try {
    console.log(`[Supabase] Inserindo dados em ${table}:`, data);
    
    const { data: result, error } = await supabaseAdmin
      .from(table)
      .insert(data)
      .select();
    
    if (error) {
      console.error(`[Supabase] Erro ao inserir em ${table}:`, error);
      throw new Error(`Erro ao inserir dados: ${error.message}`);
    }
    
    console.log(`[Supabase] Dados inseridos com sucesso em ${table}:`, result);
    return result;
  } catch (error: any) {
    console.error(`[Supabase] Exceção ao inserir em ${table}:`, error);
    throw new Error(`Falha ao inserir dados: ${error.message}`);
  }
}

/**
 * Busca dados de uma tabela Supabase usando o cliente administrativo (contorna RLS)
 * Para compatibilidade com código existente, esta função também está disponível como fetchRecords
 * @param table Nome da tabela
 * @param query Objeto de consulta (opcional)
 * @returns Dados retornados
 */
export async function fetchData(table: string, query?: any) {
  try {
    console.log(`[Supabase] Buscando dados de ${table}`);
    
    let queryBuilder = supabaseAdmin
      .from(table)
      .select();
    
    // Aplica filtros se existirem
    if (query) {
      if (query.equals) {
        Object.entries(query.equals).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }
      
      if (query.order) {
        Object.entries(query.order).forEach(([column, direction]) => {
          queryBuilder = queryBuilder.order(column, { ascending: direction === 'asc' });
        });
      }
      
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error(`[Supabase] Erro ao buscar dados de ${table}:`, error);
      throw new Error(`Erro ao buscar dados: ${error.message}`);
    }
    
    console.log(`[Supabase] Dados recuperados de ${table}: ${data?.length} registros`);
    return data || [];
  } catch (error: any) {
    console.error(`[Supabase] Exceção ao buscar dados de ${table}:`, error);
    throw new Error(`Falha ao buscar dados: ${error.message}`);
  }
}

/**
 * Atualiza dados em uma tabela Supabase usando o cliente administrativo (contorna RLS)
 * @param table Nome da tabela
 * @param id ID do registro a ser atualizado
 * @param data Dados atualizados
 * @returns Resultado da operação
 */
export async function updateData(table: string, id: number, data: any) {
  try {
    console.log(`[Supabase] Atualizando dados em ${table} com ID ${id}:`, data);
    
    const { data: result, error } = await supabaseAdmin
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`[Supabase] Erro ao atualizar em ${table}:`, error);
      throw new Error(`Erro ao atualizar dados: ${error.message}`);
    }
    
    console.log(`[Supabase] Dados atualizados com sucesso em ${table}:`, result);
    return result;
  } catch (error: any) {
    console.error(`[Supabase] Exceção ao atualizar em ${table}:`, error);
    throw new Error(`Falha ao atualizar dados: ${error.message}`);
  }
}

/**
 * Verifica se a conexão com o Supabase está funcionando
 * @returns true se a conexão estiver funcionando, false caso contrário
 */
export async function checkConnection(): Promise<boolean> {
  try {
    // Tenta buscar um registro de uma tabela existente
    const { data, error } = await supabaseAdmin
      .from('controle_tanques')
      .select()
      .limit(1);
    
    if (error) {
      console.error('[Supabase] Erro ao verificar conexão:', error);
      return false;
    }
    
    console.log('[Supabase] Conexão verificada com sucesso');
    return true;
  } catch (error) {
    console.error('[Supabase] Exceção ao verificar conexão:', error);
    return false;
  }
}

/**
 * Alias para fetchData para compatibilidade com código existente
 */
export const fetchRecords = fetchData;

/**
 * Exclui um registro de uma tabela Supabase usando o cliente administrativo (contorna RLS)
 * @param table Nome da tabela
 * @param id ID do registro a ser excluído
 * @returns true se a exclusão for bem sucedida
 */
export async function deleteRecord(table: string, id: number): Promise<boolean> {
  try {
    console.log(`[Supabase] Excluindo registro de ${table} com ID ${id}`);
    
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`[Supabase] Erro ao excluir registro de ${table}:`, error);
      throw new Error(`Erro ao excluir registro: ${error.message}`);
    }
    
    console.log(`[Supabase] Registro excluído com sucesso de ${table}`);
    return true;
  } catch (error: any) {
    console.error(`[Supabase] Exceção ao excluir registro de ${table}:`, error);
    throw new Error(`Falha ao excluir registro: ${error.message}`);
  }
}

/**
 * Exclui múltiplos registros de uma tabela Supabase usando o cliente administrativo (contorna RLS)
 * @param table Nome da tabela
 * @param ids Lista de IDs dos registros a serem excluídos
 * @returns true se a exclusão for bem sucedida
 */
export async function deleteRecords(table: string, ids: number[]): Promise<boolean> {
  try {
    console.log(`[Supabase] Excluindo ${ids.length} registros de ${table}`);
    
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .in('id', ids);
    
    if (error) {
      console.error(`[Supabase] Erro ao excluir registros de ${table}:`, error);
      throw new Error(`Erro ao excluir registros: ${error.message}`);
    }
    
    console.log(`[Supabase] Registros excluídos com sucesso de ${table}`);
    return true;
  } catch (error: any) {
    console.error(`[Supabase] Exceção ao excluir registros de ${table}:`, error);
    throw new Error(`Falha ao excluir registros: ${error.message}`);
  }
}