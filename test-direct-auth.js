/**
 * Script para testar a rota direta de autenticação híbrida
 */

import fetch from 'node-fetch';

// URLs para teste
const API_BASE_URL = 'http://localhost:5000';
const AUTH_DIRECT_URL = `${API_BASE_URL}/api/auth-test-direct/hybrid`;
const AUTH_CONFIG_URL = `${API_BASE_URL}/api/auth-config`;
const AUTH_STATUS_URL = `${API_BASE_URL}/api/auth-status`;

// Função para fazer requisições e mostrar resultados
async function testEndpoint(url, options = {}) {
  try {
    console.log(`Testando: ${url}`);
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    console.log(`Status: ${response.status}, Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Resposta JSON:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const text = await response.text();
      console.log(`Resposta não-JSON (${text.length} caracteres):`);
      console.log(text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      console.log(`É HTML? ${text.includes('<!DOCTYPE html>') || text.includes('<html')}`);
      return text;
    }
  } catch (error) {
    console.error('Erro:', error.message);
    return null;
  }
}

// Um token JWT fictício para testes (substitua por um token real em produção)
// Na prática, este deve ser obtido através do login no Supabase
const TEST_JWT_TOKEN = 'seu-token-jwt-real-aqui';

// Função principal para executar os testes
async function main() {
  console.log('=== Testando Autenticação Híbrida Direta ===\n');
  
  console.log('\n1. Verificando configuração de autenticação');
  await testEndpoint(AUTH_CONFIG_URL);
  
  console.log('\n2. Verificando status de autenticação');
  await testEndpoint(AUTH_STATUS_URL);
  
  console.log('\n3. Testando rota direta de autenticação híbrida (sem autenticação)');
  await testEndpoint(AUTH_DIRECT_URL);
  
  console.log('\n4. Testando rota direta de autenticação híbrida (com JWT)');
  await testEndpoint(AUTH_DIRECT_URL, {
    headers: {
      'Authorization': `Bearer ${TEST_JWT_TOKEN}`
    }
  });
  
  console.log('\nTestes concluídos!');
}

// Executar testes
main().catch(err => {
  console.error('Erro fatal:', err);
});