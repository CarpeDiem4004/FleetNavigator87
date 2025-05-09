import { Request, Response, NextFunction } from 'express';
import { ADMIN_EMAILS, FLEET_MANAGEMENT_BASE_ID, isUserAdmin, isUserInFleetManagement, canUserAccessBase } from './constants';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

/**
 * Middleware para verificar se o usuário está autenticado
 * Retorna 401 se o usuário não estiver autenticado
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Se o usuário está autenticado via sessão, continuar
  if (req.isAuthenticated()) {
    console.log(`[isAuthenticated] Sessão válida para usuário: ${req.user?.email}`);
    return next();
  }
  
  // Verificar se existe header de autorização com token JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Tentativa de acesso não autenticado a', req.originalUrl, {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    // Extrair token JWT
    const token = extractJwtToken(authHeader);
    console.log('[isAuthenticated] Token JWT encontrado, verificando com múltiplos métodos...');
    
    // Tentativa 1: Verificar com o Supabase
    try {
      const supabaseUser = await validateSupabaseToken(token);
      if (supabaseUser) {
        // Usuário autenticado via JWT Supabase, anexá-lo à requisição
        (req as any).supabaseUser = supabaseUser;
        console.log(`[isAuthenticated] Token JWT Supabase validado para usuário: ${supabaseUser.email}`);
        return next();
      }
    } catch (supabaseError) {
      console.log('[isAuthenticated] Token não é do Supabase, tentando verificar token hybrid...');
    }
    
    // Tentativa 2: Verificar com o serviço híbrido
    try {
      // Importar o módulo dinamicamente para evitar dependência circular
      const hybridModule = await import('../../hybrid-user-service');
      const hybridService = hybridModule.getHybridUserService();
      
      // Verificar token com o serviço híbrido
      const verifyResult = await hybridService.verifyToken(token);
      
      if (verifyResult && verifyResult.user) {
        // Usuário autenticado via JWT híbrido, anexá-lo à requisição
        (req as any).hybridUser = verifyResult.user;
        console.log(`[isAuthenticated] Token JWT híbrido validado para usuário: ${verifyResult.user.email}`);
        return next();
      }
    } catch (hybridError) {
      console.error('[isAuthenticated] Erro ao verificar token JWT híbrido:', hybridError);
    }
    
    // Se chegou aqui, nenhum método de verificação do token funcionou
    console.log('[isAuthenticated] Token JWT inválido ou expirado');
    return res.status(401).json({ message: "Token de autenticação inválido ou expirado" });
    
  } catch (error) {
    console.error('[isAuthenticated] Erro ao processar autenticação:', error);
    return res.status(500).json({ message: "Erro no servidor durante autenticação" });
  }
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de manutenção
 * Permite acesso para admin, baseId=12 (Gestão de Frotas), role='gestor' ou role='oficina'
 */
