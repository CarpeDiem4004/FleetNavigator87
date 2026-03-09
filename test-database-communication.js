// Teste de comunicação entre bancos de dados Supabase e Replit PostgreSQL
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Configuração do PostgreSQL do Replit
const replitDbConfig = {
  connectionString: process.env.DATABASE_URL,
};

async function main() {
  console.log('=== TESTE DE COMUNICAÇÃO ENTRE BANCOS DE DADOS ===');
  console.log('Verificando conexão e tabelas do Supabase e PostgreSQL do Replit...\n');

  try {
    // Inicializar conexões
    const supabase = createClient(supabaseUrl, supabaseKey);
    const replitPool = new Pool(replitDbConfig);

    // Verificar tabelas do Supabase
    console.log('=== TABELAS DO SUPABASE ===');
    const { data: supabaseTables, error: supabaseError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'pg_stat_statements')
      .order('table_name');

    if (supabaseError) {
      console.error('Erro ao consultar tabelas do Supabase:', supabaseError);
    } else {
      console.log(`Encontradas ${supabaseTables.length} tabelas no Supabase:`);
      const supabaseTableNames = supabaseTables.map(t => t.table_name);
      console.log(supabaseTableNames);
      console.log();
    }

    // Verificar tabelas do PostgreSQL do Replit
    console.log('=== TABELAS DO POSTGRESQL (REPLIT) ===');
    const replitTablesResult = await replitPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`Encontradas ${replitTablesResult.rowCount} tabelas no PostgreSQL (Replit):`);
    const replitTableNames = replitTablesResult.rows.map(r => r.table_name);
    console.log(replitTableNames);
    console.log();

    // Comparar tabelas entre os dois bancos
    console.log('=== COMPARAÇÃO DE TABELAS ===');
    const supabaseOnlyTables = supabaseTableNames.filter(t => !replitTableNames.includes(t));
    const replitOnlyTables = replitTableNames.filter(t => !supabaseTableNames.includes(t));
    const commonTables = supabaseTableNames.filter(t => replitTableNames.includes(t));

    console.log(`Tabelas comuns em ambos os bancos (${commonTables.length}):`);
    console.log(commonTables);
    console.log();

    console.log(`Tabelas apenas no Supabase (${supabaseOnlyTables.length}):`);
    console.log(supabaseOnlyTables);
    console.log();

    console.log(`Tabelas apenas no PostgreSQL/Replit (${replitOnlyTables.length}):`);
    console.log(replitOnlyTables);
    console.log();

    // Testar comunicação para algumas tabelas comuns
    if (commonTables.length > 0) {
      console.log('=== TESTANDO COMUNICAÇÃO PARA TABELAS COMUNS ===');
      
      // Testar até 5 tabelas comuns
      const tablesToTest = commonTables.slice(0, 5);
      
      for (const tableName of tablesToTest) {
        console.log(`\nTestando tabela: ${tableName}`);
        
        // Contar registros no Supabase
        const { data: supabaseCount, error: supabaseCountError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (supabaseCountError) {
          console.error(`Erro ao contar registros no Supabase para ${tableName}:`, supabaseCountError);
        } else {
          console.log(`Supabase: ${supabaseCount.length} registros`);
        }
        
        // Contar registros no PostgreSQL (Replit)
        try {
          const replitCountResult = await replitPool.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`PostgreSQL (Replit): ${replitCountResult.rows[0].count} registros`);
        } catch (error) {
          console.error(`Erro ao contar registros no PostgreSQL (Replit) para ${tableName}:`, error.message);
        }
      }
    }

    // Verificar problemas específicos
    if (commonTables.includes('users')) {
      console.log('\n=== VERIFICANDO CONFIGURAÇÃO DE USUÁRIOS ===');
      // Verificar se há discrepâncias na tabela de usuários
      try {
        const { data: supabaseUsers, error: supabaseUsersError } = await supabase
          .from('users')
          .select('id, email')
          .limit(3);
          
        if (supabaseUsersError) {
          console.error('Erro ao consultar usuários no Supabase:', supabaseUsersError);
        } else {
          console.log('Amostra de usuários no Supabase:');
          console.log(supabaseUsers);
        }
        
        const replitUsersResult = await replitPool.query(`
          SELECT id, email FROM users LIMIT 3
        `);
        
        console.log('Amostra de usuários no PostgreSQL (Replit):');
        console.log(replitUsersResult.rows);
      } catch (error) {
        console.error('Erro ao verificar tabela de usuários:', error.message);
      }
    }

    // Fechar conexões
    await replitPool.end();
    console.log('\nTeste de comunicação concluído!');
  
  } catch (error) {
    console.error('Erro geral durante o teste:', error);
  }
}

main();