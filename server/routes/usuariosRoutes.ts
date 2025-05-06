/**
 * Rotas para gerenciamento de usuários
 * Estas rotas usam autenticação por sessão em vez de JWT
 */

import { Router } from 'express';
import { pool } from '../db';

// Middleware para verificar autenticação
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Não autenticado'
  });
};

const router = Router();

// Middleware para verificar se o usuário é um administrador
const adminRequired = (req: any, res: any, next: any) => {
  // Verificar se o usuário está autenticado e é um administrador
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar esta rota.'
    });
  }
  
  next();
};

// Listar todos os usuários (apenas admin)
router.get('/users/list', isAuthenticated, adminRequired, async (req: any, res: any) => {
  try {
    console.log('[UsuariosRoutes] Listando usuários via sessão');
    
    // Extrair filtros da query string
    const { role, baseId, active } = req.query;
    
    // Construir a consulta SQL
    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.base_id as "baseId", 
        b.name as "baseName", 
        u.oficina_id as "oficinaId", 
        u.is_active as "isActive", 
        u.created_at as "createdAt", 
        u.updated_at as "updatedAt"
      FROM 
        users u
      LEFT JOIN 
        bases b ON u.base_id = b.id
    `;
    
    // Adicionar filtros
    const conditions = [];
    const params = [];
    
    if (role) {
      conditions.push('u.role = $' + (params.length + 1));
      params.push(role);
    }
    
    if (baseId) {
      conditions.push('u.base_id = $' + (params.length + 1));
      params.push(baseId);
    }
    
    if (active !== undefined) {
      conditions.push('u.is_active = $' + (params.length + 1));
      params.push(active === 'true');
    }
    
    // Adicionar condições à query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Ordenar por nome
    query += ' ORDER BY u.name';
    
    console.log('[UsuariosRoutes] Executando consulta SQL:', query);
    
    const result = await pool.query(query, params);
    
    console.log(`[UsuariosRoutes] ${result.rows.length} usuário(s) encontrado(s)`);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    console.error('[UsuariosRoutes] Erro ao listar usuários:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: String(error)
    });
  }
});

// Obter um usuário específico pelo ID (apenas admin)
router.get('/users/:id', isAuthenticated, adminRequired, async (req: any, res: any) => {
  try {
    const userId = req.params.id;
    
    const query = {
      text: `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.role, 
          u.base_id as "baseId", 
          b.name as "baseName", 
          u.oficina_id as "oficinaId", 
          u.is_active as "isActive", 
          u.created_at as "createdAt", 
          u.updated_at as "updatedAt"
        FROM 
          users u
        LEFT JOIN 
          bases b ON u.base_id = b.id
        WHERE 
          u.id = $1
      `,
      values: [userId]
    };
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Usuário com ID ${userId} não encontrado`
      });
    }
    
    return res.status(200).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[UsuariosRoutes] Erro ao obter usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter usuário',
      error: String(error)
    });
  }
});

export default router;