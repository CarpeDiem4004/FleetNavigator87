import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';

/**
 * Middleware para mapear um usuário autenticado do Supabase
 * para um usuário do sistema na sessão atual.
 * 
 * Deve ser usado após um middleware de autenticação Supabase
 * que define req.supabaseUser.
 */
export const mapSupabaseUserToSession = async (req: Request, res: Response, next: NextFunction) => {
  // Verificar se existe um usuário Supabase autenticado, mas não uma sessão
  if (req.supabaseUser && !req.isAuthenticated()) {
    try {
      // Obter o email do usuário Supabase
      const supabaseEmail = req.supabaseUser.email;

      if (!supabaseEmail) {
        return res.status(400).json({ message: "Usuário Supabase sem email" });
      }

      // Buscar o usuário no banco de dados local pelo email
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [supabaseEmail]
      );

      if (userResult.rowCount === 0 || !userResult.rows[0]) {
        console.log(`[MapSupabaseUser] Usuário não encontrado para email: ${supabaseEmail}`);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const user = userResult.rows[0];
      
      // Atualizar o supabase_uid do usuário se necessário
      try {
        // Verificar se a coluna supabase_uid já existe
        const columnCheck = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'supabase_uid'
        `);
        
        // Se a coluna não existe, adicione-a
        if (columnCheck.rowCount === 0) {
          console.log('[MapSupabaseUser] Adicionando coluna supabase_uid à tabela users');
          await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255)
          `);
        }
        
        // Se o usuário não tem supabase_uid ou está diferente, atualize
        if (!user.supabase_uid || user.supabase_uid !== req.supabaseUser.id) {
          console.log(`[MapSupabaseUser] Vinculando usuário PostgreSQL ${user.id} ao Supabase ${req.supabaseUser.id}`);
          await pool.query(
            'UPDATE users SET supabase_uid = $1 WHERE id = $2',
            [req.supabaseUser.id, user.id]
          );
        }
      } catch (error) {
        console.error('[MapSupabaseUser] Erro ao atualizar supabase_uid:', error);
        // Não interrompe o fluxo em caso de erro
      }
      
      // Fazer login do usuário na sessão
      req.login(user, (err) => {
        if (err) {
          console.error('[MapSupabaseUser] Erro ao fazer login na sessão:', err);
          return next(err);
        }
        
        console.log(`[MapSupabaseUser] Usuário do Supabase mapeado para sessão: ${user.id} (${user.email})`);
        next();
      });
    } catch (error) {
      console.error('[MapSupabaseUser] Erro ao mapear usuário Supabase:', error);
      next(error);
    }
  } else {
    next();
  }
};