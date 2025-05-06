/**
 * Script para adicionar múltiplos usuários ao sistema
 * Use este script para recriar usuários após uma restauração do banco de dados
 */

const { Pool } = require('pg');
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const scryptAsync = promisify(scrypt);

require('dotenv').config();

// Função para gerar hash de senha
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function adicionarUsuarios() {
  // Lista de usuários a serem adicionados
  const usuarios = [
    {
      name: 'Administrador',
      email: 'admin@muricionfleet.com',
      password: 'MuricionAdmin2025',
      role: 'admin',
      base_id: null,
      is_active: true
    },
    {
      name: 'Operador Externo',
      email: 'operador@muricionfleet.com',
      password: 'MuricionOp2025',
      role: 'operador',
      base_id: null,
      is_active: true
    },
    // Adicione seus usuários adicionais aqui no formato:
    // { name: 'Nome Completo', email: 'email@exemplo.com', password: 'senha123', role: 'tipo', base_id: null, is_active: true }
  ];

  // Conexão com o banco de dados
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Conectado ao banco de dados');
    
    // Verificar se já existem usuários no banco
    const checkQuery = 'SELECT COUNT(*) FROM users';
    const checkResult = await pool.query(checkQuery);
    const userCount = parseInt(checkResult.rows[0].count);
    
    console.log(`Total de usuários existentes: ${userCount}`);
    
    // Criar contador para novos usuários
    let novosUsuarios = 0;
    let usuariosAtualizados = 0;
    
    // Para cada usuário na lista
    for (const usuario of usuarios) {
      // Verificar se o usuário já existe (pelo email)
      const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
      const checkUserResult = await pool.query(checkUserQuery, [usuario.email]);
      
      if (checkUserResult.rows.length === 0) {
        // Usuário não existe, criar novo
        const senhaHash = await hashPassword(usuario.password);
        
        const insertQuery = `
          INSERT INTO users (name, email, password, role, base_id, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id
        `;
        
        const result = await pool.query(insertQuery, [
          usuario.name,
          usuario.email,
          senhaHash,
          usuario.role,
          usuario.base_id,
          usuario.is_active
        ]);
        
        console.log(`✅ Usuário criado: ${usuario.email}, ID: ${result.rows[0].id}`);
        novosUsuarios++;
      } else {
        // Usuário já existe, perguntar se deseja atualizar
        const userId = checkUserResult.rows[0].id;
        console.log(`⚠️ Usuário já existe: ${usuario.email}, ID: ${userId}`);
        
        // Atualizar a senha do usuário existente
        const senhaHash = await hashPassword(usuario.password);
        
        const updateQuery = `
          UPDATE users
          SET password = $1, name = $2, role = $3, base_id = $4, is_active = $5, updated_at = NOW()
          WHERE id = $6
        `;
        
        await pool.query(updateQuery, [
          senhaHash,
          usuario.name,
          usuario.role,
          usuario.base_id,
          usuario.is_active,
          userId
        ]);
        
        console.log(`✅ Usuário atualizado: ${usuario.email}, ID: ${userId}`);
        usuariosAtualizados++;
      }
    }
    
    // Resumo final
    console.log('\n===== RESUMO DA OPERAÇÃO =====');
    console.log(`Total de usuários antes: ${userCount}`);
    console.log(`Novos usuários criados: ${novosUsuarios}`);
    console.log(`Usuários atualizados: ${usuariosAtualizados}`);
    console.log(`Total de usuários agora: ${userCount + novosUsuarios}`);
    
  } catch (error) {
    console.error('Erro ao adicionar usuários:', error);
  } finally {
    await pool.end();
    console.log('Conexão com o banco encerrada');
  }
}

// Executar a função principal
adicionarUsuarios().catch(err => {
  console.error('Erro na execução do script:', err);
  process.exit(1);
});