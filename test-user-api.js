/**
 * Script para testar a API de usuários híbrida
 * Este script pode ser usado tanto no ambiente Replit quanto fora dele
 */
import axios from 'axios';

// URL base da API (modifique para o correto em produção)
const BASE_URL = 'http://localhost:5000';

async function testarCadastroUsuario() {
  try {
    console.log('=== TESTANDO CADASTRO DE USUÁRIO ===');
    
    const novoUsuario = {
      name: 'Usuário Teste API',
      email: `teste-api-${Date.now()}@example.com`,
      role: 'colaborador',
      // Senha opcional - se não fornecida, uma será gerada automaticamente
    };
    
    const response = await axios.post(`${BASE_URL}/api/users/register`, novoUsuario);
    
    console.log('Status da requisição:', response.status);
    console.log('Resposta:', response.data);
    
    if (response.data.generatedPassword) {
      console.log('IMPORTANTE: Senha gerada automaticamente:', response.data.generatedPassword);
      console.log('Guarde esta senha para fazer login!');
    }
    
    return response.data.user.id; // Retorna o ID do usuário para testes subsequentes
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error.response?.data || error.message);
    throw error;
  }
}

async function testarListagemUsuarios() {
  try {
    console.log('\n=== TESTANDO LISTAGEM DE USUÁRIOS ===');
    
    const response = await axios.get(`${BASE_URL}/api/users/list`);
    
    console.log('Status da requisição:', response.status);
    console.log('Total de usuários:', response.data.count);
    console.log('Primeiros 3 usuários:', response.data.users.slice(0, 3));
    
    return response.data.users;
  } catch (error) {
    console.error('Erro ao listar usuários:', error.response?.data || error.message);
    throw error;
  }
}

async function testarObterUsuario(id) {
  try {
    console.log(`\n=== TESTANDO OBTER USUÁRIO ID ${id} ===`);
    
    const response = await axios.get(`${BASE_URL}/api/users/${id}`);
    
    console.log('Status da requisição:', response.status);
    console.log('Dados do usuário:', response.data.user);
    
    return response.data.user;
  } catch (error) {
    console.error('Erro ao obter usuário:', error.response?.data || error.message);
    throw error;
  }
}

async function testarAtualizacaoUsuario(id) {
  try {
    console.log(`\n=== TESTANDO ATUALIZAÇÃO DE USUÁRIO ID ${id} ===`);
    
    const dadosAtualizacao = {
      name: `Usuário Atualizado ${Date.now()}`,
      role: 'supervisor'
    };
    
    const response = await axios.put(`${BASE_URL}/api/users/${id}`, dadosAtualizacao);
    
    console.log('Status da requisição:', response.status);
    console.log('Dados atualizados:', response.data.user);
    
    return response.data.user;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error.response?.data || error.message);
    throw error;
  }
}

async function testarResetSenhaUsuario(id) {
  try {
    console.log(`\n=== TESTANDO RESET DE SENHA DO USUÁRIO ID ${id} ===`);
    
    const response = await axios.post(`${BASE_URL}/api/users/${id}/reset-password`);
    
    console.log('Status da requisição:', response.status);
    console.log('Resposta:', response.data);
    
    if (response.data.generatedPassword) {
      console.log('IMPORTANTE: Nova senha gerada:', response.data.generatedPassword);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao redefinir senha:', error.response?.data || error.message);
    throw error;
  }
}

async function testarExclusaoUsuario(id) {
  try {
    console.log(`\n=== TESTANDO EXCLUSÃO DE USUÁRIO ID ${id} ===`);
    
    const response = await axios.delete(`${BASE_URL}/api/users/${id}`);
    
    console.log('Status da requisição:', response.status);
    console.log('Resposta:', response.data);
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error.response?.data || error.message);
    throw error;
  }
}

async function executarTestes() {
  try {
    // Testar cadastro de usuário
    const userId = await testarCadastroUsuario();
    
    // Testar listagem de usuários
    await testarListagemUsuarios();
    
    // Testar obtenção de usuário específico
    await testarObterUsuario(userId);
    
    // Testar atualização de usuário
    await testarAtualizacaoUsuario(userId);
    
    // Testar reset de senha
    await testarResetSenhaUsuario(userId);
    
    // Testar exclusão de usuário (descomente se quiser testar a exclusão)
    // await testarExclusaoUsuario(userId);
    
    console.log('\n=== TODOS OS TESTES CONCLUÍDOS COM SUCESSO ===');
  } catch (error) {
    console.error('\n=== FALHA NOS TESTES ===');
    console.error(error);
  }
}

// Executar todos os testes
executarTestes();