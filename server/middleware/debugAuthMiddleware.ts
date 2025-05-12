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
    // Verificar se a função isAuthenticated existe antes de chamá-la
    const isAuthed = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'Função ainda não disponível';
    console.log(`[DebugAuth] isAuthenticated: ${isAuthed}`);
    console.log(`[DebugAuth] SessionID: ${req.sessionID}`);
    console.log(`[DebugAuth] Cookies: ${cookieInfo}`);
    console.log(`[DebugAuth] Session Info:`, sessionInfo);
    console.log(`[DebugAuth] User:`, req.user || 'Não autenticado');

    // Se o usuário está autenticado, mas a informação não está chegando corretamente
    // Verificar se a função isAuthenticated existe antes de usá-la na comparação
    if (req.sessionID && typeof req.isAuthenticated === 'function' && !req.isAuthenticated()) {
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
 * ou quando o cookie de autenticação está presente mas a sessão não
 */
export const recoverSessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Verificar se a rota é uma API que requer autenticação
  const isApiRoute = req.path.startsWith('/api/') && 
                   !req.path.startsWith('/api/login') && 
                   !req.path.startsWith('/api/register') &&
                   !req.path.startsWith('/api/auth');
  
  // Verificar se temos autenticação
  const isAuthed = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;
  
  // Verificar se é uma rota protegida mas não estamos autenticados
  if (isApiRoute && !isAuthed) {
    try {
      // ESTRATÉGIA 1: Verificar sessão existente
      if (req.sessionID && req.session) {
        const passportData = (req.session as any)?.passport;
        const userId = passportData?.user;
        
        if (userId) {
          console.log(`[RecoverSession] Estratégia 1: Tentando recuperar sessão para userId ${userId}`);
          
          try {
            // Tentar obter usuário do banco de dados
            const { pool } = require('../db');
            
            // Primeiro tentar na tabela usuarios (tradicional)
            let result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
            
            // Se não encontrar, tentar na tabela users (Supabase/híbrida)
            if (!result.rows || result.rowCount === 0) {
              result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
            }
            
            // Se encontrou o usuário
            if (result.rowCount > 0) {
              const user = result.rows[0];
              console.log(`[RecoverSession] Usuário recuperado do banco: ${user.email} (${user.id})`);
              
              if (typeof req.login === 'function') {
                // "Simular" login manual para o usuário
                return req.login(user, (err) => {
                  if (err) {
                    console.error('[RecoverSession] Erro ao realizar login manual:', err);
                  } else {
                    console.log('[RecoverSession] Login manual realizado com sucesso!');
                    // Salvar sessão explicitamente
                    req.session.save();
                  }
                  next();
                });
              }
            }
          } catch (dbErr) {
            console.error('[RecoverSession] Erro ao consultar banco:', dbErr);
          }
        }
      }
      
      // ESTRATÉGIA 2: Verificar JWT no cookie
      const authHeader = req.headers.authorization;
      const authCookie = req.cookies?.['authToken'] || req.cookies?.['supabase-auth-token'];
      
      if (authHeader || authCookie) {
        console.log('[RecoverSession] Estratégia 2: Verificando token JWT');
        
        try {
          // Extrair token
          let token;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          } else if (authCookie) {
            token = typeof authCookie === 'string' ? authCookie : authCookie[0];
          }
          
          if (token) {
            // Verificar token usando JWT
            const jsonwebtoken = require('jsonwebtoken');
            
            // Tentar diferentes segredos
            const jwtSecret = process.env.JWT_SECRET || 'seu_jwt_secret_dev';
            
            try {
              const decoded = jsonwebtoken.verify(token, jwtSecret);
              
              if (decoded && decoded.email) {
                console.log(`[RecoverSession] Token contém email: ${decoded.email}`);
                
                // Buscar usuário por email
                const { pool } = require('../db');
                let result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [decoded.email]);
                
                // Se não encontrar, tentar em users
                if (!result.rows || result.rowCount === 0) {
                  result = await pool.query('SELECT * FROM users WHERE email = $1', [decoded.email]);
                }
                
                // Se encontrou o usuário
                if (result.rowCount > 0) {
                  const user = result.rows[0];
                  console.log(`[RecoverSession] Usuário recuperado via JWT: ${user.email} (${user.id})`);
                  
                  if (typeof req.login === 'function') {
                    return req.login(user, (err) => {
                      if (err) {
                        console.error('[RecoverSession] Erro ao realizar login via JWT:', err);
                      } else {
                        console.log('[RecoverSession] Login via JWT realizado com sucesso!');
                        // Salvar sessão explicitamente
                        req.session.save();
                      }
                      next();
                    });
                  }
                }
              }
            } catch (jwtErr) {
              console.warn('[RecoverSession] Erro ao verificar JWT:', jwtErr.message);
            }
          }
        } catch (tokenErr) {
          console.error('[RecoverSession] Erro ao processar token:', tokenErr);
        }
      }
      
      // ESTRATÉGIA 3: Verificar cookie de sessão (para rotas protegidas)
      if (req.path === '/api/user' || req.path === '/api/auth-status') {
        // Se estamos verificando o status do usuário, verificamos especificamente
        // o cookie de sessão para tentar uma última recuperação
        if (req.headers.cookie && req.headers.cookie.includes('connect.sid=')) {
          console.log('[RecoverSession] Estratégia 3: Verificando cookie de sessão');
          
          // Para rotas de verificação de usuário, tentamos regenerar a sessão
          req.session.regenerate((regErr) => {
            if (regErr) {
              console.error('[RecoverSession] Erro ao regenerar sessão:', regErr);
            } else {
              console.log('[RecoverSession] Sessão regenerada com sucesso');
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