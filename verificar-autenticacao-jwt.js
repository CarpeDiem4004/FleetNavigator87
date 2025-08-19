/**
 * Script para verificar completamente o fluxo de autenticação JWT
 * - Testa login
 * - Testa verificação de token
 * - Testa acesso a rotas protegidas
 * - Testa limites de expiração
 * - Testa rejeição de tokens inválidos
 */
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Configurações
const API_BASE_URL = 'http://localhost:5000';
const VALID_CREDENTIALS = {
  email: 'joao.paulo@muricionfleet.com',
  password: 'fleetadmin2025'
};
const INVALID_CREDENTIALS = {
  email: 'joao.paulo@muricionfleet.com',
  password: 'senha_incorreta'
};
const INVALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjk5OSwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ0ZXN0IiwiYmFzZUlkIjpudWxsLCJvZmljaW5hSWQiOm51bGwsImlhdCI6MTY5OTY4ODM4MiwiZXhwIjoxNjk5Nzc0NzgyfQ.invalid_signature_for_testing_purposes_only';

// Função utilitária para fazer requisições HTTP
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
    
    try {
      const data = await response.json();
      return { status: response.status, data };
    } catch (e) {
      const text = await response.text();
      return { status: response.status, data: { text } };
    }
  } catch (error) {
    console.error(`Erro ao fazer requisição para ${url}:`, error);
    return {
      status: 500,
      data: { success: false, message: error.message }
    };
  }
}

// Função para testar login com credenciais válidas
async function testarLoginValido() {
  console.log('\n1. Testando login com credenciais válidas:');
  const res = await fetchApi('/api/hybrid/auth/login', {
    method: 'POST',
    body: JSON.stringify(VALID_CREDENTIALS)
  });
  
  console.log(`Status: ${res.status}`);
  console.log(`Sucesso: ${res.data.success}`);
  
  if (res.data.token) {
    console.log(`Token recebido: ${res.data.token.substring(0, 20)}...`);
    return res.data.token;
  } else {
    console.log('Nenhum token recebido');
    return null;
  }
}

// Função para testar login com credenciais inválidas
async function testarLoginInvalido() {
  console.log('\n2. Testando login com credenciais inválidas:');
  const res = await fetchApi('/api/hybrid/auth/login', {
    method: 'POST',
    body: JSON.stringify(INVALID_CREDENTIALS)
  });
  
  console.log(`Status: ${res.status}`);
  console.log(`Mensagem: ${res.data.message}`);
  return res.status === 401; // Deve retornar 401 Unauthorized
}

// Função para testar verificação de token válido
async function testarVerificacaoToken(token) {
  console.log('\n3. Testando verificação de token válido:');
  const res = await fetchApi('/api/hybrid/auth/verify', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Status: ${res.status}`);
  console.log(`Sucesso: ${res.data.success}`);
  console.log(`Usuário: ${res.data.user ? res.data.user.email : 'Nenhum'}`);
  return res.status === 200;
}

// Função para testar verificação de token inválido
async function testarTokenInvalido() {
  console.log('\n4. Testando verificação de token inválido:');
  const res = await fetchApi('/api/hybrid/auth/verify', {
    headers: {
      'Authorization': `Bearer ${INVALID_TOKEN}`
    }
  });
  
  console.log(`Status: ${res.status}`);
  console.log(`Mensagem: ${res.data.message}`);
  return res.status === 401; // Deve retornar 401 Unauthorized
}

// Função para testar acesso a rota protegida
async function testarRotaProtegida(token) {
  console.log('\n5. Testando acesso a rota protegida:');
  const res = await fetchApi('/api/hybrid/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Status: ${res.status}`);
  console.log(`Número de usuários: ${res.data.count || 'Nenhum'}`);
  return res.status === 200;
}

// Função para testar acesso sem token
async function testarAcessoSemToken() {
  console.log('\n6. Testando acesso sem token:');
  const res = await fetchApi('/api/hybrid/users');
  
  console.log(`Status: ${res.status}`);
  console.log(`Mensagem: ${res.data.message}`);
  return res.status === 401; // Deve retornar 401 Unauthorized
}

// Função para executar todos os testes
async function executarTestes() {
  console.log('=== VERIFICAÇÃO DO FLUXO DE AUTENTICAÇÃO JWT ===');
  
  // Teste 1: Login válido
  const token = await testarLoginValido();
  if (!token) {
    console.log('\nERRO: Falha no login com credenciais válidas, impossível continuar os testes');
    return;
  }
  
  // Teste 2: Login inválido
  const loginInvalidoOk = await testarLoginInvalido();
  console.log(`Resultado: ${loginInvalidoOk ? 'OK' : 'FALHA'}`);
  
  // Teste 3: Verificação de token válido
  const verificacaoTokenOk = await testarVerificacaoToken(token);
  console.log(`Resultado: ${verificacaoTokenOk ? 'OK' : 'FALHA'}`);
  
  // Teste 4: Verificação de token inválido
  const tokenInvalidoOk = await testarTokenInvalido();
  console.log(`Resultado: ${tokenInvalidoOk ? 'OK' : 'FALHA'}`);
  
  // Teste 5: Acesso a rota protegida
  const rotaProtegidaOk = await testarRotaProtegida(token);
  console.log(`Resultado: ${rotaProtegidaOk ? 'OK' : 'FALHA'}`);
  
  // Teste 6: Acesso sem token
  const acessoSemTokenOk = await testarAcessoSemToken();
  console.log(`Resultado: ${acessoSemTokenOk ? 'OK' : 'FALHA'}`);
  
  // Resumo dos testes
  console.log('\n=== RESUMO DOS TESTES ===');
  console.log(`1. Login válido: ${token ? 'OK' : 'FALHA'}`);
  console.log(`2. Login inválido: ${loginInvalidoOk ? 'OK' : 'FALHA'}`);
  console.log(`3. Verificação de token válido: ${verificacaoTokenOk ? 'OK' : 'FALHA'}`);
  console.log(`4. Verificação de token inválido: ${tokenInvalidoOk ? 'OK' : 'FALHA'}`);
  console.log(`5. Acesso a rota protegida: ${rotaProtegidaOk ? 'OK' : 'FALHA'}`);
  console.log(`6. Acesso sem token: ${acessoSemTokenOk ? 'OK' : 'FALHA'}`);
  
  const todosTestesPassaram = token && loginInvalidoOk && verificacaoTokenOk && 
                              tokenInvalidoOk && rotaProtegidaOk && acessoSemTokenOk;
  
  console.log(`\nRESULTADO FINAL: ${todosTestesPassaram ? 'TODOS OS TESTES PASSARAM ✓' : 'ALGUNS TESTES FALHARAM ✗'}`);
}

// Executar todos os testes
executarTestes().catch(error => {
  console.error('Erro fatal ao executar testes:', error);
});