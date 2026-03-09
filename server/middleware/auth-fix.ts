import { Request, Response, NextFunction } from 'express';
import { ADMIN_EMAILS, FLEET_MANAGEMENT_BASE_ID, isUserAdmin, isUserInFleetManagement, canUserAccessBase } from './constants';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de manutenção
 * Permite acesso para admin, baseId=12 (Gestão de Frotas), role='gestor' ou role='oficina'
 */
export const hasMaintenanceAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar autenticação primeiro
    console.log('[hasMaintenanceAccess] Verificando acesso para rota:', req.originalUrl, {
      isAuthenticated: req.isAuthenticated(),
      hasSession: !!req.session,
      hasSupabaseUser: !!(req as any).supabaseUser,
      hasHybridUser: !!(req as any).hybridUser,
      authHeader: !!req.headers.authorization
    });
    
    // Se não houver autenticação por sessão, Supabase ou híbrida, verificar token JWT no header
    if (!req.isAuthenticated() && !(req as any).supabaseUser && !(req as any).hybridUser) {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        console.log('[hasMaintenanceAccess] Verificando token JWT do cabeçalho Authorization');
        
        try {
          // Extrair token do header Authorization
          const token = extractJwtToken(req.headers.authorization);
          
          // Primeiro tentar validar com Supabase
          try {
            const supabaseUser = await validateSupabaseToken(token);
            if (supabaseUser) {
              (req as any).supabaseUser = supabaseUser;
              console.log(`[hasMaintenanceAccess] Token JWT Supabase validado para ${supabaseUser.email}`);
            }
          } catch (supabaseError) {
            console.log('[hasMaintenanceAccess] Token não é do Supabase:', supabaseError.message);
          }
          
          // Se ainda não temos usuário autenticado, tentar com o serviço híbrido
          if (!(req as any).supabaseUser) {
            try {
              // Importar o serviço híbrido para verificar o token JWT
              const hybridModule = await import('../../hybrid-user-service');
              const hybridService = hybridModule.getHybridUserService();
              
              // Verificar token com o serviço híbrido
              const tokenVerification = await hybridService.verifyToken(token);
              
              if (tokenVerification && tokenVerification.user) {
                // Anexar usuário verificado à requisição
                (req as any).hybridUser = tokenVerification.user;
                console.log(`[hasMaintenanceAccess] Token JWT híbrido validado para ${tokenVerification.user.email}`);
              } else {
                console.log('[hasMaintenanceAccess] Token JWT híbrido inválido ou expirado');
              }
            } catch (hybridError) {
              console.error('[hasMaintenanceAccess] Erro ao verificar token JWT híbrido:', hybridError);
            }
          }
        } catch (jwtError) {
          console.error('[hasMaintenanceAccess] Erro ao extrair token JWT:', jwtError);
        }
      }
    }
    
    // Verificar se alguma autenticação foi bem-sucedida
    if (!req.isAuthenticated() && !(req as any).supabaseUser && !(req as any).hybridUser) {
      console.log('[hasMaintenanceAccess] Acesso negado - usuário não autenticado');
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    // Obter usuário autenticado de qualquer fonte disponível
    const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
    
    console.log('[hasMaintenanceAccess] Usuário autenticado:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      baseId: user?.baseId
    });
    
    // Verificar permissões
    if (user && (
        isUserAdmin(user) ||
        (user.role && user.role.toLowerCase() === 'gestor') || 
        (user.role && user.role.toLowerCase() === 'admin') || 
        user.baseId === FLEET_MANAGEMENT_BASE_ID || 
        (user.role && user.role.toLowerCase() === 'oficina')
      )) {
      console.log('[hasMaintenanceAccess] Acesso concedido para usuário:', user.email);
      return next();
    }
    
    console.log("[hasMaintenanceAccess] Acesso negado a recurso de manutenção (permissões insuficientes):", {
      url: req.originalUrl,
      method: req.method,
      role: user?.role,
      baseId: user?.baseId,
      email: user?.email
    });
    
    return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin, gestor ou oficina necessária." });
  } catch (error) {
    console.error('[hasMaintenanceAccess] Erro inesperado:', error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};