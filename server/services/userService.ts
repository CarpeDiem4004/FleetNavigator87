import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { pool } from '../db'; // conexão com PostgreSQL
import { createClient } from '@supabase/supabase-js';

const scryptAsync = promisify(scrypt);

// Interface para usuário
export interface User {
  id: number | string;
  name: string;
  email: string;
  password?: string;
  role: string;
  baseId?: number | null;
  basename?: string | null;
  oficinaId?: number | null;
  isActive: boolean;
}

// Interface para criação de usuário
export interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role: string;
  baseId?: number | null;
  isActive?: boolean;
}

/**
 * Classe de serviço abstrato para usuários
 * Define a interface que todas as implementações devem seguir
 */
export abstract class UserService {
  abstract getUserByEmail(email: string): Promise<User | null>;
  abstract createUser(userData: CreateUserParams): Promise<User>;
  abstract updateUser(id: number | string, userData: Partial<User>): Promise<User | null>;
  abstract deleteUser(id: number | string): Promise<boolean>;
  abstract resetPassword(id: number | string, newPassword: string): Promise<boolean>;
}

/**
 * Implementação do serviço de usuário usando PostgreSQL
 */
export class PostgresUserService extends UserService {
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return this.mapDbUserToUser(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }
  
  async createUser(userData: CreateUserParams): Promise<User> {
    try {
      // Verificar se base existe se baseId for fornecido
      if (userData.baseId) {
        const baseQuery = 'SELECT id FROM bases WHERE id = $1';
        const baseResult = await pool.query(baseQuery, [userData.baseId]);
        
        if (baseResult.rowCount === 0) {
          throw new Error('Base não encontrada');
        }
      }
      
      // Construir a query de inserção
      const query = `
        INSERT INTO users (name, email, password, role, base_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        userData.name,
        userData.email,
        userData.password,
        userData.role,
        userData.baseId || null,
        userData.isActive !== undefined ? userData.isActive : true
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rowCount === 0) {
        throw new Error('Falha ao criar usuário');
      }
      
      return this.mapDbUserToUser(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }
  
  async updateUser(id: number | string, userData: Partial<User>): Promise<User | null> {
    try {
      // Construir os conjuntos de atualização e valores
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;
      
      if (userData.name !== undefined) {
        updateFields.push(`name = $${paramCounter}`);
        values.push(userData.name);
        paramCounter++;
      }
      
      if (userData.email !== undefined) {
        updateFields.push(`email = $${paramCounter}`);
        values.push(userData.email);
        paramCounter++;
      }
      
      if (userData.password !== undefined) {
        updateFields.push(`password = $${paramCounter}`);
        values.push(userData.password);
        paramCounter++;
      }
      
      if (userData.role !== undefined) {
        updateFields.push(`role = $${paramCounter}`);
        values.push(userData.role);
        paramCounter++;
      }
      
      if (userData.baseId !== undefined) {
        updateFields.push(`base_id = $${paramCounter}`);
        values.push(userData.baseId);
        paramCounter++;
      }
      
      if (userData.oficinaId !== undefined) {
        updateFields.push(`oficina_id = $${paramCounter}`);
        values.push(userData.oficinaId);
        paramCounter++;
      }
      
      if (userData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramCounter}`);
        values.push(userData.isActive);
        paramCounter++;
      }
      
      if (updateFields.length === 0) {
        throw new Error('Nenhum campo fornecido para atualização');
      }
      
      // Adicionar o ID no final dos valores
      values.push(id);
      
      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return this.mapDbUserToUser(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }
  
  async deleteUser(id: number | string): Promise<boolean> {
    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  }
  
  async resetPassword(id: number | string, newPassword: string): Promise<boolean> {
    try {
      const query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id';
      const result = await pool.query(query, [newPassword, id]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao redefinir senha do usuário:', error);
      throw error;
    }
  }
  
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      role: dbUser.role,
      baseId: dbUser.base_id,
      basename: dbUser.basename,
      oficinaId: dbUser.oficina_id,
      isActive: dbUser.is_active
    };
  }
}

/**
 * Implementação do serviço de usuário usando Supabase
 */
export class SupabaseUserService extends UserService {
  private supabase;
  
  constructor() {
    super();
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY) {
      throw new Error('Variáveis de ambiente do Supabase não definidas');
    }
    
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_KEY
    );
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      console.error('Erro ao buscar usuário no Supabase:', error);
      throw error;
    }
  }
  
  async createUser(userData: CreateUserParams): Promise<User> {
    try {
      // Se baseId for fornecido, verificar se a base existe
      if (userData.baseId) {
        const { data: baseData, error: baseError } = await this.supabase
          .from('bases')
          .select('id')
          .eq('id', userData.baseId)
          .single();
        
        if (baseError || !baseData) {
          throw new Error('Base não encontrada');
        }
      }
      
      const { data, error } = await this.supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          base_id: userData.baseId || null,
          is_active: userData.isActive !== undefined ? userData.isActive : true
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('Falha ao criar usuário no Supabase');
      }
      
      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      console.error('Erro ao criar usuário no Supabase:', error);
      throw error;
    }
  }
  
  async updateUser(id: number | string, userData: Partial<User>): Promise<User | null> {
    try {
      const updateData: any = {};
      
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.password !== undefined) updateData.password = userData.password;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.baseId !== undefined) updateData.base_id = userData.baseId;
      if (userData.oficinaId !== undefined) updateData.oficina_id = userData.oficinaId;
      if (userData.isActive !== undefined) updateData.is_active = userData.isActive;
      
      if (Object.keys(updateData).length === 0) {
        throw new Error('Nenhum campo fornecido para atualização');
      }
      
      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      console.error('Erro ao atualizar usuário no Supabase:', error);
      throw error;
    }
  }
  
  async deleteUser(id: number | string): Promise<boolean> {
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
  
  async resetPassword(id: number | string, newPassword: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao redefinir senha do usuário no Supabase:', error);
      throw error;
    }
  }
  
  private mapSupabaseUserToUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      name: supabaseUser.name,
      email: supabaseUser.email,
      password: supabaseUser.password,
      role: supabaseUser.role,
      baseId: supabaseUser.base_id,
      basename: supabaseUser.basename,
      oficinaId: supabaseUser.oficina_id,
      isActive: supabaseUser.is_active
    };
  }
}

/**
 * Factory para criar a instância apropriada do serviço de usuário
 */
export function createUserService(): UserService {
  // Verificar se estamos usando Supabase
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_SERVICE_KEY) {
    console.log('Usando SupabaseUserService');
    return new SupabaseUserService();
  }
  
  // Caso contrário, usar PostgreSQL direto
  console.log('Usando PostgresUserService');
  return new PostgresUserService();
}

/**
 * Funções de utilitário para senha
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  try {
    return hashedBuf.length === suppliedBuf.length && 
      Buffer.compare(hashedBuf, suppliedBuf) === 0;
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
}

export function generateRandomPassword(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  const randomValues = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % chars.length;
    result += chars.charAt(randomIndex);
  }
  
  return result;
}

// Exportar uma instância já configurada para uso imediato
export const userService = createUserService();