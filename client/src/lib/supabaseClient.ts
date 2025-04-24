import { createClient } from '@supabase/supabase-js';

// URL e chaves fixas para o Supabase, já que as variáveis de ambiente não estão funcionando
const supabaseUrl = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Log de diagnóstico para verificar URLs e chaves
console.log('Configuração Supabase Cliente:', {
  url: supabaseUrl.substring(0, 15) + '...',
  anonKeyAvailable: !!supabaseAnonKey,
  serviceKeyAvailable: !!supabaseServiceKey
});

// Criar cliente Supabase com configurações otimizadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'murici-fleet-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'MuriciFleet-Web',
    },
  }
});

// Criar cliente Supabase com privilégios administrativos para operações que requerem mais permissões
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storageKey: 'murici-fleet-admin-auth',
    autoRefreshToken: true,
    persistSession: true
  }
});

// Helper para verificar conexão
export const checkConnection = async (): Promise<boolean> => {
  try {
    // Tentamos fazer uma busca simples para verificar a conexão
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    return !error;
  } catch (err) {
    console.error('Erro ao verificar conexão com Supabase:', err);
    return false;
  }
};

export default supabase;