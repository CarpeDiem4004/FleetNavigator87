import { Router } from 'express';

const router = Router();

// Rota de diagnóstico para verificar autenticação
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
      'user-agent': req.headers['user-agent'],
      host: req.headers.host
    }
  });
});

export default router;