/**
 * API para gerenciamento de usuários híbrida
 * Funciona tanto no ambiente Replit quanto externamente
 */
import express from 'express';
import { getHybridUserService } from './hybrid-user-service.js';

// Criar roteador para a API
const router = express.Router();

// Obter instância do serviço de usuário
const userService = getHybridUserService();

/**
 * Middleware para verificar autenticação JWT
 * Verifica se o token JWT é válido e adiciona o usuário ao objeto de requisição
 */
const verifyJwtAuth = async (req, res, next) => {
  try {
    // Extrair token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado - Token não fornecido'
      });
    }
    
    // Verificar formato do token (Bearer TOKEN)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido'
      });
    }
    
    const token = parts[1];
    
    // Verificar token com o serviço de usuário
    const user = await userService.verifyToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    // Adicionar usuário ao objeto de requisição
    req.user = user;
    
    // Continuar para o próximo middleware/rota
    next();
  } catch (error) {
    console.error('[HybridAPI] Erro ao verificar token JWT:', error);
    return res.status(401).json({
      success: false,
      message: 'Erro ao verificar autenticação',
      error: error.message
    });
  }
};

/**
 * Rota para criar um novo usuário
 * POST /api/hybrid/users
 */
router.post('/api/hybrid/users', async (req, res) => {
  try {
    console.log('[HybridAPI] Requisição para criar usuário recebida');
    
    // Extrair dados do corpo da requisição
    const { name, email, role, baseId, isActive, password } = req.body;
    
    // Verificar campos obrigatórios
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando: name, email, role'
      });
    }
    
    // Verificar se o role é válido
    const validRoles = ['admin', 'gestor', 'operador', 'oficina', 'pneus', 'posto'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role inválido. Valores permitidos: ${validRoles.join(', ')}`
      });
    }
    
    // Verificar se o usuário já existe
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Um usuário com este email já existe'
      });
    }
    
    // Gerar senha aleatória se não foi fornecida
    const finalPassword = password || userService.generateRandomPassword(12);
    
    // Criar o usuário
    const newUser = await userService.createUser({
      name,
      email,
      password: finalPassword,
      role,
      baseId: baseId || null,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Remover senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = newUser;
    
    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword,
      generatedPassword: password ? undefined : finalPassword
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao criar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário',
      error: error.message
    });
  }
});

/**
 * Rota para obter um usuário pelo ID
 * GET /api/hybrid/users/:id
 */
router.get('/api/hybrid/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[HybridAPI] Buscando usuário com ID: ${id}`);
    
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Remover senha do objeto de resposta
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao buscar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário',
      error: error.message
    });
  }
});

/**
 * Rota para buscar usuário por email
 * GET /api/hybrid/users/email/:email
 */
router.get('/api/hybrid/users/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`[HybridAPI] Buscando usuário com email: ${email}`);
    
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Remover senha do objeto de resposta
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao buscar usuário por email:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário por email',
      error: error.message
    });
  }
});

/**
 * Rota para listar todos os usuários
 * GET /api/hybrid/users
 */
router.get('/api/hybrid/users', async (req, res) => {
  try {
    console.log('[HybridAPI] Listando usuários');
    
    // Extrair filtros da query string
    const { role, baseId, active } = req.query;
    const filters = {};
    
    if (role) filters.role = role;
    if (baseId) filters.baseId = parseInt(baseId, 10);
    if (active !== undefined) filters.isActive = active === 'true';
    
    const users = await userService.listUsers(filters);
    
    // Remover senhas dos objetos de resposta
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json({
      success: true,
      count: usersWithoutPasswords.length,
      users: usersWithoutPasswords
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao listar usuários:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: error.message
    });
  }
});

/**
 * Rota para atualizar um usuário
 * PUT /api/hybrid/users/:id
 */
router.put('/api/hybrid/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[HybridAPI] Atualizando usuário com ID: ${id}`);
    
    // Verificar se o usuário existe
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Extrair dados do corpo da requisição
    const { name, email, role, baseId, isActive } = req.body;
    
    // Verificar se o role é válido (se fornecido)
    if (role) {
      const validRoles = ['admin', 'gestor', 'operador', 'oficina', 'pneus', 'posto'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Role inválido. Valores permitidos: ${validRoles.join(', ')}`
        });
      }
    }
    
    // Atualizar usuário
    const updatedUser = await userService.updateUser(id, {
      name,
      email,
      role,
      baseId,
      isActive
    });
    
    // Remover senha do objeto de resposta
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao atualizar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: error.message
    });
  }
});

/**
 * Rota para redefinir a senha de um usuário
 * POST /api/hybrid/users/:id/reset-password
 */
router.post('/api/hybrid/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[HybridAPI] Redefinindo senha para usuário com ID: ${id}`);
    
    // Verificar se o usuário existe
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Gerar nova senha aleatória ou usar a fornecida
    const newPassword = req.body.password || userService.generateRandomPassword(12);
    
    // Redefinir senha
    await userService.resetPassword(id, newPassword);
    
    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso',
      generatedPassword: req.body.password ? undefined : newPassword
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao redefinir senha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha',
      error: error.message
    });
  }
});

/**
 * Rota para excluir um usuário
 * DELETE /api/hybrid/users/:id
 */
router.delete('/api/hybrid/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[HybridAPI] Excluindo usuário com ID: ${id}`);
    
    // Verificar se o usuário existe
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Excluir usuário
    await userService.deleteUser(id);
    
    return res.status(200).json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('[HybridAPI] Erro ao excluir usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir usuário',
      error: error.message
    });
  }
});

/**
 * Rota para autenticação e geração de token JWT
 * POST /api/hybrid/auth/login
 */
router.post('/api/hybrid/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Usar o novo método de autenticação do serviço
    const authResult = await userService.authenticateUser(email, password);
    
    if (!authResult) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Retornar token e dados do usuário
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: authResult.user,
      token: authResult.token
    });
  } catch (error) {
    console.error('[HybridAPI] Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro na autenticação',
      error: error.message
    });
  }
});

/**
 * Rota para verificar se um token JWT é válido
 * GET /api/hybrid/auth/verify
 */
router.get('/api/hybrid/auth/verify', verifyJwtAuth, (req, res) => {
  // Se chegou aqui, o token é válido e o usuário está no req.user
  return res.status(200).json({
    success: true,
    message: 'Token válido',
    user: req.user
  });
});

export default router;