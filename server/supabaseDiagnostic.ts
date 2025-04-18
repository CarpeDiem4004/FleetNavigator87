import { createClient } from '@supabase/supabase-js';

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Tabelas que esperamos encontrar no Supabase
export const expectedTables = [
  'status_tanques',
  'abastecimentos_postos',
  'recebimentos_combustivel',
  'controle_patio'
];

/**
 * Testa a conexão com o Supabase e verifica as permissões
 * @returns Resultados do diagnóstico
 */
export async function runSupabaseDiagnostic() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    baseConnection: false,
    readPermission: false,
    writePermission: false,
    tables: {}
  };

  try {
    console.log('Iniciando diagnóstico Supabase no servidor...');
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste 1: Conexão básica
    console.log('Testando conexão básica...');
    const { data: pingData, error: pingError } = await supabase.from('status_tanques').select('count(*)', { count: 'exact', head: true });
    results.baseConnection = !pingError;
    
    if (pingError) {
      console.error('Erro na conexão básica:', pingError);
      results.baseConnectionError = pingError.message;
    } else {
      console.log('Conexão básica: OK');
    }
    
    // Teste 2: Permissão de leitura
    console.log('Testando permissão de leitura...');
    const { data: readData, error: readError } = await supabase.from('status_tanques').select('*').limit(1);
    results.readPermission = !readError;
    
    if (readError) {
      console.error('Erro na permissão de leitura:', readError);
      results.readPermissionError = readError.message;
    } else {
      console.log('Permissão de leitura: OK');
      results.readSample = readData;
    }
    
    // Teste 3: Permissão de escrita
    console.log('Testando permissão de escrita...');
    const testRecord = {
      posto_id: 999,
      diesel_capacidade: 1000,
      diesel_nivel: 500,
      arla_capacidade: 100,
      arla_nivel: 50,
      ultima_atualizacao: new Date().toISOString(),
      teste_diagnostico: true
    };
    
    const { data: writeData, error: writeError } = await supabase
      .from('status_tanques')
      .insert(testRecord)
      .select();
      
    results.writePermission = !writeError;
    
    if (writeError) {
      console.error('Erro na permissão de escrita:', writeError);
      results.writePermissionError = writeError.message;
    } else {
      console.log('Permissão de escrita: OK');
      results.writeSample = writeData;
      
      // Limpar registro de teste se foi inserido com sucesso
      if (writeData && writeData[0]?.id) {
        const { error: deleteError } = await supabase
          .from('status_tanques')
          .delete()
          .eq('id', writeData[0].id);
          
        if (deleteError) {
          console.warn('Não foi possível excluir registro de teste:', deleteError);
        } else {
          console.log('Registro de teste removido com sucesso');
        }
      }
    }
    
    // Teste 4: Verificação de tabelas
    console.log('Verificando tabelas esperadas...');
    for (const table of expectedTables) {
      const { data, error } = await supabase.from(table).select('count(*)', { count: 'exact', head: true });
      
      results.tables[table] = {
        exists: !error,
        error: error ? error.message : null
      };
      
      if (error) {
        console.error(`Erro ao verificar tabela ${table}:`, error);
      } else {
        console.log(`Tabela ${table}: OK`);
      }
    }
    
    // Verificar schema da tabela
    if (results.tables['status_tanques']?.exists) {
      try {
        // Executar query para tentar obter a estrutura da tabela
        const { data, error } = await supabase.rpc('get_table_info', { table_name: 'status_tanques' });
        
        if (error) {
          results.schemaCheck = {
            success: false,
            error: error.message
          };
        } else {
          results.schemaCheck = {
            success: true,
            schema: data
          };
        }
      } catch (e: any) {
        results.schemaCheck = {
          success: false,
          error: e.message
        };
      }
    }
    
  } catch (error: any) {
    console.error('Erro fatal durante diagnóstico Supabase:', error);
    results.fatalError = error.message;
    results.errorStack = error.stack;
  }
  
  console.log('Diagnóstico Supabase concluído');
  return results;
}