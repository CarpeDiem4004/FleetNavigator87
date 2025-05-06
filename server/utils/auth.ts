import { createClient } from '@supabase/supabase-js';
import { pool } from '../db';
import jwt, { SignOptions, Secret, JwtPayload as JWTPayload } from 'jsonwebtoken';

// Classe de erro personalizada para autenticação
export class AuthError extends Error {
  constructor(message: string = "Não autenticado") {
    super(message);
    this.name = "AuthError";
  }
}

// Constantes para JWT
const JWT_SECRET_STR = process.env.JWT_SECRET || 'murici-fleet-jwt-secret-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Interface para o payload do token JWT
interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  baseId?: number | null;
  basename?: string | null;
  oficinaId?: number | null;
  isActive?: boolean;
}

// Função para gerar token JWT manualmente
export function generateJwtToken(user: any): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    baseId: user.base_id,
    basename: user.basename,
    oficinaId: user.oficina_id,
    isActive: user.is_active
  };
  
  try {
    // Usar string diretamente
    return jwt.sign(payload, JWT_SECRET_STR, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256'
    });
  } catch (error) {
    console.error('[generateJwtToken] Erro ao gerar token JWT:', error);
    throw new Error('Falha ao gerar token JWT');
  }
}

// Função para validar token JWT customizado (não Supabase)
export function validateJwtToken(token: string): JwtPayload {
  try {
    // Usar string diretamente
    return jwt.verify(token, JWT_SECRET_STR) as JwtPayload;
  } catch (error) {
    console.error('[validateJwtToken] Erro ao validar token JWT:', error);
    throw new AuthError("Token JWT inválido ou expirado");
  }
}

// Função para validar token - agora suporta tanto tokens Supabase quanto tokens JWT customizados
export async function validateSupabaseToken(token: string) {
  try {
    // Primeiro tenta validar como token JWT customizado
    try {
      const decodedToken = validateJwtToken(token);
      console.log('[validateSupabaseToken] Token JWT customizado válido:', decodedToken.email);
      return decodedToken;
    } catch (jwtError) {
      // Se falhar, tenta como token Supabase
      console.log('[validateSupabaseToken] Não é um token JWT customizado, tentando como token Supabase...');
    }
    
    // Verificar configurações do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuração do Supabase não disponível');
    }
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[validateSupabaseToken] Erro ao validar token Supabase:', error);
      throw new AuthError("Token Supabase inválido");
    }
    
    // Vincular o usuário do Supabase ao usuário do PostgreSQL, se ainda não estiver vinculado
    await linkSupabaseUserToPostgres(supabase, user, token);
    
    console.log('[validateSupabaseToken] Token Supabase válido:', user.email);
    return user;
  } catch (error) {
    console.error('[validateSupabaseToken] Erro no processo de validação de token:', error);
    throw new AuthError(error instanceof Error ? error.message : "Erro de autenticação");
  }
}

/**
 * Vincula o usuário do Supabase ao usuário do PostgreSQL
 * Atualiza a tabela 'usuarios' adicionando o ID do Supabase na coluna supabase_uid
 */
async function linkSupabaseUserToPostgres(supabase: any, user: any, token: string) {
  try {
    // Verificar se o usuário já está vinculado
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [user.email]
    );

    // Se o usuário existe no PostgreSQL mas não tem supabase_uid, atualize
    if (userResult.rowCount && userResult.rowCount > 0) {
      const postgresUser = userResult.rows[0];
      
      // Verificar se a coluna supabase_uid já existe
      const columnCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'supabase_uid'
      `);
      
      // Se a coluna não existe, adicione-a
      if (columnCheck.rowCount === 0) {
        console.log('[linkSupabaseUserToPostgres] Adicionando coluna supabase_uid à tabela usuarios');
        await pool.query(`
          ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255)
        `);
      }
      
      // Se o usuário não tem supabase_uid ou está diferente, atualize
      if (!postgresUser.supabase_uid || postgresUser.supabase_uid !== user.id) {
        console.log(`[linkSupabaseUserToPostgres] Vinculando usuário PostgreSQL ${postgresUser.id} ao Supabase ${user.id}`);
        await pool.query(
          'UPDATE usuarios SET supabase_uid = $1 WHERE id = $2',
          [user.id, postgresUser.id]
        );
      }
    }
  } catch (error) {
    console.error('[linkSupabaseUserToPostgres] Erro ao vincular usuário:', error);
    // Não lançar erro para não interromper o fluxo de autenticação
  }
}

// Função para extrair token JWT do cabeçalho Authorization
export function extractJwtToken(authHeader: string | undefined): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError("Token ausente ou inválido");
  }
  
  return authHeader.split(' ')[1];
}