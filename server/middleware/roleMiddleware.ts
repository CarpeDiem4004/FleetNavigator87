/**
 * Middleware para verificação de papéis/funções de usuário
 */
import { Request, Response, NextFunction } from 'express';

// Interface para o usuário autenticado (estendendo a Request)
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware para verificar se o usuário é administrador
 * @param req Request (requisição)
 * @param res Response (resposta)
 * @param next NextFunction (próxima função na cadeia)
 */
export const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Verificar se o usuário está autenticado
  if (!req.user) {
    return res.status(401).json({ error: 'Acesso negado', details: 'Usuário não autenticado' });
  }

  // Verificar se o usuário é administrador
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado', 
      details: 'Esta operação requer privilégios de administrador'
    });
  }

  // Usuário é administrador, prosseguir
  next();
};

/**
 * Middleware para verificar se o usuário é administrador ou gestor de frota
 * @param req Request (requisição)
 * @param res Response (resposta)
 * @param next NextFunction (próxima função na cadeia)
 */
export const verifyFleetManager = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Verificar se o usuário está autenticado
  if (!req.user) {
    return res.status(401).json({ error: 'Acesso negado', details: 'Usuário não autenticado' });
  }

  // Verificar se o usuário é administrador ou gestor de frota
  if (req.user.role !== 'admin' && req.user.role !== 'gestor_frota') {
    return res.status(403).json({ 
      error: 'Acesso negado', 
      details: 'Esta operação requer privilégios de administrador ou gestor de frota'
    });
  }

  // Usuário tem permissão, prosseguir
  next();
};

/**
 * Middleware para verificar se o usuário possui algum dos papéis informados
 * @param roles Array de papéis permitidos
 * @returns Middleware de verificação de papel
 */
export const verifyRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Verificar se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado', details: 'Usuário não autenticado' });
    }

    // Verificar se o papel do usuário está na lista de papéis permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Você não tem permissão para acessar este recurso'
      });
    }

    // Usuário tem um papel permitido, prosseguir
    next();
  };
};