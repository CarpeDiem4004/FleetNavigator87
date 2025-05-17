/**
 * Script para adicionar o papel "gestor_frota" ao enum user_role se ainda não existir.
 * 
 * Este script verifica se o valor já existe no enum e o adiciona se necessário.
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
 * Verifica se o valor já existe no enum user_role
 */
async function checkEnumValueExists() {
  try {
    console.log("Verificando se o valor 'gestor_frota' já existe no enum user_role...");
    
    // Método 1: Verificar direto no PostgreSQL
    try {
      const pgResult = await pgPool.query(`
        SELECT e.enumlabel
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_role'
          AND e.enumlabel = 'gestor_frota'
      `);
      
      if (pgResult.rows.length > 0) {
        console.log("Valor 'gestor_frota' já existe no enum user_role (verificado via PG)");
        return true;
      }
    } catch (pgError) {
      console.error("Erro ao verificar enum via PostgreSQL:", pgError);
    }
    
    // Método 2: Testar inserção no Supabase
    try {
      const tempUserName = `test_gestor_frota_${Date.now()}`;
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: tempUserName,
          email: `${tempUserName}@test.com`,
          password: 'test_password',
          role: 'gestor_frota'
        })
        .select()
        .limit(1);
      
      if (data && data.length > 0) {
        console.log("Valor 'gestor_frota' já existe no enum user_role (verificado via inserção)");
        // Limpar usuário de teste
        await supabase.from('users').delete().eq('email', `${tempUserName}@test.com`);
        return true;
      }
      
      if (error) {
        // Se o erro não for relacionado ao enum, pode ser que o enum já exista
        if (!error.message.includes("invalid input value for enum user_role")) {
          console.log("Erro não relacionado ao enum, assumindo que 'gestor_frota' já existe");
          return true;
        }
      }
    } catch (supabaseError) {
      console.error("Erro ao verificar enum via Supabase:", supabaseError);
    }
    
    console.log("Valor 'gestor_frota' não encontrado no enum user_role");
    return false;
  } catch (error) {
    console.error("Erro ao verificar existência do valor no enum:", error);
    return false;
  }
}

/**
 * Adiciona o valor 'gestor_frota' ao enum user_role
 */
async function addEnumValue() {
  try {
    console.log("Adicionando valor 'gestor_frota' ao enum user_role...");
    
    // Método 1: Adicionar via PostgreSQL
    try {
      await pgPool.query(`
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestor_frota'
      `);
      console.log("Valor 'gestor_frota' adicionado ao enum user_role via PostgreSQL");
      return true;
    } catch (pgError) {
      console.error("Erro ao adicionar valor via PostgreSQL:", pgError);
      
      // Tentar método alternativo se o primeiro falhar
      try {
        await pgPool.query(`
          ALTER TYPE user_role ADD VALUE 'gestor_frota'
        `);
        console.log("Valor 'gestor_frota' adicionado ao enum user_role via PostgreSQL (método alternativo)");
        return true;
      } catch (pgError2) {
        console.error("Erro ao adicionar valor via PostgreSQL (método alternativo):", pgError2);
      }
    }
    
    // Método 2: Adicionar via SQL direto no Supabase
    try {
      const { error } = await supabase.rpc('add_enum_value', {
        enum_type: 'user_role',
        enum_value: 'gestor_frota'
      });
      
      if (!error) {
        console.log("Valor 'gestor_frota' adicionado ao enum user_role via função RPC do Supabase");
        return true;
      } else {
        console.error("Erro ao adicionar valor via função RPC:", error);
      }
    } catch (supabaseError) {
      console.error("Erro ao adicionar valor via Supabase:", supabaseError);
    }
    
    // Método 3: Executar SQL raw no Supabase
    try {
      const { error } = await supabase.rpc('execute_sql', {
        sql: "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestor_frota'"
      });
      
      if (!error) {
        console.log("Valor 'gestor_frota' adicionado ao enum user_role via SQL raw no Supabase");
        return true;
      } else {
        console.error("Erro ao adicionar valor via SQL raw:", error);
      }
    } catch (rawSqlError) {
      console.error("Erro ao executar SQL raw no Supabase:", rawSqlError);
    }
    
    console.error("Não foi possível adicionar o valor 'gestor_frota' ao enum user_role por nenhum método");
    return false;
  } catch (error) {
    console.error("Erro geral ao adicionar valor ao enum:", error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    const valueExists = await checkEnumValueExists();
    
    if (!valueExists) {
      const success = await addEnumValue();
      if (success) {
        console.log("Valor 'gestor_frota' adicionado com sucesso ao enum user_role");
      } else {
        console.error("Falha ao adicionar 'gestor_frota' ao enum user_role");
      }
    } else {
      console.log("Valor 'gestor_frota' já existe no enum user_role, nenhuma ação necessária");
    }
  } catch (error) {
    console.error("Erro na execução principal:", error);
  } finally {
    pgPool.end();
  }
}

main();