import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from '../types/user';

// Extend a interface de Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware para verificar se o usuário tem o papel (role) necessário
 * 
 * @param roles Array de papéis permitidos
 * @returns Middleware para Express
 */
export const roleCheck = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica se existe um usuário autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Verifica se o papel do usuário está na lista de papéis permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: permissão insuficiente'
      });
    }

    // Usuário tem permissão, continua
    next();
  };
};

/**
 * Middleware para verificar se o usuário é administrador
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado: apenas administradores podem acessar esse recurso'
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário é gestor de frota
 */
export const isFleetManager = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  if (req.user.role !== 'gestor_frota' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado: apenas gestores de frota podem acessar esse recurso'
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  next();
};