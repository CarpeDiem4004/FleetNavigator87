import { createClient } from '@supabase/supabase-js';
import { hashPassword } from './userService';

/**
 * Adaptador para o Supabase
 * Esta classe fornece métodos para interagir com o Supabase de forma padronizada,
 * permitindo que seja usado tanto no ambiente Replit quanto fora dele.
 */
export class SupabaseAdapter {
  private static instance: SupabaseAdapter;
  private supabase;
  
  private constructor() {
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY) {
      throw new Error('Variáveis de ambiente do Supabase não definidas');
    }
    
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_KEY
    );
  }
  
  /**
   * Obtém a instância do adaptador (padrão Singleton)
   */
  public static getInstance(): SupabaseAdapter {
    if (!SupabaseAdapter.instance) {
      SupabaseAdapter.instance = new SupabaseAdapter();
    }
    
    return SupabaseAdapter.instance;
  }
  
  /**
   * Busca um usuário pelo email
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário no Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Busca um usuário pelo ID
   */
  async getUserById(id: number | string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID no Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Cria um novo usuário
   */
  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    baseId?: number | null;
    isActive?: boolean;
  }) {
    try {
      // Hash da senha
      const hashedPassword = await hashPassword(userData.password);
      
      const { data, error } = await this.supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          base_id: userData.baseId || null,
          is_active: userData.isActive !== undefined ? userData.isActive : true
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao criar usuário no Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza os dados de um usuário
   */
  async updateUser(id: number | string, userData: any) {
    try {
      const updateData: any = {};
      
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.password !== undefined) updateData.password = userData.password;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.baseId !== undefined) updateData.base_id = userData.baseId;
      if (userData.oficinaId !== undefined) updateData.oficina_id = userData.oficinaId;
      if (userData.isActive !== undefined) updateData.is_active = userData.isActive;
      if (userData.base_id !== undefined) updateData.base_id = userData.base_id;
      if (userData.oficina_id !== undefined) updateData.oficina_id = userData.oficina_id;
      if (userData.is_active !== undefined) updateData.is_active = userData.is_active;
      
      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar usuário no Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Remove um usuário pelo ID
   */
  async deleteUser(id: number | string) {
    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário no Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Redefine a senha de um usuário
   */
  async resetPassword(id: number | string, newPassword: string) {
    try {
      // Hash da nova senha
      const hashedPassword = await hashPassword(newPassword);
      
      const { error } = await this.supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao redefinir senha do usuário no Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Lista todos os usuários com filtros opcionais
   */
  async listUsers(filters?: {
    role?: string;
    baseId?: number;
    isActive?: boolean;
  }) {
    try {
      let query = this.supabase
        .from('users')
        .select('*');
      
      if (filters) {
        if (filters.role) {
          query = query.eq('role', filters.role);
        }
        
        if (filters.baseId) {
          query = query.eq('base_id', filters.baseId);
        }
        
        if (filters.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao listar usuários no Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Retorna uma referência ao cliente Supabase
   * Use com cuidado e apenas quando for necessário
   */
  getClient() {
    return this.supabase;
  }
}

// Exporta uma instância já inicializada para facilitar o uso
export function getSupabaseAdapter() {
  try {
    return SupabaseAdapter.getInstance();
  } catch (error) {
    console.error('Erro ao inicializar o adaptador Supabase:', error);
    return null;
  }
}