/**
 * auth-utils.js
 * Utilitários para autenticação unificada no sistema
 * 
 * Este módulo implementa um sistema de autenticação unificado que funciona
 * com qualquer um dos métodos de autenticação do sistema:
 * 
 * 1. Sessão Express tradicional (req.isAuthenticated)
 * 2. Token JWT nos headers (Authorization: Bearer TOKEN)
 * 3. Token JWT em cookies (authToken ou supabase-auth-token)
 * 4. Token Supabase (validado contra a API do Supabase)
 * 
 * COMO USAR:
 * 
 * 1. Para proteger rotas que exigem apenas autenticação:
 *    router.get('/rota-protegida', unifiedAuthMiddleware, (req, res) => {...});
 * 
 * 2. Para proteger rotas que exigem permissão de administrador:
 *    router.post('/rota-admin', unifiedAuthMiddleware, adminRoleMiddleware, (req, res) => {...});
 * 
 * 3. Para proteger rotas que exigem roles específicas:
 *    router.get('/rota-gestor', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), (req, res) => {...});
 * 
 * IMPORTANTE: Esse módulo está sendo usado para migrar todas as APIs para um padrão
 * consistente de autenticação, eliminando implementações específicas.
 */
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Chave para JWT
// Usamos a ANON_KEY do Supabase como o segredo para JWT
// Isso garante compatibilidade com a verificação no Supabase
const JWT_SECRET = process.env.VITE_SUPABASE_ANON_KEY || 'murici-hybrid-auth-secret-key-2025';

/**
 * Middleware para autenticação unificada
 * Verifica token JWT, sessão tradicional ou autenticação Supabase
 */
export async function unifiedAuthMiddleware(req, res, next) {
  try {
    console.log('[UnifiedAuth] Verificando autenticação para:', {
      path: req.path,
      method: req.method,
      hasSession: !!req.session,
      hasSessionID: !!req.sessionID,
      hasAuthorization: !!req.headers.authorization,
      hasCookies: !!req.headers.cookie
    });

    // ESTRATÉGIA 1: Verificar se o usuário já está autenticado via sessão Express
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log('[UnifiedAuth] Autenticado via sessão Express:', req.user.id, req.user.email);
      return next();
    }

    // ESTRATÉGIA 2: Obter token de diferentes fontes
    let token = null;

    // Verificar Authorization header (Bearer token)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('[UnifiedAuth] Token obtido do header Authorization');
    } 
    // Verificar cookies
    else if (req.cookies?.authToken) {
      token = req.cookies.authToken;
      console.log('[UnifiedAuth] Token obtido do cookie authToken');
    }
    else if (req.cookies?.['supabase-auth-token']) {
      try {
        const tokenData = JSON.parse(req.cookies['supabase-auth-token']);
        token = tokenData.access_token;
        console.log('[UnifiedAuth] Token obtido do cookie supabase-auth-token');
      } catch (parseError) {
        console.error('[UnifiedAuth] Erro ao processar token do cookie:', parseError);
      }
    }
    
    // Se não encontrou token, tentar recuperar usuário da sessão sem passport
    if (!token && req.session?.user) {
      req.user = req.session.user;
      console.log('[UnifiedAuth] Usuário recuperado da sessão:', req.user.id, req.user.email);
      return next();
    }

    if (!token) {
      console.log('[UnifiedAuth] Nenhum token encontrado');
      return res.status(401).json({ 
        success: false, 
        message: 'Não autenticado',
        error: 'Token não fornecido'
      });
    }

    // ESTRATÉGIA 3: Verificar token JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('[UnifiedAuth] Token JWT verificado:', decoded.sub);
      
      // Se precisar validar dados do usuário, adicionar verificação adicional aqui
      req.user = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        baseId: decoded.baseId,
        oficinaId: decoded.oficinaId
      };
      
      return next();
    } catch (jwtError) {
      console.log('[UnifiedAuth] Falha ao verificar JWT, tentando Supabase:', jwtError.message);
    }

    // ESTRATÉGIA 4: Verificar token via Supabase
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data?.user) {
        throw new Error(error?.message || 'Token Supabase inválido');
      }
      
      console.log('[UnifiedAuth] Token Supabase verificado:', data.user.id);
      
      // Mapear usuário do Supabase para formato padrão do sistema
      req.user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0],
        role: data.user.user_metadata?.role || 'colaborador'
      };
      
      return next();
    } catch (supabaseError) {
      console.error('[UnifiedAuth] Falha ao verificar token Supabase:', supabaseError.message);
    }

    // Se chegou aqui, todas as estratégias falharam
    console.log('[UnifiedAuth] Todas as estratégias de autenticação falharam');
    return res.status(401).json({ 
      success: false, 
      message: 'Não autenticado',
      error: 'Token inválido ou expirado'
    });
  } catch (error) {
    console.error('[UnifiedAuth] Erro ao processar autenticação:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar autenticação',
      error: error.message
    });
  }
}

