import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Chaves de API Supabase
export const supabaseUrl = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Cliente Supabase para uso anônimo (geral)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase para operações administrativas (quando disponível)
// Para ser inicializado quando necessário, por exemplo
// `supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);`
export let supabaseAdmin: SupabaseClient | null = null;

// Inicializa cliente admin se a chave de serviço estiver disponível
// No ambiente do cliente, usamos import.meta.env ao invés de process.env
if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(
    supabaseUrl,
    import.meta.env.VITE_SUPABASE_SERVICE_KEY
  );
}

// Função para buscar registros de uma tabela Supabase
export async function fetchRecords(table: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Erro ao buscar registros da tabela ${table}:`, error);
    return [];
  }
}

// Função para excluir um registro específico de uma tabela Supabase
export async function deleteRecord(table: string, id: number) {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erro ao excluir registro id=${id} da tabela ${table}:`, error);
    return false;
  }
}

// Função para excluir todos os registros ou um conjunto específico de registros de uma tabela Supabase
export async function deleteRecords(table: string, ids?: number[]) {
  try {
    // Se recebemos uma lista de IDs, exclui apenas esses registros
    if (ids && ids.length > 0) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return true;
    }
    
    // Caso contrário, tenta excluir todos os registros
    // Primeiro tentamos usar o cliente administrativo se disponível
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .neq('id', -1); // Truque para deletar todos (já que não existe .delete() sem where)
      
      if (error) throw error;
      return true;
    } else {
      // Fallback para o cliente anônimo com permissões limitadas
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', -1);
      
      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error(`Erro ao excluir registros da tabela ${table}:`, error);
    return false;
  }
}

// Função para inserir um registro em uma tabela Supabase
export async function insertRecord(table: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result?.[0] || null;
  } catch (error) {
    console.error(`Erro ao inserir registro na tabela ${table}:`, error);
    return null;
  }
}

// Alias da função insertRecord para compatibilidade com código existente
export async function insertData(table: string, data: any) {
  return insertRecord(table, data);
}

// Função para atualizar um registro em uma tabela Supabase
export async function updateData(table: string, id: number, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return result?.[0] || null;
  } catch (error) {
    console.error(`Erro ao atualizar registro na tabela ${table}:`, error);
    return null;
  }
}

// Verifica se a conexão com o Supabase está funcionando
export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('status_tanques')
      .select('count(*)', { count: 'exact', head: true });
    
    return !error;
  } catch (e) {
    console.error("Erro ao verificar conexão com Supabase:", e);
    return false;
  }
}

// Função para testar as conexões com o Supabase
export async function checkAllConnections() {
  const results: Record<string, boolean> = {};
  
  // Teste 1: Conexão básica com Supabase
  try {
    const { data, error } = await supabase
      .from('status_tanques')
      .select('count(*)', { count: 'exact', head: true });
    
    results.baseConnection = !error;
  } catch (e) {
    results.baseConnection = false;
  }
  
  // Teste 2: Permissões de leitura
  try {
    const { data, error } = await supabase
      .from('status_tanques')
      .select('*')
      .limit(1);
    
    results.readPermission = !error;
  } catch (e) {
    results.readPermission = false;
  }
  
  // Teste 3: Permissões de escrita (teste com insert e delete)
  try {
    // Inserir um registro temporário
    const testRecord = {
      posto_id: 99,
      diesel_capacidade: 1000,
      diesel_nivel: 500,
      arla_capacidade: 100,
      arla_nivel: 50,
      ultima_atualizacao: new Date().toISOString(),
      teste_diagnostico: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('status_tanques')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      results.writePermission = false;
    } else if (insertData && insertData.length > 0) {
      // Agora tentar excluir o registro criado
      const id = insertData[0].id;
      
      const { error: deleteError } = await supabase
        .from('status_tanques')
        .delete()
        .eq('id', id);
      
      results.writePermission = !deleteError;
    } else {
      results.writePermission = false;
    }
  } catch (e) {
    results.writePermission = false;
  }
  
  // Teste 4: Tabelas específicas existem e são acessíveis
  const tables = [
    'status_tanques', 
    'abastecimentos_postos', 
    'movimentacoes_patio',
    'entradas_combustivel',
    'controle_tanques',
    'veiculos'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });
      
      results[`table_${table}`] = !error;
    } catch (e) {
      results[`table_${table}`] = false;
    }
  }
  
  // Teste 5: Testar funções RPC (se houver)
  try {
    const { data, error } = await supabase
      .rpc('get_system_time');
    
    results.rpcFunctions = !error;
  } catch (e) {
    results.rpcFunctions = false;
  }
  
  // Teste 6: Verificar se consegue fazer autenticação (se relevante)
  // Nota: este é um teste sintético, não vai realmente criar um usuário
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'invalidpassword123',
    });
    
    // Aqui estamos testando apenas se a API de auth responde, não se faz login
    // então ignoramos o erro específico de credenciais inválidas
    results.authSystem = Boolean(error?.message?.includes('Invalid login') || error?.message?.includes('Email not confirmed'));
  } catch (e) {
    results.authSystem = false;
  }

  // Adicionar versões do navegador e informações de ambiente
  results.userAgent = navigator.userAgent ? true : false;
  results.timestamp = true;
  
  return results;
}