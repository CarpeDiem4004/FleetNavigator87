/**
 * Serviço de usuário híbrido
 * Este serviço funciona tanto no ambiente Replit quanto externamente
 * usando Supabase ou PostgreSQL diretamente, conforme necessário
 */
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';

// Função assíncrona para hash de senha
const scryptAsync = promisify(scrypt);

// Chave secreta para assinatura de tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'murici-hybrid-auth-secret-key-2025';
// Tempo de expiração do token (24 horas)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

console.log('[HybridUserService] Configuração JWT:', {
  secret: JWT_SECRET ? 'Definido' : 'Não definido',
  expiresIn: JWT_EXPIRES_IN
});

/**
 * Classe que gerencia operações de usuário de forma genérica
 * independente do ambiente (Replit ou externo)
 */
class HybridUserService {
  constructor() {
    // Inicializar conexões
    this.initConnections();
  }

  /**
   * Inicializa as conexões com os bancos de dados
   */
  initConnections() {
    try {
      // Inicializar PostgreSQL direto (para ambiente Replit)
      if (process.env.DATABASE_URL) {
        this.pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
        console.log('[HybridUserService] Conexão PostgreSQL inicializada');
      }

      // Inicializar Supabase (para ambientes externos)
      if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_SERVICE_KEY) {
        this.supabase = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.VITE_SUPABASE_SERVICE_KEY
        );
        console.log('[HybridUserService] Conexão Supabase inicializada');
      }

