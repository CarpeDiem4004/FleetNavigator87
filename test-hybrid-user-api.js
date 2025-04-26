/**
 * Script para testar a API de usuários híbrida
 * Este script pode ser usado tanto no ambiente Replit quanto fora dele
 */
import axios from 'axios';

// URL base para as requisições (ajuste conforme necessário)
const API_BASE_URL = 'http://localhost:5000'; // Para testes locais no Replit

// Função para realizar requisições
async function fazerRequisicao(metodo, url, dados = null) {
  try {
    const config = {
      method: metodo,
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (dados) {
      config.data = dados;
    }
    
    const resposta = await axios(config);
    return resposta.data;
  } catch (erro) {
    if (erro.response) {
      console.error(`Erro ${erro.response.status}: ${JSON.stringify(erro.response.data)}`);
      return erro.response.data;
    } else {
      console.error('Erro na requisição:', erro.message);
      throw erro;
    }
  }
}

// Testes para API híbrida
async function testarAPIHibrida() {
  console.log('=== TESTANDO API HÍBRIDA DE USUÁRIOS ===');
  
  try {
    // 1. Cadastrar um novo usuário
    console.log('\n1. Cadastrando novo usuário...');
    const email = `teste-hibrido-${Date.now()}@exemplo.com`;
    const dadosUsuario = {
      name: 'Usuário Teste Híbrido',
      email,
      role: 'colaborador'
    };
    
    const resultadoCadastro = await fazerRequisicao('post', '/api/hybrid/users', dadosUsuario);
    console.log('Resultado do cadastro:', resultadoCadastro);
    
    if (!resultadoCadastro.success) {
      throw new Error('Falha ao cadastrar usuário');
    }
    
    const idUsuario = resultadoCadastro.user.id;
    const senhaGerada = resultadoCadastro.generatedPassword;
    
    console.log(`Usuário cadastrado com ID: ${idUsuario}`);
    console.log(`Senha gerada: ${senhaGerada}`);
    
    // 2. Obter usuário pelo ID
    console.log('\n2. Buscando usuário pelo ID...');
    const usuarioPorId = await fazerRequisicao('get', `/api/hybrid/users/${idUsuario}`);
    console.log('Usuário encontrado:', usuarioPorId);
    
    // 3. Obter usuário pelo email
    console.log('\n3. Buscando usuário pelo email...');
    const usuarioPorEmail = await fazerRequisicao('get', `/api/hybrid/users/email/${email}`);
    console.log('Usuário encontrado por email:', usuarioPorEmail);
    
    // 4. Atualizar dados do usuário
    console.log('\n4. Atualizando dados do usuário...');
    const dadosAtualizacao = {
      name: 'Usuário Híbrido Atualizado',
      role: 'gerente'
    };
    
    const resultadoAtualizacao = await fazerRequisicao('put', `/api/hybrid/users/${idUsuario}`, dadosAtualizacao);
    console.log('Resultado da atualização:', resultadoAtualizacao);
    
    // 5. Redefinir senha
    console.log('\n5. Redefinindo senha do usuário...');
    const resultadoResetSenha = await fazerRequisicao('post', `/api/hybrid/users/${idUsuario}/reset-password`);
    console.log('Resultado do reset de senha:', resultadoResetSenha);
    
    // 6. Autenticar usuário
    console.log('\n6. Testando autenticação do usuário...');
    const dadosLogin = {
      email,
      password: resultadoResetSenha.generatedPassword
    };
    
    const resultadoLogin = await fazerRequisicao('post', '/api/hybrid/auth/login', dadosLogin);
    console.log('Resultado do login:', resultadoLogin);
    
    // 7. Listar usuários
    console.log('\n7. Listando usuários...');
    const listaUsuarios = await fazerRequisicao('get', '/api/hybrid/users');
    console.log(`Total de usuários: ${listaUsuarios.count}`);
    console.log('Primeiro usuário da lista:', listaUsuarios.users[0]);
    
    // 8. Excluir usuário
    console.log('\n8. Excluindo usuário de teste...');
    const resultadoExclusao = await fazerRequisicao('delete', `/api/hybrid/users/${idUsuario}`);
    console.log('Resultado da exclusão:', resultadoExclusao);
    
    console.log('\n=== TESTES CONCLUÍDOS COM SUCESSO ===');
  } catch (erro) {
    console.error('\n=== FALHA NOS TESTES ===');
    console.error(erro);
  }
}

// Executar testes
testarAPIHibrida();