export const hasMaintenanceAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar autenticação primeiro usando sessão, se presente
    if (req.isAuthenticated()) {
      console.log(`[hasMaintenanceAccess] Usuário autenticado por sessão: ${req.user?.email}`);
    }
    // Se não houver autenticação por sessão, verificar token JWT no header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
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
        } catch (error) {
          const supabaseError = error as Error; 
          console.log('[hasMaintenanceAccess] Token não é do Supabase:', supabaseError.message);
        }
        
        // Se ainda não temos usuário autenticado, tentar com o serviço híbrido
        if (!(req as any).supabaseUser) {
          try {
            // Importar o serviço híbrido para verificar o token JWT
            const hybridModule = await import('../../hybrid-user-service');
            const hybridService = hybridModule.getHybridUserService();
            
            // Verificar token com o serviço híbrido
            const tokenVerification = await hybridService.verifyToken(token, true);
            
            console.log('[hasMaintenanceAccess] Resultado da verificação do token JWT híbrido:', JSON.stringify(tokenVerification));
            
            // Se o token retornou um objeto de usuário diretamente
            if (tokenVerification && !tokenVerification.user && typeof tokenVerification === 'object' && tokenVerification.id) {
              // Anexar o próprio objeto como usuário
              (req as any).hybridUser = tokenVerification;
              console.log(`[hasMaintenanceAccess] Token JWT híbrido direto validado para ${tokenVerification.email || tokenVerification.id}`);
            }
            // Se o token retornou um objeto com propriedade user
            else if (tokenVerification && tokenVerification.user) {
              // Anexar usuário verificado à requisição
              (req as any).hybridUser = tokenVerification.user;
              console.log(`[hasMaintenanceAccess] Token JWT híbrido validado para ${tokenVerification.user.email}`);
            } else {
              console.log('[hasMaintenanceAccess] Token JWT híbrido inválido ou expirado');
            }
          } catch (error) {
            const hybridError = error as Error;
            console.error('[hasMaintenanceAccess] Erro ao verificar token JWT híbrido:', hybridError.message);
          }
        }
      } catch (error) {
        const jwtError = error as Error;
        console.error('[hasMaintenanceAccess] Erro ao extrair token JWT:', jwtError.message);
      }
    } else {
      console.log('[hasMaintenanceAccess] Nenhum método de autenticação encontrado');
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
    const serverError = error as Error;
    console.error('[hasMaintenanceAccess] Erro inesperado:', serverError.message);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

/**
 * Middleware para verificar se o usuário é administrador
 * Verifica se o usuário tem papel de administrador (role=admin) ou email listado em ADMIN_EMAILS
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar se o token JWT está presente e é válido
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = extractJwtToken(req.headers.authorization);
        
        // Tentativa 1: Verificar com o Supabase
        try {
          const supabaseUser = await validateSupabaseToken(token);
          if (supabaseUser) {
            // Anexar usuário ao request
            (req as any).supabaseUser = supabaseUser;
            console.log(`[isAdmin] Token JWT Supabase validado para usuário: ${supabaseUser.email}`);
          }
        } catch (supabaseError) {
          console.log('[isAdmin] Token não é do Supabase, tentando verificar token híbrido...');
        }
        
        // Tentativa 2: Verificar com o serviço híbrido se o Supabase falhou
        if (!(req as any).supabaseUser) {
          try {
            // Importar getHybridUserService para verificar token (usando dynamic import)
            const hybridModule = await import('../../hybrid-user-service');
            const hybridService = hybridModule.getHybridUserService();
            
            // Verificar token com o serviço híbrido
            const verifyResult = await hybridService.verifyToken(token, true);
            console.log(`[isAdmin] Resultado verificação do token JWT híbrido:`, JSON.stringify(verifyResult));
            
            // Se o token retornou um objeto de usuário diretamente
            if (verifyResult && !verifyResult.user && typeof verifyResult === 'object' && verifyResult.id) {
              // Anexar o próprio objeto como usuário
              (req as any).hybridUser = verifyResult;
              console.log(`[isAdmin] Token JWT híbrido direto validado para ${verifyResult.email || verifyResult.id}`);
            }
            // Se o token retornou um objeto com propriedade user
            else if (verifyResult && verifyResult.user) {
              // Usuário autenticado via JWT híbrido, anexá-lo à requisição
              (req as any).hybridUser = verifyResult.user;
              console.log(`[isAdmin] Token JWT híbrido validado para usuário: ${verifyResult.user.email}`);
            }
          } catch (hybridError) {
            console.error('[isAdmin] Erro ao validar token JWT híbrido:', hybridError);
          }
        }
      } catch (jwtError) {
        console.error('[isAdmin] Erro ao extrair ou processar token JWT:', jwtError);
      }
    }
    
    // Verificar autenticação por qualquer método disponível
    const isUserAuthenticatedByAnyMethod = req.isAuthenticated() || 
                                          !!(req as any).supabaseUser || 
                                          !!(req as any).hybridUser;
    
    if (!isUserAuthenticatedByAnyMethod) {
      console.log('[isAdmin] Usuário não autenticado por nenhum método:', {
        authHeader: !!req.headers.authorization,
        sessionAuth: req.isAuthenticated(),
        supabaseAuth: !!(req as any).supabaseUser,
        hybridAuth: !!(req as any).hybridUser
      });
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    // Verificar se o usuário é administrador - usar o primeiro disponível
    const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
    
    if (user && isUserAdmin(user)) {
      console.log(`[isAdmin] Acesso autorizado para admin: ${user.email}, role: ${user.role}`);
      return next();
    }
    
    console.log("[isAdmin] Acesso negado - Permissão de administrador necessária:", {
      url: req.originalUrl,
      method: req.method,
      role: user?.role,
      email: user?.email
    });
    
    return res.status(403).json({ message: "Acesso negado. Permissão de administrador necessária." });
  } catch (error) {
    console.error('[isAdmin] Erro inesperado:', error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de pneus
 * Permite acesso para admin, baseId=12 (Gestão de Frotas) ou role='pneus'
 */
export const hasTiresAccess = (req: Request, res: Response, next: NextFunction) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser && !(req as any).hybridUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
  if (user && (
    isUserAdmin(user) ||
    user.baseId === FLEET_MANAGEMENT_BASE_ID || 
    user.role === 'pneus'
  )) {
    return next();
  }
  
  console.log("Acesso negado a recurso de pneus:", {
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role,
    baseId: req.user?.baseId,
    email: req.user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin ou especialista de pneus necessária." });
};

/**
 * Middleware para verificar se o usuário é uma oficina
 * Verifica se o usuário tem papel de oficina (role=oficina)
 */
export const isWorkshop = (req: Request, res: Response, next: NextFunction) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser && !(req as any).hybridUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
  if (user && (isUserAdmin(user) || user.role === 'oficina')) {
    return next();
  }
  
  console.log("Acesso negado a recurso de oficina:", {
    url: req.originalUrl,
    method: req.method,
    role: user?.role,
    email: user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão de oficina ou administrador necessária." });
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar uma base específica
 * Verifica se o usuário tem baseId igual ao parâmetro da rota ou é admin
 */
export const hasBaseAccess = (req: Request, res: Response, next: NextFunction) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser && !(req as any).hybridUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
  const baseId = parseInt(req.params.baseId, 10);
  
  if (user && (isUserAdmin(user) || user.baseId === baseId)) {
    return next();
  }
  
  console.log("Acesso negado a recurso da base:", {
    url: req.originalUrl,
    method: req.method,
    role: user?.role,
    userBaseId: user?.baseId,
    requestedBaseId: baseId,
    email: user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão para acessar esta base não concedida." });
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar recursos de manutenção
 * Permite acesso para admin, gestores de frota (role='gestor_frota') ou usuários da base específica
 * 
 * Essa função substitui a implementação anterior, implementando controle de acesso mais específico
 * para gestão de frota e manutenções.
 */
export const hasMaintenanceAccessV2 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar autenticação por sessão
    if (req.isAuthenticated() && req.user) {
      console.log(`[hasMaintenanceAccessV2] Usuário autenticado por sessão: ${req.user.email}`);
      const user = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        baseId: req.user.base_id // Mapear base_id para baseId para consistência
      };
      
      // Anexar dados normalizados do usuário à requisição para uso posterior
      (req as any).user = user;
      
      // Verificar se o usuário é admin, gestor_frota, ou usuário da gestão de frotas
      if (isUserAdmin(user) || (user.role && user.role === 'gestor_frota') || isUserInFleetManagement(user)) {
        console.log(`[hasMaintenanceAccessV2] Acesso concedido para usuário: ${user.email}`);
        return next();
      }
      
      // Verificar se tem acesso à base específica quando é uma requisição para base específica
      const baseIdParam = req.params.baseId ? parseInt(req.params.baseId, 10) : null;
      if (baseIdParam && user.baseId === baseIdParam) {
        console.log(`[hasMaintenanceAccessV2] Acesso à base ${baseIdParam} concedido para usuário: ${user.email}`);
        return next();
      }
    }
    
    // Verificar JWT token se não estiver autenticado por sessão
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extrair token
        const token = extractJwtToken(authHeader);
        
        // Tentar verificar token JWT híbrido
        const hybridModule = await import('../../hybrid-user-service');
        const hybridService = hybridModule.getHybridUserService();
        const verifyResult = await hybridService.verifyToken(token, true);
        
        if (verifyResult) {
          console.log(`[hasMaintenanceAccessV2] Token JWT híbrido validado para ${verifyResult.user?.email || verifyResult.email}`);
          
          // Normalizar dados do usuário
          const user = verifyResult.user || verifyResult;
          
          // Anexar dados do usuário à requisição para uso posterior
          (req as any).user = user;
          
          // Verificar permissões
          if (isUserAdmin(user) || (user.role && user.role === 'gestor_frota') || isUserInFleetManagement(user)) {
            console.log(`[hasMaintenanceAccessV2] Acesso concedido para usuário: ${user.email}`);
            return next();
          }
          
          // Verificar acesso à base específica
          const baseIdParam = req.params.baseId ? parseInt(req.params.baseId, 10) : null;
          if (baseIdParam && user.baseId === baseIdParam) {
            console.log(`[hasMaintenanceAccessV2] Acesso à base ${baseIdParam} concedido para usuário: ${user.email}`);
            return next();
          }
        }
      } catch (error) {
        console.error('[hasMaintenanceAccessV2] Erro ao verificar token JWT:', error);
      }
    }
    
    // Se chegou até aqui, o acesso deve ser negado
    console.log('[hasMaintenanceAccessV2] Nenhum método de autenticação encontrado');
    return res.status(401).json({ message: "Usuário não autenticado" });
    
  } catch (error) {
    console.error('[hasMaintenanceAccessV2] Erro inesperado:', error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};