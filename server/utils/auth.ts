import { createClient } from '@supabase/supabase-js';
import { pool } from '../db';

// Classe de erro personalizada para autenticação
export class AuthError extends Error {
  constructor(message: string = "Não autenticado") {
    super(message);
    this.name = "AuthError";
  }
}

// Função para validar token JWT do Supabase
export async function validateSupabaseToken(token: string) {
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
    console.error('[validateSupabaseToken] Erro ao validar token:', error);
    throw new AuthError();
  }
  
  // Vincular o usuário do Supabase ao usuário do PostgreSQL, se ainda não estiver vinculado
  await linkSupabaseUserToPostgres(supabase, user, token);
  
  return user;
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