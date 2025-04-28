/**
 * Script para criar a tabela users no Supabase
 * Baseado na estrutura do PostgreSQL local
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Credenciais do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Conexão direta ao banco Supabase via PostgreSQL
const supabasePool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Iniciando criação da tabela users no Supabase...');
  
  try {
    // Verificar se o enum user_role já existe no Supabase
    console.log('Verificando se o enum user_role existe no Supabase...');
    
    const { data: enumExists, error: enumError } = await supabase.rpc('pg_type_exists', { 
      type_name: 'user_role'
    });
    
    console.log('Resultado da verificação:', enumExists);
    
    if (enumError) {
      console.log('Erro ao verificar enum:', enumError);
      
      // Usando conexão direta para verificar
      const client = await supabasePool.connect();
      try {
        const enumCheck = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'user_role'
          );
        `);
        
        if (!enumCheck.rows[0].exists) {
          console.log('Criando enum user_role no Supabase...');
          await client.query(`
            CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'operador', 'oficina', 'pneus', 'posto');
          `);
          console.log('Enum user_role criado com sucesso!');
        } else {
          console.log('Enum user_role já existe no Supabase.');
        }
      } finally {
        client.release();
      }
    }
    
    // Criar tabela users se não existir
    console.log('Criando tabela users no Supabase...');
    
    const client = await supabasePool.connect();
    try {
      // Verificar se a tabela já existe
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('Criando tabela users...');
        await client.query(`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role user_role NOT NULL,
            base_id INTEGER REFERENCES bases(id),
            basename VARCHAR(255),
            oficina_id INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Tabela users criada com sucesso!');
      } else {
        console.log('Tabela users já existe no Supabase.');
      }
    } finally {
      client.release();
    }
    
    console.log('Processo concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo:', error);
  }
}

main();