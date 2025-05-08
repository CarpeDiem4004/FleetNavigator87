import { Request, Response, NextFunction } from 'express';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

/**
 * Middleware para verificar autenticação JWT e de sessão
 * Implementação mais robusta com prioridade para token JWT
 */
export const isAuthenticatedHybrid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[isAuthenticatedHybrid] Verificando autenticação...');
    
    // Verificar se existe header de autorização com token JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extrair token JWT
        const token = extractJwtToken(authHeader);
        console.log('[isAuthenticatedHybrid] Token JWT encontrado, verificando...');
        
        // Tentativa 1: Verificar com o Supabase
        try {
          const supabaseUser = await validateSupabaseToken(token);
          if (supabaseUser) {
            // Usuário autenticado via JWT Supabase, anexá-lo à requisição
            (req as any).supabaseUser = supabaseUser;
            console.log(`[isAuthenticatedHybrid] Token JWT Supabase validado para usuário: ${supabaseUser.email}`);
            return next();
          }
        } catch (supabaseError) {
          console.log('[isAuthenticatedHybrid] Token não é do Supabase, tentando verificar com serviço híbrido...');
        }
        
        // Tentativa 2: Verificar com o serviço híbrido
        try {
          // Importar o módulo dinamicamente para evitar dependência circular
          const hybridModule = await import('../../hybrid-user-service');
          const hybridService = hybridModule.getHybridUserService();
          
          // Verificar token com o serviço híbrido
          const verifyResult = await hybridService.verifyToken(token, true);
          
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
          }
        } catch (hybridError) {
          console.error('[isAuthenticatedHybrid] Erro ao verificar token JWT híbrido:', hybridError);
        }
        
        // Nenhum método de verificação JWT funcionou
        console.log('[isAuthenticatedHybrid] Token JWT inválido ou expirado');
      } catch (jwtError) {
        console.error('[isAuthenticatedHybrid] Erro ao processar token JWT:', jwtError);
      }
    }
    
    // Se chegou aqui, tentar autenticação por sessão como fallback
    if (req.isAuthenticated()) {
      console.log(`[isAuthenticatedHybrid] Sessão válida para usuário: ${req.user?.email}`);
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