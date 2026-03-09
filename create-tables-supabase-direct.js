import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não foram encontradas nas variáveis de ambiente');
  process.exit(1);
}

console.log('🔑 Usando Supabase URL:', supabaseUrl.substring(0, 10) + '...');
console.log('🔑 Usando Supabase Service Key:', supabaseServiceKey.substring(0, 5) + '...' + supabaseServiceKey.substring(supabaseServiceKey.length - 5));

// Criar cliente Supabase com chave de serviço
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserRoleEnum() {
  console.log('🔹 Criando enum user_role...');
  const { error } = await supabase.rpc('create_user_role_enum');
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Enum user_role já existe');
      return true;
    } else {
      console.error('❌ Erro ao criar enum user_role:', error.message);
      return false;
    }
  }
  
  console.log('✅ Enum user_role criado com sucesso');
  return true;
}

async function createWorkshopsTable() {
  console.log('🔹 Criando tabela workshops...');
  
  const { error } = await supabase.rpc('create_workshops_table');
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Tabela workshops já existe');
      return true;
    } else {
      console.error('❌ Erro ao criar tabela workshops:', error.message);
      return false;
    }
  }
  
  console.log('✅ Tabela workshops criada com sucesso');
  return true;
}

async function createUsersTable() {
  console.log('🔹 Criando tabela users...');
  
  const { error } = await supabase.rpc('create_users_table');
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Tabela users já existe');
      return true;
    } else {
      console.error('❌ Erro ao criar tabela users:', error.message);
      return false;
    }
  }
  
  console.log('✅ Tabela users criada com sucesso');
  return true;
}

async function createPostoRemediosAbastecimentosTable() {
  console.log('🔹 Criando tabela posto_remedios_abastecimentos...');
  
  const { error } = await supabase.rpc('create_posto_remedios_abastecimentos_table');
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Tabela posto_remedios_abastecimentos já existe');
      return true;
    } else {
      console.error('❌ Erro ao criar tabela posto_remedios_abastecimentos:', error.message);
      return false;
    }
  }
  
  console.log('✅ Tabela posto_remedios_abastecimentos criada com sucesso');
  return true;
}

async function createOficinasTable() {
  console.log('🔹 Criando tabela oficinas...');
  
  const { error } = await supabase.rpc('create_oficinas_table');
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Tabela oficinas já existe');
      return true;
    } else {
      console.error('❌ Erro ao criar tabela oficinas:', error.message);
      return false;
    }
  }
  
  console.log('✅ Tabela oficinas criada com sucesso');
  return true;
}

async function setupStoredProcedures() {
  console.log('🔹 Configurando stored procedures para criação de tabelas...');
  
  // Stored procedure para criar o enum user_role
  const createUserRoleEnumResult = await supabase.rpc('execute_sql', {
    sql_command: `
      CREATE OR REPLACE FUNCTION create_user_role_enum()
      RETURNS void AS $$
      BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'operador', 'oficina', 'pneus', 'posto');
        EXCEPTION WHEN duplicate_object THEN
          NULL;
      END;
      $$ LANGUAGE plpgsql;
    `
  });
  
  if (createUserRoleEnumResult.error) {
    console.error('❌ Erro ao criar stored procedure para enum user_role:', createUserRoleEnumResult.error.message);
    return false;
  }
  
  // Stored procedure para criar a tabela workshops
  const createWorkshopsTableResult = await supabase.rpc('execute_sql', {
    sql_command: `
      CREATE OR REPLACE FUNCTION create_workshops_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS workshops (
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
      END;
      $$ LANGUAGE plpgsql;
    `
  });
  
  if (createWorkshopsTableResult.error) {
    console.error('❌ Erro ao criar stored procedure para workshops:', createWorkshopsTableResult.error.message);
    return false;
  }
  
  // Stored procedure para criar a tabela users
  const createUsersTableResult = await supabase.rpc('execute_sql', {
    sql_command: `
      CREATE OR REPLACE FUNCTION create_users_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role user_role NOT NULL,
          base_id INTEGER REFERENCES bases(id),
          basename VARCHAR(255),
          oficina_id INTEGER,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      END;
      $$ LANGUAGE plpgsql;
    `
  });
  
  if (createUsersTableResult.error) {
    console.error('❌ Erro ao criar stored procedure para users:', createUsersTableResult.error.message);
    return false;
  }
  
  // Stored procedure para criar a tabela posto_remedios_abastecimentos
  const createPostoRemediosTableResult = await supabase.rpc('execute_sql', {
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
      END;
      $$ LANGUAGE plpgsql;
    `
  });
  
  if (createPostoRemediosTableResult.error) {
    console.error('❌ Erro ao criar stored procedure para posto_remedios_abastecimentos:', createPostoRemediosTableResult.error.message);
    return false;
  }
  
  // Stored procedure para criar a tabela oficinas
  const createOficinasTableResult = await supabase.rpc('execute_sql', {
    sql_command: `
      CREATE OR REPLACE FUNCTION create_oficinas_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS oficinas (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          endereco TEXT,
          telefone TEXT,
          contato TEXT,
          especializada BOOLEAN DEFAULT FALSE,
          especialidades TEXT,
          observacoes TEXT,
          ativa BOOLEAN DEFAULT TRUE,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      END;
      $$ LANGUAGE plpgsql;
    `
  });
  
  if (createOficinasTableResult.error) {
    console.error('❌ Erro ao criar stored procedure para oficinas:', createOficinasTableResult.error.message);
    return false;
  }
  
  console.log('✅ Stored procedures criados com sucesso');
  return true;
}

async function executeRawSQL(sqlCommand, description) {
  console.log(`🔹 Executando SQL: ${description}...`);
  
  const { error } = await supabase.rpc('execute_sql', {
    sql_command: sqlCommand
  });
  
  if (error) {
    console.error(`❌ Erro ao executar SQL (${description}):`, error.message);
    return false;
  }
  
  console.log(`✅ SQL executado com sucesso: ${description}`);
  return true;
}

async function main() {
  console.log('🔄 Iniciando criação de tabelas no Supabase...');
  
  // Criar stored procedure auxiliar para executar SQL diretamente
  await executeRawSQL(`
    CREATE OR REPLACE FUNCTION execute_sql(sql_command TEXT)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_command;
    END;
    $$ LANGUAGE plpgsql;
  `, 'criar função auxiliar execute_sql');
  
  // Configurar stored procedures para criar as tabelas
  await setupStoredProcedures();
  
  // Criar tabelas em ordem de dependência
  await createUserRoleEnum();
  await createWorkshopsTable();
  await createUsersTable();
  await createPostoRemediosAbastecimentosTable();
  await createOficinasTable();
  
  console.log('✅ Processo concluído com sucesso!');
}

main();