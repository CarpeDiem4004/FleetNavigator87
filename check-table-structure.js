// Script para verificar a estrutura das tabelas comuns entre PostgreSQL e Supabase
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

// Tabelas comuns a verificar
const commonTables = [
  'abastecimentos_postos',
  'bases',
  'movimentacao_pneu',
  'movimentacoes_patio'
];

// Função para obter a estrutura de uma tabela no PostgreSQL
async function getPostgresTableStructure(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, 
             is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      ORDER BY ordinal_position;
    `, [tableName]);
    
    return result.rows;
  } catch (error) {
    console.error(`${colors.red}Erro ao obter estrutura da tabela ${tableName} no PostgreSQL:${colors.reset}`, error.message);
    return [];
  }
}

// Função para obter dados de exemplo de uma tabela no PostgreSQL
async function getPostgresTableSample(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT * FROM ${tableName} LIMIT 1;
    `);
    
    return result.rows;
  } catch (error) {
    console.error(`${colors.red}Erro ao obter amostra da tabela ${tableName} no PostgreSQL:${colors.reset}`, error.message);
    return [];
  }
}

// Função principal
async function main() {
  console.log(`\n${colors.bright}${colors.bgBlue} VERIFICAÇÃO DE ESTRUTURA DE TABELAS COMUNS ${colors.reset}\n`);
  
  const pool = new Pool(postgresConfig);
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    for (const tableName of commonTables) {
      console.log(`\n${colors.bright}${colors.cyan}Analisando tabela: ${tableName}${colors.reset}`);
      
      // Obter estrutura da tabela no PostgreSQL
      const pgStructure = await getPostgresTableStructure(pool, tableName);
      
      if (pgStructure.length === 0) {
        console.log(`${colors.yellow}⚠ Não foi possível obter a estrutura da tabela no PostgreSQL${colors.reset}`);
        continue;
      }
      
      console.log(`${colors.green}✓ Estrutura obtida do PostgreSQL: ${pgStructure.length} colunas${colors.reset}`);
      
      // Verificar se a tabela existe no Supabase
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (supabaseError) {
        console.log(`${colors.red}✗ Erro ao acessar tabela no Supabase: ${supabaseError.message}${colors.reset}`);
        continue;
      }
      
      console.log(`${colors.green}✓ Tabela acessível no Supabase${colors.reset}`);
      
      // Obter amostra de dados do PostgreSQL para comparação
      const pgSample = await getPostgresTableSample(pool, tableName);
      
      if (pgSample.length === 0) {
        console.log(`${colors.yellow}⚠ Não há dados de amostra no PostgreSQL para esta tabela${colors.reset}`);
      } else {
        // Comparar campos disponíveis
        const pgColumns = Object.keys(pgSample[0]);
        const supaColumns = supabaseData && supabaseData.length > 0 ? 
                           Object.keys(supabaseData[0]) : [];
        
        if (supaColumns.length === 0) {
          console.log(`${colors.yellow}⚠ Não há dados de amostra no Supabase para esta tabela${colors.reset}`);
        } else {
          // Verificar diferenças nas colunas
          const pgOnlyColumns = pgColumns.filter(col => !supaColumns.includes(col));
          const supaOnlyColumns = supaColumns.filter(col => !pgColumns.includes(col));
          const commonColumns = pgColumns.filter(col => supaColumns.includes(col));
          
          console.log(`\n${colors.bright}Comparação de Colunas:${colors.reset}`);
          console.log(`${colors.blue}Total de colunas PostgreSQL: ${pgColumns.length}${colors.reset}`);
          console.log(`${colors.blue}Total de colunas Supabase: ${supaColumns.length}${colors.reset}`);
          console.log(`${colors.blue}Colunas em comum: ${commonColumns.length}${colors.reset}`);
          
          if (pgOnlyColumns.length > 0) {
            console.log(`\n${colors.yellow}Colunas apenas no PostgreSQL:${colors.reset}`);
            pgOnlyColumns.forEach(col => console.log(`  - ${col}`));
          }
          
          if (supaOnlyColumns.length > 0) {
            console.log(`\n${colors.magenta}Colunas apenas no Supabase:${colors.reset}`);
            supaOnlyColumns.forEach(col => console.log(`  - ${col}`));
          }
          
          // Calcular porcentagem de sincronização
          const syncPercent = (commonColumns.length / 
                              Math.max(pgColumns.length, supaColumns.length)) * 100;
          
          if (syncPercent === 100) {
            console.log(`\n${colors.green}✓ As estruturas estão 100% sincronizadas${colors.reset}`);
          } else {
            console.log(`\n${colors.yellow}⚠ As estruturas estão ${syncPercent.toFixed(1)}% sincronizadas${colors.reset}`);
          }
        }
      }
      
      // Verificar se há dados em ambos os bancos
      const { count: supaCount, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`${colors.red}✗ Erro ao contar registros no Supabase: ${countError.message}${colors.reset}`);
      } else {
        // Contar registros no PostgreSQL
        const pgCountResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        const pgCount = parseInt(pgCountResult.rows[0].count);
        
        console.log(`\n${colors.bright}Contagem de Registros:${colors.reset}`);
        console.log(`${colors.blue}Registros no PostgreSQL: ${pgCount}${colors.reset}`);
        console.log(`${colors.blue}Registros no Supabase: ${supaCount || 0}${colors.reset}`);
        
        if (pgCount > 0 && (supaCount || 0) === 0) {
          console.log(`${colors.yellow}⚠ Há dados no PostgreSQL mas não no Supabase${colors.reset}`);
        } else if (pgCount === 0 && (supaCount || 0) > 0) {
          console.log(`${colors.yellow}⚠ Há dados no Supabase mas não no PostgreSQL${colors.reset}`);
        } else if (pgCount === (supaCount || 0)) {
          console.log(`${colors.green}✓ Mesmo número de registros em ambos os bancos${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠ Número diferente de registros entre os bancos${colors.reset}`);
        }
      }
      
      console.log(`\n${colors.dim}-------------------------------------------------------${colors.reset}`);
    }
    
    // Resumo final e recomendações
    console.log(`\n${colors.bright}${colors.bgBlue} RESUMO E RECOMENDAÇÕES ${colors.reset}\n`);
    console.log(`${colors.bright}Com base na análise das tabelas comuns, recomenda-se:${colors.reset}`);
    console.log(`${colors.blue}1. Sincronizar os esquemas das tabelas para garantir a mesma estrutura${colors.reset}`);
    console.log(`${colors.blue}2. Verificar registros desalinhados para garantir dados consistentes${colors.reset}`);
    console.log(`${colors.blue}3. Para tabelas críticas, implementar sincronização bidirecional${colors.reset}`);
    console.log(`${colors.blue}4. Considerar usar triggers de banco de dados para sincronização automática${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.bgRed}${colors.bright} ERRO DURANTE A VERIFICAÇÃO ${colors.reset}`, error);
  } finally {
    await pool.end();
    console.log(`\n${colors.dim}Verificação concluída em: ${new Date().toLocaleString()}${colors.reset}`);
  }
}

// Executar o script
main().catch(console.error);