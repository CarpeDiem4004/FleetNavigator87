/**
 * Utilitário de conexão resiliente com Supabase
 * Implementa reconexão automática e retry para garantir persistência de dados
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Valores obtidos das variáveis de ambiente
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Configuração de retry
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000; // 1 segundo
const MAX_BACKOFF_MS = 30000; // 30 segundos

// Instâncias de cliente Supabase
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Status da conexão
let connectionStatus = {
  lastCheck: 0,
  isConnected: false,
  lastError: null as Error | null,
};

/**
 * Cria ou retorna uma instância existente do cliente Supabase com chave anônima
 * @returns Cliente Supabase
 */
export function createSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[SupabaseConnection] Criando novo cliente Supabase anônimo');
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: customFetch
      }
    });
  }
  return supabaseInstance;
}

/**
 * Cria ou retorna uma instância existente do cliente Supabase com chave de serviço (admin)
 * @returns Cliente Supabase Admin
 */
export function createSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    console.log('[SupabaseConnection] Criando novo cliente Supabase Admin');
    supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: customFetch
      }
    });
  }
  return supabaseAdminInstance;
}

/**
 * Wrapper para fetch com timeout e retry
 */
async function customFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      // Adicionar timeout para evitar requisições pendentes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
      
      const fetchOptions = {
        ...init,
        signal: controller.signal,
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Se o servidor retornar erro, lançar exceção para entrar no retry
      if (response.status >= 500) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isNetworkError = 
        error instanceof TypeError || 
        (error instanceof Error && 
          (error.message.includes('network') || 
           error.message.includes('connection') ||
           error.message.includes('abort')));
      
      if (isNetworkError) {
        retries++;
        
        // Backoff exponencial com jitter
        const backoff = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, retries - 1) + Math.random() * 1000,
          MAX_BACKOFF_MS
        );
        
        console.warn(`[SupabaseConnection] Erro de rede, tentativa ${retries}/${MAX_RETRIES}. Próxima tentativa em ${backoff}ms`, lastError);
        
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        // Se não for erro de rede, propagar o erro
        throw error;
      }
    }
  }
  
  connectionStatus.isConnected = false;
  connectionStatus.lastError = lastError;
  throw new Error(`Falha após ${MAX_RETRIES} tentativas: ${lastError?.message}`);
}

/**
 * Verifica se a conexão com o Supabase está ativa
 * @returns {Promise<boolean>} Estado da conexão
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  // Verificar não mais que uma vez a cada 30 segundos
  const now = Date.now();
  if (connectionStatus.lastCheck > 0 && (now - connectionStatus.lastCheck) < 30000) {
    return connectionStatus.isConnected;
  }
  
  connectionStatus.lastCheck = now;
  
  try {
    console.log('[SupabaseConnection] Verificando conexão com Supabase...');
    const client = createSupabaseClient();
    
    // Tentar métodos diferentes de verificação, do mais leve ao mais pesado
    try {
      // Método 1: RPC ping
      const { data, error } = await client.rpc('ping');
      if (!error) {
        connectionStatus.isConnected = true;
        connectionStatus.lastError = null;
        return true;
      }
    } catch (err) {
      // Falha silenciosa, tentar próximo método
    }
    
    try {
      // Método 2: Tentar buscar contagem de alguma tabela conhecida
      const { count, error } = await client
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        connectionStatus.isConnected = true;
        connectionStatus.lastError = null;
        return true;
      }
    } catch (err) {
      // Falha silenciosa, tentar próximo método
    }
    
    try {
      // Método 3: Tentar com outra tabela (veículos)
      const { count, error } = await client
        .from('veiculos')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        connectionStatus.isConnected = true;
        connectionStatus.lastError = null;
        return true;
      }
    } catch (err) {
      // Esse é o último método, registrar erro
      console.error('[SupabaseConnection] Todos os métodos de verificação falharam');
      connectionStatus.isConnected = false;
      connectionStatus.lastError = err instanceof Error ? err : new Error(String(err));
    }
    
    return false;
  } catch (error) {
    console.error('[SupabaseConnection] Erro ao verificar conexão:', error);
    connectionStatus.isConnected = false;
    connectionStatus.lastError = error instanceof Error ? error : new Error(String(error));
    return false;
  }
}

/**
 * Executa uma operação com retry automatico e fallback entre clientes
 * @param operation Função que executa a operação desejada
 * @param options Opções de configuração para o retry
 * @returns Resultado da operação
 */
