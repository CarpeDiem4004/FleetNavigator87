/**
 * Script para verificar a estrutura das tabelas de solicitações de pneus no Supabase
 * Este script confirma se todas as tabelas e colunas necessárias existem
 * 
 * Para executar: 
 * 1. Ajuste as variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY com seus valores
 * 2. Execute com Node.js: node verify-supabase-tire-tables.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase - substitua pelos seus valores
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY devem estar definidas');
  process.exit(1);
}

// Inicializar cliente Supabase usando a service_role key para acesso administrativo
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de tabelas que devemos verificar
const TABLES_TO_CHECK = [
  'solicitacoes_pneus',
  'campinas_tire_requests',
  'socorro_tire_requests',
  'osasco_tire_requests',
  'abc_tire_requests'
];

// Lista de colunas que cada tabela deve ter
const REQUIRED_COLUMNS = [
  'id',
  'base_id',
  'usuario_id',
  'usuario_nome',
  'quantidade',
  'medida',
  'motivo',
  'observacoes',
  'status',
  'data_solicitacao',
  'data_aprovacao',
  'aprovador_id',
  'aprovador_nome',
  'observacoes_aprovacao',
  'data_previsao',
  'placa_veiculo',
  'km_veiculo'
];

// Função para verificar se uma tabela existe
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      throw error;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`Erro ao verificar se a tabela ${tableName} existe:`, error);
    return false;
  }
}

// Função para obter as colunas de uma tabela
async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Erro ao obter colunas da tabela ${tableName}:`, error);
    return [];
  }
}

// Função para verificar as políticas RLS de uma tabela
async function checkRlsPolicies(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT policname, polcmd, polpermissive, polroles, polqual
          FROM pg_policy
          JOIN pg_class ON pg_class.oid = pg_policy.polrelid
          WHERE relname = '${tableName}'
        `
      });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Erro ao verificar políticas RLS da tabela ${tableName}:`, error);
    return [];
  }
}

// Função para verificar se todos os índices existem
async function checkIndexes() {
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT indexname, tablename
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND indexname LIKE 'idx_%_tire_requests_%';
        `
      });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao verificar índices:', error);
    return [];
  }
}

// Função para verificar a estrutura de uma tabela específica
async function verifyTableStructure(tableName) {
  console.log(`\nVerificando tabela: ${tableName}`);
  
  // Verificar se a tabela existe
  const tableExists = await checkTableExists(tableName);
  if (!tableExists) {
    console.error(`❌ A tabela ${tableName} não existe!`);
    return false;
  }
  console.log(`✓ A tabela ${tableName} existe`);
  
  // Verificar as colunas da tabela
  const columns = await getTableColumns(tableName);
  const columnNames = columns.map(col => col.column_name);
  
  console.log(`Colunas encontradas na tabela ${tableName}:`);
  columns.forEach(column => {
    console.log(`- ${column.column_name} (${column.data_type})`);
  });
  
  // Verificar se todas as colunas necessárias existem
  const missingColumns = REQUIRED_COLUMNS.filter(col => !columnNames.includes(col));
  if (missingColumns.length > 0) {
    console.error(`❌ Colunas faltando na tabela ${tableName}: ${missingColumns.join(', ')}`);
    return false;
  }
  console.log(`✓ Todas as colunas necessárias estão presentes`);
  
  // Verificar as políticas RLS
  const policies = await checkRlsPolicies(tableName);
  if (policies.length === 0) {
    console.warn(`⚠️ Não foram encontradas políticas RLS para a tabela ${tableName}`);
  } else {
    console.log(`✓ ${policies.length} política(s) RLS encontrada(s) para a tabela ${tableName}`);
  }
  
  return true;
}

// Função principal
async function main() {
  console.log('Iniciando verificação das tabelas de solicitações de pneus no Supabase...');
  
  let allTablesValid = true;
  
  // Verificar cada tabela
  for (const tableName of TABLES_TO_CHECK) {
    const isValid = await verifyTableStructure(tableName);
    allTablesValid = allTablesValid && isValid;
  }
  
  // Verificar índices
  console.log('\nVerificando índices:');
  const indexes = await checkIndexes();
  console.log(`Encontrados ${indexes.length} índices relacionados às tabelas de solicitações de pneus:`);
  indexes.forEach(index => {
    console.log(`- ${index.indexname} (na tabela ${index.tablename})`);
  });
  
  // Relatório final
  console.log('\n===== RELATÓRIO FINAL =====');
  if (allTablesValid) {
    console.log('✅ Todas as tabelas de solicitações de pneus estão configuradas corretamente!');
  } else {
    console.error('❌ Algumas tabelas não estão configuradas corretamente. Revise os detalhes acima.');
  }
}

// Executar script
main();