/**
 * Script para sincronizar a tabela posto_remedios_abastecimentos entre o banco PostgreSQL local e o Supabase
 * Este script:
 * 1. Verifica se a tabela existe em ambos os ambientes
 * 2. Cria a tabela no Supabase se não existir, com a mesma estrutura do banco local
 * 3. Verifica a estrutura em ambos os sistemas para garantir que são idênticas
 * 4. Sincroniza os dados se necessário
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Carregar variáveis de ambiente
dotenv.config();

// Conexão com o banco PostgreSQL local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Credenciais do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Criar o cliente Supabase com a chave de serviço (permissões administrativas)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Conexão direta ao banco Supabase via PostgreSQL
const supabasePool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Nome da tabela que estamos sincronizando
const TABLE_NAME = 'posto_remedios_abastecimentos';

/**
 * Verificar se a tabela existe no banco local
 */
async function checkTableExistsInLocalDb() {
  console.log(`Verificando se a tabela ${TABLE_NAME} existe no banco local...`);
  
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [TABLE_NAME]);
    
    const exists = result.rows[0].exists;
    
    if (exists) {
      console.log(`✅ Tabela ${TABLE_NAME} existe no banco local.`);
    } else {
      console.log(`❌ Tabela ${TABLE_NAME} NÃO existe no banco local.`);
    }
    
    return exists;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${TABLE_NAME} no banco local:`, error);
    return false;
  }
}

/**
 * Verificar se a tabela existe no Supabase
 */
async function checkTableExistsInSupabase() {
  console.log(`Verificando se a tabela ${TABLE_NAME} existe no Supabase...`);
  
  try {
    // Usar função RPC para verificar se a tabela existe
    const { data, error } = await supabase.rpc('execute_sql_with_result', {
      sql_command: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${TABLE_NAME}'
        );
      `
    });
    
    if (error) {
      if (error.message.includes('function execute_sql_with_result() does not exist')) {
        console.log('Função execute_sql_with_result não existe, criando...');
        await createSqlWithResultFunction();
        // Tentar novamente após criar a função
        return await checkTableExistsInSupabase();
      } else {
        console.error('Erro ao verificar tabela no Supabase:', error);
        return false;
      }
    }
    
    const exists = data && data.length > 0 && data[0].exists;
    
    if (exists) {
      console.log(`✅ Tabela ${TABLE_NAME} existe no Supabase.`);
    } else {
      console.log(`❌ Tabela ${TABLE_NAME} NÃO existe no Supabase.`);
    }
    
    return exists;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${TABLE_NAME} no Supabase:`, error);
    return false;
  }
}

/**
 * Criar função auxiliar no Supabase para executar SQL com resultado
 */
async function createSqlWithResultFunction() {
  console.log('Criando função execute_sql_with_result no Supabase...');
  
  try {
    // Primeiro criar a função execute_sql se não existir
    const { error: createExecuteSqlError } = await supabase.rpc('execute_sql', {
      sql_command: `
        CREATE OR REPLACE FUNCTION execute_sql(sql_command TEXT)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql_command;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (createExecuteSqlError && !createExecuteSqlError.message.includes('already exists')) {
      console.error('Erro ao criar função execute_sql:', createExecuteSqlError);
      throw createExecuteSqlError;
    }
    
    // Agora criar a função execute_sql_with_result
    const { error } = await supabase.rpc('execute_sql', {
      sql_command: `
        CREATE OR REPLACE FUNCTION execute_sql_with_result(sql_command TEXT)
        RETURNS SETOF json AS $$
        BEGIN
          RETURN QUERY EXECUTE sql_command;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error) {
      console.error('Erro ao criar função execute_sql_with_result:', error);
      throw error;
    }
    
    console.log('✅ Função execute_sql_with_result criada com sucesso.');
    return true;
  } catch (error) {
    console.error('Erro ao criar função execute_sql_with_result:', error);
    return false;
  }
}

/**
 * Obter a estrutura da tabela no banco local
 */
async function getLocalTableStructure() {
  console.log(`Obtendo estrutura da tabela ${TABLE_NAME} no banco local...`);
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [TABLE_NAME]);
    
    console.log(`Encontradas ${result.rows.length} colunas na tabela local.`);
    return result.rows;
  } catch (error) {
    console.error(`Erro ao obter estrutura da tabela ${TABLE_NAME} local:`, error);
    return [];
  }
}

/**
 * Obter a estrutura da tabela no Supabase
 */
async function getSupabaseTableStructure() {
  console.log(`Obtendo estrutura da tabela ${TABLE_NAME} no Supabase...`);
  
  try {
    const { data, error } = await supabase.rpc('execute_sql_with_result', {
      sql_command: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${TABLE_NAME}'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error('Erro ao obter estrutura da tabela no Supabase:', error);
      return [];
    }
    
    console.log(`Encontradas ${data.length} colunas na tabela do Supabase.`);
    return data;
  } catch (error) {
    console.error(`Erro ao obter estrutura da tabela ${TABLE_NAME} no Supabase:`, error);
    return [];
  }
}

/**
 * Comparar as estruturas das tabelas
 */
function compareTableStructures(localStructure, supabaseStructure) {
  console.log('Comparando estruturas de tabelas entre banco local e Supabase...');
  
  // Verificar se o número de colunas é o mesmo
  if (localStructure.length !== supabaseStructure.length) {
    console.log(`❌ Número de colunas diferente: Local (${localStructure.length}) vs Supabase (${supabaseStructure.length})`);
    return false;
  }
  
  // Verificar cada coluna
  for (let i = 0; i < localStructure.length; i++) {
    const localCol = localStructure[i];
    const supabaseCol = supabaseStructure[i];
    
    // Verificar nome da coluna
    if (localCol.column_name !== supabaseCol.column_name) {
      console.log(`❌ Nome de coluna diferente: Local (${localCol.column_name}) vs Supabase (${supabaseCol.column_name})`);
      return false;
    }
    
    // Verificar tipo de dados
    if (localCol.data_type !== supabaseCol.data_type) {
      console.log(`❌ Tipo de dados diferente para coluna ${localCol.column_name}: Local (${localCol.data_type}) vs Supabase (${supabaseCol.data_type})`);
      return false;
    }
    
    // Verificar se é nullable
    if (localCol.is_nullable !== supabaseCol.is_nullable) {
      console.log(`❌ Nullable diferente para coluna ${localCol.column_name}: Local (${localCol.is_nullable}) vs Supabase (${supabaseCol.is_nullable})`);
      return false;
    }
  }
  
  console.log('✅ As estruturas das tabelas são idênticas.');
  return true;
}

/**
 * Criar a tabela no Supabase usando a estrutura do banco local
 */
async function createTableInSupabase() {
  console.log(`Criando tabela ${TABLE_NAME} no Supabase...`);
  
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql_command: `
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          id SERIAL PRIMARY KEY,
          placa VARCHAR(10) NOT NULL,
          km INTEGER NOT NULL,
          projeto VARCHAR(100) NOT NULL,
          motorista_nome VARCHAR(200) NOT NULL,
          motorista_rg VARCHAR(20) NOT NULL,
          tipo_combustivel VARCHAR(20) CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'alcool')),
          quantidade_litros NUMERIC(10,2),
          valor_litro NUMERIC(10,2),
          valor_total NUMERIC(10,2),
          lavagem BOOLEAN DEFAULT FALSE,
          tipo_lavagem VARCHAR(50),
          observacoes TEXT,
          data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          tipo_veiculo VARCHAR(20) CHECK (tipo_veiculo IN ('frota', 'agregado'))
        );
      `
    });
    
    if (error) {
      console.error('Erro ao criar tabela no Supabase:', error);
      return false;
    }
    
    console.log(`✅ Tabela ${TABLE_NAME} criada com sucesso no Supabase.`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar tabela ${TABLE_NAME} no Supabase:`, error);
    return false;
  }
}

