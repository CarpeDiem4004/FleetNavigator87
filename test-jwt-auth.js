/**
 * Script para testar a autenticação JWT
 * Este script verifica se as constantes JWT_SECRET e JWT_EXPIRES_IN estão definidas corretamente
 * e testa a geração e verificação de tokens JWT.
 */
import jwt from 'jsonwebtoken';

// Verificar se as constantes JWT estão definidas
console.log('Verificando configuração JWT:');
console.log('JWT_SECRET está definido:', process.env.JWT_SECRET ? 'SIM' : 'NÃO');
console.log('JWT_EXPIRES_IN está definido:', process.env.JWT_EXPIRES_IN ? 'SIM' : 'NÃO');

// Usar valores padrão se não estiverem definidos
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_temporaria_para_testes';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

console.log('Valores que serão usados:');
console.log('JWT_SECRET:', JWT_SECRET);
console.log('JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

// Criar um usuário de teste
const testUser = {
  id: 999,
  name: 'Usuário Teste',
  email: 'teste@exemplo.com',
  role: 'admin',
  baseId: null,
  oficinaId: null
};

// Gerar um token JWT para o usuário de teste
try {
  const payload = {
    sub: testUser.id,
    name: testUser.name,
    email: testUser.email,
    role: testUser.role,
    baseId: testUser.baseId,
    oficinaId: testUser.oficinaId
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  console.log('Token JWT gerado com sucesso:');
  console.log(token);

  // Verificar o token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verificado com sucesso:');
    console.log(decoded);
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
  }
} catch (error) {
  console.error('Erro ao gerar token JWT:', error.message);
}