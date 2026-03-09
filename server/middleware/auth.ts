import { Request, Response, NextFunction } from 'express';
import { ADMIN_EMAILS, FLEET_MANAGEMENT_BASE_ID, isUserAdmin, isUserInFleetManagement, canUserAccessBase } from './constants';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

export async function getUserFromRequest(req: Request): Promise<any> {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return req.user;
  }
  
  if ((req as any).supabaseUser) return (req as any).supabaseUser;
  if ((req as any).hybridUser) return (req as any).hybridUser;
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  try {
    const token = extractJwtToken(authHeader);
    
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
        return user;
      }
    } catch (e) {}
    
    try {
      const supabaseUser = await validateSupabaseToken(token);
      if (supabaseUser) {
        (req as any).supabaseUser = supabaseUser;
        return supabaseUser;
      }
    } catch (e) {}
  } catch (e) {}
  
  return null;
}

/**
 * Middleware para bloquear acesso ao módulo de combustível/cartão para o role operador_1_line_haul
 * Este role tem acesso completo ao Line Haul MAS NÃO pode acessar funcionalidades de combustível
 */
export const blockFuelCardForOperador1LineHaul = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  // Verificar se o usuário tem o role operador_1_line_haul
  if (user?.role?.toLowerCase() === 'operador_1_line_haul') {
    console.log(`[blockFuelCardForOperador1LineHaul] Acesso BLOQUEADO para ${user.email} ao módulo de combustível/cartão`);
    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este módulo.',
      error: 'ACCESS_DENIED_FUEL_CARD'
    });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário está autenticado
 * Retorna 401 se o usuário não estiver autenticado
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Se o usuário está autenticado via sessão, continuar
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Permitir acesso público às rotas de projetos e bases para formulários de postos
  if (req.path.startsWith('/api/projects') || req.path.startsWith('/api/bases') || req.path.includes('projects-with-bases')) {
    (req as any).user = { id: 1, name: 'Sistema Público', email: 'public@muricionfleet.com', role: 'admin' };
    return next();
  }

  // Permitir acesso público à validação de tokens de oficinas
  if (req.path === '/api/workshops/validate-token' || req.path === '/api/workshops/test') {
    return next();
  }
  
  // Verificar se existe header de autorização com token JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    const token = extractJwtToken(authHeader);
    
    // PRIORIDADE 1: Verificar JWT próprio (customizado) - funciona em qualquer domínio
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
        console.log(`[isAuthenticated] JWT próprio validado para: ${user.email} (${req.method} ${req.path})`);
        return next();
      }
    } catch (jwtError) {
      // JWT próprio falhou, tentar Supabase
    }
    
    // PRIORIDADE 2: Verificar com o Supabase (fallback)
    try {
      const supabaseUser = await validateSupabaseToken(token);
      if (supabaseUser) {
        (req as any).supabaseUser = supabaseUser;
        console.log(`[isAuthenticated] Token Supabase validado para: ${supabaseUser.email}`);
        return next();
      }
    } catch (supabaseError) {
      // Supabase também falhou
    }
    
    console.log(`[isAuthenticated] Token inválido para ${req.method} ${req.path}`);
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
    let user: any = null;
    
    // PRIORIDADE 1: Sessão (Passport)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      user = req.user;
    }
    
    // PRIORIDADE 2: JWT próprio (customizado)
    if (!user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = extractJwtToken(req.headers.authorization);
        
        try {
          const jwtModule = await import('../utils/jwt');
          const secret = process.env.JWT_SECRET || 'muricion-fleet-secret-key';
          const decoded = jwtModule.verifyToken(token, secret);
          
          if (decoded && (decoded.email || decoded.id)) {
            user = decoded;
            req.user = user as any;
            (req as any).user = user;
          }
        } catch (customJwtErr) {
          // JWT próprio falhou
        }
        
        // PRIORIDADE 3: Supabase (fallback)
        if (!user) {
          try {
            const supabaseUser = await validateSupabaseToken(token);
            if (supabaseUser) {
              user = supabaseUser;
              (req as any).supabaseUser = supabaseUser;
            }
          } catch (supabaseErr) {
            // Supabase também falhou
          }
        }
      } catch (extractErr) {
        // Erro ao extrair token
      }
    }
    
    if (!user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    if (user && (
        isUserAdmin(user) ||
        (user.role && user.role.toLowerCase() === 'gestor') || 
        (user.role && user.role.toLowerCase() === 'admin') || 
        user.baseId === FLEET_MANAGEMENT_BASE_ID || 
        (user.role && user.role.toLowerCase() === 'oficina') ||
        (user.role && user.role.toLowerCase() === 'line_hall')
      )) {
      return next();
    }
    
    return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin, gestor, oficina ou line_hall necessária." });
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
    let user: any = null;
    
    console.log('[isAdmin] Verificando autenticação:', {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated && req.isAuthenticated(),
      hasUser: !!req.user,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      hasAuthHeader: !!req.headers.authorization
    });
    
    // Método 1: Verificar sessão ativa primeiro (Passport)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      user = req.user as any;
      console.log(`[isAdmin] Usuário autenticado via sessão: ${user.email}, role: ${user.role}`);
    }
    
    // Método 2: Verificar token JWT se a sessão não estiver ativa
    if (!user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = extractJwtToken(req.headers.authorization);
        
        // PRIORIDADE 1: JWT próprio (customizado)
        try {
          const jwtModule = await import('../utils/jwt');
          const secret = process.env.JWT_SECRET || 'muricion-fleet-secret-key';
          const verifyResult = jwtModule.verifyToken(token, secret);
          
          if (verifyResult && (verifyResult.email || verifyResult.id)) {
            user = verifyResult;
            req.user = user as any;
            (req as any).user = user;
          }
        } catch (customJwtError) {
          // JWT próprio falhou, tentar Supabase
        }
        
        // PRIORIDADE 2: Supabase (fallback)
        if (!user) {
          try {
            const supabaseUser = await validateSupabaseToken(token);
            if (supabaseUser) {
              user = supabaseUser;
            }
          } catch (supabaseError) {
            // Supabase também falhou
          }
        }
      } catch (jwtError) {
        // Erro ao extrair token
      }
    }
    
    // Método 3: Verificar dados anexados por outros middlewares
    if (!user) {
      user = (req as any).supabaseUser || (req as any).hybridUser;
    }
    
    if (!user) {
      console.log('[isAdmin] Usuário não autenticado por nenhum método');
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    // Verificar se o usuário é admin, CEO ou gerente geral (todos com mesmo nível de acesso)
    if (user.role === 'admin' || user.role === 'ceo' || user.role === 'gerente_geral') {
      console.log(`[isAdmin] Acesso autorizado para ${user.role}: ${user.email}, role: ${user.role}`);
      return next();
    }
    
    console.log("[isAdmin] Acesso negado - Permissão de administrador necessária:", {
      email: user.email,
      role: user.role,
      requiredRole: 'admin'
    });
    
    return res.status(403).json({ message: "Acesso negado. Apenas administradores podem realizar esta ação." });
  } catch (error) {
    console.error('[isAdmin] Erro inesperado:', error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de pneus
 * Permite acesso para admin, baseId=12 (Gestão de Frotas) ou role='pneus'
 */
export const hasTiresAccess = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  if (isUserAdmin(user) || user.baseId === FLEET_MANAGEMENT_BASE_ID || user.role === 'pneus') {
    return next();
  }
  
  return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin ou especialista de pneus necessária." });
};

/**
 * Middleware para verificar se o usuário é uma oficina
 * Verifica se o usuário tem papel de oficina (role=oficina)
 */
export const isWorkshop = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  if (isUserAdmin(user) || user.role === 'oficina') {
    return next();
  }
  
  return res.status(403).json({ message: "Acesso negado. Permissão de oficina ou administrador necessária." });
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar uma base específica
 * Verifica se o usuário tem baseId igual ao parâmetro da rota ou é admin
 */
export const hasBaseAccess = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const baseId = parseInt(req.params.baseId, 10);
  
  if (isUserAdmin(user) || user.baseId === baseId) {
    return next();
  }
  
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
    console.log(`[hasMaintenanceAccessV2] 🔍 Verificando autenticação para ${req.method} ${req.path}`);
    console.log(`[hasMaintenanceAccessV2] 📋 isAuthenticated: ${req.isAuthenticated ? req.isAuthenticated() : 'false'}`);
    console.log(`[hasMaintenanceAccessV2] 👤 req.user:`, req.user ? { email: req.user.email, role: req.user.role } : 'null');
    
    // Verificar autenticação por sessão
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      console.log(`[hasMaintenanceAccessV2] ✅ Usuário autenticado por sessão: ${req.user.email}`);
      const user = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        baseId: req.user.base_id // Mapear base_id para baseId para consistência
      };
      
      // Anexar dados normalizados do usuário à requisição para uso posterior
      (req as any).user = user;
      
      // LIBERADO PARA: admin, gestor_frota, gerente_geral, CEO, gestor, operador, manutencao
      if (isUserAdmin(user) || isUserInFleetManagement(user) || 
          user.role === 'gestor' || user.role === 'operador' || user.role === 'ceo' || 
          user.role === 'gerente_geral' || user.role === 'gestor_frota' || user.role === 'manutencao') {
        console.log(`[hasMaintenanceAccessV2] Acesso concedido para usuário: ${user.email} (role: ${user.role})`);
        return next();
      }
      
      // Verificar se tem acesso à base específica quando é uma requisição para base específica
      const baseIdParam = req.params.baseId ? parseInt(req.params.baseId, 10) : null;
      if (baseIdParam && user.baseId === baseIdParam) {
        console.log(`[hasMaintenanceAccessV2] Acesso à base ${baseIdParam} concedido para usuário: ${user.email}`);
        return next();
      }
      
      // Para usuários autenticados mas sem papel específico, permitir acesso básico
      console.log(`[hasMaintenanceAccessV2] Acesso básico concedido para usuário autenticado: ${user.email} (role: ${user.role})`);
      return next();
    }
    
    // Verificar JWT token se não estiver autenticado por sessão
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extrair token
        const token = extractJwtToken(authHeader);
        
        // Verificar token JWT próprio diretamente
        const jwtModule = await import('../utils/jwt');
        const secret = process.env.JWT_SECRET || 'muricion-fleet-secret-key';
        const decoded = jwtModule.verifyToken(token, secret);
        
        if (decoded && (decoded.email || decoded.id)) {
          console.log(`[hasMaintenanceAccessV2] Token JWT próprio validado para ${decoded.email}`);
          
          // Normalizar dados do usuário
          const user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            baseId: decoded.baseId,
            basename: decoded.basename
          };
          
          // Anexar dados do usuário à requisição para uso posterior
          (req as any).user = user;
          req.user = user as any;
          
          // LIBERADO PARA: admin, gestor_frota, gerente_geral, CEO, gestor, operador, manutencao
          if (isUserAdmin(user) || isUserInFleetManagement(user) || 
              user.role === 'gestor' || user.role === 'operador' || user.role === 'ceo' || 
              user.role === 'gerente_geral' || user.role === 'gestor_frota' || user.role === 'manutencao') {
            console.log(`[hasMaintenanceAccessV2] Acesso concedido para usuário: ${user.email} (role: ${user.role})`);
            return next();
          }
          
          // Verificar acesso à base específica
          const baseIdParam = req.params.baseId ? parseInt(req.params.baseId, 10) : null;
          if (baseIdParam && user.baseId === baseIdParam) {
            console.log(`[hasMaintenanceAccessV2] Acesso à base ${baseIdParam} concedido para usuário: ${user.email}`);
            return next();
          }
          
          // Para usuários com token válido, permitir acesso básico
          console.log(`[hasMaintenanceAccessV2] Acesso básico concedido via JWT para usuário: ${user.email} (role: ${user.role})`);
          return next();
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