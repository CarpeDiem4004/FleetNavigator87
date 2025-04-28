import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import { createClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface User extends SelectUser {}
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

export function setupAuth(app: Express) {
  // Configuração da sessão
  const MemoryStore = createMemoryStore(session);
  const PgStore = connectPg(session);
  
  // Sempre usar armazenamento PostgreSQL para melhor persistência
  // Apenas usaremos MemoryStore se especificamente solicitado por variável de ambiente
  const useMemoryStore = process.env.USE_MEMORY_STORE === 'true';
  
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
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 
      'dev_temp_secret_' + Date.now().toString() : 
      (() => { throw new Error('SESSION_SECRET deve ser definido em produção'); })()),
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false, // Desabilitado para desenvolvimento, em produção deveria ser true
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      sameSite: 'lax', // Ajuda nas requisições cross-site (importante para APIs)
      httpOnly: true,
      path: '/'
    }
  };
  
  console.log(`Configuração da sessão: 
  - Secure: ${process.env.NODE_ENV === 'production'}
  - MaxAge: ${7 * 24 * 60 * 60 * 1000}ms (${7} dias)
  - Store: ${!useMemoryStore ? 'PostgreSQL' : 'Memory'}
  - Environment: ${process.env.NODE_ENV || 'development'}`);
  

  app.use(session(sessionSettings));
  
  // Middleware para ajustar o domínio do cookie para o domínio personalizado
  app.use((req, res, next) => {
    if (req.hostname && req.hostname.includes('gestaoonfleet.com.br') && req.session) {
      // Configurar domínio do cookie para o domínio personalizado
      const domainName = '.gestaoonfleet.com.br';
      if ((req.session as any).cookie.domain !== domainName) {
        console.log(`[SessionMiddleware] Ajustando domínio do cookie para: ${domainName} (request para ${req.hostname}${req.path})`);
        (req.session as any).cookie.domain = domainName;
      }
      
      // Tocar na sessão para garantir que ela será salva com as novas configurações
      req.session.touch();
    }
    next();
  });
  
  app.use(passport.initialize());
  app.use(passport.session());

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
            
            // Verificar se a senha está armazenada como hash (contém um ponto)
            let isPasswordValid = false;
            
            if (user.password && user.password.includes('.')) {
              // Verificação de senha com hash
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

  app.post("/api/login", (req, res, next) => {
    console.log(`Tentativa de login via API: ${req.body.username}`);
    
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error('Erro na autenticação:', err);
        return next(err);
      }
      if (!user) {
        console.log(`Login falhou para: ${req.body.username} - ${info?.message || "Credenciais inválidas"}`);
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
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

  app.get("/api/user", async (req, res) => {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated()) {
      console.log('Tentativa de acesso não autenticado a /api/user', {
        hasSession: !!req.session,
        sessionID: req.sessionID,
        cookies: req.headers.cookie,
        origin: req.headers.origin,
        referer: req.headers.referer,
        userAgent: req.headers['user-agent']
      });
      
      // Verificar tentativa de recuperação de sessão
      if (req.session && (req.session as any)?.passport?.user) {
        const userId = (req.session as any).passport.user;
        console.log(`[API/USER] Tentando recuperação automática de sessão para userId: ${userId}`);
        
        try {
          // Tentar obter o usuário do banco
          const user = await storage.getUser(userId);
          
          if (user) {
            console.log(`[API/USER] Recuperado usuário ${user.id} (${user.email}) do banco, tentando login manual`);
            
            // Login manual do usuário
            return req.login(user, (loginErr) => {
              if (loginErr) {
                console.error('[API/USER] Falha na recuperação da sessão:', loginErr);
                return res.status(401).json({ 
                  message: "Não autenticado",
                  recoveryAttempted: true,
                  recoverySuccess: false,
                  error: "Erro ao restaurar sessão"
                });
              }
              
              // Sucesso na recuperação
              console.log('[API/USER] Sessão recuperada com sucesso!');
              const userWithoutPassword = { ...user, password: undefined };
              return res.json({
                ...userWithoutPassword,
                _sessionRecovered: true
              });
            });
          }
        } catch (error) {
          console.error('[API/USER] Erro ao recuperar usuário para recuperação de sessão:', error);
        }
      }
      
      // Se não conseguiu recuperar, retornar erro de autenticação
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Usuário está autenticado normalmente
    console.log(`Informações do usuário solicitadas: ${req.user.id} (${req.user.email})`);
    
    // Não enviar a senha para o cliente
    const userWithoutPassword = { ...req.user, password: undefined };
    res.json(userWithoutPassword);
  });
  
  // Rota para ressincronizar sessão a partir de token JWT (Supabase)
  app.post("/api/resync-session", async (req, res) => {
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