/**
 * Middleware para corrigir problemas de cookies e sessão em diferentes ambientes
 * Ajusta as configurações de cookie para garantir compatibilidade entre
 * domínios personalizados, Replit e ambientes locais
 */
import { Request, Response, NextFunction } from 'express';

export default function fixCookieSession(req: Request, res: Response, next: NextFunction) {
  // Se a sessão não existir, continuar
  if (!req.session) {
    return next();
  }

  // Ajustar configurações do cookie de sessão para máxima compatibilidade
  if (req.session.cookie) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    
    // CORREÇÃO CRÍTICA: Verificar o protocolo REAL da requisição
    // O 'x-forwarded-proto' indica o protocolo original quando atrás de proxy
    const forwardedProto = req.headers['x-forwarded-proto'] as string | undefined;
    const isHttps = req.secure || forwardedProto === 'https';
    
    // Verificar se é ambiente Replit pelo hostname OU pelas variáveis de ambiente
    const isReplitHost = req.hostname.includes('replit.dev') || req.hostname.includes('replit.app') || req.hostname.includes('picard.replit');
    const isReplitEnv = Boolean(process.env.REPL_ID || process.env.REPL_SLUG);
    
    // Verificar se é localhost (acesso direto sem HTTPS)
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || req.hostname.startsWith('192.168.');
    
    // Log para diagnóstico
    console.log(`[Cookie Middleware] hostname: ${req.hostname}, isHttps: ${isHttps}, isReplitHost: ${isReplitHost}, isLocalhost: ${isLocalhost}`);
    
    // REGRA: Se for HTTPS E (Replit host OU ambiente Replit), usar secure=true
    // Caso contrário (localhost HTTP), usar secure=false
    if (isHttps && (isReplitHost || isReplitEnv)) {
      req.session.cookie.secure = true; // REQUERIDO para sameSite=none no navegador
      req.session.cookie.sameSite = 'none'; // PERMITIR cross-origin cookies
      console.log('[Cookie Middleware] Configurado para Replit HTTPS: secure=true, sameSite=none');
    } else {
      // Para localhost ou HTTP: usar configuração que funciona sem HTTPS
      req.session.cookie.secure = false; // Funciona com HTTP
      req.session.cookie.sameSite = 'lax'; // Mais seguro para HTTP
      console.log('[Cookie Middleware] Configurado para HTTP/localhost: secure=false, sameSite=lax');
    }
    req.session.cookie.httpOnly = true; // SEGURANÇA: Prevenir acesso JavaScript aos cookies

    // Se houver headers de autorização, armazenar na sessão para recuperação de emergência
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // @ts-ignore
        req.session.emergencyToken = token;
      }
    }

    // Se o cookie connect.sid estiver na requisição, ajustar e registrar
    if (req.headers.cookie && req.headers.cookie.includes('connect.sid')) {
      const cookieHeader = req.headers.cookie;
      const sidMatch = cookieHeader.match(/connect\.sid=([^;]+)/);
      
      if (sidMatch && sidMatch[1]) {
        const sid = sidMatch[1];
        console.log(`[Cookie Middleware] Ajustando cookie de sessão: connect.sid=${sid.substring(0, 20)}...`);
      }
    }
    
    // Configurar o header para permitir cookies de qualquer origem
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // CORREÇÃO CRÍTICA: Nunca usar '*' com credentials=true
    // O navegador rejeita cookies quando Access-Control-Allow-Origin é '*' com credentials
    // Usar a origem real da requisição ou construir a partir do host
    const forwardedProto = req.headers['x-forwarded-proto'] as string | undefined;
    const protocol = forwardedProto === 'https' || req.secure ? 'https' : 'http';
    const origin = req.headers.origin || `${protocol}://${req.headers.host}`;
    res.setHeader('Access-Control-Allow-Origin', origin);
    
    // Configurar headers adicionais para melhorar a compatibilidade de CORS
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Force-Sync, X-Auth-Verification, X-Emergency-Auth');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }

  next();
}