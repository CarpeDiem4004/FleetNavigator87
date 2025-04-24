// Script para resetar a senha de um usuário
import { pool } from '../db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function resetPassword(userId: number, newPassword: string) {
  try {
    console.log(`Resetando senha para usuário ID ${userId}...`);
    
    // Gerar hash da nova senha
    const hashedPassword = await hashPassword(newPassword);
    console.log(`Hash gerado com sucesso.`);
    
    // Atualizar a senha no banco de dados
    const query = `
      UPDATE users
      SET password = $1
      WHERE id = $2
      RETURNING id, name, email, role, base_id as "baseId", basename, is_active as "isActive"
    `;
    
    const result = await pool.query(query, [hashedPassword, userId]);
    
    if (result.rows.length === 0) {
      console.error(`Usuário ID ${userId} não encontrado.`);
      return null;
    }
    
    console.log(`Senha resetada com sucesso para ${result.rows[0].name}.`);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    throw error;
  }
}

// Executar para um usuário específico (Gabriel ID=51)
async function main() {
  try {
    const userId = 51;
    const newPassword = 'muricao2024';
    
    const updatedUser = await resetPassword(userId, newPassword);
    
    if (updatedUser) {
      console.log('Resultado da operação:');
      console.log(JSON.stringify(updatedUser, null, 2));
      console.log(`\nSenha resetada para: ${newPassword}`);
    } else {
      console.log('Falha ao resetar senha.');
    }
    
    // Encerrar a conexão com o banco de dados
    await pool.end();
  } catch (error) {
    console.error('Erro na execução do script:', error);
    process.exit(1);
  }
}

// Executar o script
main();