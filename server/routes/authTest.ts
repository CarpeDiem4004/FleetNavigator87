import { Router } from 'express';
import { 
  isAuthenticated, 
  isAuthenticatedWithMapping, 
  isSessionAuthenticated,
  isJwtAuthenticated 
} from '../middleware/auth/index';

const router = Router();

// Rota para testar a autenticação híbrida
router.get('/test/hybrid', isAuthenticated, (req, res) => {
  // Esta rota aceita tanto sessão quanto token JWT
  const authMethod = req.isAuthenticated() ? 'sessão' : 'token JWT';
  
  const user = req.isAuthenticated() 
    ? { id: req.user.id, email: req.user.email, role: req.user.role } 
    : req.supabaseUser;
  
  res.json({
    success: true,
    message: `Autenticado via ${authMethod}`,
    user,
    hasSession: req.isAuthenticated(),
    hasJwtUser: !!req.supabaseUser
  });
});

// Rota para testar a autenticação com mapeamento
router.get('/test/mapping', isAuthenticatedWithMapping, (req, res) => {
  // Esta rota aceita token JWT e mapeia para sessão
  res.json({
    success: true,
    message: 'Autenticado com mapeamento JWT para sessão',
    user: req.isAuthenticated() ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    hasSession: req.isAuthenticated(),
    hasJwtUser: !!req.supabaseUser
  });
});

// Rota para testar apenas autenticação por sessão
router.get('/test/session', isSessionAuthenticated, (req, res) => {
  // Esta rota aceita apenas sessão
  res.json({
    success: true,
    message: 'Autenticado via sessão',
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
    hasSession: true,
    hasJwtUser: !!req.supabaseUser
  });
});

// Rota para testar apenas autenticação por token JWT
router.get('/test/jwt', isJwtAuthenticated, (req, res) => {
  // Esta rota aceita apenas token JWT
  res.json({
    success: true,
    message: 'Autenticado via token JWT',
    user: req.supabaseUser,
    hasSession: req.isAuthenticated(),
    hasJwtUser: true
  });
});

export default router;