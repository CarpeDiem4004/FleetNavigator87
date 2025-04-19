import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Chaves de API Supabase
export const supabaseUrl = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Cliente Supabase para uso anônimo (geral)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase para operações administrativas (quando disponível)
// No cliente web, não inicializamos o admin client - deixamos isso para o servidor
export const supabaseAdmin: SupabaseClient | null = null;

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
    
    // Se não tem IDs, tenta excluir todos - como não temos acesso admin no cliente web, 
    // isso deve ser feito pelo servidor ou então usar a API específica para limpar dados
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', -1); // Truque para deletar todos (já que não existe .delete() sem where)
    
    if (error) throw error;
    return true;
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

// Interface para resultado detalhado dos testes
interface DetailedTestResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Função para testar as conexões com o Supabase com detalhes
export async function checkAllConnections() {
  // Objeto para resultados detalhados
  const detailedResults: Record<string, DetailedTestResult> = {};
  
  // Objeto para compatibilidade com versão antiga (retorna apenas boolean)
  const results: Record<string, boolean> = {};
  
  console.log("Iniciando diagnóstico Supabase cliente");
  
  // Teste 1: Conexão básica com Supabase
  try {
    console.log("Testando conexão básica...");
    const { data, error } = await supabase
      .from('status_tanques')
      .select('count(*)', { count: 'exact', head: true });
    
    const success = !error;
    results.baseConnection = success;
    detailedResults.baseConnection = {
      success,
      error: error?.message,
      data
    };
    
    if (error) {
      console.error("Erro na conexão básica:", error);
    } else {
      console.log("Conexão básica: OK");
    }
  } catch (e: any) {
    results.baseConnection = false;
    detailedResults.baseConnection = {
      success: false,
      error: e?.message || "Erro desconhecido na conexão"
    };
    console.error("Exceção na conexão básica:", e);
  }
  
  // Teste 2: Permissões de leitura
  try {
    console.log("Testando permissão de leitura...");
    const { data, error } = await supabase
      .from('status_tanques')
      .select('*')
      .limit(1);
    
    const success = !error;
    results.readPermission = success;
    detailedResults.readPermission = {
      success,
      error: error?.message,
      data
    };
    
    if (error) {
      console.error("Erro na permissão de leitura:", error);
    } else {
      console.log("Permissão de leitura: OK");
    }
  } catch (e: any) {
    results.readPermission = false;
    detailedResults.readPermission = {
      success: false,
      error: e?.message || "Erro desconhecido na leitura"
    };
    console.error("Exceção na permissão de leitura:", e);
  }
  
  // Teste 3: Permissões de escrita (teste com insert e delete)
  try {
    console.log("Testando permissão de escrita...");
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
      console.error("Erro na permissão de escrita (insert):", insertError);
      results.writePermission = false;
      detailedResults.writePermission = {
        success: false,
        error: insertError.message,
      };
    } else if (insertData && insertData.length > 0) {
      console.log("Insert bem-sucedido, tentando excluir o registro...");
      // Agora tentar excluir o registro criado
      const id = insertData[0].id;
      
      const { error: deleteError } = await supabase
        .from('status_tanques')
        .delete()
        .eq('id', id);
      
      const success = !deleteError;
      results.writePermission = success;
      detailedResults.writePermission = {
        success,
        error: deleteError?.message,
        data: insertData
      };
      
      if (deleteError) {
        console.error("Erro na permissão de escrita (delete):", deleteError);
      } else {
        console.log("Permissão de escrita: OK (insert e delete bem-sucedidos)");
      }
    } else {
      console.error("Erro na permissão de escrita: insert retornou null");
      results.writePermission = false;
      detailedResults.writePermission = {
        success: false,
        error: "Insert retornou dados nulos"
      };
    }
  } catch (e: any) {
    console.error("Exceção na permissão de escrita:", e);
    results.writePermission = false;
    detailedResults.writePermission = {
      success: false,
      error: e?.message || "Erro desconhecido na escrita"
    };
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

// Função para limpar completamente uma tabela específica no Supabase
export async function limparTabela(tabela: string) {
  try {
    const { error } = await supabase
      .from(tabela)
      .delete()
      .neq('id', ''); // Garante que ele tente apagar tudo
    
    if (error) {
      console.error(`Erro ao limpar tabela ${tabela}:`, error);
      return { success: false, message: error.message };
    } else {
      console.log(`Tabela ${tabela} limpa com sucesso.`);
      return { success: true, message: `Tabela ${tabela} limpa com sucesso` };
    }
  } catch (error: any) {
    console.error(`Erro ao limpar tabela ${tabela}:`, error);
    return { success: false, message: error.message || 'Erro desconhecido' };
  }
}

// Função para limpar várias tabelas no Supabase na ordem correta
export async function limparTodosOsDados(tabelas?: string[]) {
  // Lista padrão de tabelas para limpar, na ordem correta para evitar conflitos de FK
  const tabelasPadrao = [
    'manutencao',
    'abastecimentos',
    'multas',
    'pneus',
    'linha_corredor',
    'veiculos',
    'oficinas',
    'abastecimentos_postos',
    'movimentacoes_patio',
    'entradas_combustivel',
    'status_tanques',
    'controle_tanques',
    // Incluir também os nomes antigos em inglês para garantir
    'maintenance',
    'refueling',
    'fines',
    'tires',
    'line_hall',
    'vehicles',
    'workshops'
  ];

  // Usar as tabelas fornecidas ou as padrão
  const tabelasParaLimpar = tabelas || tabelasPadrao;
  const resultados: Record<string, any> = {};
  
  for (const tabela of tabelasParaLimpar) {
    console.log(`Tentando limpar tabela ${tabela}...`);
    const resultado = await limparTabela(tabela);
    resultados[tabela] = resultado;
  }
  
  return resultados;
}