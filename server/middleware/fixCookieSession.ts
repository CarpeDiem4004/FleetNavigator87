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

  // Log para diagnóstico
  console.log('[Cookie Middleware] Ajustando sessão: maxAge=2592000000, sameSite=lax');

  // CORREÇÃO CRÍTICA: Configurar cookies adequadamente para melhor compatibilidade 
  // e garantir compartilhamento entre domínios

  // Ajustar configurações do cookie de sessão para máxima compatibilidade
  if (req.session.cookie) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    req.session.cookie.secure = false; // Desabilitar secure para garantir funcionamento em http e https
    req.session.cookie.sameSite = 'none'; // PERMITIR cross-origin cookies 
    req.session.cookie.httpOnly = false; // TEMPORÁRIO: permitir JS access para debug de cookies

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
    
    // Garantir que Access-Control-Allow-Origin seja configurado
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    
    // Configurar headers adicionais para melhorar a compatibilidade de CORS
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Force-Sync, X-Auth-Verification, X-Emergency-Auth');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }

  next();
}