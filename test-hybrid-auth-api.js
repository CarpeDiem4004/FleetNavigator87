/**
 * Script para testar a API de autenticação híbrida
 * Este script realiza um teste completo do fluxo de autenticação
 * e verifica se o token JWT está funcionando corretamente.
 * 
 * - Teste de ping para verificar se a API está online
 * - Teste de login para obter um token JWT
 * - Teste de verificação do token
 * - Teste de acesso a rotas protegidas usando o token
 * 
 * Uso: node test-hybrid-auth-api.js [api_base_url]
 * 
 * Se api_base_url não for fornecido, usa 'http://localhost:5000'
 */

const { default: fetch } = await import('node-fetch');

// Configuração
let API_BASE_URL = process.argv[2] || 'http://localhost:5000';
API_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Credenciais de teste
const TEST_USER = {
  email: 'joao.paulo@muricionfleet.com',
  password: 'admin'
};

// Variáveis globais para armazenar token e usuário
let authToken = '';
let userId = '';

// Função utilitária para fazer uma requisição e exibir os resultados
async function request(method, endpoint, body = null, token = null) {
  console.log(`\n>>> Requisição ${method} para ${endpoint}`);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('>>> Usando token JWT para autenticação');
  }
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`>>> URL completa: ${url}`);
    
    const response = await fetch(url, options);
    const status = response.status;
    const statusText = response.statusText;
    
    try {
      const data = await response.json();
      console.log(`>>> Resposta (${status} ${statusText}):`);
      console.log(JSON.stringify(data, null, 2));
      return { success: response.ok, status, data };
    } catch (parseError) {
      const text = await response.text();
      console.log(`>>> Resposta (${status} ${statusText}) - Não é JSON:`);
      console.log(text);
      return { success: response.ok, status, data: text };
    }
  } catch (error) {
    console.error(`>>> Erro na requisição:`, error.message);
    return { success: false, status: 0, data: null, error: error.message };
  }
}

// Testar se a API está online
async function testPing() {
  console.log('\n===== TESTE DE PING =====');
  const result = await request('GET', '/api/hybrid/ping');
  return result.success;
}

// Testar login e obter token JWT
async function testLogin() {
  console.log('\n===== TESTE DE LOGIN =====');
  const result = await request('POST', '/api/hybrid/auth/login', TEST_USER);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    userId = result.data.user.id;
    console.log(`>>> Token JWT obtido: ${authToken.slice(0, 20)}...`);
    console.log(`>>> ID do usuário: ${userId}`);
    return true;
  }
  
  return false;
}

// Testar verificação de token
async function testVerifyToken() {
  console.log('\n===== TESTE DE VERIFICAÇÃO DE TOKEN =====');
  const result = await request('GET', '/api/hybrid/auth/verify', null, authToken);
  return result.success;
}

// Testar acesso a rota protegida para obter informações do usuário
async function testGetUser() {
  console.log('\n===== TESTE DE ACESSO A ROTA PROTEGIDA =====');
  const result = await request('GET', `/api/hybrid/users/${userId}`, null, authToken);
  return result.success;
}

// Função principal para executar todos os testes em sequência
async function runTests() {
  console.log(`\n==> Iniciando testes para API em: ${API_BASE_URL}\n`);
  
  // Testar se a API está online
  const pingSuccess = await testPing();
  if (!pingSuccess) {
    console.error('\n❌ FALHA: A API não está respondendo. Verifique se o servidor está rodando no endereço correto.');
    return;
  }
  console.log('\n✅ SUCESSO: A API está online e respondendo.');
  
  // Testar login e obter token JWT
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.error('\n❌ FALHA: Não foi possível fazer login. Verifique as credenciais.');
    return;
  }
  console.log('\n✅ SUCESSO: Login realizado com sucesso e token JWT obtido.');
  
  // Testar verificação de token
  const verifySuccess = await testVerifyToken();
  if (!verifySuccess) {
    console.error('\n❌ FALHA: O token JWT não passou na verificação.');
    return;
  }
  console.log('\n✅ SUCESSO: Token JWT verificado com sucesso.');
  
  // Testar acesso a rota protegida
  const getUserSuccess = await testGetUser();
  if (!getUserSuccess) {
    console.error('\n❌ FALHA: Não foi possível acessar a rota protegida com o token JWT.');
    return;
  }
  console.log('\n✅ SUCESSO: Rota protegida acessada com sucesso usando o token JWT.');
  
  // Todos os testes passaram
  console.log('\n==> TODOS OS TESTES PASSARAM! O sistema de autenticação híbrida está funcionando corretamente. 🎉');
}

// Executar os testes
runTests().catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
});