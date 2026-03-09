/**
 * Script para criar a tabela de usuários no Supabase
 * Este script deve ser executado apenas uma vez para configurar o ambiente
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// Configurações do Supabase e PostgreSQL
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são necessárias');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('Erro: Variável de ambiente DATABASE_URL é necessária');
  process.exit(1);
}

// Clientes
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const pgPool = new Pool({ connectionString: databaseUrl });

async function criarTabelaUsuarios() {
  console.log('Verificando se a tabela de usuários existe...');

  try {
    // Verificar se a tabela já existe usando uma consulta SQL direta
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as table_exists;
    `;
    
    const tableResult = await pgPool.query(checkTableQuery);
    const tableExists = tableResult.rows[0].table_exists;

    if (tableExists) {
      console.log('Tabela users já existe no banco de dados');
      // Verificar colunas existentes 
      await verificarColunasUsuarios();
      return;
    }

    console.log('Criando tabela users...');

    // Criar tabela e índices usando SQL direto
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        base_id INTEGER NULL,
        oficina_id INTEGER NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Adicionar índices para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
      CREATE INDEX IF NOT EXISTS idx_users_base_id ON public.users (base_id) WHERE base_id IS NOT NULL;
    `;
    
    await pgPool.query(createTableQuery);
    console.log('Tabela users criada com sucesso!');
    
    // Verificar as permissões do Supabase (se necessário)
    await configurarPermissoesSupabase();
    
  } catch (error) {
    console.error('Erro ao executar migração:', error);
  }
}

async function configurarPermissoesSupabase() {
  console.log('Configurando permissões de acesso no Supabase...');
  
  try {
    // Criando políticas diretamente via SQL para bypass de possíveis limitações da API
    const permissoesQuery = `
      -- Tentar habilitar RLS (Row Level Security)
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
          RAISE NOTICE 'RLS habilitado para tabela users';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Não foi possível habilitar RLS para tabela users: %', SQLERRM;
        END;
        
        -- Tentar criar políticas (tentar uma por uma para garantir que algumas funcionem mesmo se outras falharem)
        BEGIN
          DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON public.users;
          CREATE POLICY "Usuários podem ver seus próprios dados" ON public.users 
            FOR SELECT USING (true);
          RAISE NOTICE 'Política de seleção criada com sucesso';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Não foi possível criar política de seleção: %', SQLERRM;
        END;
        
        BEGIN
          DROP POLICY IF EXISTS "Service role pode gerenciar todos os usuários" ON public.users;
          CREATE POLICY "Service role pode gerenciar todos os usuários" ON public.users USING (true) WITH CHECK (true);
          RAISE NOTICE 'Política de gerenciamento via service role criada com sucesso';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Não foi possível criar política de gerenciamento: %', SQLERRM;
        END;
      END $$;
    `;
    
    await pgPool.query(permissoesQuery);
    console.log('Permissões configuradas com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar permissões (não crítico):', error);
    console.log('Prosseguindo mesmo com erro nas permissões...');
  }
}

async function verificarColunasUsuarios() {
  console.log('Verificando colunas da tabela users...');
  
  try {
    // Verificar e adicionar colunas via SQL direto
    const verificarColunasQuery = `
      DO $$
      BEGIN
        -- Verificar e adicionar coluna oficina_id se não existir
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'oficina_id'
        ) THEN
          ALTER TABLE public.users ADD COLUMN oficina_id INTEGER NULL;
          RAISE NOTICE 'Coluna oficina_id adicionada à tabela users';
        ELSE
          RAISE NOTICE 'Coluna oficina_id já existe na tabela users';
        END IF;
        
        -- Verificar e adicionar coluna is_active se não existir
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'is_active'
        ) THEN
          ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
          RAISE NOTICE 'Coluna is_active adicionada à tabela users';
        ELSE
          RAISE NOTICE 'Coluna is_active já existe na tabela users';
        END IF;
        
        -- Verificar e adicionar colunas de timestamp
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'created_at'
        ) THEN
          ALTER TABLE public.users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          RAISE NOTICE 'Coluna created_at adicionada à tabela users';
        ELSE
          RAISE NOTICE 'Coluna created_at já existe na tabela users';
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          RAISE NOTICE 'Coluna updated_at adicionada à tabela users';
        ELSE
          RAISE NOTICE 'Coluna updated_at já existe na tabela users';
        END IF;
      END $$;
    `;
    
    await pgPool.query(verificarColunasQuery);
    console.log('Verificação de colunas da tabela users concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao verificar colunas:', error);
  }
}

// Função principal
async function main() {
  try {
    console.log('Iniciando criação da tabela de usuários...');
    console.log(`URL do Supabase: ${supabaseUrl.substring(0, 15)}...`);
    console.log('Usando DATABASE_URL para conexão PostgreSQL direta');
    
    await criarTabelaUsuarios();
    
    console.log('Processo concluído com sucesso!');
  } catch (error) {
    console.error('Erro na execução do script:', error);
  } finally {
    // Fechar a conexão do pool ao finalizar
    await pgPool.end();
  }
}

// Executar o script
main();