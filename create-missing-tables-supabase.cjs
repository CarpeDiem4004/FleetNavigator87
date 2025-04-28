/**
 * Script para criar todas as tabelas que faltam no Supabase
 * Este script executa a criação das tabelas na ordem correta de dependências
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Credenciais do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔑 Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'não definido');
console.log('🔑 Supabase Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 5)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 5)}` : 'não definida');

// Conexão direta ao banco Supabase via PostgreSQL
// IMPORTANTE: Para o Supabase, precisamos usar a string de conexão específica do Supabase
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
console.log('🔌 Usando string de conexão:', connectionString ? 'Definida' : 'Não definida');

const supabasePool = new Pool({
  connectionString: connectionString,
});

async function createUserRoleEnum(client) {
  console.log('Verificando se o enum user_role existe...');
  
  const enumCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'user_role'
    );
  `);
  
  if (!enumCheck.rows[0].exists) {
    console.log('Criando enum user_role...');
    await client.query(`
      CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'operador', 'oficina', 'pneus', 'posto');
    `);
    console.log('Enum user_role criado com sucesso!');
    return true;
  } else {
    console.log('Enum user_role já existe.');
    return false;
  }
}

async function createWorkshopsTable(client) {
  console.log('Verificando se a tabela workshops existe...');
  
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
    return true;
  } else {
    console.log('Tabela workshops já existe.');
    return false;
  }
}

async function createUsersTable(client) {
  console.log('Verificando se a tabela users existe...');
  
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
        oficina_id INTEGER REFERENCES workshops(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela users criada com sucesso!');
    return true;
  } else {
    console.log('Tabela users já existe.');
    return false;
  }
}

async function createPostoRemediosAbastecimentosTable(client) {
  console.log('Verificando se a tabela posto_remedios_abastecimentos existe...');
  
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
    return true;
  } else {
    console.log('Tabela posto_remedios_abastecimentos já existe.');
    return false;
  }
}

async function main() {
  console.log('Iniciando criação das tabelas que faltam no Supabase...');
  
  try {
    const client = await supabasePool.connect();
    try {
      // Criação das tabelas em ordem de dependência
      await createUserRoleEnum(client);
      await createWorkshopsTable(client);
      await createUsersTable(client);
      await createPostoRemediosAbastecimentosTable(client);
      
      console.log('Todas as tabelas foram verificadas/criadas com sucesso!');
    } finally {
      client.release();
    }
    
    console.log('Processo concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo:', error);
  }
}

main();