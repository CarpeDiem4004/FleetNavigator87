import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import '../types/express';

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