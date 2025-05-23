/**
 * Utilitários para trabalhar com JWT
 * Este arquivo fornece funções para verificar e validar tokens JWT
 */
import jwt from 'jsonwebtoken';
import { pool } from '../database.js';

// Chave secreta para assinatura JWT (usar uma variável de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET || 'murici-on-fleet-secret-key-2025';

/**
 * Middleware para verificar se o token JWT é válido
 */
export function verifyJWT(req, res, next) {
  // Obter o token do cabeçalho Authorization
  const authHeader = req.headers['authorization'];
  
  // Verificar se existe um token no formato correto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token não fornecido ou em formato inválido'
    });
  }
  
  // Extrair o token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar o token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Adicionar as informações do usuário decodificadas à requisição
    req.user = decoded;
    
    // Em um ambiente de desenvolvimento, podemos adicionar logs de debug
    if (process.env.NODE_ENV === 'development') {
      console.log('[JWT Verify] Usando modo de desenvolvimento para usuário ID:', decoded.id);
    }
    
    // Verificar se o usuário existe no banco de dados
    getUserFromToken(decoded.id)
      .then(user => {
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        
        // Continuar com a requisição
        next();
      })
      .catch(error => {
        console.error('Erro ao obter dados do usuário:', error);
        // Permitir a requisição mesmo com erro no banco (para fins de desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          next();
        } else {
          res.status(500).json({
            success: false,
            message: 'Erro interno ao verificar token'
          });
        }
      });
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
}

/**
 * Buscar dados do usuário no banco de dados
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} - Dados do usuário
 */
async function getUserFromToken(userId) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      console.log('Dados do usuário por ID:', result.rows[0]);
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    return null;
  }
}

/**
 * Criar um novo token JWT para um usuário
 * @param {Object} user - Dados do usuário
 * @returns {string} - Token JWT
 */
export function generateJWT(user) {
  // Campos que queremos incluir no token
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  
  // Assinar o token (expira em 30 dias)
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}