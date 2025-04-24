import { Request, Response } from 'express';
import { pool } from '../db';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

// Rota para ressincronizar a sessão usando token JWT do Supabase
export async function resyncSession(req: Request, res: Response) {
  try {
    // Obter o token de autenticação do header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token de autenticação não fornecido' });
    }
    
    // Extrair o token do header Authorization
    const token = extractJwtToken(authHeader);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Formato de token inválido' });
    }
    
    console.log('[ResyncSession] Tentando validar token JWT do Supabase');
    
    // Validar o token com o Supabase
    const user = await validateSupabaseToken(token);
    
    if (!user || !user.email) {
      return res.status(401).json({ success: false, message: 'Token inválido ou usuário não encontrado' });
    }
    
    console.log(`[ResyncSession] Token válido para o usuário ${user.email}`);
    
    // Buscar o usuário no banco de dados
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [user.email]
    );
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado no banco de dados' });
    }
    
    const dbUser = userResult.rows[0];
    
    // Ativar a sessão do usuário
    if (req.login) {
      req.login(dbUser, (err) => {
        if (err) {
          console.error('[ResyncSession] Erro ao criar sessão:', err);
          return res.status(500).json({ success: false, message: 'Erro ao criar sessão' });
        }
        
        console.log(`[ResyncSession] Sessão ressincronizada com sucesso para ${dbUser.email}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Sessão ressincronizada com sucesso',
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role
          }
        });
      });
    } else {
      return res.status(500).json({ success: false, message: 'Função de login não disponível' });
    }
  } catch (error) {
    console.error('[ResyncSession] Erro ao ressincronizar sessão:', error);
    return res.status(401).json({ 
      success: false, 
      message: error instanceof AuthError 
        ? 'Token de autenticação inválido' 
        : 'Erro ao ressincronizar sessão' 
    });
  }
}