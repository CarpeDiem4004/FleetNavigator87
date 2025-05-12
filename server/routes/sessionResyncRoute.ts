import { Request, Response } from 'express';
import { pool } from '../db';
import { validateSupabaseToken, extractJwtToken, AuthError } from '../utils/auth';

// Rota para ressincronizar a sessão usando token JWT do Supabase
// ou forçando a sincronização com base no ID de usuário fornecido
export async function resyncSession(req: Request, res: Response) {
  try {
    // Verificar se é uma solicitação de sincronização forçada
    const isForceSync = req.headers['x-force-sync'] === 'true';
    const userData = req.body?.user;
    
    // Forçar sincronização com dados do corpo da requisição
    if (isForceSync && userData) {
      console.log('[ResyncSession] Forçando sincronização com dados fornecidos:', userData.email);
      
      // Fazer validação mínima dos dados
      if (!userData.email) {
        return res.status(400).json({ success: false, message: 'Email do usuário não fornecido' });
      }
      
      // Buscar o usuário no banco de dados
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      
      if (userResult.rowCount === 0) {
        // Tentar na tabela tradicional
        const tradResult = await pool.query(
          'SELECT * FROM usuarios WHERE email = $1',
          [userData.email]
        );
        
        if (tradResult.rowCount === 0) {
          return res.status(404).json({ success: false, message: 'Usuário não encontrado no banco de dados' });
        }
        
        const dbUser = tradResult.rows[0];
        // Prosseguir com login usando dados da tabela tradicional
        return handleUserLogin(req, res, dbUser);
      }
      
      const dbUser = userResult.rows[0];
      // Prosseguir com login usando dados da tabela Supabase
      return handleUserLogin(req, res, dbUser);
    }
    
    // Fluxo normal com autenticação JWT
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
    
    // Buscar o usuário no banco de dados (primeiro na tabela Supabase)
    let userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [user.email]
    );
    
    // Se não encontrar na tabela Supabase, tentar na tabela tradicional
    if (userResult.rowCount === 0) {
      userResult = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [user.email]
      );
      
      if (userResult.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado no banco de dados' });
      }
    }
    
    const dbUser = userResult.rows[0];
    
    // Prosseguir com login
    return handleUserLogin(req, res, dbUser);
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

// Função auxiliar para lidar com o login do usuário
function handleUserLogin(req: Request, res: Response, dbUser: any) {
  // Ativar a sessão do usuário
  if (req.login) {
    req.login(dbUser, (err) => {
      if (err) {
        console.error('[ResyncSession] Erro ao criar sessão:', err);
        return res.status(500).json({ success: false, message: 'Erro ao criar sessão' });
      }
      
      // Tocar na sessão para garantir que ela seja salva
      req.session.touch();
      req.session.save((saveErr) => {
        if (saveErr) {
          console.warn('[ResyncSession] Aviso ao salvar sessão:', saveErr);
        }
        
        console.log(`[ResyncSession] Sessão ressincronizada com sucesso para ${dbUser.email}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Sessão ressincronizada com sucesso',
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            baseId: dbUser.baseId || dbUser.base_id,
            basename: dbUser.basename
          }
        });
      });
    });
  } else {
    return res.status(500).json({ success: false, message: 'Função de login não disponível' });
  }
}