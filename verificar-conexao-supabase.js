/**
 * Script para verificar a conexão com o Supabase
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

console.log('Verificando variáveis de ambiente do Supabase:');
console.log('- VITE_SUPABASE_URL disponível:', !!supabaseUrl);
console.log('- VITE_SUPABASE_ANON_KEY disponível:', !!supabaseAnonKey);
console.log('- VITE_SUPABASE_SERVICE_KEY disponível:', !!supabaseServiceKey);

if (supabaseServiceKey) {
  console.log('Supabase Service Key (primeiros 10 caracteres):', supabaseServiceKey.substring(0, 10) + '...');
}

// Criar cliente com chave anônima para testes
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Criar cliente com chave de serviço para testes
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testarTabelasSupabase() {
  try {
    console.log('\n=== TESTANDO CONEXÃO COM SUPABASE (ANON KEY) ===');
    const { data: tablesAnon, error: errorAnon } = await supabaseAnon
      .from('tabelas_info')
      .select('*')
      .limit(1);
    
    if (errorAnon) {
      console.log('Erro ao acessar tabelas com chave anônima:', errorAnon);
    } else {
      console.log('Acesso bem-sucedido com chave anônima!');
      console.log('Dados:', tablesAnon);
    }
    
    console.log('\n=== TESTANDO CONEXÃO COM SUPABASE (SERVICE KEY) ===');
    const { data: tablesService, error: errorService } = await supabaseService
      .from('tabelas_info')
      .select('*')
      .limit(1);
    
    if (errorService) {
      console.log('Erro ao acessar tabelas com chave de serviço:', errorService);
      
      // Tentar uma tabela específica
      console.log('\nTentando acessar tabelas existentes...');
      
      const { data: usersData, error: usersError } = await supabaseService
        .from('users')
        .select('count(*)')
        .limit(1);
        
      if (usersError) {
        console.log('Erro ao acessar tabela users:', usersError);
      } else {
        console.log('Tabela users acessada com sucesso!');
        console.log('Contagem:', usersData);
      }
      
      // Tentar listar todas as tabelas
      console.log('\nTentando listar todas as tabelas no schema public:');
      const { data: tableList, error: tableListError } = await supabaseService
        .rpc('get_tables');
        
      if (tableListError) {
        console.log('Erro ao listar tabelas:', tableListError);
        
        // Tentar selecionar diretamente da tabela de sistema
        console.log('\nTentando consultar o catálogo do sistema:');
        console.log('Obs: Isso pode falhar se a API do Supabase não tiver permissões adequadas');
        
        const { data: sysTablesData, error: sysTablesError } = await supabaseService
          .from('pg_tables')
          .select('tablename, schemaname')
          .eq('schemaname', 'public')
          .order('tablename');
          
        if (sysTablesError) {
          console.log('Erro ao acessar pg_tables:', sysTablesError);
        } else {
          console.log('Tabelas no schema public:', sysTablesData);
        }
      } else {
        console.log('Tabelas disponíveis:', tableList);
      }
    } else {
      console.log('Acesso bem-sucedido com chave de serviço!');
      console.log('Dados:', tablesService);
    }
    
    // Tentar criar uma tabela para testar permissões
    console.log('\n=== TESTANDO CRIAÇÃO DE TABELA TEMPORÁRIA (SERVICE KEY) ===');
    const testTableName = `test_table_${Date.now()}`;
    
    const { error: createError } = await supabaseService
      .from(testTableName)
      .insert([{ name: 'Test', value: 'Data' }]);
      
    if (createError) {
      console.log(`Erro ao criar tabela temporária ${testTableName}:`, createError);
    } else {
      console.log(`Tabela temporária ${testTableName} criada e dados inseridos com sucesso!`);
      
      // Limpar tabela de teste
      const { error: dropError } = await supabaseService
        .rpc('drop_table', { table_name: testTableName });
        
      if (dropError) {
        console.log(`Erro ao remover tabela temporária ${testTableName}:`, dropError);
      } else {
        console.log(`Tabela temporária ${testTableName} removida com sucesso!`);
      }
    }
    
  } catch (error) {
    console.error('Erro crítico ao testar conexão:', error);
  }
}

// Executar testes
testarTabelasSupabase();