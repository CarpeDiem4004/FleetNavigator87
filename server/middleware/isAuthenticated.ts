import { Request, Response, NextFunction } from 'express';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

// Middleware personalizado que permite acesso público às rotas de projetos
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Permitir acesso público às rotas de projetos e bases para formulários de postos
  if (req.path.startsWith('/api/projects') || req.path.startsWith('/api/bases') || req.path.includes('projects-with-bases')) {
    console.log('[isAuthenticated] Permitindo acesso público às rotas de projetos e bases para formulários');
    (req as any).user = { id: 1, name: 'Sistema Público', email: 'public@muricionfleet.com', role: 'admin' };
    return next();
  }

  // Para outras rotas, verificar autenticação
  // PRIORIDADE 1: Verificar se o usuário está autenticado via sessão
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log(`[isAuthenticated] Sessão válida para usuário: ${req.user?.email} - IGNORANDO JWT`);
    return next();
  }
  
  // PRIORIDADE 2: Verificar token JWT APENAS se não estiver autenticado por sessão
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[isAuthenticated] Acesso negado - sem sessão e sem JWT para: ${req.originalUrl}`);
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    // Extrair token JWT
    const token = extractJwtToken(authHeader);
    console.log('[isAuthenticated] Sessão inválida, tentando JWT...');
    
    // Verificar com Supabase
    const supabaseUser = await validateSupabaseToken(token);
    if (supabaseUser) {
      (req as any).supabaseUser = supabaseUser;
      console.log(`[isAuthenticated] Token JWT validado para usuário: ${supabaseUser.email}`);
      return next();
    }
  } catch (error) {
    console.error('[isAuthenticated] Erro ao validar JWT:', error);
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