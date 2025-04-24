import { hybridAuth, supabaseAuth, sessionAuth } from '../hybridAuth';
import { mapSupabaseUserToSession } from '../mapSupabaseUser';

/**
 * Autenticação híbrida - verifica sessão OU token JWT
 * Permite acesso se qualquer um dos métodos for válido
 */
export const isAuthenticated = hybridAuth;

/**
 * Autenticação Supabase com mapeamento para sessão
 * Verifica o token JWT e, se for válido, mapeia para sessão
 */
export const isAuthenticatedWithMapping = [supabaseAuth, mapSupabaseUserToSession];

/**
 * Autenticação apenas por sessão (sem verificar token JWT)
 * Útil para rotas específicas que precisam da sessão
 */
export const isSessionAuthenticated = sessionAuth;

/**
 * Autenticação apenas por token JWT (sem verificar sessão)
 * Útil para APIs consumidas apenas por clientes externos
 */
export const isJwtAuthenticated = supabaseAuth;

/**
 * Exporta todos os middlewares individuais para uso específico
 */
export {
  hybridAuth,
  supabaseAuth,
  sessionAuth,
  mapSupabaseUserToSession
};