      if (!this.pgPool && !this.supabase) {
        throw new Error('Nenhuma conexão de banco de dados disponível');
      }
    } catch (error) {
      console.error('[HybridUserService] Erro ao inicializar conexões:', error);
    }
  }

  /**
   * Mapeia um registro de usuário do banco para um objeto JavaScript
   */
  mapDbUserToObject(dbUser) {
    return dbUser ? {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      role: dbUser.role,
      baseId: dbUser.base_id,
      basename: dbUser.basename,
      oficinaId: dbUser.oficina_id,
      isActive: dbUser.is_active || true
    } : null;
  }

  /**
   * Busca um usuário pelo email
   */
  async getUserByEmail(email) {
    try {
      console.log(`[HybridUserService] Buscando usuário por email: ${email}`);
      
      // Tentar com PostgreSQL direto primeiro (ambiente Replit)
      if (this.pgPool) {
        try {
          const query = 'SELECT * FROM users WHERE email = $1';
          const result = await this.pgPool.query(query, [email]);
          
          if (result.rows.length > 0) {
            console.log('[HybridUserService] Usuário encontrado via PostgreSQL');
            return this.mapDbUserToObject(result.rows[0]);
          }
        } catch (pgError) {
          console.error('[HybridUserService] Erro ao buscar via PostgreSQL:', pgError);
        }
      }
      
      // Tentar com Supabase (ambientes externos)
      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
          
          if (error) throw error;
          
          if (data) {
            console.log('[HybridUserService] Usuário encontrado via Supabase');
            return this.mapDbUserToObject(data);
          }
        } catch (supabaseError) {
          console.error('[HybridUserService] Erro ao buscar via Supabase:', supabaseError);
        }
      }
      
      console.log('[HybridUserService] Usuário não encontrado');
      return null;
    } catch (error) {
      console.error('[HybridUserService] Erro ao buscar usuário:', error);
      throw error;
    }
  }

  /**
   * Busca um usuário pelo ID
   */
  async getUserById(id) {
    try {
      console.log(`[HybridUserService] Buscando usuário por ID: ${id}`);
      
      // Tentar com PostgreSQL direto primeiro (ambiente Replit)
      if (this.pgPool) {
        try {
          const query = 'SELECT * FROM users WHERE id = $1';
          const result = await this.pgPool.query(query, [id]);
          
          if (result.rows.length > 0) {
            console.log('[HybridUserService] Usuário encontrado via PostgreSQL');
            return this.mapDbUserToObject(result.rows[0]);
          }
        } catch (pgError) {
          console.error('[HybridUserService] Erro ao buscar via PostgreSQL:', pgError);
        }
      }
      
      // Tentar com Supabase (ambientes externos)
      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            console.log('[HybridUserService] Usuário encontrado via Supabase');
            return this.mapDbUserToObject(data);
          }
        } catch (supabaseError) {
          console.error('[HybridUserService] Erro ao buscar via Supabase:', supabaseError);
        }
      }
      
      console.log('[HybridUserService] Usuário não encontrado');
      return null;
    } catch (error) {
      console.error('[HybridUserService] Erro ao buscar usuário:', error);
      throw error;
    }
  }

  /**
   * Cria um novo usuário
   */
  async createUser(userData) {
    try {
      console.log(`[HybridUserService] Criando novo usuário: ${userData.email}`);
      
      // Hash da senha
      const hashedPassword = await this.hashPassword(userData.password);
      
      // Preparar dados para inserção
      const userDataForDb = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        base_id: userData.baseId || null,
        oficina_id: userData.oficinaId || null,
        is_active: userData.isActive !== undefined ? userData.isActive : true
      };
      
      let createdUser = null;
      
      // Tentar com PostgreSQL direto primeiro (ambiente Replit)
      if (this.pgPool) {
        try {
          const query = `
            INSERT INTO users (name, email, password, role, base_id, oficina_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;
          
          const values = [
            userDataForDb.name,
            userDataForDb.email,
            userDataForDb.password,
            userDataForDb.role,
            userDataForDb.base_id,
            userDataForDb.oficina_id,
            userDataForDb.is_active
          ];
          
          const result = await this.pgPool.query(query, values);
          
          if (result.rows.length > 0) {
            console.log('[HybridUserService] Usuário criado via PostgreSQL');
            createdUser = this.mapDbUserToObject(result.rows[0]);
          }
        } catch (pgError) {
          console.error('[HybridUserService] Erro ao criar via PostgreSQL:', pgError);
        }
      }
      
      // Se não conseguiu via PostgreSQL, tentar via Supabase
      if (!createdUser && this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('users')
            .insert([userDataForDb])
            .select()
            .single();
          
          if (error) throw error;
          
          if (data) {
            console.log('[HybridUserService] Usuário criado via Supabase');
            createdUser = this.mapDbUserToObject(data);
          }
        } catch (supabaseError) {
          console.error('[HybridUserService] Erro ao criar via Supabase:', supabaseError);
        }
      }
      
      if (!createdUser) {
        throw new Error('Não foi possível criar o usuário');
      }
      
      return createdUser;
    } catch (error) {
      console.error('[HybridUserService] Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Atualiza os dados de um usuário
   */
  async updateUser(id, userData) {
    try {
      console.log(`[HybridUserService] Atualizando usuário ID: ${id}`);
      
      // Preparar campos para atualização
      const updateFields = {};
      
      if (userData.name !== undefined) updateFields.name = userData.name;
      if (userData.email !== undefined) updateFields.email = userData.email;
      if (userData.role !== undefined) updateFields.role = userData.role;
      if (userData.password !== undefined) updateFields.password = await this.hashPassword(userData.password);
      if (userData.baseId !== undefined) updateFields.base_id = userData.baseId;
      if (userData.oficinaId !== undefined) updateFields.oficina_id = userData.oficinaId;
      if (userData.isActive !== undefined) updateFields.is_active = userData.isActive;
      
      // Verificar se há campos para atualizar
      if (Object.keys(updateFields).length === 0) {
        throw new Error('Nenhum campo fornecido para atualização');
      }
      
      let updatedUser = null;
      
      // Tentar com PostgreSQL direto primeiro (ambiente Replit)
      if (this.pgPool) {
        try {
          // Construir query dinâmica
          const setClause = Object.keys(updateFields)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');
          
          const values = Object.values(updateFields);
          values.push(id); // Adicionar ID como último parâmetro
          
          const query = `
            UPDATE users
            SET ${setClause}
            WHERE id = $${values.length}
            RETURNING *
          `;
          
          const result = await this.pgPool.query(query, values);
          
          if (result.rows.length > 0) {
            console.log('[HybridUserService] Usuário atualizado via PostgreSQL');
            updatedUser = this.mapDbUserToObject(result.rows[0]);
          }
        } catch (pgError) {
          console.error('[HybridUserService] Erro ao atualizar via PostgreSQL:', pgError);
        }
      }
      
      // Se não conseguiu via PostgreSQL, tentar via Supabase
      if (!updatedUser && this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('users')
            .update(updateFields)
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          
          if (data) {
            console.log('[HybridUserService] Usuário atualizado via Supabase');
            updatedUser = this.mapDbUserToObject(data);
          }
        } catch (supabaseError) {
          console.error('[HybridUserService] Erro ao atualizar via Supabase:', supabaseError);
        }
      }
      
      if (!updatedUser) {
        throw new Error('Não foi possível atualizar o usuário');
      }
      
      return updatedUser;
    } catch (error) {
      console.error('[HybridUserService] Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Remove um usuário pelo ID
   */
  async deleteUser(id) {
    try {
      console.log(`[HybridUserService] Excluindo usuário ID: ${id}`);
      
      let success = false;
      
      // Tentar com PostgreSQL direto primeiro (ambiente Replit)
      if (this.pgPool) {
        try {
          const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
          const result = await this.pgPool.query(query, [id]);
          
          if (result.rows.length > 0) {
            console.log('[HybridUserService] Usuário excluído via PostgreSQL');
            success = true;
          }
        } catch (pgError) {
          console.error('[HybridUserService] Erro ao excluir via PostgreSQL:', pgError);
        }
      }
      
      // Se não conseguiu via PostgreSQL, tentar via Supabase
      if (!success && this.supabase) {
        try {
          const { error } = await this.supabase
            .from('users')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          
          console.log('[HybridUserService] Usuário excluído via Supabase');
          success = true;
        } catch (supabaseError) {
          console.error('[HybridUserService] Erro ao excluir via Supabase:', supabaseError);
        }
      }
      
      if (!success) {
        throw new Error('Não foi possível excluir o usuário');
      }
      
      return true;
    } catch (error) {
      console.error('[HybridUserService] Erro ao excluir usuário:', error);
      throw error;
    }
  }

  /**
   * Redefine a senha de um usuário
   */
  async resetPassword(id, newPassword) {
    try {
      console.log(`[HybridUserService] Redefinindo senha para usuário ID: ${id}`);
      
      // Hash da nova senha
      const hashedPassword = await this.hashPassword(newPassword);
      
      let success = false;
      
      // Tentar com PostgreSQL direto primeiro (ambiente Replit)
      if (this.pgPool) {
        try {
          const query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id';
          const result = await this.pgPool.query(query, [hashedPassword, id]);
          
          if (result.rows.length > 0) {
            console.log('[HybridUserService] Senha redefinida via PostgreSQL');
            success = true;
          }
        } catch (pgError) {
          console.error('[HybridUserService] Erro ao redefinir senha via PostgreSQL:', pgError);
        }
      }
      
      // Se não conseguiu via PostgreSQL, tentar via Supabase
      if (!success && this.supabase) {
        try {
          const { error } = await this.supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', id);
          
          if (error) throw error;
          
          console.log('[HybridUserService] Senha redefinida via Supabase');
          success = true;
        } catch (supabaseError) {
          console.error('[HybridUserService] Erro ao redefinir senha via Supabase:', supabaseError);
        }
      }
      
      if (!success) {
        throw new Error('Não foi possível redefinir a senha do usuário');
      }
      
      return true;
    } catch (error) {
      console.error('[HybridUserService] Erro ao redefinir senha:', error);
      throw error;
    }
  }

  /**
   * Lista todos os usuários com filtros opcionais
   */
  async listUsers(filters = {}) {
    try {
      console.log('[HybridUserService] Listando usuários com filtros:', filters);
      
      let usersList = null;
      
      // Tentar com PostgreSQL direto primeiro (ambiente Replit)
      if (this.pgPool) {
        try {
          // Construir query com filtros
          let whereClause = '';
          const values = [];
          let paramCounter = 1;
          
          if (filters.role) {
            whereClause = `WHERE role = $${paramCounter}`;
            values.push(filters.role);
            paramCounter++;
          }
          
          if (filters.baseId) {
            whereClause = whereClause
              ? `${whereClause} AND base_id = $${paramCounter}`
              : `WHERE base_id = $${paramCounter}`;
            values.push(filters.baseId);
            paramCounter++;
          }
          
          if (filters.isActive !== undefined) {
            whereClause = whereClause
              ? `${whereClause} AND is_active = $${paramCounter}`
              : `WHERE is_active = $${paramCounter}`;
            values.push(filters.isActive);
            paramCounter++;
          }
          
          const query = `SELECT * FROM users ${whereClause} ORDER BY name`;
          const result = await this.pgPool.query(query, values);
          
          if (result.rows.length > 0) {
            console.log(`[HybridUserService] ${result.rows.length} usuários encontrados via PostgreSQL`);
            usersList = result.rows.map(user => this.mapDbUserToObject(user));
          } else {
            usersList = [];
          }
        } catch (pgError) {
          console.error('[HybridUserService] Erro ao listar via PostgreSQL:', pgError);
        }
      }
      
      // Se não conseguiu via PostgreSQL, tentar via Supabase
      if (usersList === null && this.supabase) {
        try {
          let query = this.supabase
            .from('users')
            .select('*');
          
          if (filters.role) {
            query = query.eq('role', filters.role);
          }
          
          if (filters.baseId) {
            query = query.eq('base_id', filters.baseId);
          }
          
          if (filters.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive);
          }
          
          const { data, error } = await query.order('name');
          
          if (error) throw error;
          
          if (data) {
            console.log(`[HybridUserService] ${data.length} usuários encontrados via Supabase`);
            usersList = data.map(user => this.mapDbUserToObject(user));
          } else {
            usersList = [];
          }
        } catch (supabaseError) {
          console.error('[HybridUserService] Erro ao listar via Supabase:', supabaseError);
        }
      }
      
      if (usersList === null) {
        throw new Error('Não foi possível listar os usuários');
      }
      
      return usersList;
    } catch (error) {
      console.error('[HybridUserService] Erro ao listar usuários:', error);
      throw error;
    }
  }

  /**
   * Cria hash de senha
   */
  async hashPassword(password) {
    try {
      const salt = randomBytes(16).toString('hex');
      const buf = (await scryptAsync(password, salt, 64));
      return `${buf.toString('hex')}.${salt}`;
    } catch (error) {
      console.error('[HybridUserService] Erro ao gerar hash de senha:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma senha corresponde a um hash armazenado
   */
  async comparePasswords(supplied, stored) {
    try {
      console.log(`[HybridUserService] Comparando senha para autenticação`);
      
      // Verificar se a senha armazenada está no formato correto
      if (!stored || !stored.includes('.')) {
        console.error('[HybridUserService] Formato de senha inválido');
        return false;
      }
      
      const [hashed, salt] = stored.split('.');
      const hashedBuf = Buffer.from(hashed, 'hex');
      const suppliedBuf = await scryptAsync(supplied, salt, 64);
      
      // Usar timingSafeEqual para evitar ataques de timing
      const result = hashedBuf.length === suppliedBuf.length && 
        timingSafeEqual(hashedBuf, suppliedBuf);
      
      console.log(`[HybridUserService] Resultado da comparação de senha: ${result ? 'válida' : 'inválida'}`);
      return result;
    } catch (error) {
      console.error('[HybridUserService] Erro ao comparar senhas:', error);
      return false;
    }
  }

  /**
   * Gera uma senha aleatória
   */
  generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    const randomValues = randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      const randomIndex = randomValues[i] % chars.length;
      result += chars.charAt(randomIndex);
    }
    
    return result;
  }

  /**
   * Realiza a autenticação de um usuário e gera um token JWT
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<{token: string, user: Object}|null>} - Token JWT e dados do usuário ou null se falhar
   */
  async authenticateUser(email, password) {
    try {
      console.log(`[HybridUserService] Tentando autenticar usuário: ${email}`);
      
      // Buscar usuário pelo email
      const user = await this.getUserByEmail(email);
      if (!user) {
        console.log(`[HybridUserService] Usuário não encontrado: ${email}`);
        return null;
      }
      
      // Verificar se usuário está ativo
      if (!user.isActive) {
        console.log(`[HybridUserService] Usuário desativado: ${email}`);
        return null;
      }
      
      // Verificar senha
      const passwordValid = await this.comparePasswords(password, user.password);
      if (!passwordValid) {
        console.log(`[HybridUserService] Senha inválida para usuário: ${email}`);
        return null;
      }
      
      // Gerar token JWT
      const token = this.generateToken(user);
      
      // Retornar token e dados do usuário (sem a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        token,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('[HybridUserService] Erro na autenticação:', error);
      return null;
    }
  }

  /**
   * Gera um token JWT para o usuário
   * @param {Object} user - Dados do usuário
   * @returns {string} - Token JWT
   */
  generateToken(user) {
    try {
      const payload = {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        baseId: user.baseId,
        oficinaId: user.oficinaId
      };
      
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      console.error('[HybridUserService] Erro ao gerar token:', error);
      throw error;
    }
  }

  /**
   * Verifica e decodifica um token JWT
   * @param {string} token - Token JWT a ser verificado
   * @param {boolean} includeTokenInfo - Se deve incluir informações do token na resposta
   * @returns {Promise<Object|null>} - Dados do usuário ou null se o token for inválido
   */
  async verifyToken(token, includeTokenInfo = false) {
    try {
      if (!token) {
        console.log('[HybridUserService] Token não fornecido');
        return null;
      }
      
      console.log('[HybridUserService] Tentando verificar token JWT');
      
      // Verificar e decodificar o token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log('[HybridUserService] Token decodificado com sucesso:', decoded.sub);
      } catch (jwtError) {
        console.error('[HybridUserService] Erro na verificação JWT:', jwtError.message);
        return null;
      }
      
      // Buscar usuário no banco de dados para garantir que ainda existe e está ativo
      const userId = decoded.sub;
      console.log('[HybridUserService] Buscando usuário do token:', userId);
      const user = await this.getUserById(userId);
      
      if (!user) {
        console.log(`[HybridUserService] Usuário do token não encontrado: ${userId}`);
        return null;
      }
      
      // Verificar se o usuário está ativo (suporta is_active ou isActive)
      const isActive = user.isActive === undefined ? user.is_active : user.isActive;
      if (isActive === false) {
        console.log(`[HybridUserService] Usuário do token está inativo: ${userId}`);
        return null;
      }
      
      console.log(`[HybridUserService] Token verificado com sucesso para usuário: ${userId}`);
      
      // Retornar dados do usuário (sem a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      // Se solicitado, incluir informações do token decodificado
      if (includeTokenInfo) {
        return {
          user: userWithoutPassword,
          tokenInfo: {
            sub: decoded.sub,
            iat: decoded.iat,
            exp: decoded.exp,
            // Adicionar mais campos do token conforme necessário
          }
        };
      }
      
      return userWithoutPassword;
    } catch (error) {
      console.error('[HybridUserService] Erro ao verificar token:', error);
      return null;
    }
  }
}

// Instância singleton para uso em todo o aplicativo
let instance = null;

export function getHybridUserService() {
  if (!instance) {
    instance = new HybridUserService();
  }
  return instance;
}

export default getHybridUserService;