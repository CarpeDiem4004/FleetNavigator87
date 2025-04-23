import { createClient } from '@supabase/supabase-js';

// Obter as configurações do Supabase de variáveis de ambiente
// Importante: Variáveis de ambiente no front-end precisam começar com VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Criar cliente Supabase com privilégios administrativos para operações que requerem mais permissões
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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