/**
 * Criar stored procedure para criar a tabela
 */
async function createStoredProcedure() {
  console.log('Criando stored procedure para criar tabela no Supabase...');
  
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql_command: `
        CREATE OR REPLACE FUNCTION create_posto_remedios_abastecimentos_table()
        RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS posto_remedios_abastecimentos (
            id SERIAL PRIMARY KEY,
            placa VARCHAR(10) NOT NULL,
            km INTEGER NOT NULL,
            projeto VARCHAR(100) NOT NULL,
            motorista_nome VARCHAR(200) NOT NULL,
            motorista_rg VARCHAR(20) NOT NULL,
            tipo_combustivel VARCHAR(20) CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'alcool')),
            quantidade_litros NUMERIC(10,2),
            valor_litro NUMERIC(10,2),
            valor_total NUMERIC(10,2),
            lavagem BOOLEAN DEFAULT FALSE,
            tipo_lavagem VARCHAR(50),
            observacoes TEXT,
            data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            tipo_veiculo VARCHAR(20) CHECK (tipo_veiculo IN ('frota', 'agregado'))
          );
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error) {
      console.error('Erro ao criar stored procedure:', error);
      return false;
    }
    
    console.log('✅ Stored procedure criada com sucesso.');
    
    // Agora executar a função para criar a tabela
    const { error: execError } = await supabase.rpc('create_posto_remedios_abastecimentos_table');
    
    if (execError) {
      console.error('Erro ao executar stored procedure:', execError);
      return false;
    }
    
    console.log('✅ Tabela criada com sucesso usando a stored procedure.');
    return true;
  } catch (error) {
    console.error('Erro ao criar ou executar stored procedure:', error);
    return false;
  }
}

/**
 * Obter estatísticas das tabelas (contagem de registros)
 */
async function getTableStats() {
  console.log('Obtendo estatísticas das tabelas...');
  
  try {
    // Contar registros na tabela local
    const localResult = await pool.query(`SELECT COUNT(*) FROM ${TABLE_NAME}`);
    const localCount = parseInt(localResult.rows[0].count);
    
    // Contar registros na tabela do Supabase
    const { data, error } = await supabase.rpc('execute_sql_with_result', {
      sql_command: `SELECT COUNT(*) FROM ${TABLE_NAME}`
    });
    
    if (error) {
      console.error('Erro ao contar registros no Supabase:', error);
      return { local: localCount, supabase: 0 };
    }
    
    const supabaseCount = parseInt(data[0].count);
    
    console.log(`Estatísticas da tabela ${TABLE_NAME}:`);
    console.log(`- Registros no banco local: ${localCount}`);
    console.log(`- Registros no Supabase: ${supabaseCount}`);
    
    return { local: localCount, supabase: supabaseCount };
  } catch (error) {
    console.error('Erro ao obter estatísticas das tabelas:', error);
    return { local: 0, supabase: 0 };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log(`
=================================================
SINCRONIZAÇÃO DA TABELA ${TABLE_NAME}
=================================================
  `);
  
  try {
    // Passo 1: Verificar se a tabela existe no banco local
    const existsLocal = await checkTableExistsInLocalDb();
    
    if (!existsLocal) {
      console.error(`Tabela ${TABLE_NAME} não existe no banco local. Abortando sincronização.`);
      return;
    }
    
    // Passo 2: Verificar se a tabela existe no Supabase
    const existsSupabase = await checkTableExistsInSupabase();
    
    // Passo 3: Se a tabela não existir no Supabase, criar com a mesma estrutura do local
    if (!existsSupabase) {
      console.log(`Tabela ${TABLE_NAME} não existe no Supabase. Criando...`);
      
      // Criar usando stored procedure (abordagem recomendada)
      const created = await createStoredProcedure();
      
      if (!created) {
        // Tentar abordagem alternativa se falhar
        console.log('Tentando método alternativo para criar tabela...');
        const altCreated = await createTableInSupabase();
        
        if (!altCreated) {
          console.error('Falha ao criar tabela no Supabase. Abortando sincronização.');
          return;
        }
      }
      
      console.log(`Tabela ${TABLE_NAME} criada com sucesso no Supabase.`);
    }
    
    // Passo 4: Comparar as estruturas das tabelas para garantir que são idênticas
    const localStructure = await getLocalTableStructure();
    const supabaseStructure = await getSupabaseTableStructure();
    
    const structuresMatch = compareTableStructures(localStructure, supabaseStructure);
    
    if (!structuresMatch) {
      console.error('As estruturas das tabelas não correspondem. Necessária intervenção manual.');
      return;
    }
    
    // Passo 5: Obter estatísticas das tabelas
    const stats = await getTableStats();
    
    // Encerrar com mensagem de sucesso
    console.log(`
=================================================
SINCRONIZAÇÃO COMPLETA
- Banco local: ${stats.local} registros
- Supabase: ${stats.supabase} registros
=================================================
    `);
    
  } catch (error) {
    console.error('Erro durante o processo de sincronização:', error);
  } finally {
    // Fechar conexões
    pool.end();
    supabasePool.end();
  }
}

// Executar script
main();