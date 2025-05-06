/**
 * Rotas para gerenciamento de usuários
 * Estas rotas usam autenticação por sessão em vez de JWT
 */

import { Router } from 'express';
import { pool } from '../db';

// Middleware para verificar autenticação
const isAuthenticated = (req: any, res: any, next: any) => {
  console.log('[Middleware isAuthenticated] Estado de autenticação:', {
    isAuthenticated: req.isAuthenticated?.() || false,
    hasSession: !!req.session,
    sessionID: req.sessionID,
    user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null
  });
  
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
  console.log('[Middleware adminRequired] Verificando usuário admin:', {
    isAuthenticated: req.isAuthenticated?.() || false,
    role: req.user?.role || 'não definido'
  });
  
  // Verificar se o usuário está autenticado e é um administrador
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar esta rota.'
    });
  }
  
  next();
};

// Rota pública para diagnóstico de sessão
router.get('/session-diagnostic', (req: any, res: any) => {
  console.log('[UsuariosRoutes] Diagnóstico de sessão solicitado');
  
  // Informações da sessão
  const sessionInfo = {
    hasSession: !!req.session,
    sessionID: req.sessionID || 'sem ID de sessão',
    isAuthenticated: req.isAuthenticated?.() || false,
    sessionData: req.session ? { ...req.session, cookie: req.session.cookie ? {
      maxAge: req.session.cookie.maxAge,
      expires: req.session.cookie.expires,
      httpOnly: req.session.cookie.httpOnly,
      secure: req.session.cookie.secure,
      sameSite: req.session.cookie.sameSite
    } : 'sem cookie' } : 'sem dados',
    user: req.user ? {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    } : 'não autenticado',
    cookies: req.headers.cookie,
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent']
    }
  };
  
  return res.status(200).json({
    success: true,
    sessionInfo
  });
});

// Listar todos os usuários (apenas admin)
router.get('/users/list', isAuthenticated, adminRequired, async (req: any, res: any) => {
  try {
    console.log('[UsuariosRoutes] Listando usuários via sessão');
    console.log('[UsuariosRoutes] Verificando autenticação:', {
      isAuthenticated: req.isAuthenticated?.() || false,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      } : null
    });
    
    // Simplificando ao máximo a consulta para encontrar o problema
    try {
      // Consulta simples - apenas os campos básicos
      const query = `
        SELECT 
          id, 
          name, 
          email, 
          role, 
          base_id as "baseId", 
          basename as "baseName", 
          oficina_id as "oficinaId", 
          is_active as "isActive", 
          created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM 
          users
        ORDER BY 
          name
      `;
      
      console.log('[UsuariosRoutes] Executando consulta SQL simplificada...');
      
      const result = await pool.query(query);
      console.log(`[UsuariosRoutes] ${result.rows.length} usuário(s) encontrado(s)`);
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        users: result.rows
      });
    } catch (queryErr: any) {
      console.error('[UsuariosRoutes] Erro na consulta SQL:', queryErr);
      return res.status(500).json({
        success: false,
        message: 'Erro na consulta SQL: ' + queryErr.message,
        error: queryErr
      });
    }
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

// APENAS PARA TESTES: Rota sem autenticação para listar usuários (remover em produção)
router.get('/users/list-debug', async (req: any, res: any) => {
  try {
    console.log('[UsuariosRoutes] Listando usuários SEM autenticação (rota de debug)');
    
    try {
      // Consulta simples
      const query = `
        SELECT 
          id, 
          name, 
          email, 
          role
        FROM 
          users
        ORDER BY 
          name
        LIMIT 10
      `;
      
      console.log('[UsuariosRoutes] Executando consulta SQL de debug...');
      
      const result = await pool.query(query);
      console.log(`[UsuariosRoutes] ${result.rows.length} usuário(s) encontrado(s) em debug`);
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        users: result.rows
      });
    } catch (queryErr: any) {
      console.error('[UsuariosRoutes] Erro na consulta SQL de debug:', queryErr);
      return res.status(500).json({
        success: false,
        message: 'Erro na consulta SQL de debug: ' + queryErr.message,
        error: queryErr
      });
    }
  } catch (error) {
    console.error('[UsuariosRoutes] Erro ao listar usuários debug:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários debug',
      error: String(error)
    });
  }
});

export default router;