/**
 * API para gerenciamento de usuários híbrida
 * Funciona tanto no ambiente Replit quanto externamente
 */
import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabaseConnection';
import { pool as dbPool } from '../db';

// Criar routers separados para usuários e autenticação
const router = express.Router();
const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'murici-hybrid-auth-secret-key-2025';
const JWT_EXPIRY = '7d'; // 7 dias

/**
 * Middleware para verificar autenticação JWT
 * Verifica se o token JWT é válido e adiciona o usuário ao objeto de requisição
 */
const verifyJwt = async (req: any, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('JWT não fornecido no cabeçalho Authorization');
      return res.status(401).json({ success: false, message: 'Não autenticado - Token não fornecido' });
    }
    
    // Garantir que o formato é "Bearer TOKEN"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Formato inválido do token JWT:', authHeader);
      return res.status(401).json({ success: false, message: 'Formato de token inválido' });
    }
    
    const token = parts[1];
    
    try {
      // Verificar o token JWT
      const decoded: any = jwt.verify(token, JWT_SECRET);
      // Adicionar usuário decodificado à requisição para uso nas rotas
      req.user = decoded;
      
      // Log para debug
      console.log('Verificação de JWT bem-sucedida para:', decoded.email);
      
      // Verificação de admin para rotas de usuários
      if (req.baseUrl.includes('/users') && decoded.role !== 'admin') {
        console.log('Acesso negado: apenas admins podem gerenciar usuários. Usuário atual:', decoded.role);
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso restrito apenas a administradores' 
        });
      }
      
      next();
    } catch (jwtError) {
      console.log('Erro ao verificar token JWT:', jwtError);
      return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
    }
  } catch (error) {
    console.error('Erro não tratado no middleware verifyJwt:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

/**
 * Obter uma conexão com o banco
 */
const getDbConnection = (): Pool => {
  try {
    // Usar o pool importado no topo do arquivo
    if (dbPool) {
      return dbPool;
    }
    
    throw new Error('Não foi possível obter conexão com o banco de dados');
  } catch (error) {
    console.error('Erro ao obter conexão com o banco:', error);
    throw error;
  }
};

/**
 * Rota para listar todos os usuários
 * GET /api/hybrid/users (caminho simplificado: /)
 */
router.get('/', verifyJwt, async (req: any, res) => {
  try {
    const pool = getDbConnection();
    
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.base_id as "baseId",
        b.name as "baseName",
        u.last_login as "lastLogin",
        u.is_active as "isActive"
      FROM 
        users u
      LEFT JOIN 
        bases b ON u.base_id = b.id
      ORDER BY 
        u.name ASC
    `);
    
    return res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar usuários'
    });
  }
});

/**
 * Rota para obter um usuário pelo ID
 * GET /api/hybrid/users/:id (caminho simplificado: /:id)
 */
router.get('/:id', verifyJwt, async (req: any, res) => {
  try {
    const { id } = req.params;
    const pool = getDbConnection();
    
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.base_id as "baseId",
        b.name as "baseName",
        u.last_login as "lastLogin",
        u.is_active as "isActive"
      FROM 
        users u
      LEFT JOIN 
        bases b ON u.base_id = b.id
      WHERE 
        u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    return res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar usuário'
    });
  }
});

/**
 * Rota para criar um novo usuário
 * POST /api/hybrid/users (caminho simplificado: /)
 */
router.post('/', verifyJwt, async (req: any, res) => {
  try {
    const { name, email, role, password, baseId, isActive = true } = req.body;
    
    // Validação básica
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e perfil são obrigatórios'
      });
    }
    
    const pool = getDbConnection();
    
    // Verificar se o email já está em uso
    const existingUser = await pool.query(`
      SELECT id FROM users WHERE email = $1
    `, [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está em uso'
      });
    }
    
    // Gerar senha aleatória se não fornecida
    let generatedPassword: string | null = null;
    let hashedPassword: string;
    
    if (password) {
      // Usar senha fornecida
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Gerar senha aleatória
      generatedPassword = generateRandomPassword(10);
      hashedPassword = await bcrypt.hash(generatedPassword, 10);
    }
    
    // Inserir usuário no banco
    const result = await pool.query(`
      INSERT INTO users (name, email, password, role, base_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, base_id as "baseId", is_active as "isActive"
    `, [name, email, hashedPassword, role, baseId || null, isActive]);
    
    // Se base_id foi fornecido, buscar o nome da base
    let baseName = null;
    if (baseId) {
      const baseResult = await pool.query(`
        SELECT name FROM bases WHERE id = $1
      `, [baseId]);
      
      if (baseResult.rows.length > 0) {
        baseName = baseResult.rows[0].name;
      }
    }
    
    // Adicionar baseName ao resultado
    const newUser = {
      ...result.rows[0],
      baseName
    };
    
    return res.status(201).json({
      success: true,
      user: newUser,
      ...(generatedPassword ? { generatedPassword } : {})
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar usuário'
    });
  }
});

/**
 * Rota para atualizar um usuário
 * PUT /api/hybrid/users/:id (caminho simplificado: /:id)
 */
router.put('/:id', verifyJwt, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, baseId, isActive } = req.body;
    
    // Validação básica
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e perfil são obrigatórios'
      });
    }
    
    const pool = getDbConnection();
    
    // Verificar se o usuário existe
    const userExists = await pool.query(`
      SELECT id FROM users WHERE id = $1
    `, [id]);
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se o email já está em uso por outro usuário
    const existingEmail = await pool.query(`
      SELECT id FROM users WHERE email = $1 AND id != $2
    `, [email, id]);
    
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está em uso por outro usuário'
      });
    }
    
    // Atualizar usuário no banco
    await pool.query(`
      UPDATE users
      SET name = $1, email = $2, role = $3, base_id = $4, is_active = $5
      WHERE id = $6
    `, [name, email, role, baseId || null, isActive, id]);
    
    // Buscar usuário atualizado com nome da base
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.base_id as "baseId",
        b.name as "baseName",
        u.last_login as "lastLogin",
        u.is_active as "isActive"
      FROM 
        users u
      LEFT JOIN 
        bases b ON u.base_id = b.id
      WHERE 
        u.id = $1
    `, [id]);
    
    return res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar usuário'
    });
  }
});

