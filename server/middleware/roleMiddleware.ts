/**
 * Middleware para controle de acesso baseado em papéis (roles)
 * Usado para proteger rotas com base em funções específicas dos usuários
 */
import { Request, Response, NextFunction } from 'express';

// Interface para tipagem correta da requisição autenticada
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    baseId?: number;
    oficinaId?: number;
  };
}

/**
 * Middleware para verificar se o usuário é administrador
 */
export function verifyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Não autenticado',
      message: 'É necessário estar autenticado para acessar este recurso'
    });
  }

  if (req.user.role !== 'admin') {
    console.log(`[RoleMiddleware] Acesso admin negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Esta operação requer privilégios de administrador'
    });
  }

  console.log(`[RoleMiddleware] Acesso admin permitido para usuário ${req.user.id} (${req.user.email})`);
  next();
}

/**
 * Middleware para verificar se o usuário é gestor de frota
 */
export function verifyFleetManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Não autenticado',
      message: 'É necessário estar autenticado para acessar este recurso'
    });
  }

  const allowedRoles = ['admin', 'gestor_frota'];
  
  if (!allowedRoles.includes(req.user.role)) {
    console.log(`[RoleMiddleware] Acesso gestor frota negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Esta operação requer privilégios de gestor de frota'
    });
  }

  console.log(`[RoleMiddleware] Acesso gestor frota permitido para usuário ${req.user.id} (${req.user.email})`);
  next();
}

/**
 * Middleware para verificar se o usuário tem acesso à gestão de postos
 */
export function verifyFuelStationAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Não autenticado',
      message: 'É necessário estar autenticado para acessar este recurso'
    });
  }

  const allowedRoles = ['admin', 'gestor_frota', 'posto'];
  
  if (!allowedRoles.includes(req.user.role)) {
    console.log(`[RoleMiddleware] Acesso posto negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Esta operação requer privilégios de gestão de postos'
    });
  }

  console.log(`[RoleMiddleware] Acesso posto permitido para usuário ${req.user.id} (${req.user.email})`);
  next();
}

/**
 * Middleware para verificar se o usuário tem acesso à gestão de pneus
 */
export function verifyTireAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Não autenticado',
      message: 'É necessário estar autenticado para acessar este recurso'
    });
  }

  const allowedRoles = ['admin', 'gestor_frota', 'pneus'];
  
  if (!allowedRoles.includes(req.user.role)) {
    console.log(`[RoleMiddleware] Acesso pneus negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Esta operação requer privilégios de gestão de pneus'
    });
  }

  console.log(`[RoleMiddleware] Acesso pneus permitido para usuário ${req.user.id} (${req.user.email})`);
  next();
}

/**
 * Middleware para verificar se o usuário é gestor de base
 */
export function verifyBaseManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Não autenticado',
      message: 'É necessário estar autenticado para acessar este recurso'
    });
  }

  const allowedRoles = ['admin', 'gestor', 'gestor_frota'];
  
  if (!allowedRoles.includes(req.user.role)) {
    console.log(`[RoleMiddleware] Acesso gestor base negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Esta operação requer privilégios de gestor'
    });
  }

  console.log(`[RoleMiddleware] Acesso gestor base permitido para usuário ${req.user.id} (${req.user.email})`);
  next();
}

/**
 * Middleware para verificar se o usuário tem alguma das roles especificadas
 */
export function verifyRoles(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`[RoleMiddleware] Acesso negado para usuário ${req.user.id} (${req.user.email}) com role ${req.user.role}`);
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      });
    }

    console.log(`[RoleMiddleware] Acesso permitido para usuário ${req.user.id} (${req.user.email})`);
    next();
  };
}