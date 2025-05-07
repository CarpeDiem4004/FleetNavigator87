import { Request, Response, NextFunction } from 'express';
import { ADMIN_EMAILS, FLEET_MANAGEMENT_BASE_ID, isUserAdmin, isUserInFleetManagement, canUserAccessBase } from './constants';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

/**
 * Middleware para verificar se o usuário está autenticado
 * Retorna 401 se o usuário não estiver autenticado
 */

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Se o usuário está autenticado via sessão, continuar
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Verificar se existe header de autorização com token JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Tentativa de acesso não autenticado a', req.originalUrl, {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    // Extrair e validar token JWT
    const token = extractJwtToken(authHeader);
    const user = await validateSupabaseToken(token);
    
    // Usuário autenticado via JWT, anexá-lo à requisição
    (req as any).supabaseUser = user;
    
    // Continuar
    return next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    console.error('Erro ao processar autenticação:', error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

/**
 * Middleware para verificar se o usuário é administrador
 * Permite acesso para usuários com role='admin' ou emails específicos
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se existe header de autorização com token JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extrair e validar token JWT
        const token = extractJwtToken(authHeader);
        const user = await validateSupabaseToken(token);
        
        // Usuário autenticado via JWT, anexá-lo à requisição
        (req as any).supabaseUser = user;
        
        console.log(`[isAdmin] Token JWT validado para usuário: ${user.email}`);
      } catch (error) {
        console.error('[isAdmin] Erro ao validar token JWT:', error);
      }
    }
    
    // Verificar autenticação 
    if (!req.isAuthenticated() && !(req as any).supabaseUser) {
      console.log('[isAdmin] Usuário não autenticado:', {
        authHeader: !!authHeader,
        sessionAuth: req.isAuthenticated(),
        jwtAuth: !!(req as any).supabaseUser
      });
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    // Verificar se o usuário é administrador
    const user = req.user || (req as any).supabaseUser;
    if (user && isUserAdmin(user)) {
      console.log(`[isAdmin] Acesso autorizado para admin: ${user.email}, role: ${user.role}`);
      return next();
    }
    
    console.log("[isAdmin] Acesso negado - Permissão de administrador necessária:", {
      url: req.originalUrl,
      method: req.method,
      userEmail: user?.email,
      userRole: user?.role
    });
    
    return res.status(403).json({ message: "Acesso negado. Permissão de administrador necessária." });
  } catch (error) {
    console.error('[isAdmin] Erro no middleware:', error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de manutenção
 * Permite acesso para admin, gestor, oficina ou baseId=12 (Gestão de Frotas)
 */
export const hasMaintenanceAccess = (req: Request, res: Response, next: NextFunction) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  // Verifica se o usuário está autenticado e tem permissão de acesso a manutenção
  const user = req.user || (req as any).supabaseUser;
  if (user && (
      isUserAdmin(user) ||
      user.role === 'gestor' || 
      user.baseId === FLEET_MANAGEMENT_BASE_ID || 
      user.role === 'oficina'
    )) {
    return next();
  }
  
  console.log("Acesso negado a recurso de manutenção:", {
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role,
    baseId: req.user?.baseId,
    email: req.user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin, gestor ou oficina necessária." });
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de pneus
 * Permite acesso para admin, baseId=12 (Gestão de Frotas) ou role='pneus'
 */
export const hasTiresAccess = (req: Request, res: Response, next: NextFunction) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const user = req.user || (req as any).supabaseUser;
  if (user && (
    isUserAdmin(user) ||
    user.baseId === FLEET_MANAGEMENT_BASE_ID || 
    user.role === 'pneus'
  )) {
    return next();
  }
  
  console.log("Acesso negado a recurso de pneus:", {
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role,
    baseId: req.user?.baseId,
    email: req.user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin ou especialista de pneus necessária." });
};

/**
 * Middleware para verificar se o usuário tem perfil de oficina
 * Permite acesso para oficina ou admin
 */
export const isWorkshop = (req: Request, res: Response, next: NextFunction) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const user = req.user || (req as any).supabaseUser;
  if (user && (
    user.role === 'oficina' || 
    isUserAdmin(user)
  )) {
    return next();
  }
  
  console.log("Acesso negado a recurso de oficina:", {
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role,
    email: req.user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Apenas oficinas podem acessar este recurso." });
};

/**
 * Middleware para verificar se o usuário tem acesso à base especificada
 * Permite acesso para admin ou se a baseId do usuário corresponde à solicitada
 */
export const hasBaseAccess = (req: Request, res: Response, next: NextFunction) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const user = req.user || (req as any).supabaseUser;
  
  // Se o usuário for admin, permite acesso a todas as bases
  if (user && isUserAdmin(user)) {
    return next();
  }
  
  // Verificar se o usuário tem uma base associada e se corresponde à base solicitada
  const requestedBaseId = req.params.baseId || req.query.baseId;
  
  if (requestedBaseId && user && user.baseId !== undefined) {
    // Se estiver solicitando uma base específica, verificar se corresponde à do usuário
    if (parseInt(requestedBaseId as string) === user.baseId) {
      return next();
    }
  } else if (user && user.baseId !== undefined) {
    // Se não estiver solicitando uma base específica, continuar mas será filtrado depois
    return next();
  }
  
  console.log("Acesso negado à base:", {
    url: req.originalUrl,
    method: req.method,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    userBaseId: req.user?.baseId,
    requestedBaseId
  });
  
  return res.status(403).json({ message: "Acesso negado. Você não tem permissão para acessar esta base." });
};