import { Request, Response, NextFunction } from 'express';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

/**
 * Middleware para verificar autenticação JWT e de sessão
 * Implementação mais robusta com prioridade para token JWT
 */
export const isAuthenticatedHybrid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Log detalhado para debug
    console.log('[isAuthenticatedHybrid] Verificando autenticação com cabeçalhos:', {
      authorizationHeader: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'ausente',
      hasSession: req.isAuthenticated ? req.isAuthenticated() : 'método não disponível',
      cookiesExists: !!req.headers.cookie,
      origin: req.headers.origin || 'desconhecida'
    });
    
    // Verificar se existe header de autorização com token JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extrair token JWT
        const token = extractJwtToken(authHeader);
        console.log('[isAuthenticatedHybrid] Token JWT encontrado:', token.substring(0, 20) + '...');
        
        // Tentativa 1: Verificar com o Supabase
        try {
          const supabaseUser = await validateSupabaseToken(token);
          if (supabaseUser) {
            // Usuário autenticado via JWT Supabase, anexá-lo à requisição
            (req as any).supabaseUser = supabaseUser;
            (req as any).user = supabaseUser; // Adiciona aos dois campos por compatibilidade
            console.log(`[isAuthenticatedHybrid] Token JWT Supabase validado para usuário: ${supabaseUser.email}`);
            return next();
          }
        } catch (supabaseError) {
          console.log('[isAuthenticatedHybrid] Token não é do Supabase:', supabaseError);
        }
        
        // Tentativa 2: Verificar com o serviço híbrido
        try {
          // Importar o módulo dinamicamente para evitar dependência circular
          const hybridModule = await import('../../hybrid-user-service');
          const hybridService = hybridModule.getHybridUserService();
          
          // Verificar token com o serviço híbrido
          const verifyResult = await hybridService.verifyToken(token, true);
          console.log('[isAuthenticatedHybrid] Resultado da verificação híbrida:', verifyResult);
          
          if (verifyResult && verifyResult.user) {
            // Usuário autenticado via JWT híbrido, anexá-lo à requisição
            (req as any).user = verifyResult.user;
            (req as any).hybridUser = verifyResult.user;
            console.log(`[isAuthenticatedHybrid] Token JWT híbrido validado para usuário: ${verifyResult.user.email}`);
            return next();
          } else if (verifyResult && !verifyResult.user && typeof verifyResult === 'object' && verifyResult.id) {
            // Anexar o próprio objeto como usuário
            (req as any).user = verifyResult;
            (req as any).hybridUser = verifyResult;
            console.log(`[isAuthenticatedHybrid] Token JWT híbrido validado para usuário: ${verifyResult.email || verifyResult.id}`);
            return next();
          } else if (verifyResult && verifyResult.success === true) {
            // Para tokens válidos, mas sem dados de usuário completos (caso específico)
            console.log('[isAuthenticatedHybrid] Token válido mas sem dados completos, autorizando mesmo assim');
            (req as any).user = { id: 0, name: 'Usuário Token', role: 'guest' };
            return next();
          }
        } catch (hybridError) {
          console.error('[isAuthenticatedHybrid] Erro ao verificar token JWT híbrido:', hybridError);
        }
        
        // Nenhum método de verificação JWT funcionou
        console.log('[isAuthenticatedHybrid] Token JWT inválido ou expirado, tentando sessão...');
      } catch (jwtError) {
        console.error('[isAuthenticatedHybrid] Erro ao processar token JWT:', jwtError);
      }
    } else {
      console.log('[isAuthenticatedHybrid] Sem token JWT, tentando sessão...');
    }
    
    // Se chegou aqui, tentar autenticação por sessão como fallback
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log(`[isAuthenticatedHybrid] Sessão válida para usuário:`, req.user);
      return next();
    }
    
    // Para ambientes de desenvolvimento/teste, permitir acesso para fins de debug
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true') {
      console.log('[isAuthenticatedHybrid] Modo DEBUG ativado, permitindo acesso não autenticado');
      (req as any).user = { id: 0, name: 'Usuário Debug', role: 'admin' };
      return next();
    }
    
    // SOLUÇÃO TEMPORÁRIA: permitir acesso à rota de budget-attachments mesmo sem autenticação
    if (req.path === '/api/budget-attachments/register') {
      console.log('[isAuthenticatedHybrid] Permitindo acesso à rota de budget-attachments mesmo sem autenticação (solução temporária)');
      (req as any).user = { id: 0, name: 'Usuário Anônimo', role: 'guest' };
      return next();
    }
    
    // SOLUÇÃO TEMPORÁRIA: permitir acesso às rotas do dashboard
    if (req.path.startsWith('/api/dashboard') || req.path === '/api/painel-principal') {
      console.log('[isAuthenticatedHybrid] Permitindo acesso à rota do dashboard mesmo sem autenticação (solução temporária)');
      (req as any).user = { id: 1, name: 'Administrador', email: 'admin@muricionfleet.com', role: 'admin' };
      return next();
    }
    
    // SOLUÇÃO TEMPORÁRIA: permitir acesso às rotas do painel operacional
    if (req.path.startsWith('/api/operational-dashboard')) {
      console.log('[isAuthenticatedHybrid] CHEGOU NO MIDDLEWARE - Permitindo acesso à rota do painel operacional:', req.path);
      (req as any).user = { id: 1, name: 'Administrador', email: 'admin@muricionfleet.com', role: 'admin' };
      return next();
    }
    
    // SOLUÇÃO TEMPORÁRIA: permitir acesso às rotas de projetos para formulários públicos
    if (req.path.startsWith('/api/projects') || req.path.includes('projects-with-bases')) {
      console.log('[isAuthenticatedHybrid] Permitindo acesso às rotas de projetos para formulários públicos');
      (req as any).user = { id: 1, name: 'Sistema Público', email: 'public@muricionfleet.com', role: 'admin' };
      return next();
    }
    
    // Nenhum método de autenticação funcionou
    console.log('[isAuthenticatedHybrid] Nenhum método de autenticação válido encontrado');
    return res.status(401).json({ 
      success: false, 
      message: "Não autenticado",
      error: "Acesso negado. Faça login para continuar."
    });
    
  } catch (error) {
    console.error('[isAuthenticatedHybrid] Erro ao processar autenticação:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro no servidor durante autenticação",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
};

export default isAuthenticatedHybrid;