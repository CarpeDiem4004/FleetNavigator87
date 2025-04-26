/**
 * Script para verificar as tabelas relacionadas a pneus no Supabase
 * Compara com as tabelas locais do PostgreSQL para identificar diferenças
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as variáveis necessárias estão definidas
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não definidas.');
  console.error('Certifique-se de definir VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('Erro: Variável de ambiente DATABASE_URL não definida.');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço
console.log(`Conectando ao Supabase: ${supabaseUrl.substring(0, 20)}...`);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Conectar ao PostgreSQL local
const pool = new Pool({ connectionString: databaseUrl });

// Lista de tabelas relacionadas a pneus para verificar
const tabelasPneus = [
  'pneus_completo',
  'movimentacao_pneu',
  'solicitacoes_pneus',
  'montagem_pneus',
  'pneus_atividades',
  'modelos_pneu'
];

// Função para obter estrutura de uma tabela no PostgreSQL local
async function obterEstruturaPostgres(nomeTabela) {
  try {
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    const result = await pool.query(query, [nomeTabela]);
    return result.rows;
  } catch (error) {
    console.error(`Erro ao obter estrutura da tabela ${nomeTabela} no PostgreSQL:`, error);
    return null;
  }
}

// Função para verificar se uma tabela existe no Supabase
async function verificarTabelaSupabase(nomeTabela) {
  try {
    // Verificar se a tabela existe no Supabase
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Código para "Tabela não encontrada"
        return { existe: false, erro: null };
      }
      return { existe: false, erro: error };
    }
    
    return { existe: true, erro: null };
  } catch (error) {
    console.error(`Erro ao verificar tabela ${nomeTabela} no Supabase:`, error);
    return { existe: false, erro: error };
  }
}

// Função para obter estrutura de uma tabela no Supabase
async function obterEstruturaSupabase(nomeTabela) {
  try {
    // No Supabase, precisamos executar uma consulta SQL para obter a estrutura
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${nomeTabela}'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      if (error.message?.includes('function "exec_sql" does not exist')) {
        // Se a função exec_sql não estiver disponível, retornamos null
        console.warn(`Aviso: Função exec_sql não disponível no Supabase. Impossível obter estrutura detalhada.`);
        return null;
      }
      console.error(`Erro ao obter estrutura da tabela ${nomeTabela} no Supabase:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Erro ao obter estrutura da tabela ${nomeTabela} no Supabase:`, error);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🔍 Iniciando verificação de tabelas relacionadas a pneus no Supabase...\n');
  
  try {
    // Tabela de resultados
    const resultados = [];
    
    // Verificar cada tabela
    for (const tabela of tabelasPneus) {
      console.log(`\n📊 Verificando tabela: ${tabela}`);
      
      // Verificar no PostgreSQL local
      const estruturaPostgres = await obterEstruturaPostgres(tabela);
      const existePostgres = estruturaPostgres !== null && estruturaPostgres.length > 0;
      
      if (existePostgres) {
        console.log(`✅ Tabela ${tabela} existe no PostgreSQL local com ${estruturaPostgres.length} colunas.`);
      } else {
        console.log(`❌ Tabela ${tabela} não encontrada no PostgreSQL local.`);
      }
      
      // Verificar no Supabase
      const { existe: existeSupabase, erro } = await verificarTabelaSupabase(tabela);
      
      if (existeSupabase) {
        console.log(`✅ Tabela ${tabela} existe no Supabase.`);
        
        // Tentar obter estrutura detalhada do Supabase
        const estruturaSupabase = await obterEstruturaSupabase(tabela);
        
        if (estruturaSupabase) {
          console.log(`ℹ️ Estrutura no Supabase: ${estruturaSupabase.length} colunas.`);
          
          // Comparar estruturas
          if (existePostgres) {
            // Mapear colunas do PostgreSQL por nome
            const colunasPostgres = estruturaPostgres.reduce((acc, col) => {
              acc[col.column_name] = col;
              return acc;
            }, {});
            
            // Mapear colunas do Supabase por nome
            const colunasSupabase = estruturaSupabase.reduce((acc, col) => {
              acc[col.column_name] = col;
              return acc;
            }, {});
            
            // Identificar colunas faltando no Supabase
            const colunasFaltandoSupabase = estruturaPostgres
              .filter(col => !colunasSupabase[col.column_name])
              .map(col => col.column_name);
            
            // Identificar colunas faltando no PostgreSQL
            const colunasFaltandoPostgres = estruturaSupabase
              .filter(col => !colunasPostgres[col.column_name])
              .map(col => col.column_name);
            
            if (colunasFaltandoSupabase.length > 0) {
              console.log(`⚠️ Colunas faltando no Supabase: ${colunasFaltandoSupabase.join(', ')}`);
            }
            
            if (colunasFaltandoPostgres.length > 0) {
              console.log(`ℹ️ Colunas extras no Supabase: ${colunasFaltandoPostgres.join(', ')}`);
            }
            
            if (colunasFaltandoSupabase.length === 0 && colunasFaltandoPostgres.length === 0) {
              console.log(`✅ As estruturas são idênticas.`);
            }
          }
        } else {
          console.log(`⚠️ Não foi possível obter a estrutura detalhada da tabela no Supabase.`);
        }
      } else {
        console.log(`❌ Tabela ${tabela} não encontrada no Supabase.`);
        if (erro) {
          console.log(`   Erro: ${erro.message}`);
        }
      }
      
      // Adicionar resultado à tabela
      resultados.push({
        tabela,
        postgresLocal: existePostgres,
        supabase: existeSupabase,
        estruturaPostgres: existePostgres ? estruturaPostgres.length : 0,
        colunasFaltantes: []
      });
    }
    
    // Exibir resumo
    console.log('\n\n📋 Resumo da verificação:');
    console.log('------------------------');
    resultados.forEach(r => {
      console.log(`${r.tabela}: ${r.postgresLocal ? '✅' : '❌'} Local / ${r.supabase ? '✅' : '❌'} Supabase`);
    });
    
    // Identificar próximos passos
    const tabelasFaltandoSupabase = resultados.filter(r => r.postgresLocal && !r.supabase).map(r => r.tabela);
    
    if (tabelasFaltandoSupabase.length > 0) {
      console.log('\n⚠️ Tabelas que precisam ser criadas no Supabase:');
      tabelasFaltandoSupabase.forEach(t => console.log(`- ${t}`));
    } else {
      console.log('\n✅ Todas as tabelas de pneus existem no Supabase.');
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante a verificação:', error);
  } finally {
    // Fechar conexões
    pool.end();
    console.log('\n👋 Verificação concluída.');
  }
}

// Executar
main();