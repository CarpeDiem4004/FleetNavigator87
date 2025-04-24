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
    
    // Verificar a conexão com o Supabase usando uma tabela pública conhecida
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro ao verificar a conexão com o Supabase (tabela users):', healthError.message);
      
      // Tentar com outra tabela
      const { data: baseCheck, error: baseError } = await supabase
        .from('bases')
        .select('id')
        .limit(1);
      
      if (baseError) {
        console.error('❌ Erro ao verificar a conexão com o Supabase (tabela bases):', baseError.message);
        
        // Fazer uma consulta de autenticação básica
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('❌ Erro ao acessar API de autenticação do Supabase:', authError.message);
          console.error('⚠️ Possível problema com as credenciais do Supabase ou com a conexão.');
          return;
        } else {
          console.log('✅ API de autenticação do Supabase está acessível.');
          console.log('⚠️ Você está conectado ao Supabase, mas pode não ter permissões para acessar tabelas.');
        }
      } else {
        console.log('✅ Conexão com o Supabase estabelecida com sucesso (via tabela bases).');
      }
    } else {
      console.log('✅ Conexão com o Supabase estabelecida com sucesso (via tabela users).');
    }
    
    // Listar tabelas no Supabase usando método alternativo
    console.log('\n📋 Buscando lista de tabelas no Supabase...');
    
    // Criar função alternativa para listar tabelas sem usar information_schema
    // (que pode não estar acessível para o usuário anônimo)
    const testTables = [
      'users', 'bases', 'veiculos', 'pneus', 'oficinas', 
      'abastecimentos', 'abastecimentos_postos', 'sessions',
      'posto_remedios_abastecimentos', 'workshops', 'maintenance',
      'refueling', 'tires', 'vehicles', 'vehicle_checklist'
    ];
    
    // Verificar cada tabela individualmente
    const tableResults = await Promise.all(testTables.map(async (tableName) => {
      const { error } = await supabase.from(tableName).select('count').limit(1);
      return { tableName, exists: !error };
    }));
    
    // Filtrar apenas tabelas que existem
    const existingTables = tableResults.filter(t => t.exists).map(t => ({ table_name: t.tableName }));
    
    const tables = existingTables;
    const tablesError = null;
    
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
        
        // A consulta à information_schema requer privilégios elevados, 
        // então vamos pular a verificação de estrutura e buscar diretamente os dados
        console.log(`📑 Verificando dados da tabela ${tableName}...`);
        
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