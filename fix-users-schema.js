/**
 * Script para corrigir o esquema da tabela 'users' adicionando quaisquer colunas faltantes
 * e sincronizando o esquema entre PostgreSQL e Supabase
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
console.log("Supabase Config:", {
  url: supabaseUrl,
  keyAvailable: !!supabaseServiceKey
});

// Conexão direta com PostgreSQL
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Verifica se a coluna existe na tabela
 */
async function columnExists(schema, table, column) {
  try {
    const result = await pgPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = $1
        AND table_name = $2
        AND column_name = $3
      ) AS exists
    `, [schema, table, column]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar existência da coluna ${column}:`, error);
    return false;
  }
}

/**
 * Adiciona a coluna à tabela se não existir
 */
async function addColumnIfNotExists(schema, table, column, dataType, defaultValue = null) {
  try {
    const exists = await columnExists(schema, table, column);
    
    if (!exists) {
      console.log(`Adicionando coluna '${column}' à tabela '${schema}.${table}'...`);
      
      let sql = `ALTER TABLE ${schema}.${table} ADD COLUMN ${column} ${dataType}`;
      
      if (defaultValue !== null) {
        sql += ` DEFAULT ${defaultValue}`;
      }
      
      await pgPool.query(sql);
      console.log(`Coluna '${column}' adicionada com sucesso.`);
      return true;
    } else {
      console.log(`Coluna '${column}' já existe na tabela '${schema}.${table}'.`);
      return false;
    }
  } catch (error) {
    console.error(`Erro ao adicionar coluna ${column}:`, error);
    return false;
  }
}

/**
 * Verifica o esquema atual da tabela 'users'
 */
async function checkUserTableSchema() {
  try {
    console.log("Verificando esquema da tabela 'users'...");
    
    // Verificar schema 'public' primeiro
    let schema = 'public';
    
    // Verificar se a tabela existe no schema 'public'
    const tableExistsResult = await pgPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${schema}'
        AND table_name = 'users'
      ) AS exists
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (!tableExists) {
      console.warn(`A tabela '${schema}.users' não existe!`);
      return;
    }
    
    // Obter todas as colunas atuais
    const columnsResult = await pgPool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = '${schema}'
      AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log("Colunas encontradas na tabela 'users':");
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})${col.column_default ? ' DEFAULT ' + col.column_default : ''}`);
    });
    
    // Adicionar colunas faltantes
    await addColumnIfNotExists(schema, 'users', 'basename', 'VARCHAR', 'NULL');
    await addColumnIfNotExists(schema, 'users', 'last_login', 'timestamp with time zone', 'NULL');
    
    // Verificar se a coluna 'role' está configurada corretamente
    const roleTypeQuery = await pgPool.query(`
      SELECT pg_get_expr(atttypmod, attrelid) AS enum_values
      FROM pg_attribute
      JOIN pg_class ON pg_class.oid = attrelid
      WHERE attname = 'role'
      AND relname = 'users'
      AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schema}')
    `);
    
    console.log("Tipo da coluna 'role':", roleTypeQuery.rows[0] ? roleTypeQuery.rows[0].enum_values : 'Não encontrado');
    
    // Verificar valores disponíveis para enum 'user_role'
    const enumValuesQuery = await pgPool.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role'
      ORDER BY e.enumsortorder
    `);
    
    console.log("Valores disponíveis para enum 'user_role':");
    enumValuesQuery.rows.forEach(value => {
      console.log(`- ${value.enumlabel}`);
    });
    
    // Verificar se 'gestor_frota' está entre os valores do enum
    const gestorFrotaExists = enumValuesQuery.rows.some(row => row.enumlabel === 'gestor_frota');
    
    if (!gestorFrotaExists) {
      console.log("Valor 'gestor_frota' não existe no enum 'user_role'. Tentando adicionar...");
      try {
        await pgPool.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestor_frota'`);
        console.log("Valor 'gestor_frota' adicionado com sucesso ao enum 'user_role'.");
      } catch (enumError) {
        console.error("Erro ao adicionar valor ao enum:", enumError);
      }
    } else {
      console.log("Valor 'gestor_frota' já existe no enum 'user_role'.");
    }
    
  } catch (error) {
    console.error("Erro ao verificar esquema da tabela 'users':", error);
  }
}

/**
 * Sincroniza o esquema com o Supabase
 */
async function syncSchemaWithSupabase() {
  try {
    console.log("\nSincronizando esquema com Supabase...");
    
    // Tente executar uma consulta para verificar a estrutura da tabela
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error("Erro ao acessar tabela 'users' no Supabase:", error);
      return;
    }
    
    console.log("Conexão com tabela 'users' no Supabase estabelecida com sucesso.");
    
    // Atualizar definição da tabela no Supabase
    try {
      const { error: rpcError } = await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE IF EXISTS users
          ADD COLUMN IF NOT EXISTS basename VARCHAR DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL
        `
      });
      
      if (rpcError) {
        console.error("Erro ao atualizar esquema no Supabase via RPC:", rpcError);
      } else {
        console.log("Esquema atualizado no Supabase via RPC.");
      }
    } catch (rpcError) {
      console.error("Erro ao chamar RPC para atualizar esquema:", rpcError);
    }
    
  } catch (error) {
    console.error("Erro ao sincronizar esquema com Supabase:", error);
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    await checkUserTableSchema();
    await syncSchemaWithSupabase();
    
    console.log("\nVerificação e sincronização de esquema concluídas.");
  } catch (error) {
    console.error("Erro na execução principal:", error);
  } finally {
    pgPool.end();
  }
}

main();