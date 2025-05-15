import { createClient } from '@supabase/supabase-js';

// Obtém variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não definidas!');
}

// Cria o cliente Supabase com persistência automática de sessão
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});

// Cliente com chave de serviço para operações administrativas (apenas no servidor)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Função para tentar novamente uma operação em caso de falha
export async function withRetry(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      console.log(`Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`, error);
      lastError = error;
      
      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Aumentar o tempo de espera para a próxima tentativa (backoff exponencial)
      delay = delay * 1.5;
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  console.error(`Todas as ${maxRetries} tentativas falharam`, lastError);
  throw lastError;
}

// Função para verificar conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    return !error;
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
}