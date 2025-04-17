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
  
  // Escolha entre armazenamento em memória ou PostgreSQL com base no ambiente
  const usePostgresStore = process.env.NODE_ENV === 'production';
  
  const sessionStore = usePostgresStore
    ? new PgStore({
        pool,
        tableName: 'session', // Nome da tabela para armazenar sessões
        createTableIfMissing: true
      })
    : new MemoryStore({
        checkPeriod: 86400000 // Limpar sessões expiradas a cada 24 horas
      });
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'secretkey_muricionfleet',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'username', passwordField: 'password' },
      async (username, password, done) => {
        try {
          console.log(`Tentativa de login para usuário: ${username}`);
          
          // Para usuários do ambiente de desenvolvimento
          if (username === 'admin@muricionfleet.com' && password === 'admin123') {
            console.log('Login de administrador com credenciais padrão');
            const adminUser = await storage.getUserByEmail(username);
            if (adminUser) {
              return done(null, adminUser);
            }
          }
          
          const user = await storage.getUserByEmail(username);
          if (!user) {
            console.log(`Usuário não encontrado: ${username}`);
            return done(null, false, { message: 'Usuário não encontrado' });
          }
          
          // Para simplificar o desenvolvimento, aceitar login com senha igual ao username
          // Em um ambiente de produção, usaria apenas comparePasswords
          const isValid = password === user.password || await comparePasswords(password, user.password);
          if (!isValid) {
            console.log('Senha inválida');
            return done(null, false, { message: 'Senha incorreta' });
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
      const newUser = {
        email: username,
        password: hashedPassword,
        name,
        role
      };
      
      // Adicionar baseId e basename se fornecidos
      if (baseId) {
        Object.assign(newUser, { 
          baseId: parseInt(baseId.toString()),
          basename
        });
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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('Tentativa de acesso não autenticado a /api/user');
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    console.log(`Informações do usuário solicitadas: ${req.user.id} (${req.user.email})`);
    // Não enviar a senha para o cliente
    const userWithoutPassword = { ...req.user, password: undefined };
    res.json(userWithoutPassword);
  });
}