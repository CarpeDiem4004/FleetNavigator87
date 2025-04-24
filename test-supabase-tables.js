// Script para verificar a comunicação com Supabase e suas tabelas
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Função principal
async function main() {
  console.log('🔄 Verificando comunicação com Supabase e suas tabelas...');
  
  try {
    // Verificar se as variáveis de ambiente estão disponíveis
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não estão definidas.');
      return;
    }
    
    console.log(`🔑 Supabase URL: ${supabaseUrl.substring(0, 15)}...`);
    console.log(`🔑 Supabase Key: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`);
    
    // Inicializar o cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar a conexão com o Supabase usando uma tabela de sistema
    const { data: health, error: healthError } = await supabase
      .from('pg_stat_database')
      .select('*')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro ao verificar a conexão com o Supabase:', healthError.message);
      // Tentar outra abordagem com uma simples consulta
      const { error: simpleError } = await supabase.from('information_schema.tables').select('table_name').limit(1);
      
      if (simpleError) {
        console.error('❌ Também não foi possível realizar uma consulta simples:', simpleError.message);
        return;
      } else {
        console.log('✅ Conexão com o Supabase estabelecida com sucesso (via consulta alternativa).');
      }
    } else {
      console.log('✅ Conexão com o Supabase estabelecida com sucesso.');
    }
    
    // Listar tabelas no Supabase
    console.log('\n📋 Buscando lista de tabelas no Supabase...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'pg_stat_statements')
      .order('table_name');
    
    if (tablesError) {
      console.error('❌ Erro ao listar tabelas do Supabase:', tablesError.message);
      return;
    }
    
    const tableNames = tables.map(t => t.table_name);
    console.log(`📊 Total de tabelas encontradas no Supabase: ${tableNames.length}`);
    console.log('📋 Lista de tabelas:');
    tableNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    // Verificar tabelas críticas específicas
    const criticalTables = [
      'users', 
      'bases', 
      'veiculos', 
      'pneus', 
      'oficinas', 
      'abastecimentos',
      'abastecimentos_postos',
      'sessions',
      'posto_remedios_abastecimentos'
    ];
    
    console.log('\n🔎 Verificando tabelas críticas no Supabase...');
    
    for (const tableName of criticalTables) {
      if (tableNames.includes(tableName)) {
        console.log(`\n✅ Tabela ${tableName} encontrada no Supabase.`);
        
        // Verificar a estrutura da tabela (colunas)
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position');
        
        if (columnsError) {
          console.error(`❌ Erro ao verificar estrutura da tabela ${tableName}:`, columnsError.message);
          continue;
        }
        
        console.log(`📑 Estrutura da tabela ${tableName}:`);
        console.log('------------------------');
        columns.forEach(column => {
          console.log(`${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Contar registros na tabela
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error(`❌ Erro ao contar registros da tabela ${tableName}:`, countError.message);
          continue;
        }
        
        console.log(`\n📝 Total de registros no Supabase: ${count}`);
        
        // Buscar alguns registros da tabela
        const { data: records, error: recordsError } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);
        
        if (recordsError) {
          console.error(`❌ Erro ao buscar registros da tabela ${tableName}:`, recordsError.message);
          continue;
        }
        
        console.log(`🔍 Primeiros registros da tabela ${tableName}:`);
        
        if (records.length === 0) {
          console.log('Nenhum registro encontrado.');
          continue;
        }
        
        records.forEach((record, index) => {
          console.log(`\nRegistro #${index + 1}:`);
          Object.entries(record).forEach(([key, value]) => {
            // Limitar o tamanho de exibição de valores muito grandes
            const displayValue = value && typeof value === 'string' && value.length > 100 
              ? value.substring(0, 100) + '...' 
              : value;
            console.log(`  ${key}: ${displayValue}`);
          });
        });
      } else {
        console.log(`\n❌ Tabela ${tableName} NÃO encontrada no Supabase.`);
      }
    }
    
    console.log('\n✅ Verificação de tabelas do Supabase concluída!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a verificação do Supabase:', error.message);
  }
}

// Executar o script
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});