/**
 * Cliente Supabase simulado para evitar dependências externas
 * Importa e reexporta de supabase-helper.js
 */

import { supabase, getSupabaseAdminClient, checkConnection as helperCheckConnection } from './supabase-helper';

/**
 * Função para chamar uma função com retry automático
 */
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`[withRetry] Tentativa ${retries + 1}/${maxRetries}`);
      const result = await fn();
      return result;
    } catch (err) {
      retries++;
      console.error(`[withRetry] Exceção na tentativa ${retries}/${maxRetries}:`, err);
      
      if (retries >= maxRetries) {
        return { data: null, error: err };
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Aumentar o delay a cada tentativa
    }
  }
  
  return { data: null, error: new Error(`Falha após ${maxRetries} tentativas`) };
}

/**
 * Verificar conexão com o Supabase
 */
export async function checkSupabaseConnection() {
  console.log('[Mock] Verificando conexão com Supabase...');
  return { connected: true };
}

/**
 * Verificar todas as conexões (Supabase, API, database)
 */
export async function checkAllConnections() {
  console.log('[Mock] Verificando todas as conexões...');
  return { 
    data: {
      supabase: true,
      api: true,
      database: true
    }, 
    error: null 
  };
}

/**
 * Função simulada para buscar registros
 */
export async function fetchRecords(table, limit = 10) {
  console.log(`[Mock] Buscando registros da tabela ${table} (limite: ${limit})`);
  return { 
    data: Array(limit).fill().map((_, i) => ({ 
      id: i + 1, 
      created_at: new Date().toISOString(),
      name: `Registro ${i + 1}`
    })), 
    error: null 
  };
}

// Exportando a função checkConnection do helper
export const checkConnection = helperCheckConnection;

// Exportar o cliente Supabase simulado e outras funções para compatibilidade
export { supabase, getSupabaseAdminClient };