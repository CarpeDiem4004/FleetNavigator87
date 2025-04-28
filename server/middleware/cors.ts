import { Request, Response, NextFunction } from 'express';

// Middleware para lidar com CORS - Versão Liberada para Testes
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Se não houver origem, permite a requisição (geralmente significa que é uma requisição direta)
  if (!origin) {
    console.log('[CORS] Sem origem especificada na requisição');
    return next();
  }

  // IMPORTANTE: Durante a fase de testes, aceitamos qualquer origem do Replit
  // Verificação básica para garantir que é um domínio do Replit ou o domínio oficial
  if (origin.includes('replit') || 
      origin.includes('gestaoonfleet.com.br') || 
      origin.includes('localhost')) {
    
    // Define os cabeçalhos CORS para a origem permitida
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Se for uma requisição OPTIONS (preflight), responde com 200
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  } else {
    console.log(`[CORS] Origem bloqueada: ${origin}`);
  }

  next();
}