/**
 * Middleware para verificar acesso às funcionalidades de pneus
 * Usado para proteger rotas do módulo de gestão de pneus
 */
export function pneusAccessMiddleware(req, res, next) {
  if (!req.user) {
    console.log('[PneusAccess] Usuário não autenticado');
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  const allowedRoles = ['admin', 'gestor', 'pneus', 'gestor_frota'];
  
  if (!allowedRoles.includes(req.user.role)) {
    console.log(`[PneusAccess] Acesso negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
    return res.status(403).json({
      success: false,
      message: 'Acesso negado',
      error: 'Você não tem permissão para acessar o módulo de pneus'
    });
  }

  console.log(`[PneusAccess] Acesso permitido para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
  next();
}

/**
 * Middleware para verificar se o usuário é admin
 * Usado para proteger rotas que exigem permissão de administrador
 */
export function adminRoleMiddleware(req, res, next) {
  if (!req.user) {
    console.log('[AdminRole] Usuário não autenticado');
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  // Modificado para permitir que administradores e usuários autenticados do Supabase gerenciem todos os tipos de usuários
  // Isso inclui a capacidade de criar usuários com o papel de gestor_frota
  const isAdmin = req.user.role === 'admin';
  const isSupabaseAuthenticated = req.user.role === 'authenticated';
  
  if (!isAdmin && !isSupabaseAuthenticated) {
    console.log(`[AdminRole] Acesso negado para usuário ${req.user.id} (${req.user.email || 'sem email'}) com role ${req.user.role}`);
    return res.status(403).json({
      success: false,
      message: 'Acesso negado',
      error: 'Esta operação requer privilégios de administrador'
    });
  }

  console.log(`[AdminRole] Acesso admin permitido para usuário ${req.user.id} (email: ${req.user.email || 'não definido'}, role: ${req.user.role})`);
  next();
}

/**
 * Middleware para verificar permissões de usuário
 * @param {Array<string>} allowedRoles - Lista de roles permitidas
 */
export function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    try {
      // Se não há usuário autenticado
      if (!req.user) {
        console.log('[RequireRoles] Usuário não autenticado');
        return res.status(401).json({
          success: false,
          message: 'Não autenticado'
        });
      }

      // Verificar se a role do usuário está na lista de permitidas
      if (!allowedRoles.includes(req.user.role)) {
        console.log(`[RequireRoles] Acesso negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
        return res.status(403).json({
          success: false,
          message: 'Acesso negado',
          error: 'Você não tem permissão para acessar este recurso'
        });
      }

      console.log(`[RequireRoles] Acesso permitido para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
      next();
    } catch (error) {
      console.error('[RequireRoles] Erro ao verificar permissões:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões',
        error: error.message
      });
    }
  };
}

/**
 * Gera um token JWT para o usuário
 * @param {Object} user - Dados do usuário
 * @returns {string} - Token JWT
 */
export function generateToken(user) {
  try {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      baseId: user.baseId,
      oficinaId: user.oficinaId
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  } catch (error) {
    console.error('[AuthUtils] Erro ao gerar token:', error);
    throw error;
  }
}