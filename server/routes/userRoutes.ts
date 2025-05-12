/**
 * Rotas para gerenciamento de usuários
 * Este módulo adiciona as rotas para listagem, criação, edição e exclusão de usuários
 */

import express, { Request, Response } from 'express';
import { pool } from '../db';
import { isAdmin, isAuthenticated } from '../middleware/roleCheck';
import { hash } from 'bcrypt';

const router = express.Router();

/**
 * GET /api/users
 * Lista todos os usuários
 */
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log('Buscando todos os usuários, solicitado por:', req.user?.id);
    
    // Busca todos os usuários junto com informações da base (se tiver)
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.base_id as "baseId", 
             b.name as "basename", u.is_active, u.oficina_id
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      ORDER BY u.id ASC
    `);

    console.log(`Encontrados ${result.rows.length} usuários`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/users/:id
 * Obtém um usuário específico pelo ID
 */
router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário solicitante tem permissão para ver este usuário
    // Apenas admins podem ver qualquer usuário, outros só podem ver a si mesmos
    if (req.user?.role !== 'admin' && req.user?.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar este usuário'
      });
    }

    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.base_id as "baseId", 
             b.name as "basename", u.is_active, u.oficina_id
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter usuário',
      error: (error as Error).message
    });
  }
});

/**
 * POST /api/users
 * Cria um novo usuário
 */
router.post('/', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, baseId } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Informações incompletas',
        details: 'Nome, e-mail e senha são obrigatórios'
      });
    }

    // Verifica se o e-mail já está em uso
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'E-mail já cadastrado',
        details: 'Este e-mail já está sendo usado por outro usuário'
      });
    }

    // Hash da senha
    const hashedPassword = await hash(password, 10);

    // Insere o novo usuário
    const result = await pool.query(`
      INSERT INTO users (name, email, password, role, base_id, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING id, name, email, role, base_id as "baseId", is_active
    `, [name, email, hashedPassword, role || 'operador', baseId || null]);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário',
      error: (error as Error).message
    });
  }
});

/**
 * PUT /api/users/:id
 * Atualiza um usuário existente
 */
router.put('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, baseId, is_active, password } = req.body;

    // Verifica se o usuário solicitante tem permissão para editar este usuário
    // Apenas admins podem editar qualquer usuário, outros só podem editar a si mesmos
    if (req.user?.role !== 'admin' && req.user?.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para editar este usuário'
      });
    }

    // Se não for admin, não pode mudar o próprio role
    if (req.user?.role !== 'admin' && role && role !== req.user?.role) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para alterar o próprio perfil'
      });
    }

    // Verifica se o usuário existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verifica se o novo e-mail já está em uso por outro usuário
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'E-mail já cadastrado',
          details: 'Este e-mail já está sendo usado por outro usuário'
        });
      }
    }

    // Prepara a atualização dos campos
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    // Apenas admin pode mudar o role
    if (role && req.user?.role === 'admin') {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    // Apenas admin pode mudar a base
    if (baseId !== undefined && req.user?.role === 'admin') {
      updates.push(`base_id = $${paramCount}`);
      values.push(baseId === null ? null : baseId);
      paramCount++;
    }

    // Apenas admin pode ativar/desativar um usuário
    if (is_active !== undefined && req.user?.role === 'admin') {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    // Atualiza a senha se fornecida
    if (password) {
      const hashedPassword = await hash(password, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    // Adiciona o timestamp de atualização
    updates.push(`updated_at = NOW()`);

    // Se não houver campos para atualizar, retorna
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      });
    }

    // Adiciona o ID para a cláusula WHERE
    values.push(id);

    // Constrói e executa a query
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, base_id as "baseId", is_active
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: (error as Error).message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Exclui um usuário
 */
router.delete('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Não permite excluir o próprio usuário
    if (req.user?.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir o próprio usuário'
      });
    }

    // Verifica se o usuário existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Exclui o usuário - Na verdade, apenas marca como inativo para manter histórico
    await pool.query(`
      UPDATE users
      SET is_active = false, 
          updated_at = NOW()
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir usuário',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/users/reset-password/:id
 * Redefine a senha de um usuário para uma senha padrão
 */
router.post('/reset-password/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário existe
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Gera uma senha aleatória
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(tempPassword, 10);

    // Atualiza a senha
    await pool.query(`
      UPDATE users
      SET password = $1, 
          updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, id]);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      tempPassword: tempPassword
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha',
      error: (error as Error).message
    });
  }
});

export default router;