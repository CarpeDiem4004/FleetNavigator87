/**
 * Script para gerar um token JWT para testes
 * Este script usa o serviço híbrido de usuários para gerar um token
 * que pode ser usado para autenticar requisições à API
 */
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente
dotenv.config();

// Segredo para assinatura do JWT, usando a mesma variável do sistema principal
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

async function main() {
  try {
    console.log('Gerando token JWT para testes...');
    
    // Cria um usuário fictício com permissões de admin para testes
    const testUser = {
      id: 999,
      email: 'test-admin@example.com',
      name: 'Test Admin',
      role: 'admin',
      baseId: 12, // Gestão de Frotas
    };
    
    // Gera um token JWT para o usuário fictício
    const token = jwt.sign(
      { 
        user: {
          id: testUser.id,
          email: testUser.email,
          role: testUser.role,
          baseId: testUser.baseId
        }
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Token JWT gerado com sucesso:');
    console.log(token);
    
    // Verifica o token para confirmar que está funcionando
    const decodedToken = jwt.verify(token, JWT_SECRET);
    console.log('Token verificado com sucesso:');
    console.log(JSON.stringify(decodedToken, null, 2));
    
    // Mostra um exemplo de como usar o token em uma requisição curl
    console.log('\nExemplo de uso com curl:');
    console.log(`curl -v -H "Authorization: Bearer ${token}" http://localhost:5000/api/fleet/budget-requests`);
    
  } catch (error) {
    console.error('Erro ao gerar token JWT:', error);
  }
}

main();