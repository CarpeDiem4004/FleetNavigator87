// Script de comparação entre os bancos de dados PostgreSQL local e Supabase
import pkg from 'pg';
const { Pool } = pkg;
import { createClient } from '@supabase/supabase-js';

// Cores para saída no console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Configurações
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const postgresConfig = {
  connectionString: process.env.DATABASE_URL,
};

async function getPostgresqlTables() {
  const pool = new Pool(postgresConfig);
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error(`${colors.red}Erro ao consultar tabelas do PostgreSQL:${colors.reset}`, error.message);
    return [];
  } finally {
    await pool.end();
  }
}

async function getSupabaseTables() {
  // Lista de tabelas para verificar
  const testTables = [
    'users', 'bases', 'veiculos', 'pneus', 'oficinas', 
    'abastecimentos', 'abastecimentos_postos', 'sessions',
    'posto_remedios_abastecimentos', 'workshops', 'maintenance',
    'refueling', 'tires', 'vehicles', 'vehicle_checklist',
    'movimentacao_pneu', 'driver_checklists', 'movimentacoes_patio',
    'linehall_shopee', 'configuracao_tanques'
  ];
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar cada tabela individualmente
    const tableResults = await Promise.all(testTables.map(async (tableName) => {
      const { error } = await supabase.from(tableName).select('count').limit(1);
      return { tableName, exists: !error };
    }));
    
    // Retornar apenas tabelas que existem
    return tableResults.filter(t => t.exists).map(t => t.tableName);
  } catch (error) {
    console.error(`${colors.red}Erro ao consultar tabelas do Supabase:${colors.reset}`, error.message);
    return [];
  }
}

