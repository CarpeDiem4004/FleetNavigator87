/**
 * ARQUIVO DE COMPATIBILIDADE
 * 
 * Este arquivo existe apenas para manter compatibilidade com códigos existentes
 * que ainda importam de '@/lib/supabase-client' ao invés de '@/lib/supabaseClient'.
 * 
 * TODOS os códigos devem ser migrados eventualmente para usar '@/lib/supabaseClient' diretamente.
 */

// Re-exportar tudo do arquivo principal consolidado (SEGURO - apenas cliente anônimo)
export * from './supabase-compat';

// Exportações nomeadas explícitas para compatibilidade com importações antigas
import { 
  supabase,
  getSupabaseClient,
  checkConnection,
  checkSupabaseConnection,
  checkAllConnections,
  fetchRecords,
  insertRecord,
  insertData,
  updateData,
  deleteRecord,
  deleteRecords,
  withRetry,
  createSupabaseClient
} from './supabase-compat';

// Re-exportar explicitamente para compatibilidade
export {
  supabase,
  getSupabaseClient,
  checkConnection,
  checkSupabaseConnection,
  checkAllConnections,
  fetchRecords,
  insertRecord,
  insertData,
  updateData,
  deleteRecord,
  deleteRecords,
  withRetry,
  createSupabaseClient
};

// REMOVIDO POR SEGURANÇA: supabaseAdmin, getSupabaseAdminClient, createSupabaseAdmin
// Operações admin devem ser feitas via APIs backend (/api/storage/*, etc)

// Exportação padrão para compatibilidade
export default supabase;

// Aviso de depreciação no console
console.warn(
  '[DEPRECIADO] O arquivo supabase-client.ts está depreciado e será removido em uma versão futura. ' +
  'Por favor, atualize suas importações para usar "@/lib/supabaseClient" ao invés de "@/lib/supabase-client".'
);