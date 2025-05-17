import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { validateSupabaseToken } from '../utils/auth';

// Variáveis de ambiente Supabase (com fallbacks para desenvolvimento)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Criar cliente Supabase apenas se as credenciais estiverem definidas
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * Função para verificar autenticação
 * Pode ser usada em rotas individuais
 */
export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Não autorizado" });
};

/**
 * Middleware de autenticação híbrida que verifica:
 * 1. Se o usuário está autenticado via sessão (express-session + Passport)
 * 2. Se não estiver, tenta autenticar via token JWT (Supabase)
 */
export const hybridAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Debug info - mostra informações sobre a requisição para depuração
  const cookieKeys = req.cookies ? Object.keys(req.cookies) : [];
  const hasJwtCookie = cookieKeys.includes('supabase-auth-token');
  
  console.log('[HybridAuth] Requisição recebida:', {
    path: req.path,
    method: req.method,
    hasSession: !!req.session,
    sessionID: req.sessionID || 'não disponível',
    isAuthenticated: req.isAuthenticated(),
    hasAuthHeader: !!req.headers.authorization,
    hasCookies: cookieKeys.length > 0,
    cookieKeys: cookieKeys,
    hasJwtCookie: hasJwtCookie,
    referer: req.headers.referer || 'não disponível'
  });
  
  // Etapa 1: Verificar autenticação por sessão 
  if (req.isAuthenticated()) {
    console.log(`[HybridAuth] Usuário autenticado via sessão: ${req.user.id} (${req.user.email})`);
    
    // Se estamos no domínio personalizado, verificar se o cookie de sessão está configurado corretamente
    if (req.hostname.includes('gestaoonfleet.com.br') && req.session) {
      // Garantir que o cookie está configurado para o domínio correto
      if ((req.session as any).cookie.domain !== '.gestaoonfleet.com.br') {
        (req.session as any).cookie.domain = '.gestaoonfleet.com.br';
        console.log(`[HybridAuth] Ajustando domínio do cookie para: .gestaoonfleet.com.br`);
      }
    }
    
    return next();
  }

  // Etapa 2: Verificar autenticação por token JWT (Supabase)
  // Só tenta se o Supabase estiver configurado
  if (supabase) {
    try {
      const token = extractToken(req);
      if (token) {
        console.log('[HybridAuth] Token JWT encontrado, tentando validar...');
        const user = await validateSupabaseToken(token);
        if (user) {
          // Adicionar informações do usuário Supabase ao request
          req.supabaseUser = user;
          console.log(`[HybridAuth] Usuário autenticado via token Supabase: ${user.id} (${user.email})`);
          return next();
        } else {
          console.log('[HybridAuth] Token JWT inválido ou expirado');
        }
      } else {
        console.log('[HybridAuth] Nenhum token JWT encontrado nas fontes disponíveis');
      }
    } catch (error) {
      console.error('[HybridAuth] Erro ao validar token:', error);
      // Não retornar erro aqui, continuar para a verificação final
    }
  } else {
    console.log('[HybridAuth] Cliente Supabase não configurado, pulando verificação JWT');
  }

  // Etapa 3: Verificar se é uma rota de estoque
  // Para qualquer rota de estoque no ambiente de desenvolvimento, permitir o acesso
  if (process.env.NODE_ENV === 'development' && (
      req.path.includes('/frota/estoque') || 
      req.path.includes('/estoque') || 
      req.path.includes('/pneus') ||
      req.path.includes('/stock'))) {
    console.log('[HybridAuth] Permitindo acesso à rota de estoque em ambiente de desenvolvimento:', req.path);
    
    // Adicionar um usuário temporário ao request para que as funcionalidades funcionem
    if (!req.user) {
      req.user = {
        id: 1,
        name: 'Admin Temporário',
        email: 'admin@muricionfleet.com',
        role: 'admin'
      } as any;
    }
    
    return next();
  }
  
  // Permitir acesso a rotas de diagnóstico pelo referer
  if (req.path.includes('/diagnostico') && 
      req.headers.referer && 
      (req.headers.referer.includes('diagnostico') || req.headers.referer.includes('debug'))) {
    console.log('[HybridAuth] Permitindo acesso à rota de diagnóstico pelo referer:', req.headers.referer);
    return next();
  }

  // Nenhum método de autenticação funcionou
  console.log('[HybridAuth] Autenticação falhou. Acesso não autorizado.');
  return res.status(401).json({ message: "Não autenticado" });
};

