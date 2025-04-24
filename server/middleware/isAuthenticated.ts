import { Request, Response, NextFunction } from 'express';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

// Re-exportar o middleware de autenticação da auth.ts para compatibilidade com código existente
export { isAuthenticated } from '../middleware/auth';

// Também exportar o isAuthenticated como isAuthenticatedBySessionOrJwt para leitura semântica mais clara
export { isAuthenticated as isAuthenticatedBySessionOrJwt } from '../middleware/auth';

/**
 * Middleware para verificar autenticação baseada em token JWT (Supabase)
 * Este middleware verifica apenas o token JWT no cabeçalho Authorization
 * e adiciona as informações do usuário a req.supabaseUser
 */
export const isJwtAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obter e validar o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Token de autenticação ausente ou inválido" });
    }
    
    const token = extractJwtToken(authHeader);
    const user = await validateSupabaseToken(token);
    
    // Anexar o usuário à requisição
    (req as any).supabaseUser = user;
    
    // Continuar
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({ message: "Token de autenticação inválido" });
    }
    console.error('Erro ao processar token JWT:', error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
};