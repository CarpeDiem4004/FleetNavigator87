/**
 * Script para criar a tabela posto_remedios_abastecimentos no Supabase
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
  console.log('Iniciando criação da tabela posto_remedios_abastecimentos no Supabase...');
  
  try {
    // Criar tabela posto_remedios_abastecimentos se não existir
    console.log('Verificando/criando tabela posto_remedios_abastecimentos no Supabase...');
    
    const client = await supabasePool.connect();
    try {
      // Verificar se a tabela já existe
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'posto_remedios_abastecimentos'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('Criando tabela posto_remedios_abastecimentos...');
        await client.query(`
          CREATE TABLE posto_remedios_abastecimentos (
            id SERIAL PRIMARY KEY,
            placa VARCHAR(10) NOT NULL,
            km INTEGER NOT NULL,
            projeto VARCHAR(100) NOT NULL,
            motorista_nome VARCHAR(200) NOT NULL,
            motorista_rg VARCHAR(20) NOT NULL,
            tipo_combustivel VARCHAR(20) CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'alcool')),
            quantidade_litros NUMERIC(10,2),
            valor_total NUMERIC(10,2),
            lavagem BOOLEAN DEFAULT FALSE,
            tipo_lavagem VARCHAR(50),
            observacoes TEXT,
            data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            valor_litro NUMERIC(10,2),
            tipo_veiculo VARCHAR(20) CHECK (tipo_veiculo IN ('frota', 'agregado'))
          );
        `);
        console.log('Tabela posto_remedios_abastecimentos criada com sucesso!');
      } else {
        console.log('Tabela posto_remedios_abastecimentos já existe no Supabase.');
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