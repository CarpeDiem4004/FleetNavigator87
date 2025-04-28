/**
 * Rotas de diagnóstico específicas para postos
 * Estas rotas ajudam a identificar problemas de acesso quando utilizando o domínio personalizado
 */

import { Router } from 'express';

const router = Router();

// Rota para verificar acesso e autenticação nos postos
router.get('/diagnostico', (req, res) => {
  const isAuth = req.isAuthenticated();
  const sessionInfo = req.session 
    ? {
        id: req.sessionID,
        cookie: req.session.cookie ? {
          domain: req.session.cookie.domain,
          path: req.session.cookie.path,
          secure: req.session.cookie.secure,
          expires: req.session.cookie.expires,
          maxAge: req.session.cookie.maxAge
        } : undefined
      }
    : undefined;
    
  return res.json({
    success: true,
    currentRoute: '/postos/diagnostico',
    isAuthenticated: isAuth,
    user: isAuth ? { 
      id: req.user.id, 
      email: req.user.email,
      role: req.user.role
    } : null,
    host: req.hostname,
    path: req.path,
    method: req.method,
    session: sessionInfo,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    },
    isDomainGestaoonfleet: req.hostname.includes('gestaoonfleet.com.br'),
    sugestedAction: !isAuth ? 'Necessário fazer login em gestaoonfleet.com.br/login antes de acessar' : 'Usuário está autenticado'
  });
});

// Rota para verificar os cookies da sessão
router.get('/cookies', (req, res) => {
  return res.json({
    success: true,
    sessionID: req.sessionID,
    cookies: req.headers.cookie,
    host: req.hostname,
    sessionPresent: !!req.session
  });
});

export default router;