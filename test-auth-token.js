/**
 * Script para gerar um token JWT para testes
 * Este script usa o serviço híbrido de usuários para gerar um token
 * que pode ser usado para autenticar requisições à API
 */
const { getHybridUserService } = require('./hybrid-user-service');

async function main() {
  try {
    console.log('Gerando token JWT para testes...');
    
    // Obtém o serviço híbrido de usuários
    const userService = getHybridUserService();
    
    // Cria um usuário fictício com permissões de admin para testes
    const testUser = {
      id: 999,
      email: 'test-admin@example.com',
      name: 'Test Admin',
      role: 'admin',
      baseId: 12, // Gestão de Frotas
    };
    
    // Gera um token JWT para o usuário fictício
    const token = userService.generateToken(testUser);
    
    console.log('Token JWT gerado com sucesso:');
    console.log(token);
    
    // Verifica o token para confirmar que está funcionando
    const decodedToken = await userService.verifyToken(token, true);
    console.log('Token verificado com sucesso:');
    console.log(JSON.stringify(decodedToken, null, 2));
    
    // Mostra um exemplo de como usar o token em uma requisição curl
    console.log('\nExemplo de uso com curl:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/fleet/budget-requests`);
    
  } catch (error) {
    console.error('Erro ao gerar token JWT:', error);
  }
}

main();