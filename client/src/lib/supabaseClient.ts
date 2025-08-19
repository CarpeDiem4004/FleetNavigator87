// Re-exportar do arquivo principal corrigido (supabase-compat.ts)
// Este arquivo agora serve apenas como alias de compatibilidade
export * from '@/lib/supabase-compat';

// Interface para resultados de diagnóstico do cliente (mantida para compatibilidade)
export interface ClientDiagnosticResults {
  authConnection: boolean;
  databaseConnection: boolean;
  storageConnection: boolean;
  functionsConnection: boolean;
  realtimeConnection: boolean;
  baseConnection?: boolean;
  readPermission?: boolean;
  writePermission?: boolean;
  authSystem?: boolean;
  rpcFunctions?: boolean;
  supabase?: boolean;
}

// AVISO: Este arquivo agora serve apenas como alias de compatibilidade.
// A implementação real está em supabase-compat.ts
console.log('[supabaseClient] Redirecionando para supabase-compat.ts para evitar conflitos');