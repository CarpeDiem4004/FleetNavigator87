const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const { Pool } = require('pg');

const scryptAsync = promisify(scrypt);

// Função para gerar hash de senha
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hashed = await scryptAsync(password, salt, 64);
  return `${hashed.toString('hex')}.${salt}`;
}

// Função para verificar senha
async function comparePasswords(supplied, stored) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error('Formato de senha inválido no banco de dados');
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return hashedBuf.equals(suppliedBuf);
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
}

async function resetBrunoPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Senha padrão para Bruno Machado
    const newPassword = 'gp03@123';
    
    // Gera o hash da nova senha
    const hashedPassword = await hashPassword(newPassword);
    
    console.log('Nova senha para Bruno Machado:', newPassword);
    console.log('Hash gerado:', hashedPassword);
    
    // Verifica se a senha atual está correta
    const currentResult = await pool.query(
      'SELECT password FROM users WHERE email = $1',
      ['bruno.machado@muricionfleet.com']
    );
    
    if (currentResult.rows.length > 0) {
      const currentPassword = currentResult.rows[0].password;
      console.log('Senha atual:', currentPassword);
      
      // Testa a senha atual com algumas tentativas
      const testPasswords = ['senha123', 'gp03@123', 'bruno123', 'password'];
      
      for (const testPassword of testPasswords) {
        const isValid = await comparePasswords(testPassword, currentPassword);
        if (isValid) {
          console.log(`✓ Senha atual é: ${testPassword}`);
          return;
        }
      }
      
      console.log('Nenhuma senha testada funcionou. Atualizando senha...');
      
      // Atualiza a senha no banco
      const result = await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email',
        [hashedPassword, 'bruno.machado@muricionfleet.com']
      );
      
      if (result.rows.length > 0) {
        console.log('✓ Senha atualizada com sucesso para:', result.rows[0]);
        
        // Testa a nova senha
        const testResult = await comparePasswords(newPassword, hashedPassword);
        console.log('✓ Teste da nova senha:', testResult ? 'SUCESSO' : 'FALHA');
      } else {
        console.log('✗ Erro ao atualizar a senha');
      }
    } else {
      console.log('✗ Usuário não encontrado');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

resetBrunoPassword();