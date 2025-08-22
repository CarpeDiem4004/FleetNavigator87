/**
 * Script para criar a tabela de usuários no Supabase
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// Necessário para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para hash de senha
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

// Carrega variáveis de ambiente
dotenv.config();

// Verifica se a URL do banco de dados está disponível
if (!process.env.DATABASE_URL) {
  console.error('Erro: DATABASE_URL não definida no ambiente');
  process.exit(1);
}

// Inicializa conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Conectado ao banco de dados');
    
    // Verifica se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios_supabase'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('Tabela usuarios_supabase já existe, verificando estrutura...');
      
      // Verifica a estrutura atual da tabela
      const columnsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios_supabase'
      `;
      
      const columnsResult = await client.query(columnsQuery);
      console.log('Colunas existentes:', columnsResult.rows);
      
      // Verifica campos ausentes e adiciona-os
      const requiredColumns = [
        { name: 'id', type: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'email', type: 'text' },
        { name: 'username', type: 'text' },
        { name: 'password_hash', type: 'text' },
        { name: 'nome_completo', type: 'text' },
        { name: 'role', type: 'text' },
        { name: 'base_id', type: 'integer' },
        { name: 'base_nome', type: 'text' },
        { name: 'oficina_id', type: 'integer' },
        { name: 'ativo', type: 'boolean' },
        { name: 'ultimo_login', type: 'timestamp with time zone' },
        { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' }
      ];
      
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      for (const column of requiredColumns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`Adicionando coluna ausente: ${column.name} (${column.type})`);
          
          let alterQuery = `
            ALTER TABLE usuarios_supabase 
            ADD COLUMN ${column.name} ${column.type}
          `;
          
          if (column.default) {
            alterQuery += ` DEFAULT ${column.default}`;
          }
          
          await client.query(alterQuery);
          console.log(`Coluna ${column.name} adicionada com sucesso`);
        }
      }
      
      console.log('Estrutura da tabela verificada e atualizada');
      
    } else {
      console.log('Tabela usuarios_supabase não existe, criando...');
      
      // Primeiro, garante que a extensão uuid-ossp esteja disponível
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      
      // Cria a tabela
      const createTableQuery = `
        CREATE TABLE usuarios_supabase (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          nome_completo TEXT NOT NULL,
          role TEXT NOT NULL,
          base_id INTEGER,
          base_nome TEXT,
          oficina_id INTEGER,
          ativo BOOLEAN DEFAULT true,
          ultimo_login TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Adiciona índices para otimização de consultas
        CREATE INDEX idx_usuarios_supabase_email ON usuarios_supabase(email);
        CREATE INDEX idx_usuarios_supabase_username ON usuarios_supabase(username);
        CREATE INDEX idx_usuarios_supabase_role ON usuarios_supabase(role);
        CREATE INDEX idx_usuarios_supabase_base_id ON usuarios_supabase(base_id);
        CREATE INDEX idx_usuarios_supabase_ativo ON usuarios_supabase(ativo);
      `;
      
      await client.query(createTableQuery);
      console.log('Tabela usuarios_supabase criada com sucesso');
      
      // Busca usuários existentes para migrar
      console.log('Buscando usuários existentes para migrar...');
      const existingUsersQuery = 'SELECT * FROM users';
      const existingUsersResult = await client.query(existingUsersQuery);
      const existingUsers = existingUsersResult.rows;
      
      console.log(`Encontrados ${existingUsers.length} usuários para migração`);
      
      // Migra usuários existentes
      for (const user of existingUsers) {
        const insertQuery = {
          text: `
            INSERT INTO usuarios_supabase (
              email, 
              username, 
              password_hash, 
              nome_completo, 
              role, 
              base_id, 
              base_nome, 
              oficina_id, 
              ativo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
          `,
          values: [
            user.email, 
            user.email.split('@')[0], // Gera username a partir do email
            user.password, 
            user.name, 
            user.role, 
            user.base_id, 
            user.basename, 
            user.oficina_id, 
            user.is_active
          ]
        };
        
        try {
          const result = await client.query(insertQuery);
          if (result.rows.length > 0) {
            console.log(`Usuário ${user.email} migrado com sucesso (ID: ${result.rows[0].id})`);
          } else {
            console.log(`Usuário ${user.email} já existe, pulando migração`);
          }
        } catch (insertError) {
          console.error(`Erro ao migrar usuário ${user.email}:`, insertError.message);
        }
      }
      
      // Adiciona usuário admin inicial se ainda não existir
      const adminUsername = 'admin';
      const adminEmail = 'admin@muricionfleet.com';
      const adminPassword = 'Amanda@25'; // Senhas são definidas pelo admin no futuro
      
      // Verifica se o admin já existe
      const checkAdminQuery = {
        text: 'SELECT * FROM usuarios_supabase WHERE email = $1',
        values: [adminEmail]
      };
      
      const adminExists = await client.query(checkAdminQuery);
      
      if (adminExists.rows.length === 0) {
        // Hash a senha do admin
        const passwordHash = await hashPassword(adminPassword);
        
        const insertAdminQuery = {
          text: `
            INSERT INTO usuarios_supabase (
              email, 
              username, 
              password_hash, 
              nome_completo, 
              role
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `,
          values: [
            adminEmail,
            adminUsername,
            passwordHash,
            'Administrador do Sistema',
            'admin'
          ]
        };
        
        try {
          const result = await client.query(insertAdminQuery);
          console.log(`Usuário admin criado com sucesso (ID: ${result.rows[0].id})`);
          console.log(`Credenciais iniciais: ${adminEmail} / ${adminPassword}`);
          console.log('IMPORTANTE: Altere a senha do admin após o primeiro login!');
        } catch (adminError) {
          console.error('Erro ao criar usuário admin:', adminError.message);
        }
      } else {
        console.log('Usuário admin já existe, pulando criação');
      }
    }
    
    // Lista todos os registros na tabela para verificação
    const selectQuery = 'SELECT id, email, username, role, base_nome, ativo, created_at FROM usuarios_supabase';
    const result = await client.query(selectQuery);
    
    console.log('Registros na tabela (mostrando apenas dados não sensíveis):');
    console.table(result.rows);
    
    console.log('Operação concluída com sucesso!');
    console.log(`Total de ${result.rows.length} usuários na tabela`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

main();