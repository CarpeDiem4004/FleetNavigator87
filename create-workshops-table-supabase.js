/**
 * Script para criar a tabela workshops no Supabase
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
  console.log('Iniciando criação da tabela workshops no Supabase...');
  
  try {
    // Criar tabela workshops se não existir
    console.log('Verificando/criando tabela workshops no Supabase...');
    
    const client = await supabasePool.connect();
    try {
      // Verificar se a tabela já existe
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'workshops'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('Criando tabela workshops...');
        await client.query(`
          CREATE TABLE workshops (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            contact_person TEXT,
            is_specialized BOOLEAN DEFAULT FALSE,
            specialties TEXT,
            observations TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Tabela workshops criada com sucesso!');
      } else {
        console.log('Tabela workshops já existe no Supabase.');
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