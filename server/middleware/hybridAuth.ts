import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { validateSupabaseToken } from '../utils/auth';
import '../types/express'; // Importar as definições de tipo

// Variáveis de ambiente Supabase (com fallbacks para desenvolvimento)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Criar cliente Supabase apenas se as credenciais estiverem definidas
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * Middleware de autenticação híbrida que verifica:
 * 1. Se o usuário está autenticado via sessão (express-session + Passport)
 * 2. Se não estiver, tenta autenticar via token JWT (Supabase)
 */
export const hybridAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Etapa 1: Verificar autenticação por sessão
  if (req.isAuthenticated()) {
    console.log(`[HybridAuth] Usuário autenticado via sessão: ${req.user.id} (${req.user.email})`);
    return next();
  }

  // Etapa 2: Verificar autenticação por token JWT (Supabase)
  // Só tenta se o Supabase estiver configurado
  if (supabase) {
    try {
      const token = extractToken(req);
      if (token) {
        const user = await validateSupabaseToken(token);
        if (user) {
          // Adicionar informações do usuário Supabase ao request
          req.supabaseUser = user;
          console.log(`[HybridAuth] Usuário autenticado via token Supabase: ${user.id} (${user.email})`);
          return next();
        }
      }
    } catch (error) {
      console.error('[HybridAuth] Erro ao validar token:', error);
      // Não retornar erro aqui, continuar para a verificação final
    }
  }

  // Nenhum método de autenticação funcionou
  console.log('[HybridAuth] Autenticação falhou. Acesso não autorizado.');
  return res.status(401).json({ message: "Não autenticado" });
};

/**
 * Extrai o token JWT do cabeçalho Authorization
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

/**
 * Middleware específico para a API do Supabase 
 * Apenas verifica o token JWT, não verifica sessão
 */
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!supabase) {
    return res.status(500).json({ message: "Configuração do Supabase não encontrada" });
  }
  
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const user = await validateSupabaseToken(token);
    if (!user) {
      return res.status(401).json({ message: "Token inválido" });
    }
    
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
    return next();
  }
  
  return res.status(401).json({ message: "Não autenticado" });
};