async function main() {
  console.log(`\n${colors.bright}${colors.bgBlue} RELATÓRIO DE COMPARAÇÃO DE BANCOS DE DADOS ${colors.reset}\n`);
  
  try {
    // Buscar tabelas dos dois bancos de dados
    console.log(`${colors.cyan}Buscando tabelas do PostgreSQL local...${colors.reset}`);
    const postgresqlTables = await getPostgresqlTables();
    console.log(`${colors.green}✓ Encontradas ${postgresqlTables.length} tabelas no PostgreSQL local${colors.reset}`);
    
    console.log(`\n${colors.cyan}Buscando tabelas do Supabase...${colors.reset}`);
    const supabaseTables = await getSupabaseTables();
    console.log(`${colors.green}✓ Encontradas ${supabaseTables.length} tabelas no Supabase${colors.reset}`);
    
    // Comparar as tabelas
    console.log(`\n${colors.bright}${colors.bgBlue} ANÁLISE COMPARATIVA ${colors.reset}\n`);
    
    // Tabelas comuns
    const commonTables = postgresqlTables.filter(table => supabaseTables.includes(table));
    
    // Tabelas apenas no PostgreSQL
    const postgresOnlyTables = postgresqlTables.filter(table => !supabaseTables.includes(table));
    
    // Tabelas apenas no Supabase
    const supabaseOnlyTables = supabaseTables.filter(table => !postgresqlTables.includes(table));
    
    // Estatísticas gerais
    const totalUniqueTabelas = [...new Set([...postgresqlTables, ...supabaseTables])].length;
    const sincronizacaoPercentual = commonTables.length / totalUniqueTabelas * 100;
    
    console.log(`${colors.bright}Estatísticas Gerais:${colors.reset}`);
    console.log(`${colors.blue}Total de tabelas únicas:${colors.reset} ${totalUniqueTabelas}`);
    console.log(`${colors.blue}Tabelas sincronizadas:${colors.reset} ${commonTables.length} (${sincronizacaoPercentual.toFixed(1)}%)`);
    console.log(`${colors.blue}Tabelas apenas no PostgreSQL:${colors.reset} ${postgresOnlyTables.length}`);
    console.log(`${colors.blue}Tabelas apenas no Supabase:${colors.reset} ${supabaseOnlyTables.length}`);
    
    // Detalhes das tabelas comuns
    console.log(`\n${colors.bright}${colors.green}Tabelas comuns nos dois bancos:${colors.reset}`);
    commonTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    // Detalhes das tabelas exclusivas do PostgreSQL
    console.log(`\n${colors.bright}${colors.yellow}Tabelas exclusivas do PostgreSQL local:${colors.reset}`);
    postgresOnlyTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    // Detalhes das tabelas exclusivas do Supabase
    console.log(`\n${colors.bright}${colors.magenta}Tabelas exclusivas do Supabase:${colors.reset}`);
    supabaseOnlyTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    // Análise para tabelas críticas
    const criticalTables = [
      'users', 'bases', 'veiculos', 'pneus', 'oficinas', 
      'abastecimentos', 'abastecimentos_postos', 'sessions',
      'posto_remedios_abastecimentos'
    ];
    
    console.log(`\n${colors.bright}${colors.bgYellow}${colors.reset} ${colors.bright}Análise de Tabelas Críticas:${colors.reset}`);
    criticalTables.forEach(table => {
      const inPostgres = postgresqlTables.includes(table);
      const inSupabase = supabaseTables.includes(table);
      
      let status;
      if (inPostgres && inSupabase) {
        status = `${colors.green}✓ Sincronizada${colors.reset}`;
      } else if (inPostgres && !inSupabase) {
        status = `${colors.yellow}⚠ Apenas no PostgreSQL${colors.reset}`;
      } else if (!inPostgres && inSupabase) {
        status = `${colors.magenta}⚠ Apenas no Supabase${colors.reset}`;
      } else {
        status = `${colors.red}✗ Não encontrada em nenhum banco${colors.reset}`;
      }
      
      console.log(`${table}: ${status}`);
    });
    
    // Conclusão e recomendações
    console.log(`\n${colors.bright}${colors.bgBlue} CONCLUSÃO E RECOMENDAÇÕES ${colors.reset}\n`);
    
    if (sincronizacaoPercentual < 50) {
      console.log(`${colors.red}⚠ ALERTA: Os bancos de dados estão com baixa sincronização (${sincronizacaoPercentual.toFixed(1)}%).${colors.reset}`);
      console.log(`${colors.red}Há um número significativo de tabelas não compartilhadas entre os bancos de dados.${colors.reset}`);
    } else if (sincronizacaoPercentual < 80) {
      console.log(`${colors.yellow}⚠ ATENÇÃO: Os bancos de dados estão parcialmente sincronizados (${sincronizacaoPercentual.toFixed(1)}%).${colors.reset}`);
      console.log(`${colors.yellow}Algumas tabelas importantes podem não estar sendo sincronizadas corretamente.${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ SATISFATÓRIO: Os bancos de dados estão bem sincronizados (${sincronizacaoPercentual.toFixed(1)}%).${colors.reset}`);
      console.log(`${colors.green}A maioria das tabelas está presente em ambos os bancos.${colors.reset}`);
    }
    
    // Verificação específica da tabela sessions
    if (postgresqlTables.includes('sessions') && !supabaseTables.includes('sessions')) {
      console.log(`\n${colors.yellow}⚠ IMPORTANTE: A tabela 'sessions' existe apenas no PostgreSQL local.${colors.reset}`);
      console.log(`${colors.yellow}Esta tabela é usada para armazenar sessões de autenticação e não está no Supabase.${colors.reset}`);
      console.log(`${colors.yellow}Isto explica por que a autenticação funciona apenas no ambiente Replit.${colors.reset}`);
    }
    
    // Fornecer recomendações específicas
    console.log(`\n${colors.bright}Recomendações:${colors.reset}`);
    
    if (postgresOnlyTables.length > 0) {
      console.log(`${colors.blue}1. Migrar as seguintes tabelas críticas para o Supabase:${colors.reset}`);
      const criticalPostgresOnly = postgresOnlyTables.filter(table => criticalTables.includes(table));
      criticalPostgresOnly.forEach((table, index) => {
        console.log(`   ${colors.yellow}➤ ${table}${colors.reset}`);
      });
    }
    
    if (!supabaseTables.includes('sessions') && postgresqlTables.includes('sessions')) {
      console.log(`${colors.blue}2. Para manter a autenticação consistente em todos os ambientes:${colors.reset}`);
      console.log(`   ${colors.yellow}➤ Migrar a tabela 'sessions' para o Supabase ou${colors.reset}`);
      console.log(`   ${colors.yellow}➤ Implementar autenticação baseada em JWT que não dependa da tabela 'sessions'${colors.reset}`);
    }
    
    console.log(`${colors.blue}3. Verificar se os schemas (estrutura) das tabelas comuns são idênticos${colors.reset}`);
    console.log(`${colors.blue}4. Implementar um sistema de sincronização regular entre os bancos de dados${colors.reset}`);
    
    console.log(`\n${colors.dim}Relatório gerado em: ${new Date().toLocaleString()}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.bgRed}${colors.bright} ERRO AO GERAR RELATÓRIO ${colors.reset}`);
    console.error(error);
  }
}

main().catch(console.error);