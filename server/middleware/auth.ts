import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar se o usuário está autenticado
 * Retorna 401 se o usuário não estiver autenticado
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    console.log('Acesso não autenticado:', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      hasSession: !!req.session,
      sessionID: req.sessionID
    });
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  return next();
};

/**
 * Middleware para verificar se o usuário é administrador
 * Permite acesso para usuários com role='admin' ou emails específicos
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Lista de emails de administradores específicos
  const adminEmails = [
    'joao.paulo@muricionfleet.com',
    'regio@muricionfleet.com',
    'andre.rosa@muricionfleet.com'
  ];
  
  // Verificar autenticação primeiro
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  // Permitir acesso para:
  // 1. Qualquer role que contenha a palavra 'admin' independente de maiúsculas/minúsculas
  // 2. Emails específicos de administradores
  if (req.user && (
      (req.user.role && req.user.role.toLowerCase().includes('admin')) ||
      (req.user.email && adminEmails.includes(req.user.email.toLowerCase()))
    )) {
    return next();
  }
  
  console.log("Acesso negado - Permissão de administrador necessária:", {
    url: req.originalUrl,
    method: req.method,
    userEmail: req.user?.email,
    userRole: req.user?.role
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão de administrador necessária." });
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de manutenção
 * Permite acesso para admin, gestor, oficina ou baseId=12 (Gestão de Frotas)
 */
export const hasMaintenanceAccess = (req: Request, res: Response, next: NextFunction) => {
  // Lista de emails de administradores específicos
  const adminEmails = [
    'joao.paulo@muricionfleet.com',
    'regio@muricionfleet.com',
    'andre.rosa@muricionfleet.com'
  ];
  
  // Verificar autenticação primeiro
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  // Verifica se o usuário está autenticado e tem permissão de acesso a manutenção
  if (req.user && (
      (req.user.role && req.user.role.toLowerCase().includes('admin')) || 
      (req.user.email && adminEmails.includes(req.user.email.toLowerCase())) ||
      req.user.role === 'gestor' || 
      req.user.baseId === 12 || 
      req.user.role === 'oficina'
    )) {
    return next();
  }
  
  console.log("Acesso negado a recurso de manutenção:", {
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role,
    baseId: req.user?.baseId,
    email: req.user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin, gestor ou oficina necessária." });
};

/**
 * Middleware para verificar se o usuário tem permissão para acessar funcionalidades de pneus
 * Permite acesso para admin, baseId=12 (Gestão de Frotas) ou role='pneus'
 */
export const hasTiresAccess = (req: Request, res: Response, next: NextFunction) => {
  // Lista de emails de administradores específicos
  const adminEmails = [
    'joao.paulo@muricionfleet.com',
    'regio@muricionfleet.com',
    'andre.rosa@muricionfleet.com'
  ];
  
  // Verificar autenticação primeiro
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  if (req.user && (
    (req.user.role && req.user.role.toLowerCase().includes('admin')) || 
    (req.user.email && adminEmails.includes(req.user.email.toLowerCase())) ||
    req.user.baseId === 12 || 
    req.user.role === 'pneus'
  )) {
    return next();
  }
  
  console.log("Acesso negado a recurso de pneus:", {
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role,
    baseId: req.user?.baseId,
    email: req.user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Permissão de gestão de frotas, admin ou especialista de pneus necessária." });
};

/**
 * Middleware para verificar se o usuário tem perfil de oficina
 * Permite acesso para oficina ou admin
 */
export const isWorkshop = (req: Request, res: Response, next: NextFunction) => {
  // Lista de emails de administradores específicos
  const adminEmails = [
    'joao.paulo@muricionfleet.com',
    'regio@muricionfleet.com',
    'andre.rosa@muricionfleet.com'
  ];
  
  // Verificar autenticação primeiro
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  if (req.user && (
    req.user.role === 'oficina' || 
    (req.user.role && req.user.role.toLowerCase().includes('admin')) ||
    (req.user.email && adminEmails.includes(req.user.email.toLowerCase()))
  )) {
    return next();
  }
  
  console.log("Acesso negado a recurso de oficina:", {
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role,
    email: req.user?.email
  });
  
  return res.status(403).json({ message: "Acesso negado. Apenas oficinas podem acessar este recurso." });
};

/**
 * Middleware para verificar se o usuário tem acesso à base especificada
 * Permite acesso para admin ou se a baseId do usuário corresponde à solicitada
 */
export const hasBaseAccess = (req: Request, res: Response, next: NextFunction) => {
  // Lista de emails de administradores específicos
  const adminEmails = [
    'joao.paulo@muricionfleet.com',
    'regio@muricionfleet.com',
    'andre.rosa@muricionfleet.com'
  ];
  
  // Verificar autenticação primeiro
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  // Se o usuário for admin ou tiver email específico, permite acesso a todas as bases
  if (req.user && (
      (req.user.role && req.user.role.toLowerCase().includes('admin')) ||
      (req.user.email && adminEmails.includes(req.user.email.toLowerCase()))
    )) {
    return next();
  }
  
  // Verificar se o usuário tem uma base associada e se corresponde à base solicitada
  const requestedBaseId = req.params.baseId || req.query.baseId;
  
  if (requestedBaseId && req.user && req.user.baseId !== undefined) {
    // Se estiver solicitando uma base específica, verificar se corresponde à do usuário
    if (parseInt(requestedBaseId as string) === req.user.baseId) {
      return next();
    }
  } else if (req.user && req.user.baseId !== undefined) {
    // Se não estiver solicitando uma base específica, continuar mas será filtrado depois
    return next();
  }
  
  console.log("Acesso negado à base:", {
    url: req.originalUrl,
    method: req.method,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    userBaseId: req.user?.baseId,
    requestedBaseId
  });
  
  return res.status(403).json({ message: "Acesso negado. Você não tem permissão para acessar esta base." });
};