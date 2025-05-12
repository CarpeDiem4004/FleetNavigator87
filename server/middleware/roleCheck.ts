/**
 * Middleware para verificação de papéis (roles) de usuários
 * Este middleware verifica se o usuário autenticado tem o papel necessário para acessar determinados recursos
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from '../types/user';

// Estende a interface Request para incluir o usuário autenticado
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
    // Verifica se há um usuário autenticado
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autenticado' 
      });
    }

    // Verifica se o papel do usuário está na lista de papéis permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso não autorizado. Papel requerido: ' + roles.join(' ou ') 
      });
    }

    // Se passar por todas as verificações, prossegue para o próximo middleware
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
      message: 'Não autenticado' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso restrito a administradores' 
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
      message: 'Não autenticado' 
    });
  }

  console.log('isFleetManager middleware - Verificando permissão:', req.user);

  // Note que o papel (role) 'gestor_frota' é específico para gestores de frota
  // Aceita também 'admin' e 'gestor' para compatibilidade
  if (req.user.role !== 'gestor_frota' && req.user.role !== 'admin' && req.user.role !== 'gestor') {
    console.log('isFleetManager middleware - Acesso negado, papel:', req.user.role);
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso restrito a gestores de frota' 
    });
  }

  console.log('isFleetManager middleware - Acesso permitido, papel:', req.user.role);
  next();
};

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Não autenticado' 
    });
  }

  next();
};