export async function executeWithRetry<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  options: {
    useAdmin?: boolean;
    maxRetries?: number;
    fallbackToAdmin?: boolean;
    logSuccess?: boolean;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    useAdmin = false,
    maxRetries = MAX_RETRIES,
    fallbackToAdmin = true,
    logSuccess = true,
    operationName = 'operação no Supabase'
  } = options;
  
  // Primeiro tenta com o cliente solicitado
  let client = useAdmin ? createSupabaseAdmin() : createSupabaseClient();
  let retries = 0;
  let lastError: Error | null = null;
  let result: T;
  
  // Primeiro loop: tentar com o cliente principal
  while (retries < maxRetries) {
    try {
      result = await operation(client);
      if (logSuccess) {
        console.log(`[SupabaseConnection] ${operationName} concluída com sucesso`);
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Determinar se é um erro que merece retry
      const isRetryableError = 
        // Erros de rede/timeout
        error instanceof TypeError || 
        // Erros de conexão ou do servidor (5xx)
        (error instanceof Error && 
          (error.message.includes('network') || 
           error.message.includes('connection') ||
           error.message.includes('timeout') ||
           error.message.includes('500') ||
           error.message.includes('503') ||
           error.message.includes('504')));
      
      if (isRetryableError) {
        retries++;
        
        // Backoff exponencial com jitter
        const backoff = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, retries - 1) + Math.random() * 1000,
          MAX_BACKOFF_MS
        );
        
        console.warn(`[SupabaseConnection] Erro ao executar ${operationName}, tentativa ${retries}/${maxRetries}. Próxima tentativa em ${backoff}ms`, lastError);
        
        // Se a conexão falhar muitas vezes, tentar recriar o cliente
        if (retries >= 2) {
          if (useAdmin) {
            supabaseAdminInstance = null;
            client = createSupabaseAdmin();
          } else {
            supabaseInstance = null;
            client = createSupabaseClient();
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        // Se não for erro de conexão, não fazer retry
        break;
      }
    }
  }
  
  // Se todas as tentativas falharam e temos a opção de fallback para admin
  if (fallbackToAdmin && !useAdmin) {
    console.log(`[SupabaseConnection] Tentando ${operationName} como Admin após falhas com cliente anônimo`);
    try {
      const adminClient = createSupabaseAdmin();
      result = await operation(adminClient);
      console.log(`[SupabaseConnection] ${operationName} concluída com sucesso (via Admin)`);
      return result;
    } catch (adminError) {
      console.error(`[SupabaseConnection] Erro ao executar ${operationName} mesmo com privilégios de Admin:`, adminError);
      throw adminError;
    }
  }
  
  throw lastError || new Error(`Falha ao executar ${operationName} no Supabase`);
}

// Criação inicial dos clientes
export const supabase = createSupabaseClient();
export const supabaseAdmin = createSupabaseAdmin();

// Verificação periódica da conexão a cada 5 minutos
setInterval(checkSupabaseConnection, 5 * 60 * 1000);

// Verificação inicial
checkSupabaseConnection()
  .then(connected => {
    console.log(`[SupabaseConnection] Conexão inicial com Supabase: ${connected ? 'SUCESSO' : 'FALHA'}`);
  })
  .catch(err => {
    console.error('[SupabaseConnection] Erro na verificação inicial:', err);
  });