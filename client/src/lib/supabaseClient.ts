/**
 * Este arquivo re-exporta tudo de supabase-compat.ts para manter compatibilidade
 * e evitar múltiplas instâncias do GoTrueClient.
 * IMPORTANTE: Sempre importe deste arquivo ou de supabase-compat.ts, NUNCA crie
 * novas instâncias com createClient() diretamente em outros arquivos.
 */
export * from './supabase-compat';
