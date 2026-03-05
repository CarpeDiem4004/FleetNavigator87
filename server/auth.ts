import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import { createClient } from '@supabase/supabase-js';
import { generateToken } from './utils/jwt';

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
      role: string;
      baseId?: number | null;
      basename?: string | null;
      password?: string;
      oficina_id?: number | null;
      isActive?: boolean | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function verifyJwtToken(token: string): Promise<SelectUser | null> {
  try {
    // PRIORIDADE 1: JWT próprio (customizado)
    try {
      const { verifyToken } = await import('./utils/jwt');
      const secret = process.env.JWT_SECRET || 'muricion-fleet-secret-key';
      const decoded = verifyToken(token, secret);
      
      if (decoded && (decoded.email || decoded.id)) {
        const { rows } = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [decoded.email]
        );
        if (rows.length > 0) {
          return rows[0];
        }
        if (decoded.id) {
          const user = await storage.getUser(Number(decoded.id));
          if (user) return user;
        }
      }
    } catch (customJwtErr) {
      // JWT próprio falhou, tentar Supabase
    }
    
    // PRIORIDADE 2: Supabase (fallback)
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );
      
      const { data, error } = await supabase.auth.getUser(token);
      
      if (!error && data.user && data.user.email) {
        const { rows } = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [data.user.email]
        );
        if (rows.length > 0) return rows[0];
      }
    } catch (supabaseErr) {
      // Supabase também falhou
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Middleware para autenticação através de token JWT
export function jwtAuthMiddleware(req: any, res: any, next: any) {
  // Se o usuário já está autenticado via Passport, continue
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Verificar se existe um token JWT no cabeçalho
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Não há token, continue para o próximo middleware
  }
  
  // Extrair o token
  const token = authHeader.split(' ')[1];
  
  // Verificar o token e autenticar o usuário
  verifyJwtToken(token)
    .then(user => {
      if (!user) {
        return next(); // Token inválido ou usuário não encontrado
      }
      
      // Autenticar o usuário via Passport
      req.login(user, (err: any) => {
        if (err) {
          console.error("[JWT Middleware] Erro ao fazer login via token:", err);
          return next(err);
        }
        
        console.log(`[JWT Middleware] Usuário ${user.email} autenticado via token JWT`);
        next();
      });
    })
    .catch(error => {
      console.error("[JWT Middleware] Erro ao verificar token:", error);
      next(error);
    });
}

