/**
 * Script para redefinir a senha do usuário joao.paulo@muricionfleet.com
 * Este script cria um hash de senha conhecido e atualiza diretamente no banco
 */
import { Pool } from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Função assíncrona para hash de senha
const scryptAsync = promisify(scrypt);

// Senha conhecida para testes
const KNOWN_PASSWORD = 'fleetadmin2025';

async function hashPassword(password) {
  try {
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
  } catch (error) {
    console.error('Erro ao gerar hash de senha:', error);
    throw error;
  }
}

async function resetUserPassword() {
  // Conectar ao banco de dados
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  try {
    console.log('Conectado ao banco de dados PostgreSQL');
    
    // Gerar hash para a senha conhecida
    const hashedPassword = await hashPassword(KNOWN_PASSWORD);
    console.log('Hash gerado para senha conhecida');
    
    // Atualizar senha do usuário
    const email = 'joao.paulo@muricionfleet.com';
    const query = 'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email';
    const result = await pool.query(query, [hashedPassword, email]);
    
    if (result.rows.length > 0) {
      console.log('Senha atualizada com sucesso para o usuário:');
      console.log(result.rows[0]);
      console.log(`Nova senha definida: ${KNOWN_PASSWORD}`);
      console.log(`Hash da senha: ${hashedPassword}`);
    } else {
      console.log('Usuário não encontrado');
    }
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
  } finally {
    pool.end();
    console.log('Conexão com o banco de dados encerrada');
  }
}

// Executar o script
resetUserPassword().catch(console.error);