/**
 * Script para redefinir a senha do usuário administrador
 */

import { Pool } from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Função assíncrona para hash de senha
const scryptAsync = promisify(scrypt);

// Nova senha para o admin
const NEW_PASSWORD = 'Amanda@25';

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

async function resetAdminPassword() {
  // Conectar ao banco de dados
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  try {
    console.log('Conectado ao banco de dados PostgreSQL');
    
    // Gerar hash para a nova senha
    const hashedPassword = await hashPassword(NEW_PASSWORD);
    console.log('Hash gerado para a nova senha');
    
    // Atualizar senha do usuário admin
    const adminId = 1; // ID do usuário Administrador
    const query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email';
    const result = await pool.query(query, [hashedPassword, adminId]);
    
    if (result.rows.length > 0) {
      console.log('Senha atualizada com sucesso para o usuário:');
      console.log(result.rows[0]);
      console.log(`Nova senha definida: ${NEW_PASSWORD}`);
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
resetAdminPassword().catch(console.error);