/**
 * Extrai o token JWT do cabeçalho Authorization ou outros locais
 * Tenta múltiplas estratégias de obtenção do token
 */
function extractToken(req: Request): string | null {
  // Estratégia 1: Extrair do cabeçalho Authorization
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    console.log('[HybridAuth] Token encontrado no cabeçalho Authorization');
    return authHeader.split(' ')[1];
  }
  
  // Estratégia 2: Extrair de cookies padrão
  const authCookie = req.cookies?.['supabase-auth-token'];
  if (authCookie) {
    try {
      // O cookie pode ser um array JSON
      const parsed = JSON.parse(authCookie);
      if (parsed && parsed.length > 0 && parsed[0]) {
        console.log('[HybridAuth] Token encontrado no cookie supabase-auth-token');
        return parsed[0];
      }
    } catch (e) {
      // Se não for JSON, pode ser o token direto
      if (typeof authCookie === 'string') {
        console.log('[HybridAuth] Token string encontrado no cookie supabase-auth-token');
        return authCookie;
      }
    }
  }
  
  // Estratégia 3: Verificar o objeto de sessão (se integrado com Supabase)
  if (req.session?.['supabase'] && req.session['supabase'].auth?.token) {
    console.log('[HybridAuth] Token encontrado na sessão');
    return req.session['supabase'].auth.token;
  }
  
  // Nenhum token encontrado
  console.log('[HybridAuth] Nenhum token encontrado nas fontes disponíveis');
  return null;
}

/**
 * Middleware específico para a API do Supabase 
 * Apenas verifica o token JWT, não verifica sessão
 */
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!supabase) {
    return res.status(500).json({ message: "Configuração do Supabase não encontrada" });
  }
  
  // Log para debug
  console.log('[SupabaseAuth] Request headers:', {
    authorization: req.headers.authorization ? 'Presente' : 'Ausente',
    cookie: req.headers.cookie ? 'Presente' : 'Ausente',
    'user-agent': req.headers['user-agent'],
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    'content-type': req.headers['content-type']
  });
  
  // Extrair token
  const token = extractToken(req);
  if (!token) {
    console.log('[SupabaseAuth] Nenhum token encontrado no request. Cookies:', Object.keys(req.cookies || {}));
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const user = await validateSupabaseToken(token);
    if (!user) {
      console.log('[SupabaseAuth] Token inválido ou expirado');
      return res.status(401).json({ message: "Token inválido" });
    }
    
    // Usuário autenticado com sucesso
    console.log(`[SupabaseAuth] Usuário autenticado: ${user.id} (${user.email})`);
    req.supabaseUser = user;
    next();
  } catch (error) {
    console.error('[SupabaseAuth] Erro ao validar token:', error);
    return res.status(401).json({ message: "Erro na validação do token" });
  }
};

/**
 * Middleware específico para a autenticação por sessão
 * Apenas verifica a sessão, não verifica token JWT
 */
export const sessionAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    // Se estamos no domínio personalizado, verificar se o cookie de sessão está configurado corretamente
    if (req.hostname.includes('gestaoonfleet.com.br') && req.session) {
      // Garantir que o cookie está configurado para o domínio correto
      if ((req.session as any).cookie.domain !== '.gestaoonfleet.com.br') {
        (req.session as any).cookie.domain = '.gestaoonfleet.com.br';
        console.log(`[SessionAuth] Ajustando domínio do cookie para: .gestaoonfleet.com.br`);
      }
    }
    
    return next();
  }
  
  console.log('[SessionAuth] Usuário não autenticado', {
    sessionID: req.sessionID,
    hostname: req.hostname,
    path: req.path
  });
  
  return res.status(401).json({ message: "Não autenticado" });
};