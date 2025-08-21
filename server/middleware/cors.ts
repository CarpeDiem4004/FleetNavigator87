import { Request, Response, NextFunction } from 'express';

// Middleware para lidar com CORS - Versão CRÍTICA  
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // SOLUÇÃO DE EMERGÊNCIA - PERMITIR QUALQUER ORIGEM (CORS completamente aberto)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, X-Auth-Verification');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  
  // Se for uma requisição OPTIONS (preflight), responde com 200 imediatamente
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  // Log de depuração
  if (req.headers.origin) {
    console.log(`[CORS] Requisição de origem: ${req.headers.origin} - PERMITIDA`);
  } else {
    console.log('[CORS] Requisição sem origem especificada');
  }

  next();
}