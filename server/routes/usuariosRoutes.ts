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
    
    try {
      console.log('[UsuariosRoutes] Testando pool do banco antes da consulta:', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
      
      // ABORDAGEM EXTREMAMENTE SIMPLIFICADA
      // Removendo campos possivelmente problemáticos
      const query = `
        SELECT 
          id, 
          name, 
          email, 
          role,
          is_active AS "isActive"
        FROM 
          users
        LIMIT 50
      `;
      
      console.log('[UsuariosRoutes] Executando consulta minimalista...');
      
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
        stack: queryErr.stack
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

// APENAS PARA TESTES: Rota sem autenticação para verificar a conexão com o banco
// Esta rota é pública, sem necessidade de autenticação.
router.get('/users/list-debug', async (req: any, res: any) => {
  // Esta rota não usa o middleware de autenticação para permitir diagnóstico
  console.log('[UsuariosRoutes] Executando rota de diagnóstico (sem autenticação)');
  try {
    console.log('[UsuariosRoutes] Teste de conexão ao banco (rota de debug)');
    
    // Primeiro tentamos executar um comando simples para verificar a conexão
    try {
      console.log('[UsuariosRoutes] Testando conexão com SELECT NOW()...');
      
      // Teste de conexão básico
      const testResult = await pool.query('SELECT NOW() as current_time');
      
      console.log('[UsuariosRoutes] Conexão bem-sucedida, hora atual:', testResult.rows[0].current_time);
      
      // Testar consulta simples para contar usuários
      const countResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
      
      console.log(`[UsuariosRoutes] Total de ${countResult.rows[0].user_count} usuário(s) no banco`);
      
      // Se chegou até aqui, o banco de dados está funcionando
      return res.status(200).json({
        success: true,
        connection: "OK",
        timestamp: testResult.rows[0].current_time,
        user_count: parseInt(countResult.rows[0].user_count),
        database_info: {
          pool_total_count: pool.totalCount,
          pool_idle_count: pool.idleCount,
          pool_waiting_count: pool.waitingCount,
          connection_string: process.env.DATABASE_URL?.substring(0, 20) + '...'
        }
      });
    } catch (dbErr: any) {
      console.error('[UsuariosRoutes] Erro de conexão com o banco:', dbErr);
      return res.status(500).json({
        success: false,
        message: 'Erro na conexão com o banco: ' + dbErr.message,
        error: dbErr
      });
    }
  } catch (error) {
    console.error('[UsuariosRoutes] Erro geral no teste de conexão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro geral no teste de conexão',
      error: String(error)
    });
  }
});

export default router;