import { Request, Response, NextFunction } from 'express';

// Lista de origens permitidas
const allowedOrigins = [
  // Domínios Replit
  /^https:\/\/.*\.replit\.app$/,
  /^https:\/\/.*\.repl\.co$/,
  /^https:\/\/.*\.id\.repl\.co$/,
  /^https:\/\/.*\.repl\.dev$/,
  /^https:\/\/.*\.worf\.replit\.dev$/,
  /^https:\/\/.*-.*-.*-.*-.*-.*\.worf\.replit\.dev$/,  // Formato longo com UUIDs
  
  // Domínio personalizado e seus subdomínios
  /^https:\/\/(.*\.)?gestaoonfleet\.com\.br$/,
  
  // Desenvolvimento local
  /^http:\/\/localhost(:\d+)?$/,
];

// Middleware para lidar com CORS
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Se não houver origem, permite a requisição (geralmente significa que é uma requisição direta)
  if (!origin) {
    console.log('[CORS] Sem origem especificada na requisição');
    return next();
  }

  // Verifica se a origem está na lista de permitidas
  const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));

  if (isAllowed) {
    // Define os cabeçalhos CORS para a origem permitida
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Se for uma requisição OPTIONS (preflight), responde com 200
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  } else {
    console.log(`[CORS] Origem não permitida: ${origin}`);
  }

  next();
}