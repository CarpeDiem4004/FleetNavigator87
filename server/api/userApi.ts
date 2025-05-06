import express from 'express';
import { userService, generateRandomPassword } from '../services/userService';

// Router específico para API de usuários
const router = express.Router();

/**
 * Rota para cadastrar um novo usuário - funciona independente do ambiente
 * Esta rota pode ser acessada externamente ao ambiente Replit
 */
router.post('/api/users/register', async (req, res) => {
  try {
    console.log('API - Requisição de cadastro de usuário recebida');
    
    // Extrair dados do corpo da requisição
    const { name, email, role, baseId, isActive } = req.body;
    
    // Verificar campos obrigatórios
    if (!name || !email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos obrigatórios: name, email, role' 
      });
    }
    
    // Verificar se o usuário já existe
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso' 
      });
    }
    
    // Gerar senha aleatória
    const password = req.body.password || generateRandomPassword(10);
    
    // Criar o usuário
    const newUser = await userService.createUser({
      name,
      email,
      password,
      role,
      baseId: baseId || null,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Resposta de sucesso (remover senha hash da resposta)
    const userResponse = { ...newUser };
    delete userResponse.password;
    
    console.log(`API - Usuário cadastrado com sucesso: ${email}`);
    return res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      user: userResponse,
      generatedPassword: req.body.password ? undefined : password // Incluir senha gerada apenas se foi automática
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao cadastrar usuário',
      error: error.message
    });
  }
});

/**
 * Rota para listar usuários
 */
router.get('/api/users/list', async (req, res) => {
  try {
    // Obter o adaptador Supabase
    const supabaseAdapter = getSupabaseAdapter();
    if (!supabaseAdapter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao inicializar o adaptador Supabase' 
      });
    }
    
    // Extrair filtros da query string
    const { role, baseId, active } = req.query;
    const filters: any = {};
    
    if (role) filters.role = role as string;
    if (baseId) filters.baseId = parseInt(baseId as string, 10);
    if (active !== undefined) filters.isActive = active === 'true';
    
    // Listar usuários
    const users = await supabaseAdapter.listUsers(filters);
    
    // Remover senhas hash da resposta
    const usersResponse = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json({
      success: true,
      count: usersResponse.length,
      users: usersResponse
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar usuários',
      error: error.message
    });
  }
});

/**
 * Rota para obter um usuário pelo ID
 */
router.get('/api/users/:id', async (req, res) => {
  try {
    // Obter o adaptador Supabase
    const supabaseAdapter = getSupabaseAdapter();
    if (!supabaseAdapter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao inicializar o adaptador Supabase' 
      });
    }
    
    // Obter ID do usuário da URL
    const { id } = req.params;
    
    // Buscar usuário
    const user = await supabaseAdapter.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Remover senha hash da resposta
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Erro ao obter usuário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter usuário',
      error: error.message
    });
  }
});

/**
 * Rota para atualizar um usuário
 */
router.put('/api/users/:id', async (req, res) => {
  try {
    // Obter o adaptador Supabase
    const supabaseAdapter = getSupabaseAdapter();
    if (!supabaseAdapter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao inicializar o adaptador Supabase' 
      });
    }
    
    // Obter ID do usuário da URL
    const { id } = req.params;
    
    // Extrair dados do corpo da requisição
    const { name, email, role, baseId, isActive } = req.body;
    
    // Verificar se o usuário existe
    const existingUser = await supabaseAdapter.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Preparar dados de atualização
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (baseId !== undefined) updateData.baseId = baseId;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Atualizar usuário
    const updatedUser = await supabaseAdapter.updateUser(id, updateData);
    
    // Remover senha hash da resposta
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar usuário',
      error: error.message
    });
  }
});

/**
 * Rota para redefinir a senha de um usuário
 */
router.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    // Obter o adaptador Supabase
    const supabaseAdapter = getSupabaseAdapter();
    if (!supabaseAdapter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao inicializar o adaptador Supabase' 
      });
    }
    
    // Obter ID do usuário da URL
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const existingUser = await supabaseAdapter.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Gerar nova senha aleatória
    const newPassword = req.body.password || generateRandomPassword(10);
    
    // Redefinir senha
    await supabaseAdapter.resetPassword(id, newPassword);
    
    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso',
      generatedPassword: req.body.password ? undefined : newPassword
    });
  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao redefinir senha',
      error: error.message
    });
  }
});

/**
 * Rota para excluir um usuário
 */
router.delete('/api/users/:id', async (req, res) => {
  try {
    // Obter o adaptador Supabase
    const supabaseAdapter = getSupabaseAdapter();
    if (!supabaseAdapter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao inicializar o adaptador Supabase' 
      });
    }
    
    // Obter ID do usuário da URL
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const existingUser = await supabaseAdapter.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Excluir usuário
    await supabaseAdapter.deleteUser(id);
    
    return res.status(200).json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir usuário',
      error: error.message
    });
  }
});

export default router;