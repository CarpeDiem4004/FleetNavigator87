/**
 * Script para adicionar usuários padrão ao sistema
 * Este script deve ser executado uma única vez para adicionar usuários essenciais
 */

import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Função assíncrona para hash de senha
const scryptAsync = promisify(scrypt);

// Função para criar hash de senha
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Conexão ao banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Supabase client (alternativa)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

// Lista de usuários padrão a serem criados
const usuarios = [
  {
    name: 'Administrador',
    email: 'admin@muricionfleet.com',
    password: 'MuricionAdmin2025',
    role: 'admin',
    baseId: null,
    isActive: true
  },
  {
    name: 'Gestor de Frota',
    email: 'frota@muricionfleet.com',
    password: 'MuricionFrota2025',
    role: 'gestor_frota',
    baseId: null,
    isActive: true
  },
  {
    name: 'Gestor Base SP',
    email: 'basesp@muricionfleet.com',
    password: 'MuricionBaseSP2025',
    role: 'gestor',
    baseId: 1, // ID da Base São Paulo
    isActive: true
  },
  {
    name: 'Operador Campinas',
    email: 'campinas@muricionfleet.com',
    password: 'MuricionCampinas2025',
    role: 'operador',
    baseId: 2, // ID da Base Campinas
    isActive: true
  },
  {
    name: 'Operador Goiânia',
    email: 'goiania@muricionfleet.com',
    password: 'MuricionGoiania2025',
    role: 'operador',
    baseId: 10, // ID da Base Goiânia
    isActive: true
  },
  {
    name: 'Gestor Postos',
    email: 'postos@muricionfleet.com',
    password: 'MuricionPostos2025',
    role: 'posto',
    baseId: null,
    isActive: true
  },
  {
    name: 'Especialista Pneus',
    email: 'pneus@muricionfleet.com',
    password: 'MuricionPneus2025',
    role: 'pneus',
    baseId: null,
    isActive: true
  },
  {
    name: 'Oficina Murici',
    email: 'oficina@muricionfleet.com',
    password: 'MuricionOficina2025',
    role: 'oficina',
    baseId: null,
    isActive: true
  }
];

// Função principal
async function main() {
  console.log('Iniciando processo de adição de usuários padrão...');

  try {
    // Verificar se tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('Tabela "users" não existe! Execute o script de criação da tabela primeiro.');
      return;
    }

    // Verificar usuários existentes
    const usuariosExistentes = await pool.query(`
      SELECT email FROM users;
    `);
    
    const emailsExistentes = usuariosExistentes.rows.map(row => row.email.toLowerCase());
    console.log('Usuários existentes:', emailsExistentes);

    // Filtrar usuários que não existem no banco
    const usuariosParaAdicionar = usuarios.filter(
      usuario => !emailsExistentes.includes(usuario.email.toLowerCase())
    );

    if (usuariosParaAdicionar.length === 0) {
      console.log('Todos os usuários padrão já estão cadastrados!');
      return;
    }

    // Adicionar usuários via PostgreSQL direto
    for (const usuario of usuariosParaAdicionar) {
      try {
        // Hash da senha
        const hashedPassword = await hashPassword(usuario.password);
        
        // Inserir usuário
        await pool.query(`
          INSERT INTO users (
            name, 
            email, 
            password, 
            role, 
            base_id, 
            is_active, 
            created_at, 
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id, name, email, role
        `, [
          usuario.name,
          usuario.email,
          hashedPassword,
          usuario.role,
          usuario.baseId,
          usuario.isActive
        ]);
        
        console.log(`✅ Usuário criado com sucesso: ${usuario.email} (${usuario.role})`);
      } catch (err) {
        console.error(`❌ Erro ao criar usuário ${usuario.email}:`, err.message);
      }
    }

    console.log('\nProcesso concluído!');
  } catch (error) {
    console.error('Erro durante o processo:', error);
  } finally {
    // Fechar conexão com o pool
    await pool.end();
  }
}

// Executar função principal
main().catch(console.error);