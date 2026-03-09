/**
 * Script para gerar um token JWT para testes usando a API híbrida
 * Este script faz uma requisição para a API de autenticação para obter um token válido
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function main() {
  try {
    console.log('Gerando token JWT para testes através da API...');
    
    // Tentar login com usuário admin
    const loginData = {
      email: 'admin@muricionfleet.com',
      password: 'Amanda@25'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/hybrid/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    const result = await response.json();
    
    if (result.token) {
      console.log('Token JWT gerado com sucesso:');
      console.log(result.token);
      
      // Verificar o token
      const verifyResponse = await fetch(`${API_BASE_URL}/api/hybrid/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${result.token}`
        }
      });
      
      const verifyResult = await verifyResponse.json();
      console.log('Token verificado com sucesso:');
      console.log(JSON.stringify(verifyResult, null, 2));
      
      // Mostrar um exemplo de como usar o token em uma requisição curl
      console.log('\nExemplo de uso com curl:');
      console.log(`curl -v -H "Authorization: Bearer ${result.token}" http://localhost:5000/api/fleet/budget-requests`);
      
    } else {
      console.error('Erro ao obter token:', result);
    }
    
  } catch (error) {
    console.error('Erro ao gerar token JWT:', error);
  }
}

main();