import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para ajustar cookies de sessão em ambientes de desenvolvimento
 * Isso corrige problemas com domínio e flags que podem impedir
 * o armazenamento e envio de cookies de sessão pelo navegador
 */
export const fixCookieSessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Interceptar o método res.cookie para ajustar configurações de cookies
  const originalSetCookie = res.cookie;
  
  // @ts-ignore - Sobrescrevendo método para ajustar cookies
  res.cookie = function(name: string, value: string, options: any = {}) {
    // Modificar as opções de cookie para garantir compatibilidade
    const newOptions = {
      ...options,
      sameSite: 'lax', // Permitir cookies de terceiros em ambientes de desenvolvimento
      secure: process.env.NODE_ENV === 'production', // Apenas HTTPS em produção
      httpOnly: true, // Impedir acesso via JavaScript
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias em milissegundos
      path: '/' // Garantir acesso de qualquer rota
    };
    
    // Se estamos em desenvolvimento, não definir o domínio do cookie
    // pois isso pode causar problemas com hosts locais como localhost
    if (process.env.NODE_ENV !== 'production') {
      delete newOptions.domain;
    }
    
    // Registrar para depuração
    console.log(`[Cookie Middleware] Definindo cookie: ${name} (Domínio: ${newOptions.domain || 'default'}, Secure: ${newOptions.secure}, MaxAge: ${newOptions.maxAge})`);
    
    // Chamar o método original com as opções ajustadas
    return originalSetCookie.call(res, name, value, newOptions);
  };
  
  // Também interceptamos setHeader para ajustar cookies de sessão
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name: string, value: string | string[]) {
    if (name.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
      value = value.map(cookie => {
        if (cookie.includes('connect.sid=')) {
          console.log(`[Cookie Middleware] Ajustando cookie de sessão: ${cookie.substring(0, 30)}...`);
          return cookie
            .replace(/; SameSite=(None|Lax|Strict)/gi, '; SameSite=Lax')
            .replace(/; Domain=[^;]+/gi, '')
            .replace(/; secure/gi, process.env.NODE_ENV === 'production' ? '; secure' : '')
            .replace(/; Max-Age=[^;]+/gi, '; Max-Age=2592000')
            .replace(/; Path=[^;]+/gi, '; Path=/');
        }
        return cookie;
      });
    }
    return originalSetHeader.call(this, name, value);
  };
  
  // Se houver um objeto de sessão na requisição
  if (req.session) {
    // Verificar se estamos no Replit ou em um ambiente de desenvolvimento
    const isReplit = process.env.REPL_ID || process.env.REPL_SLUG;
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (isReplit || isDev) {
      // Ajustar configurações do cookie para funcionar no Replit
      (req.session as any).cookie.sameSite = 'lax';
      (req.session as any).cookie.secure = false; // Permitir HTTP para desenvolvimento
      (req.session as any).cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
      (req.session as any).cookie.path = '/';
      
      // Remover configuração de domínio que pode estar causando problemas
      delete (req.session as any).cookie.domain;
      
      // "Tocar" na sessão para garantir que as alterações sejam aplicadas
      req.session.touch();
      
      // Debug
      console.log(`[Cookie Middleware] Ajustando sessão: maxAge=${(req.session as any).cookie.maxAge}, sameSite=${(req.session as any).cookie.sameSite}`);
    }
  }
  
  next();
};