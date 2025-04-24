import { createClient } from '@supabase/supabase-js';

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
  
  return user;
}

// Função para extrair token JWT do cabeçalho Authorization
export function extractJwtToken(authHeader: string | undefined): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError("Token ausente ou inválido");
  }
  
  return authHeader.split(' ')[1];
}