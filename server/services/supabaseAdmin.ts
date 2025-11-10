import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Obter credenciais do Supabase das variáveis de ambiente do servidor
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('[SupabaseAdmin] ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados como variáveis de ambiente');
}

// Singleton do cliente Supabase Admin
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Retorna o cliente Supabase Admin singleton
 * Este cliente tem permissões elevadas e deve ser usado APENAS no backend
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    console.log('[SupabaseAdmin] Criando nova instância do cliente Supabase Admin');
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}