export function setupAuth(app: Express) {
  // Configuração da sessão
  const MemoryStore = createMemoryStore(session);
  const PgStore = connectPg(session);
  
  // Temporariamente usar MemoryStore para evitar erros de socket hang up
  // Mudança para melhorar estabilidade da sessão
  const useMemoryStore = process.env.USE_MEMORY_STORE !== 'false';
  
  const sessionStore = !useMemoryStore
    ? new PgStore({
        pool,
        tableName: 'session', // Usando 'session' em vez de 'sessions' para corresponder à tabela existente
        createTableIfMissing: false, // Não tentar criar a tabela, pois ela já existe
        pruneSessionInterval: 24 * 60 * 60 // Limpar sessões expiradas a cada 24 horas
      })
    : new MemoryStore({
        checkPeriod: 86400000 // Limpar sessões expiradas a cada 24 horas
      });
  
  // Verificar se SESSION_SECRET está definido
  if (!process.env.SESSION_SECRET) {
    console.warn('ATENÇÃO: SESSION_SECRET não está definido. Usando um valor temporário para desenvolvimento.');
    console.warn('Para produção, defina SESSION_SECRET como variável de ambiente.');
  }
  
  // Detectar ambiente Replit para configurar cookies corretamente desde o início
  // Usa múltiplos indicadores para máxima confiabilidade
  const isReplitEnv = Boolean(
    process.env.REPL_ID || 
    process.env.REPLIT_DB_URL ||
    process.env.REPL_SLUG ||
    process.env.REPLIT_ENV ||
    (typeof process.env.HOSTNAME === 'string' && process.env.HOSTNAME.includes('replit'))
  );
  
  console.log(`[Auth Setup] Ambiente Replit detectado: ${isReplitEnv}`);
  
  // CORREÇÃO CRÍTICA: Definir cookie como 'auto' - o middleware fixCookieSession
  // ajustará secure/sameSite baseado no protocolo REAL da requisição (HTTP vs HTTPS)
  // Isso resolve o problema de acessar via 127.0.0.1 (HTTP) no ambiente Replit
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 
      'dev_temp_secret_' + Date.now().toString() : 
      (() => { throw new Error('SESSION_SECRET deve ser definido em produção'); })()),
    resave: true, // Importante para persistência da sessão
    saveUninitialized: true, // Garante que a sessão seja salva mesmo que não modificada
    store: sessionStore,
    cookie: {
      // Iniciar com secure: 'auto' para permitir que o middleware ajuste
      // baseado no protocolo real da requisição (HTTPS = secure, HTTP = não secure)
      secure: 'auto' as any, // Será ajustado pelo middleware baseado no protocolo
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias para maior persistência
      sameSite: 'lax', // Default lax, será ajustado para 'none' se HTTPS
      httpOnly: true,
      path: '/'
    }
  };
  
  console.log(`Configuração da sessão: 
  - Secure: auto (ajustado por middleware baseado no protocolo)
  - SameSite: lax (ajustado para none se HTTPS)
  - MaxAge: ${30 * 24 * 60 * 60 * 1000}ms (30 dias)
  - Store: ${!useMemoryStore ? 'PostgreSQL' : 'Memory'}
  - Environment: ${isReplitEnv ? 'Replit' : 'Local'}`);
  

  app.use(session(sessionSettings));
  
  // Middleware para configurar sessão e cookies
  app.use((req, res, next) => {
    // CORREÇÃO: Usar X-Forwarded-Host para detectar o domínio real quando acessado via proxy/deployment
    const forwardedHost = req.headers['x-forwarded-host'] as string || '';
    const hostHeader = req.headers['host'] as string || '';
    const effectiveHostname = forwardedHost || hostHeader || req.hostname;
    
    // Verificar se estamos no ambiente de produção ou teste
    const isDev = effectiveHostname.includes('replit.dev') || effectiveHostname.includes('replit.app') || effectiveHostname.includes('localhost');
    const isProd = effectiveHostname.includes('gestaoonfleet.com.br');
    
    // Log de diagnóstico
    console.log(`[Cookie Middleware] effectiveHostname: ${effectiveHostname}, isDev: ${isDev}, isProd: ${isProd}, forwardedHost: ${forwardedHost}`);
    
    // Guardar o cookie original
    const originalCookie = res.getHeader('set-cookie');
    
    // Ajustar domínio do cookie se necessário
    if (req.session) {
      if (isProd) {
        // Configurar domínio do cookie para o domínio personalizado
        const domainName = '.gestaoonfleet.com.br';
        if ((req.session as any).cookie.domain !== domainName) {
          console.log(`[SessionMiddleware] Ajustando domínio do cookie para: ${domainName} (request para ${req.hostname}${req.path})`);
          (req.session as any).cookie.domain = domainName;
        }
        // CORREÇÃO: Configurar secure e sameSite para produção HTTPS
        (req.session as any).cookie.secure = true; // REQUERIDO para HTTPS
        (req.session as any).cookie.sameSite = 'lax'; // Lax é seguro para same-site
        (req.session as any).cookie.httpOnly = true;
        console.log('[Cookie Middleware/Auth] Configurado para Produção gestaoonfleet.com.br: secure=true, sameSite=lax');
      } else if (isDev) {
        // Para ambiente de desenvolvimento/teste
        
        // CORREÇÃO CRÍTICA: Verificar o protocolo REAL da requisição
        const forwardedProto = req.headers['x-forwarded-proto'] as string | undefined;
        const isHttps = req.secure || forwardedProto === 'https';
        const isReplitHost = effectiveHostname.includes('.replit.') || effectiveHostname.includes('replit.app');
        
        console.log(`[Cookie Middleware/Auth] effectiveHostname: ${effectiveHostname}, isHttps: ${isHttps}, isReplitHost: ${isReplitHost}`);
        
        // Só usar secure=true se for HTTPS E host Replit
        if (isHttps && isReplitHost) {
          (req.session as any).cookie.secure = true; // REQUERIDO para sameSite=none
          (req.session as any).cookie.sameSite = 'none'; // PERMITIR cross-origin
          console.log('[Cookie Middleware/Auth] Configurado para Replit HTTPS: secure=true, sameSite=none');
        } else {
          (req.session as any).cookie.secure = false; // Para HTTP/localhost
          (req.session as any).cookie.sameSite = 'lax'; // Funciona sem HTTPS
          console.log('[Cookie Middleware/Auth] Configurado para HTTP/localhost: secure=false, sameSite=lax');
        }
        (req.session as any).cookie.httpOnly = true; // SEGURANÇA: Prevenir XSS
      }
      
      // Tocar na sessão para garantir que ela será salva
      req.session.touch();
    }
    
    // Substituir o método end para configurar cookies corretamente
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, callback?: any) {
      if (!res.headersSent && res.getHeader('set-cookie')) {
        if (isDev) {
          let cookies = res.getHeader('set-cookie');
          const isReplit = req.hostname.includes('.replit.');
          
          if (Array.isArray(cookies)) {
            cookies = cookies.map((cookie: string) => {
              if (isReplit) {
                // No Replit: GARANTIR SameSite=None e Secure para funcionar cross-origin
                let updatedCookie = cookie;
                if (!cookie.includes('SameSite=None')) {
                  updatedCookie = updatedCookie.replace(/SameSite=Lax/gi, 'SameSite=None');
                }
                if (!cookie.includes('Secure')) {
                  updatedCookie = updatedCookie + '; Secure';
                }
                return updatedCookie;
              } else {
                // Localhost: SameSite=Lax sem Secure
                return cookie
                  .replace(/SameSite=None/gi, 'SameSite=Lax')
                  .replace(/Secure;/gi, '');
              }
            });
            res.setHeader('set-cookie', cookies);
          }
        }
      }
      
      // Chamar o método original com os argumentos
      return originalEnd.call(this, chunk, encoding, callback);
    };
    
    next();
  });
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Adicionar o middleware de autenticação JWT após o Passport
  // Isso permite que as requisições sejam autenticadas tanto via sessão tradicional
  // quanto via token JWT no cabeçalho Authorization
  app.use(jwtAuthMiddleware);

  passport.use(
    new LocalStrategy(
      { usernameField: 'username', passwordField: 'password' },
      async (username, password, done) => {
        try {
          console.log(`Tentativa de login para usuário: ${username}`);
          
          // Buscar o usuário pelo email
          const user = await storage.getUserByEmail(username);
          if (!user) {
            console.log(`Usuário não encontrado: ${username}`);
            return done(null, false, { message: 'Usuário não encontrado' });
          }
          
          // Verificação normal de senha com hash
          try {
            console.log(`Verificando senha para: ${username}`);
            
            // Verificar se a senha está armazenada como bcrypt hash (começa com $2b$)
            let isPasswordValid = false;
            
            if (user.password && user.password.startsWith('$2b$')) {
              // Verificação de senha com bcrypt
              isPasswordValid = await bcrypt.compare(password, user.password);
              console.log(`Verificação bcrypt resultado: ${isPasswordValid}`);
            } else if (user.password && user.password.includes('.')) {
              // Verificação de senha com hash scrypt antigo
              isPasswordValid = await comparePasswords(password, user.password);
            } else {
              // Para compatibilidade com senhas antigas sem hash
              isPasswordValid = password === user.password;
              
              // Alerta no log para atualizar o hash posteriormente
              console.log(`ATENÇÃO: Usuário ${username} está usando senha não-hashed. Recomenda-se atualizar.`);
            }
            
            if (!isPasswordValid) {
              console.log('Senha inválida');
              return done(null, false, { message: 'Senha incorreta' });
            }
          } catch (error) {
            console.error('Erro ao validar senha:', error);
            return done(null, false, { message: 'Erro na validação da senha' });
          }
          
          console.log(`Login bem-sucedido para: ${username}`);
          return done(null, user);
        } catch (error) {
          console.error('Erro na autenticação:', error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializando usuário: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializando usuário: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`Usuário não encontrado durante deserialização: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Erro ao deserializar usuário:', error);
      done(error);
    }
  });

  // Rotas de autenticação
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, role = 'operador', baseId, basename } = req.body;
      
      console.log(`Tentativa de registro para: ${username}`);
      
      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByEmail(username);
      if (existingUser) {
        console.log(`Usuário já existe: ${username}`);
        return res.status(400).json({ message: "Usuário já existe" });
      }

      // Hash da senha antes de armazenar
      const hashedPassword = await hashPassword(password);
      
      // Criar o novo usuário
      const newUser: any = {
        email: username,
        password: hashedPassword,
        name,
        role
      };
      
      // Adicionar baseId e basename se fornecidos e válidos
      if (baseId && typeof baseId === 'number' && baseId > 0) {
        newUser.baseId = baseId;
        newUser.basename = basename;
        console.log(`Usuário sendo associado à base: ${basename} (ID: ${baseId})`);
      }

      console.log(`Criando novo usuário: ${username}`, newUser);
      const user = await storage.createUser(newUser);
      console.log(`Usuário criado: ${user.id} (${username})`);

      // Login automático após registro
      req.login(user, (err) => {
        if (err) {
          console.error('Erro ao autenticar após registro:', err);
          return next(err);
        }
        const userWithoutPassword = { ...user, password: undefined };
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ message: "Erro ao registrar usuário" });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    console.log(`Tentativa de login via API: ${req.body.username}`);
    
    // Verificar se é uma solicitação de login de emergência
    const { username, password, emergencyAuth } = req.body;
    
    // Se for login de emergência e for o usuário admin
    if (emergencyAuth === 'true' && username === 'admin@muricionfleet.com') {
      console.log(`Tentativa de login de emergência para admin: ${username}`);
      
      try {
        // Buscar o usuário admin diretamente
        const adminUser = await storage.getUserByEmail(username);
        
        if (!adminUser) {
          console.error(`Usuário admin não encontrado para login de emergência: ${username}`);
          return res.status(401).json({ message: "Usuário admin não encontrado" });
        }
        
        // Realizar login sem verificar a senha
        req.login(adminUser, (loginErr) => {
          if (loginErr) {
            console.error('Erro ao realizar login de emergência:', loginErr);
            return next(loginErr);
          }
          
          console.log(`Login de emergência bem-sucedido para admin: ${username}`);
          // Não enviar a senha para o cliente
          const userWithoutPassword = { ...adminUser, password: undefined };
          return res.json(userWithoutPassword);
        });
      } catch (error) {
        console.error(`Erro ao buscar usuário admin para login de emergência:`, error);
        return next(error);
      }
    } else {
      // Login normal com autenticação padrão
      passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
        if (err) {
          console.error('Erro na autenticação:', err);
          return next(err);
        }
        if (!user) {
          console.log(`Login falhou para: ${req.body.username} - ${info?.message || "Credenciais inválidas"}`);
          return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
        }
        
        // VERIFICAÇÃO DE SEGURANÇA: Operadores não podem acessar o sistema principal
        if (user.role === 'operador') {
          console.log(`Tentativa de acesso ao sistema principal negada para operador: ${user.email}`);
          return res.status(403).json({ 
            message: 'Operadores devem acessar apenas a base designada',
            error: 'Acesso negado - Operadores não podem acessar o sistema principal'
          });
        }
        
        console.log(`Login bem-sucedido para: ${user.email} (ID: ${user.id})`);
        req.login(user, (err) => {
          if (err) {
            console.error('Erro ao iniciar sessão:', err);
            return next(err);
          }
          // Não enviar a senha para o cliente
          const userWithoutPassword = { ...user, password: undefined };
          res.json(userWithoutPassword);
        });
      })(req, res, next);
    }
  });

  app.post("/api/logout", (req, res) => {
    const userId = req.user?.id;
    console.log(`Logout do usuário: ${userId}`);
    
    req.logout((err) => {
      if (err) {
        console.error('Erro ao fazer logout:', err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      console.log(`Logout bem-sucedido para usuário: ${userId}`);
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  // API específica para verificar sessão de bases
  app.get("/api/auth/check-base-session", (req, res) => {
    try {
      // Verificar se há uma sessão ativa
      if (req.isAuthenticated() && req.user) {
        const user = req.user;
        console.log(`[check-base-session] Usuário autenticado encontrado: ${user.email} (Role: ${user.role})`);
        
        // Se é um operador de base, retornar seus dados
        if (user.role === 'operador' && user.basename) {
          return res.json({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              basename: user.basename,
              base_id: user.base_id
            },
            isBaseUser: true,
            baseName: user.basename
          });
        }
        
        // Se é admin mas estamos em contexto de base, não retornar dados de admin
        if (user.role === 'admin') {
          console.log(`[check-base-session] Admin detectado, mas contexto é de base - não retornando dados de admin`);
          return res.status(204).json({ 
            success: false, 
            message: 'Admin session detected in base context' 
          });
        }
        
        // Para outros tipos de usuário, retornar dados normalmente
        return res.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            basename: user.basename,
            base_id: user.base_id
          },
          isBaseUser: false
        });
      }
      
      // Nenhuma sessão encontrada
      console.log(`[check-base-session] Nenhuma sessão de usuário encontrada`);
      return res.status(401).json({ 
        success: false, 
        message: 'No base session found' 
      });
    } catch (error) {
      console.error('[check-base-session] Erro ao verificar sessão de base:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking base session' 
      });
    }
  });

  // API específica para login de bases (operadores)
  // Suporta AMBOS: Bearer Token (Supabase Auth) OU email/password tradicional
  app.post("/api/auth/login-base", async (req, res) => {
    const { baseId } = req.body;
    const authHeader = req.headers.authorization;
    
    try {
      let user: any = null;
      
      // MÉTODO 1: Bearer Token (Supabase Auth) - PREFERIDO
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwtToken = authHeader.split(' ')[1];
        console.log(`[login-base] Tentativa via Bearer Token`);
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error(`[login-base] ERRO: Configuração Supabase ausente`);
          return res.status(500).json({ message: "Erro de configuração do servidor" });
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: { user: supaUser }, error } = await supabase.auth.getUser(jwtToken);
        
        if (error || !supaUser?.email) {
          console.log(`[login-base] Token inválido:`, error?.message);
          return res.status(401).json({ message: "Token inválido ou expirado" });
        }
        
        console.log(`[login-base] Token válido para: ${supaUser.email}`);
        user = await storage.getUserByEmail(supaUser.email);
        
        if (!user) {
          console.log(`[login-base] Usuário não encontrado no banco: ${supaUser.email}`);
          return res.status(401).json({ message: "Usuário não encontrado no sistema" });
        }
      }
      
      // MÉTODO 2: Email/Password tradicional (fallback para compatibilidade)
      if (!user) {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: "Credenciais não fornecidas" });
        }
        
        console.log(`[login-base] Tentativa via email/password para: ${email}`);
        user = await storage.getUserByEmail(email);
        
        if (!user) {
          console.log(`[login-base] Usuário não encontrado: ${email}`);
          return res.status(401).json({ message: "Credenciais inválidas" });
        }
        
        // Verificar senha
        let isPasswordValid = false;
        if (user.password && user.password.startsWith('$2b$')) {
          isPasswordValid = await bcrypt.compare(password, user.password);
        } else if (user.password && user.password.includes('.')) {
          isPasswordValid = await comparePasswords(password, user.password);
        } else {
          isPasswordValid = password === user.password;
        }
        
        if (!isPasswordValid) {
          console.log(`[login-base] Senha inválida para: ${email}`);
          return res.status(401).json({ message: "Credenciais inválidas" });
        }
      }
      
      // Verificar se é um usuário autorizado (operador, admin, gestor, line_hall, etc.)
      if (!['operador', 'admin', 'gestor', 'posto', 'gestor_combustivel', 'operador_status_frota', 'line_hall', 'coordenador', 'oficina', 'pneus', 'operador_1_line_haul', 'gestor_equipamentos', 'gestor_frota', 'ceo', 'gerente_geral', 'operador_frota'].includes(user.role)) {
        console.log(`[login-base] Acesso negado - usuário não autorizado: ${user.email} (Role: ${user.role})`);
        return res.status(403).json({ 
          message: "Acesso negado. Este login é apenas para operadores de base e administradores." 
        });
      }
      
      // Verificar acesso à base se baseId foi fornecido
      if (baseId) {
        const parsedBaseId = parseInt(baseId);
        const hasAccess = await storage.checkUserBaseAccess(user.id, parsedBaseId, user.role);
        
        if (!hasAccess) {
          console.log(`[login-base] ACESSO NEGADO - Usuário ${user.email} não tem permissão para base ${parsedBaseId}`);
          return res.status(403).json({ 
            success: false,
            message: 'Você não tem permissão para acessar esta base',
            errorCode: 'ACCESS_DENIED'
          });
        }
        console.log(`[login-base] ACESSO LIBERADO - Usuário ${user.email} autorizado para base ${parsedBaseId}`);
      }
      
      let resolvedBasename = user.basename;
      const userBaseId = user.base_id || user.baseId;
      if (!resolvedBasename && userBaseId) {
        try {
          const baseInfo = await storage.getBase(userBaseId);
          if (baseInfo) {
            resolvedBasename = baseInfo.name;
          }
        } catch (e) {
          console.log(`[login-base] Erro ao buscar nome da base ${userBaseId}:`, e);
        }
      }
      
      console.log(`[login-base] Login bem-sucedido: ${user.email} (Base: ${resolvedBasename})`);
      
      // Gerar JWT próprio para autenticação cross-domain
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
      const token = generateToken(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          baseId: user.base_id,
          basename: resolvedBasename
        }, 
        jwtSecret, 
        { expiresIn: '30d' }
      );
      
      // Remover senha antes de retornar
      const userWithoutPassword = { ...user, password: undefined, basename: resolvedBasename };
      
      return res.json({
        success: true,
        user: userWithoutPassword,
        token: token,
        message: `Bem-vindo, ${user.name}!`
      });
      
    } catch (error) {
      console.error('[login-base] Erro no login:', error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota específica para sincronização de login entre Supabase e o sistema tradicional
  app.post("/api/login/sync", async (req, res) => {
    // Verificar JWT do Supabase
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Token JWT não fornecido" });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' do valor
    
    try {
      // Verificar se o token é válido (pode falhar se o secret for diferente)
      const jsonwebtoken = require('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET || 'seu_jwt_secret_dev';
      const decoded = jsonwebtoken.verify(token, jwtSecret);
      
      // Verificar o email do usuário no token
      const userEmail = (decoded as any).email;
      
      if (!userEmail) {
        return res.status(400).json({ message: "Token não contém email" });
      }
      
      // Buscar usuário no banco por email
      const user = await storage.getUserByEmail(userEmail);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Fazer login manual para estabelecer a sessão
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Erro ao sincronizar login:", loginErr);
          return res.status(500).json({ message: "Erro ao sincronizar login" });
        }
        
        // Tocar e salvar a sessão explicitamente
        req.session.touch();
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Erro ao salvar sessão na sincronização:", saveErr);
          }
          
          // Remover senha antes de retornar
          const userWithoutPassword = { ...user, password: undefined };
          return res.json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Erro ao verificar token na sincronização:", error);
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }
  });
  
  // Rota de emergência para forçar sessão
  app.post("/api/force-session", async (req, res) => {
    try {
      const { user, email } = req.body;
      
      if (!user || !email) {
        return res.status(400).json({ message: "Dados de usuário incompletos" });
      }
      
      console.log(`[ForceSession] Tentando forçar sessão para: ${email}`);
      
      // Buscar usuário diretamente do banco por email para ter todas as informações
      let dbUser;
      try {
        dbUser = await storage.getUserByEmail(email);
        
        if (!dbUser) {
          console.warn(`[ForceSession] Usuário não encontrado no banco: ${email}`);
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        console.log(`[ForceSession] Usuário encontrado: ${dbUser.id} (${dbUser.email})`);
      } catch (dbError) {
        console.error("[ForceSession] Erro ao consultar banco:", dbError);
        return res.status(500).json({ message: "Erro ao buscar usuário no banco de dados" });
      }
      
      // Login manual com o usuário encontrado no banco
      req.login(dbUser, (loginErr) => {
        if (loginErr) {
          console.error("[ForceSession] Erro ao fazer login manual:", loginErr);
          return res.status(500).json({ message: "Erro ao estabelecer sessão" });
        }
        
        console.log(`[ForceSession] Login manual bem-sucedido para: ${dbUser.id} (${dbUser.email})`);
        
        // Tocar na sessão para garantir persistência
        req.session.touch();
        
        // Salvar a sessão explicitamente
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[ForceSession] Erro ao salvar sessão:", saveErr);
            return res.status(500).json({ message: "Erro ao salvar sessão" });
          }
          
          console.log("[ForceSession] Sessão salva com sucesso");
          
          // Remover senha antes de retornar
          const userWithoutPassword = { ...dbUser, password: undefined };
          return res.status(200).json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("[ForceSession] Erro inesperado:", error);
      res.status(500).json({ message: "Erro ao processar pedido de força de sessão" });
    }
  });

  app.get("/api/user", async (req, res) => {
    // Extrair flags de verificação
    const isVerification = req.headers['x-auth-verification'] === 'true';
    const isEmergency = req.headers['x-emergency-auth'] === 'true';
    const hasAuthHeader = !!req.headers.authorization;
    
    // Log diagnóstico inicial
    console.log(`[API/USER] Requisição recebida:`, {
      isAuthenticated: req.isAuthenticated(),
      hasSession: !!req.session,
      sessionID: req.sessionID,
      hasCookies: !!req.headers.cookie,
      hasAuthHeader,
      isVerification,
      isEmergency,
      origem: req.headers.origin,
      referer: req.headers.referer
    });

    // MÉTODO 1: Verificar autenticação via Passport (padrão)
    if (req.isAuthenticated() && req.user) {
      console.log(`[API/USER] Usuário já autenticado via Passport: ${req.user.id} (${req.user.email})`);
      
      // Garantir sessão persistente
      req.session.touch();
      
      // Retornar dados do usuário sem senha
      const userWithoutPassword = { ...req.user, password: undefined };
      return res.json({
        ...userWithoutPassword,
        _authMethod: 'session_standard'
      });
    }

    // MÉTODO 2: Tentar recuperar Token JWT do cabeçalho Authorization
    if (hasAuthHeader && req.headers.authorization?.startsWith('Bearer ')) {
      const jwtToken = req.headers.authorization?.split(' ')[1] || '';
      console.log('[API/USER] Tentando autenticação via token JWT');
      
      try {
        // Validar com Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey && jwtToken) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: { user: supaUser }, error } = await supabase.auth.getUser(jwtToken);
          
          if (supaUser && !error) {
            console.log(`[API/USER] Token JWT válido para: ${supaUser.email}`);
            
            // Buscar usuário no banco
            const dbUser = await storage.getUserByEmail(supaUser.email || '');
            
            if (dbUser) {
              console.log(`[API/USER] Usuário encontrado no banco: ${dbUser.id} (${dbUser.email})`);
              
              // Login manual do usuário
              return req.login(dbUser, (loginErr) => {
                if (loginErr) {
                  console.error('[API/USER] Falha na autenticação via JWT:', loginErr);
                } else {
                  console.log('[API/USER] Login manual via JWT bem-sucedido');
                  
                  // Armazenar token JWT na sessão para recuperação de emergência
                  if (req.session) {
                    // @ts-ignore
                    req.session.emergencyToken = jwtToken;
                    
                    // Salvar sessão explicitamente
                    req.session.save((saveErr) => {
                      if (saveErr) {
                        console.error('[API/USER] Erro ao salvar sessão após login via JWT:', saveErr);
                      } else {
                        console.log('[API/USER] Sessão salva com sucesso após login via JWT');
                      }
                    });
                  }
                  
                  const userWithoutPassword = { ...dbUser, password: undefined };
                  return res.json({
                    ...userWithoutPassword,
                    _authMethod: 'jwt_token'
                  });
                }
              });
            }
          } else {
            console.log('[API/USER] Token JWT inválido ou expirado:', error?.message);
          }
        }
      } catch (jwtError) {
        console.error('[API/USER] Erro ao processar JWT:', jwtError);
      }
    }

    // MÉTODO 3: Tentar recuperação de sessão parcial (passport.user existe)
    if (req.session && (req.session as any)?.passport?.user) {
      const userId = (req.session as any).passport.user;
      console.log(`[API/USER] Sessão parcial encontrada, userId=${userId}`);
      
      try {
        // Buscar usuário no banco
        const user = await storage.getUser(userId);
        
        if (user) {
          console.log(`[API/USER] Usuário recuperado do banco: ${user.id} (${user.email})`);
          
          // Login manual
          return req.login(user, (loginErr) => {
            if (loginErr) {
              console.error('[API/USER] Falha na recuperação da sessão parcial:', loginErr);
            } else {
              console.log('[API/USER] Sessão parcial recuperada com sucesso');
              
              // Garantir persistência
              req.session.touch();
              req.session.save();
              
              const userWithoutPassword = { ...user, password: undefined };
              return res.json({
                ...userWithoutPassword,
                _authMethod: 'session_recovery'
              });
            }
          });
        }
      } catch (error) {
        console.error('[API/USER] Erro ao recuperar usuário da sessão parcial:', error);
      }
    }

    // MÉTODO 4: Token de Emergência na Sessão
    if (isEmergency && req.session && (req.session as any).emergencyToken) {
      const emergencyToken = (req.session as any).emergencyToken;
      console.log('[API/USER] Tentando recuperação com token de emergência');
      
      try {
        // Validar com Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: { user: supaUser }, error } = await supabase.auth.getUser(emergencyToken || '');
          
          if (supaUser && !error) {
            console.log(`[API/USER] Token emergencial válido para: ${supaUser.email}`);
            
            // Buscar usuário no banco
            const dbUser = await storage.getUserByEmail(supaUser.email || '');
            
            if (dbUser) {
              console.log(`[API/USER] Usuário recuperado via emergência: ${dbUser.id}`);
              
              // Login manual
              return req.login(dbUser, (loginErr) => {
                if (loginErr) {
                  console.error('[API/USER] Falha no login de emergência:', loginErr);
                } else {
                  // Garantir persistência
                  req.session.touch();
                  req.session.save();
                  
                  const userWithoutPassword = { ...dbUser, password: undefined };
                  return res.json({
                    ...userWithoutPassword,
                    _authMethod: 'emergency_token'
                  });
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('[API/USER] Erro na recuperação de emergência:', error);
      }
    }
    
    // Log detalhado para diagnóstico quando todos os métodos falharem
    console.log('[API/USER] Todos os métodos de autenticação falharam. Detalhes:', {
      sessionID: req.sessionID,
      hasPassportObj: !!(req.session && (req.session as any)?.passport),
      sessionKeys: req.session ? Object.keys(req.session) : [],
      cookieHeader: req.headers.cookie ? 'Presente' : 'Ausente',
      authorizationHeader: hasAuthHeader ? 'Presente' : 'Ausente'
    });
    
    // Nenhum método funcionou
    return res.status(401).json({ message: "Não autenticado" });
  });
  
  // Rota para ressincronizar sessão a partir de token JWT (Supabase)
  app.post("/api/resync-session-jwt", async (req, res) => {
    try {
      // Verificar se há um token JWT no cabeçalho de autorização
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: "Token não fornecido" 
        });
      }
      
      // Extrair e validar o token JWT
      const token = authHeader.split(' ')[1];
      
      // Verificar configurações do Supabase
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ 
          success: false, 
          message: "Configuração do Supabase não disponível" 
        });
      }
      
      // Criar cliente Supabase
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Verificar token
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
      
      if (error || !supabaseUser) {
        console.error('[ResyncSession] Erro ao validar token:', error);
        return res.status(401).json({ 
          success: false, 
          message: "Token inválido" 
        });
      }
      
      if (!supabaseUser.email) {
        return res.status(400).json({ 
          success: false, 
          message: "Usuário Supabase sem email" 
        });
      }
      
      // Buscar o usuário no banco de dados pelo email
      console.log(`[ResyncSession] Buscando usuário com email: ${supabaseUser.email}`);
      const userResult = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [supabaseUser.email]
      );
      
      if (!userResult.rowCount || userResult.rowCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário não encontrado no banco de dados" 
        });
      }
      
      const user = userResult.rows[0];
      
      // Atualizar o supabase_uid se necessário
      try {
        // Verificar se a coluna supabase_uid existe
        const columnCheck = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'usuarios' AND column_name = 'supabase_uid'
        `);
        
        // Se a coluna não existe, adicionar
        if (columnCheck.rowCount === 0) {
          console.log('[ResyncSession] Adicionando coluna supabase_uid à tabela usuarios');
          await pool.query(`
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255)
          `);
        }
        
        // Atualizar o supabase_uid
        if (!user.supabase_uid || user.supabase_uid !== supabaseUser.id) {
          console.log(`[ResyncSession] Vinculando usuário ${user.id} ao Supabase ${supabaseUser.id}`);
          await pool.query(
            'UPDATE usuarios SET supabase_uid = $1 WHERE id = $2',
            [supabaseUser.id, user.id]
          );
        }
      } catch (error) {
        console.error('[ResyncSession] Erro ao atualizar supabase_uid:', error);
        // Não interrompe o fluxo
      }
      
      // Fazer login na sessão
      req.login(user, (err) => {
        if (err) {
          console.error('[ResyncSession] Erro ao fazer login na sessão:', err);
          return res.status(500).json({ 
            success: false, 
            message: "Erro ao sincronizar sessão" 
          });
        }
        
        console.log(`[ResyncSession] Sessão resincronizada para usuário ${user.id} (${user.email})`);
        
        // Retornar dados do usuário para o cliente
        return res.json({ 
          success: true, 
          message: "Sessão resincronizada com sucesso",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            baseId: user.base_id,
            basename: user.basename,
            oficina_id: user.oficina_id,
            isActive: user.is_active
          }
        });
      });
    } catch (error) {
      console.error('[ResyncSession] Erro:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno ao resincronizar sessão" 
      });
    }
  });
  
  // Rota adicional para diagnóstico
  app.get("/api/auth-status", (req, res) => {
    // Para compatibilidade com tipos, não podemos acessar diretamente req.session.cookie
    const sessionObj: any = req.session || {};
    const cookieObj = sessionObj.cookie || {};
    
    const status = {
      isAuthenticated: req.isAuthenticated(),
      hasSession: !!req.session,
      sessionID: req.sessionID,
      cookiePresent: !!req.headers.cookie,
      cookies: req.headers.cookie,
      sessionMaxAge: cookieObj.maxAge,
      sessionExpires: cookieObj.expires,
      sessionSettings: {
        secure: cookieObj.secure,
        httpOnly: cookieObj.httpOnly,
        sameSite: cookieObj.sameSite,
        path: cookieObj.path
      },
      requestHeaders: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer || req.headers.referrer,
        userAgent: req.headers['user-agent']
      },
      user: req.isAuthenticated() ? {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      } : null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    console.log("[DiagnósticoAuth] Verificando status de autenticação:", {
      isAuth: req.isAuthenticated(),
      hasSession: !!req.session,
      sessionID: req.sessionID
    });
    
    console.log('Status de autenticação:', JSON.stringify(status, null, 2));
    res.json(status);
  });
}