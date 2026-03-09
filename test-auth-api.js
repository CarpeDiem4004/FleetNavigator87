/**
 * Script para testar a API de autenticação híbrida
 */

const fetch = require('node-fetch');

// URLs para teste
const API_BASE_URL = 'http://localhost:5000';
const AUTH_CONFIG_URL = `${API_BASE_URL}/api/auth-config`;
const AUTH_TEST_HYBRID_URL = `${API_BASE_URL}/api/auth-test/hybrid`;
const AUTH_TEST_SESSION_URL = `${API_BASE_URL}/api/auth-test/session`;
const AUTH_TEST_JWT_URL = `${API_BASE_URL}/api/auth-test/jwt`;
const AUTH_TEST_MAPPING_URL = `${API_BASE_URL}/api/auth-test/mapping`;
const AUTH_STATUS_URL = `${API_BASE_URL}/api/auth-status`;

// Token JWT para teste (substitua pelo seu token válido)
const TEST_JWT_TOKEN = 'seu-token-jwt-valido-aqui';

// Função para fazer requisições com diferentes métodos de autenticação
async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    console.log(`Status: ${response.status}, Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        status: response.status,
        data
      };
    } else {
      const text = await response.text();
      return {
        status: response.status,
        textLength: text.length,
        preview: text.substring(0, 200) + '...',
        isHtml: text.includes('<!DOCTYPE html>') || text.includes('<html')
      };
    }
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// Testes para as rotas de autenticação
async function runTests() {
  console.log('=== Testando APIs de Autenticação Híbrida ===\n');
  
  console.log('1. Verificando configuração de autenticação');
  const authConfig = await testEndpoint(AUTH_CONFIG_URL);
  console.log(JSON.stringify(authConfig, null, 2));
  console.log('\n--------------------------------------\n');
  
  console.log('2. Verificando status de autenticação (sem autenticação)');
  const authStatus = await testEndpoint(AUTH_STATUS_URL);
  console.log(JSON.stringify(authStatus, null, 2));
  console.log('\n--------------------------------------\n');
  
  console.log('3. Testando rota com autenticação híbrida (sem autenticação)');
  const hybridNoAuth = await testEndpoint(AUTH_TEST_HYBRID_URL);
  console.log(JSON.stringify(hybridNoAuth, null, 2));
  console.log('\n--------------------------------------\n');
  
  console.log('4. Testando rota com autenticação JWT (com token)');
  const jwtAuth = await testEndpoint(AUTH_TEST_JWT_URL, {
    headers: {
      'Authorization': `Bearer ${TEST_JWT_TOKEN}`
    }
  });
  console.log(JSON.stringify(jwtAuth, null, 2));
  console.log('\n--------------------------------------\n');
  
  console.log('5. Testando rota com autenticação híbrida (com token)');
  const hybridWithToken = await testEndpoint(AUTH_TEST_HYBRID_URL, {
    headers: {
      'Authorization': `Bearer ${TEST_JWT_TOKEN}`
    }
  });
  console.log(JSON.stringify(hybridWithToken, null, 2));
  console.log('\n--------------------------------------\n');
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro nos testes:', error);
});