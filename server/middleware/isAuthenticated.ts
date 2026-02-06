import { Request, Response, NextFunction } from 'express';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Permitir acesso público às rotas de projetos e bases para formulários de postos
  if (req.path.startsWith('/api/projects') || req.path.startsWith('/api/bases') || req.path.includes('projects-with-bases')) {
    (req as any).user = { id: 1, name: 'Sistema Público', email: 'public@muricionfleet.com', role: 'admin' };
    return next();
  }

  // Permitir acesso público à validação de tokens de oficinas
  if (req.path === '/api/workshops/validate-token' || req.path === '/api/workshops/test') {
    return next();
  }

  // PRIORIDADE 1: Verificar se o usuário está autenticado via sessão
  if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.id) {
    return next();
  }
  
  // PRIORIDADE 2: Verificar token JWT
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    const token = extractJwtToken(authHeader);
    
    // PRIORIDADE 2A: JWT próprio (customizado) - funciona em qualquer domínio
    try {
      const jwtModule = await import('../utils/jwt');
      const secret = process.env.JWT_SECRET || 'muricion-fleet-secret-key';
      const decoded = jwtModule.verifyToken(token, secret);
      
      if (decoded && (decoded.email || decoded.id)) {
        const user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          baseId: decoded.baseId,
          basename: decoded.basename,
          name: decoded.name || decoded.email
        };
        req.user = user as any;
        (req as any).user = user;
        return next();
      }
    } catch (jwtError) {
      // JWT próprio falhou, tentar Supabase
    }
    
    // PRIORIDADE 2B: Verificar com Supabase (fallback)
    try {
      const supabaseUser = await validateSupabaseToken(token);
      if (supabaseUser) {
        (req as any).supabaseUser = supabaseUser;
        return next();
      }
    } catch (supabaseError) {
      // Supabase também falhou
    }
    
    return res.status(401).json({ message: "Token de autenticação inválido ou expirado" });
  } catch (error) {
    return res.status(401).json({ message: "Token de autenticação inválido" });
  }
};

// Também exportar o isAuthenticated como isAuthenticatedBySessionOrJwt para leitura semântica mais clara
export const isAuthenticatedBySessionOrJwt = isAuthenticated;

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