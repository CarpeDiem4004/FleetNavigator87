/**
 * Script para testar a API híbrida de usuários com autenticação JWT
 * Este script testa a autenticação e acesso a rotas protegidas
 */
import fetch from 'node-fetch';

// URL base para API
const API_BASE_URL = 'http://localhost:5000';

/**
 * Função utilitária para fazer requisições HTTP
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const fetchOptions = { ...defaultOptions, ...options };
  
  try {
    console.log(`Requisição para ${url}`);
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    return {
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`Erro ao fazer requisição para ${url}:`, error);
    return {
      status: 500,
      data: { success: false, message: error.message }
    };
  }
}

/**
 * Função principal para rodar os testes
 */
async function runTests() {
  console.log('=== TESTE DA API HÍBRIDA COM JWT ===\n');
  
  // 1. Testar login
  console.log('1. Testando login:');
  console.log('Tentando autenticar com joao.paulo@muricionfleet.com');
  
  // Analisando o formato da senha atual no banco
  console.log('Formato da senha no banco: 25f1ef8df42bf4e9320e84d036233ace9130864bef4e489fc677ed622ebb06b3c43e456f72861f44dfb2de71c896fecd1b4029e519ccf1d05632027704aec04d.17decf7e374062db5c0354ee2be24169');
  console.log('O formato parece ser [hash].[salt]');
  
  // Testar com a senha padrão para este usuário
  const loginResult = await fetchApi('/api/hybrid/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'joao.paulo@muricionfleet.com',
      password: 'fleetadmin2025'
    })
  });
  
  console.log(`Status: ${loginResult.status}`);
  console.log('Resposta:', loginResult.data);
  console.log('\n');
  
  if (!loginResult.data.success) {
    console.log('Login falhou. Impossível continuar os testes.');
    return;
  }
  
  // Extrair token JWT da resposta
  const { token } = loginResult.data;
  
  // 2. Testar verificação do token
  console.log('2. Testando verificação do token:');
  const verifyResult = await fetchApi('/api/hybrid/auth/verify', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Status: ${verifyResult.status}`);
  console.log('Resposta:', verifyResult.data);
  console.log('\n');
  
  // 3. Testar acesso a rota protegida (listar usuários)
  console.log('3. Testando acesso a rota protegida (listar usuários):');
  const listUsersResult = await fetchApi('/api/hybrid/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Status: ${listUsersResult.status}`);
  console.log(`Número de usuários: ${listUsersResult.data.count || 0}`);
  console.log('\n');
  
  // 4. Testar acesso sem token (deve falhar)
  console.log('4. Testando acesso sem token (deve falhar):');
  const noTokenResult = await fetchApi('/api/hybrid/users');
  
  console.log(`Status: ${noTokenResult.status}`);
  console.log('Resposta:', noTokenResult.data);
  console.log('\n');
  
  console.log('=== FIM DOS TESTES ===');
}

// Executar testes
runTests().catch(console.error);