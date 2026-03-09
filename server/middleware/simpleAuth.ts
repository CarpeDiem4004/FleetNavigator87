import { Request, Response, NextFunction } from 'express';

// Middleware simples de autenticação para teste
export const simpleAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Para testes, aceita um token de autorização simples
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer test-token')) {
    // Simular um usuário para testes
    req.user = {
      id: 999,
      email: 'teste@exemplo.com',
      role: 'admin',
      baseId: 1
    } as Express.User;
    
    // Hack para compatibilidade com middleware existente
    (req as any).isAuthenticated = () => true;
    return next();
  }
  
  return res.status(401).json({ message: "Não autorizado" });
};