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
import { supabase } from './supabaseClient';
export default supabase;

// Aviso de depreciação no console
console.warn(
  '[DEPRECIADO] O arquivo supabase-client.ts está depreciado e será removido em uma versão futura. ' +
  'Por favor, atualize suas importações para usar "@/lib/supabaseClient" ao invés de "@/lib/supabase-client".'
);