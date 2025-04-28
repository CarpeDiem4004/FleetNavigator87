import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para auxiliar na depuração de problemas de autenticação
 * Este middleware analisa os detalhes da requisição e da sessão
 * para identificar problemas na autenticação
 */
export const debugAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se estamos na rota de verificação de autenticação
  const isAuthCheckRoute = req.path === '/api/user' || 
                          req.path === '/api/auth-status' ||
                          req.path.includes('/auth-test');
  
  if (isAuthCheckRoute) {
    // Obter informações detalhadas sobre a sessão
    const sessionInfo = req.session ? {
      id: req.sessionID,
      cookie: req.session.cookie ? {
        domain: (req.session.cookie as any).domain,
        path: req.session.cookie.path,
        httpOnly: req.session.cookie.httpOnly,
        secure: req.session.cookie.secure,
        maxAge: req.session.cookie.maxAge,
        expires: (req.session.cookie as any).expires
      } : 'Sem cookie na sessão',
      passport: (req.session as any).passport,
      raw: JSON.stringify(req.session)
    } : 'Sem sessão';
    
    // Obter informações sobre cookies
    let cookieInfo = 'Sem cookies';
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      cookieInfo = cookies.join(' | ');
    }
    
    console.log(`[DebugAuth] Verificação de autenticação: ${req.path}`);
    console.log(`[DebugAuth] isAuthenticated: ${req.isAuthenticated()}`);
    console.log(`[DebugAuth] SessionID: ${req.sessionID}`);
    console.log(`[DebugAuth] Cookies: ${cookieInfo}`);
    console.log(`[DebugAuth] Session Info:`, sessionInfo);
    console.log(`[DebugAuth] User:`, req.user || 'Não autenticado');

    // Se o usuário está autenticado, mas a informação não está chegando corretamente
    if (req.sessionID && !req.isAuthenticated()) {
      console.warn(`[DebugAuth] ALERTA: sessionID existe (${req.sessionID}) mas isAuthenticated() = false!`);
      // Verificar se há info de passport na sessão
      console.warn(`[DebugAuth] Passport na sessão:`, (req.session as any)?.passport || 'ausente');
      console.warn(`[DebugAuth] Usuário na sessão:`, req.user || 'ausente');
    }
  }
  
  next();
};

/**
 * Middleware para tentativa de recuperação automática de sessão
 * Tenta realizar um "auto-login" em caso de inconsistência na sessão
 */
export const recoverSessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Se temos ID de sessão mas não estamos autenticados, tenta recuperar
  if (req.sessionID && !req.isAuthenticated() && req.session) {
    try {
      // Verificar se há ID de usuário na sessão (passport)
      const passportData = (req.session as any)?.passport;
      const userId = passportData?.user;
      
      if (userId) {
        console.log(`[RecoverSession] Tentando recuperar sessão para userId ${userId}`);
        
        // Tentar obter usuário do banco de dados
        const { pool } = require('../db');
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
        
        if (result.rowCount > 0) {
          const user = result.rows[0];
          console.log(`[RecoverSession] Usuário recuperado do banco: ${user.email} (${user.id})`);
          
          // "Simular" login manual para o usuário
          req.login(user, (err) => {
            if (err) {
              console.error('[RecoverSession] Erro ao realizar login manual:', err);
            } else {
              console.log('[RecoverSession] Login manual realizado com sucesso!');
            }
            next();
          });
          return;
        }
      }
    } catch (error) {
      console.error('[RecoverSession] Erro ao tentar recuperar sessão:', error);
    }
  }
  
  next();
};