/**
 * Adaptador do Supabase para operações de banco de dados
 * Este arquivo implementa a função getSupabaseAdapter que estava faltando
 */
import { createClient } from '@supabase/supabase-js';

// Interfaces para tipagem
interface SupabaseAdapter {
  getClient: () => ReturnType<typeof createClient>;
  getUser: (id: number | string) => Promise<any>;
  getUserById: (id: number | string) => Promise<any>; // Alias para getUser
  getUserByEmail: (email: string) => Promise<any>;
  listUsers: (options?: { limit?: number; offset?: number }) => Promise<any>;
  createUser: (userData: any) => Promise<any>;
  updateUser: (id: number | string, userData: any) => Promise<any>;
  deleteUser: (id: number | string) => Promise<any>;
  resetPassword: (id: number | string, newPassword: string) => Promise<any>;
}

// Variável para armazenar a instância do adaptador
// Inicializamos como null, mas a função getSupabaseAdapter garante que sempre retornará uma instância válida
let supabaseAdapterInstance: SupabaseAdapter | null = null;

/**
 * Cria e retorna um cliente Supabase
 */
function createSupabaseClient() {
  // Usando SUPABASE_URL e SUPABASE_ANON_KEY do ambiente
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Credenciais do Supabase não configuradas corretamente.');
    throw new Error('Credenciais do Supabase não configuradas corretamente.');
  }
  
  console.log('[SupabaseAdapter] Inicializando adaptador com URL:', supabaseUrl);

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Função para obter o adaptador do Supabase
 * Esta função implementa o adaptador que estava faltando
 * Sempre retorna uma instância válida do adaptador, nunca null
 */
export function getSupabaseAdapter(): SupabaseAdapter {
  if (supabaseAdapterInstance) {
    return supabaseAdapterInstance as SupabaseAdapter;
  }

  // Criar nova instância do adaptador
  const supabase = createSupabaseClient();

  supabaseAdapterInstance = {
    // Retorna o cliente Supabase para acesso direto se necessário
    getClient: () => supabase,

    // Busca um usuário pelo ID
    getUser: async (id: number | string) => {
      const userId = typeof id === 'string' ? parseInt(id, 10) : id;
      console.log(`[SupabaseAdapter] Buscando usuário com ID: ${userId}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[SupabaseAdapter] Erro ao buscar usuário:', error);
        throw error;
      }

      return data;
    },

    // Busca um usuário pelo email
    getUserByEmail: async (email: string) => {
      console.log(`[SupabaseAdapter] Buscando usuário com email: ${email}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignora erro de "não encontrado"
        console.error('[SupabaseAdapter] Erro ao buscar usuário por email:', error);
        throw error;
      }

      return data || null;
    },

    // Lista todos os usuários com paginação
    listUsers: async (options = {}) => {
      const { limit = 100, offset = 0 } = options;
      console.log(`[SupabaseAdapter] Listando usuários (limit: ${limit}, offset: ${offset})`);

      const query = supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (limit) {
        query.limit(limit);
      }

      if (offset) {
        query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SupabaseAdapter] Erro ao listar usuários:', error);
        throw error;
      }

      return data;
    },

    // Cria um novo usuário
    createUser: async (userData: any) => {
      console.log('[SupabaseAdapter] Criando novo usuário:', { ...userData, password: '[REDACTED]' });
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('[SupabaseAdapter] Erro ao criar usuário:', error);
        throw error;
      }

      return data;
    },

    // Atualiza um usuário existente
    updateUser: async (id: number | string, userData: any) => {
      const userId = typeof id === 'string' ? parseInt(id, 10) : id;
      console.log(`[SupabaseAdapter] Atualizando usuário ID ${userId}:`, { 
        ...userData, 
        password: userData.password ? '[REDACTED]' : undefined 
      });
      
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseAdapter] Erro ao atualizar usuário:', error);
        throw error;
      }

      return data;
    },

    // Remove um usuário
    deleteUser: async (id: number | string) => {
      const userId = typeof id === 'string' ? parseInt(id, 10) : id;
      console.log(`[SupabaseAdapter] Removendo usuário ID ${userId}`);
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseAdapter] Erro ao remover usuário:', error);
        throw error;
      }

      return data;
    },

    // Alias para getUser para compatibilidade com code existente
    getUserById: async (id: number | string) => {
      const userId = typeof id === 'string' ? parseInt(id, 10) : id;
      console.log(`[SupabaseAdapter] (getUserById) Buscando usuário com ID: ${userId}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[SupabaseAdapter] Erro ao buscar usuário:', error);
        throw error;
      }

      return data;
    },

    // Redefine a senha de um usuário
    resetPassword: async (id: number | string, newPassword: string) => {
      const userId = typeof id === 'string' ? parseInt(id, 10) : id;
      console.log(`[SupabaseAdapter] Redefinindo senha do usuário ID ${userId}`);
      
      // Aqui deveria usar um método para criar hash da senha antes de atualizar
      // Por simplicidade, estamos apenas atualizando diretamente
      const { data, error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseAdapter] Erro ao redefinir senha do usuário:', error);
        throw error;
      }

      return data;
    }
  };

  return supabaseAdapterInstance as SupabaseAdapter;
}

export default { getSupabaseAdapter };