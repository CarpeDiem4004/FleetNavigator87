import { Router, Request, Response } from 'express';
import { 
  isAuthenticated, 
  isAuthenticatedWithMapping, 
  isSessionAuthenticated,
  isJwtAuthenticated 
} from '../middleware/auth/index';
// Não é necessário importar os tipos, eles já são definidos globalmente

const router = Router();

// Rota para testar a autenticação híbrida
router.get('/test/hybrid', isAuthenticated, (req: Request, res: Response) => {
  // Esta rota aceita tanto sessão quanto token JWT
  const authMethod = req.isAuthenticated() ? 'sessão' : 'token JWT';
  
  // Verificar se temos algum método de autenticação ativo
  if (!req.isAuthenticated() && !req.supabaseUser) {
    return res.status(500).json({
      success: false,
      message: 'Erro: middleware de autenticação híbrida passou, mas nenhum método de autenticação foi encontrado'
    });
  }
  
  // Se autenticado por sessão, usar usuário da sessão, senão usar Supabase
  const user = req.isAuthenticated() && req.user 
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
router.get('/test/mapping', isAuthenticatedWithMapping, (req: Request, res: Response) => {
  // Esta rota aceita token JWT e mapeia para sessão
  if (!req.isAuthenticated() && !req.user) {
    return res.status(500).json({
      success: false,
      message: 'Erro: mapeamento JWT para sessão falhou, usuário não está na sessão'
    });
  }
  
  res.json({
    success: true,
    message: 'Autenticado com mapeamento JWT para sessão',
    user: req.isAuthenticated() && req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    hasSession: req.isAuthenticated(),
    hasJwtUser: !!req.supabaseUser,
    mappingWorked: req.isAuthenticated() && !!req.supabaseUser
  });
});

// Rota para testar apenas autenticação por sessão
router.get('/test/session', isSessionAuthenticated, (req: Request, res: Response) => {
  // Esta rota aceita apenas sessão
  // Sabemos que o usuário está autenticado pelo middleware, mas vamos verificar por segurança
  if (!req.user) {
    return res.status(500).json({
      success: false,
      message: 'Erro: autenticação por sessão bem-sucedida, mas objeto de usuário não encontrado'
    });
  }
  
  res.json({
    success: true,
    message: 'Autenticado via sessão',
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
    hasSession: true,
    hasJwtUser: !!req.supabaseUser
  });
});

// Rota para testar apenas autenticação por token JWT
router.get('/test/jwt', isJwtAuthenticated, (req: Request, res: Response) => {
  // Esta rota aceita apenas token JWT
  if (!req.supabaseUser) {
    return res.status(500).json({
      success: false,
      message: 'Erro: autenticação JWT bem-sucedida, mas objeto de usuário Supabase não encontrado'
    });
  }
  
  res.json({
    success: true,
    message: 'Autenticado via token JWT',
    user: req.supabaseUser,
    hasSession: req.isAuthenticated(),
    hasJwtUser: true
  });
});

export default router;