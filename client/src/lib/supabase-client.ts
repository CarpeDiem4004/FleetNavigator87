/**
 * ARQUIVO DE COMPATIBILIDADE
 * 
 * Este arquivo existe apenas para manter compatibilidade com códigos existentes
 * que ainda importam de '@/lib/supabase-client' ao invés de '@/lib/supabaseClient'.
 * 
 * TODOS os códigos devem ser migrados eventualmente para usar '@/lib/supabaseClient' diretamente.
 */

// Re-exportar tudo do arquivo principal consolidado
export * from './supabaseClient';

// Exportação padrão para compatibilidade
import { supabase, checkConnection, getSupabaseAdminClient } from './supabaseClient';
export default supabase;

// Garantir que as funções comumente usadas estejam disponíveis
export { getSupabaseAdminClient };
export { checkConnection };

// Adicionar outros aliases de funções que possam ser usados em código antigo
export const checkSupabaseStatus = async () => await checkConnection();

// Aviso de depreciação no console
console.warn(
  '[DEPRECIADO] O arquivo supabase-client.ts está depreciado e será removido em uma versão futura. ' +
  'Por favor, atualize suas importações para usar "@/lib/supabaseClient" ao invés de "@/lib/supabase-client".'
);