/**
 * Script para criar um novo usuário no sistema
 */
import dotenv from 'dotenv';
import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

dotenv.config();
const { Pool } = pg;
const scryptAsync = promisify(scrypt);

// Função para criar hash de senha
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createUser(userData) {
  // Criar conexão com o banco de dados usando variáveis de ambiente
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Conectando ao banco de dados...');
    
    // Verificar se o usuário já existe
    const checkQuery = {
      text: 'SELECT id FROM users WHERE email = $1',
      values: [userData.email]
    };
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.error(`Erro: Usuário com email ${userData.email} já existe!`);
      return;
    }
    
    // Gerar hash da senha
    const hashedPassword = await hashPassword(userData.password);
    
    // Consulta SQL para inserir novo usuário
    const insertQuery = {
      text: `
        INSERT INTO users (
          name, 
          email, 
          password, 
          role, 
          base_id,
          oficina_id,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, email, role
      `,
      values: [
        userData.name,
        userData.email,
        hashedPassword,
        userData.role,
        userData.baseId,
        userData.oficinaId,
        true // is_active
      ]
    };
    
    const result = await pool.query(insertQuery);
    
    if (result.rows.length === 0) {
      console.error('Erro: Usuário não foi criado!');
      return;
    }
    
    console.log('\n=== USUÁRIO CRIADO COM SUCESSO ===\n');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Nome: ${result.rows[0].name}`);
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Perfil: ${result.rows[0].role}`);
    console.log('\nINFORMAÇÕES DE ACESSO:');
    console.log(`Email: ${userData.email}`);
    console.log(`Senha: ${userData.password}`);
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    // Encerrar conexão com o banco de dados
    await pool.end();
  }
}

// Dados do novo usuário operador de posto
const newUser = {
  name: "Operador Externo",
  email: "operador@muricionfleet.com",
  password: "MuricionOp2025",
  role: "operador", // Valores possíveis: admin, operador, oficina, pneus
  baseId: null,
  oficinaId: null
};

// Executar a função principal
createUser(newUser).catch(err => {
  console.error('Erro ao executar script:', err);
  process.exit(1);
});