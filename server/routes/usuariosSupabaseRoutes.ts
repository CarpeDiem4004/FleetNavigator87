import type { Express, Request, Response } from "express";
import { pool } from "../db";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Função para hash de senha
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Use timing-safe comparison
    return hashedBuf.length === suppliedBuf.length && 
      timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
}

// Função para gerar senhas aleatórias seguras
function generateRandomPassword(length: number = 12): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '@#$%&*!?';
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Garantir pelo menos um de cada tipo
  let password = '';
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Completar com caracteres aleatórios
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Registra as rotas para gerenciar usuários no Supabase
 */
export function registerUsuariosSupabaseRoutes(app: Express) {
  // Middleware para verificar se o usuário é admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: "Não autenticado" 
      });
    }
    
    const user = req.user as any;
    
    if (user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Acesso negado. Apenas administradores podem acessar esta rota." 
      });
    }
    
    next();
  };
  
  // Rota para autenticar usuário do Supabase (login)
  app.post("/api/supabase-auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email e senha são obrigatórios"
        });
      }
      
      // Buscar usuário pelo email
      const query = {
        text: `
          SELECT * 
          FROM usuarios_supabase 
          WHERE email = $1 
          AND ativo = true
        `,
        values: [email]
      };
      
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas"
        });
      }
      
      const user = result.rows[0];
      
      // Verificar senha
      const isPasswordValid = await comparePasswords(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas"
        });
      }
      
      // Atualizar último login
      await pool.query(
        'UPDATE usuarios_supabase SET ultimo_login = NOW() WHERE id = $1',
        [user.id]
      );
      
      // Remover dados sensíveis
      delete user.password_hash;
      
      // Criar sessão
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Erro ao criar sessão",
            error: String(err)
          });
        }
        
        return res.json({
          success: true,
          message: "Login realizado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            nome_completo: user.nome_completo,
            role: user.role,
            base_id: user.base_id,
            base_nome: user.base_nome,
            oficina_id: user.oficina_id,
            ultimo_login: user.ultimo_login
          }
        });
      });
      
    } catch (error) {
      console.error("Erro ao autenticar usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao processar autenticação",
        error: String(error)
      });
    }
  });
  
  // Rota para buscar todos os usuários (apenas admin)
  app.get("/api/supabase-auth/usuarios", isAdmin, async (req, res) => {
    try {
      const query = `
        SELECT 
          id, 
          email, 
          username, 
          nome_completo, 
          role, 
          base_id, 
          base_nome, 
          oficina_id, 
          ativo, 
          ultimo_login,
          created_at,
          updated_at 
        FROM usuarios_supabase 
        ORDER BY nome_completo
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar usuários",
        error: String(error)
      });
    }
  });
  
  // Rota para buscar usuário pelo ID (apenas admin)
  app.get("/api/supabase-auth/usuarios/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      
      const query = {
        text: `
          SELECT 
            id, 
            email, 
            username, 
            nome_completo, 
            role, 
            base_id, 
            base_nome, 
            oficina_id, 
            ativo, 
            ultimo_login,
            created_at,
            updated_at 
          FROM usuarios_supabase 
          WHERE id = $1
        `,
        values: [id]
      };
      
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error(`Erro ao buscar usuário ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar usuário",
        error: String(error)
      });
    }
  });
  
  // Rota para criar um novo usuário (apenas admin)
  app.post("/api/supabase-auth/usuarios", isAdmin, async (req, res) => {
    try {
      const {
        email,
        username,
        nome_completo,
        role,
        base_id,
        base_nome,
        oficina_id
      } = req.body;
      
      // Validar campos obrigatórios
      if (!email || !nome_completo || !role) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios: email, nome_completo, role"
        });
      }
      
      // Mapear "Gestor de Frota" para "gestor_frota" se necessário
      let roleValue = role;
      if (role === "Gestor de Frota") {
        roleValue = "gestor_frota";
      }
      
      // Gerar username se não for fornecido
      const finalUsername = username || email.split('@')[0];
      
      // Verificar se o email já está em uso
      const emailCheck = await pool.query(
        'SELECT id FROM usuarios_supabase WHERE email = $1',
        [email]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Este email já está em uso"
        });
      }
      
      // Verificar se o username já está em uso
      const usernameCheck = await pool.query(
        'SELECT id FROM usuarios_supabase WHERE username = $1',
        [finalUsername]
      );
      
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Este nome de usuário já está em uso"
        });
      }
      
      // Gerar senha aleatória
      const randomPassword = generateRandomPassword(12);
      const passwordHash = await hashPassword(randomPassword);
      
      // Inserir o novo usuário
      const insertQuery = {
        text: `
          INSERT INTO usuarios_supabase (
            email, 
            username, 
            password_hash, 
            nome_completo, 
            role, 
            base_id, 
            base_nome, 
            oficina_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
        values: [
          email,
          finalUsername,
          passwordHash,
          nome_completo,
          roleValue,
          base_id || null,
          base_nome || null,
          oficina_id || null
        ]
      };
      
      const result = await pool.query(insertQuery);
      const newUser = result.rows[0];
      
      // Remover dados sensíveis
      delete newUser.password_hash;
      
      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        data: newUser,
        temporary_password: randomPassword
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar usuário",
        error: String(error)
      });
    }
  });
  
  // Rota para atualizar um usuário (apenas admin)
  app.put("/api/supabase-auth/usuarios/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const {
        email,
        username,
        nome_completo,
        role,
        base_id,
        base_nome,
        oficina_id,
        ativo
      } = req.body;
      
      // Verificar se o usuário existe
      const userCheck = await pool.query(
        'SELECT id FROM usuarios_supabase WHERE id = $1',
        [id]
      );
      
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      // Verificar campos atualizáveis
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      if (email !== undefined) {
        // Verificar se o email já está em uso por outro usuário
        const emailCheck = await pool.query(
          'SELECT id FROM usuarios_supabase WHERE email = $1 AND id != $2',
          [email, id]
        );
        
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Este email já está em uso por outro usuário"
          });
        }
        
        updateFields.push(`email = $${paramCounter++}`);
        updateValues.push(email);
      }
      
      if (username !== undefined) {
        // Verificar se o username já está em uso por outro usuário
        const usernameCheck = await pool.query(
          'SELECT id FROM usuarios_supabase WHERE username = $1 AND id != $2',
          [username, id]
        );
        
        if (usernameCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Este nome de usuário já está em uso por outro usuário"
          });
        }
        
        updateFields.push(`username = $${paramCounter++}`);
        updateValues.push(username);
      }
      
      if (nome_completo !== undefined) {
        updateFields.push(`nome_completo = $${paramCounter++}`);
        updateValues.push(nome_completo);
      }
      
      if (role !== undefined) {
        updateFields.push(`role = $${paramCounter++}`);
        updateValues.push(role);
      }
      
      if (base_id !== undefined) {
        updateFields.push(`base_id = $${paramCounter++}`);
        updateValues.push(base_id);
      }
      
      if (base_nome !== undefined) {
        updateFields.push(`base_nome = $${paramCounter++}`);
        updateValues.push(base_nome);
      }
      
      if (oficina_id !== undefined) {
        updateFields.push(`oficina_id = $${paramCounter++}`);
        updateValues.push(oficina_id);
      }
      
      if (ativo !== undefined) {
        updateFields.push(`ativo = $${paramCounter++}`);
        updateValues.push(ativo);
      }
      
      // Adicionar o campo updated_at
      updateFields.push(`updated_at = NOW()`);
      
      // Adicionar o ID do usuário aos valores
      updateValues.push(id);
      
      // Construir a query de atualização
      const updateQuery = {
        text: `
          UPDATE usuarios_supabase
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCounter}
          RETURNING id, email, username, nome_completo, role, base_id, base_nome, oficina_id, ativo, ultimo_login, created_at, updated_at
        `,
        values: updateValues
      };
      
      const result = await pool.query(updateQuery);
      
      res.json({
        success: true,
        message: "Usuário atualizado com sucesso",
        data: result.rows[0]
      });
    } catch (error) {
      console.error(`Erro ao atualizar usuário ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Erro ao atualizar usuário",
        error: String(error)
      });
    }
  });
  
  // Rota para redefinir a senha de um usuário (apenas admin)
  app.post("/api/supabase-auth/usuarios/:id/reset-password", isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      
      // Verificar se o usuário existe
      const userCheck = await pool.query(
        'SELECT id, email FROM usuarios_supabase WHERE id = $1',
        [id]
      );
      
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      const user = userCheck.rows[0];
      
      // Gerar nova senha aleatória
      const newPassword = generateRandomPassword(12);
      const passwordHash = await hashPassword(newPassword);
      
      // Atualizar a senha do usuário
      await pool.query(
        'UPDATE usuarios_supabase SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, id]
      );
      
      res.json({
        success: true,
        message: "Senha redefinida com sucesso",
        email: user.email,
        temporary_password: newPassword
      });
    } catch (error) {
      console.error(`Erro ao redefinir senha do usuário ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Erro ao redefinir senha",
        error: String(error)
      });
    }
  });
  
  // Rota para alterar a própria senha (usuário autenticado)
  app.post("/api/supabase-auth/alterar-senha", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          success: false, 
          message: "Não autenticado" 
        });
      }
      
      const { senha_atual, nova_senha } = req.body;
      const user = req.user as any;
      
      if (!senha_atual || !nova_senha) {
        return res.status(400).json({
          success: false,
          message: "Senha atual e nova senha são obrigatórias"
        });
      }
      
      // Buscar hash da senha atual
      const userQuery = await pool.query(
        'SELECT password_hash FROM usuarios_supabase WHERE id = $1',
        [user.id]
      );
      
      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      const storedHash = userQuery.rows[0].password_hash;
      
      // Verificar se a senha atual está correta
      const isCurrentPasswordValid = await comparePasswords(senha_atual, storedHash);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Senha atual incorreta"
        });
      }
      
      // Validar nova senha (pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      
      if (!passwordRegex.test(nova_senha)) {
        return res.status(400).json({
          success: false,
          message: "A nova senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais"
        });
      }
      
      // Hash a nova senha
      const newPasswordHash = await hashPassword(nova_senha);
      
      // Atualizar a senha
      await pool.query(
        'UPDATE usuarios_supabase SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, user.id]
      );
      
      res.json({
        success: true,
        message: "Senha alterada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao alterar senha",
        error: String(error)
      });
    }
  });
  
  // Rota para excluir um usuário (apenas admin - na verdade, apenas marca como inativo)
  app.delete("/api/supabase-auth/usuarios/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      
      // Verificar se o usuário existe
      const userCheck = await pool.query(
        'SELECT id FROM usuarios_supabase WHERE id = $1',
        [id]
      );
      
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      // Verificar se não é o último admin
      if ((req.user as any).id === id) {
        const adminCount = await pool.query(
          "SELECT COUNT(*) FROM usuarios_supabase WHERE role = 'admin' AND ativo = true"
        );
        
        if (parseInt(adminCount.rows[0].count) <= 1) {
          return res.status(400).json({
            success: false,
            message: "Não é possível excluir o único administrador do sistema"
          });
        }
      }
      
      // Marcar o usuário como inativo em vez de excluí-lo
      await pool.query(
        'UPDATE usuarios_supabase SET ativo = false, updated_at = NOW() WHERE id = $1',
        [id]
      );
      
      res.json({
        success: true,
        message: "Usuário desativado com sucesso"
      });
    } catch (error) {
      console.error(`Erro ao desativar usuário ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Erro ao desativar usuário",
        error: String(error)
      });
    }
  });
}