/**
 * Rota para excluir um usuário
 * DELETE /api/hybrid/users/:id (caminho simplificado: /:id)
 */
router.delete('/:id', verifyJwt, async (req: any, res) => {
  try {
    const { id } = req.params;
    const pool = getDbConnection();
    
    // Verificar se o usuário existe
    const userExists = await pool.query(`
      SELECT id FROM users WHERE id = $1
    `, [id]);
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Impedir exclusão do próprio usuário logado
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir seu próprio usuário'
      });
    }
    
    // Exclusão lógica (marcar como inativo) em vez de remoção real
    await pool.query(`
      UPDATE users
      SET is_active = false
      WHERE id = $1
    `, [id]);
    
    return res.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao excluir usuário'
    });
  }
});

/**
 * Rota para atualizar status do usuário (ativo/inativo)
 * PATCH /api/hybrid/users/:id/status (caminho simplificado: /:id/status)
 */
router.patch('/:id/status', verifyJwt, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status não fornecido'
      });
    }
    
    const pool = getDbConnection();
    
    // Verificar se o usuário existe
    const userExists = await pool.query(`
      SELECT id FROM users WHERE id = $1
    `, [id]);
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Atualizar status no banco
    await pool.query(`
      UPDATE users
      SET is_active = $1
      WHERE id = $2
    `, [isActive, id]);
    
    return res.json({
      success: true,
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status do usuário:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar status do usuário'
    });
  }
});

/**
 * Rota para redefinir a senha de um usuário
 * POST /api/hybrid/users/:id/reset-password (caminho simplificado: /:id/reset-password)
 */
router.post('/:id/reset-password', verifyJwt, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const pool = getDbConnection();
    
    // Verificar se o usuário existe
    const userExists = await pool.query(`
      SELECT id FROM users WHERE id = $1
    `, [id]);
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Gerar nova senha se não fornecida
    let newPassword = password;
    if (!newPassword) {
      newPassword = generateRandomPassword(10);
    }
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha no banco
    await pool.query(`
      UPDATE users
      SET password = $1
      WHERE id = $2
    `, [hashedPassword, id]);
    
    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      newPassword: newPassword // Retornar a senha apenas se foi gerada automaticamente
    });
  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao redefinir senha'
    });
  }
});

/**
 * Rota para autenticação e geração de token JWT
 * POST /api/hybrid/auth/login (caminho simplificado: /auth/login)
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    const pool = getDbConnection();
    
    // Buscar usuário pelo email
    const result = await pool.query(`
      SELECT 
        id, name, email, password, role, base_id as "baseId", 
        is_active as "isActive"
      FROM 
        users 
      WHERE 
        email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário desativado. Entre em contato com o administrador.'
      });
    }
    
    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Remover a senha do objeto de usuário
    delete user.password;
    
    // Buscar nome da base (se aplicável)
    if (user.baseId) {
      const baseResult = await pool.query(`
        SELECT name FROM bases WHERE id = $1
      `, [user.baseId]);
      
      if (baseResult.rows.length > 0) {
        user.baseName = baseResult.rows[0].name;
      }
    }
    
    // Atualizar last_login
    await pool.query(`
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
    `, [user.id]);
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        baseId: user.baseId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    return res.json({
      success: true,
      token,
      user
    });
  } catch (error: any) {
    console.error('Erro de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar login'
    });
  }
});

/**
 * Rota para verificar se um token JWT é válido
 * GET /api/hybrid/auth/verify (caminho simplificado: /auth/verify)
 */
authRouter.get('/verify', verifyJwt, (req: any, res) => {
  // Se chegou aqui, o token é válido
  return res.json({
    success: true,
    message: 'Token válido',
    user: req.user
  });
});

/**
 * Função auxiliar para gerar senha aleatória
 */
function generateRandomPassword(length: number = 10): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  
  // Garantir pelo menos um caractere de cada categoria
  password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // minúscula
  password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // maiúscula
  password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // número
  password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // especial
  
  // Preencher o restante da senha aleatoriamente
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Embaralhar a senha para que os caracteres obrigatórios não fiquem sempre nas mesmas posições
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Exportar tanto o router de usuários quanto o de autenticação
export { router, authRouter };