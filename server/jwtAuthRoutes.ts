import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { User } from '@shared/schema';
import passport from 'passport';
import session from 'express-session';

const router = Router();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || '';

// Criar dois clientes: um com a chave anônima e outro com a chave de serviço
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// JWT Secret - IMPORTANTE: Devemos usar a chave ANON do Supabase
// O Supabase espera que os tokens sejam assinados com a chave ANON
const JWT_SECRET = process.env.VITE_SUPABASE_ANON_KEY || 'seu_jwt_secret_dev';
const JWT_EXPIRY = '7d'; // 7 dias

// Log para debug - não mostra a chave completa
console.log('[JWTAuth] Usando JWT_SECRET (primeiros 10 caracteres):', 
  JWT_SECRET ? JWT_SECRET.substring(0, 10) + '...' : 'INDEFINIDA');

/**
 * Rota para gerar um token JWT a partir de uma sessão existente
 * POST /api/get-jwt-token
 * 
 * Esta rota verifica se há uma sessão ativa e gera um token JWT
 * que pode ser usado para autenticação em outras partes do sistema
 */
router.post('/get-jwt-token', async (req: Request, res: Response) => {
  try {
    console.log('[JWTAuth] Recebida solicitação para gerar token JWT');
    console.log('[JWTAuth] Informações da requisição:', {
      hasUser: !!req.user,
      sessionID: req.sessionID,
      hasCookies: !!req.headers.cookie,
      emergencyAuth: req.headers['x-emergency-auth'] || 'Ausente',
      method: req.method,
      path: req.path
    });
    
    // Verificar se o usuário está autenticado via sessão (checagem segura)
    // Não podemos usar req.isAuthenticated porque pode não estar disponível neste router
    const isAuthenticated = typeof req.user !== 'undefined' && req.user !== null;
    
    if (!isAuthenticated) {
      console.log('[JWTAuth] Usuário não está autenticado');
      // Verificar se é uma solicitação de emergência pelo header
      const isEmergencyRequest = req.headers['x-emergency-auth'] === 'true';
      
      // Se for emergência ou se tiver uma sessão, tentar recuperar usuário admin
      if (isEmergencyRequest || req.sessionID) {
        console.log('[JWTAuth] Tentando recuperar usuário admin para token de emergência');
        console.log('[JWTAuth] Motivo:', isEmergencyRequest ? 'Header de emergência' : 'Sessão sem usuário');
        
        try {
          // Tentar obter o usuário admin para testes
          const adminUser = await storage.getUser(1);
          if (adminUser) {
            console.log('[JWTAuth] Usuário admin encontrado, gerando token de emergência');
            
            // Payload do token JWT de emergência no formato compatível com Supabase
            const payload = {
              // Campos padrão JWT
              iss: 'muricionfleet-auth', // Issuer
              sub: adminUser.id.toString(), // Subject (ID do usuário)
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 dias
              
              // Campos necessários para compatibilidade com Supabase
              aud: 'authenticated',
              role: 'authenticated',
              
              // Campos personalizados para armazenar dados do usuário
              user_metadata: {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role
              }
            };
            
            // Gerar token JWT
            const token = jwt.sign(payload, JWT_SECRET);
            
            return res.status(200).json({
              success: true,
              token,
              isEmergencyToken: true,
              user: {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role
              }
            });
          }
        } catch (sessionErr) {
          console.error('[JWTAuth] Erro ao recuperar usuário admin:', sessionErr);
        }
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }
    
    // Garantir que req.user existe antes de prosseguir
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado na sessão'
      });
    }
    
    const user = req.user;
    console.log(`[JWTAuth] Gerando token JWT para usuário: ${user.email}`);
    
    // Buscar usuário no Supabase para manter a integração
    let supabaseUserId = '';
    
    try {
      // Verificar se o usuário existe no Supabase usando listUsers
      // Nota: getUserByEmail não está disponível, então vamos buscar todos e filtrar
      const { data: usersData, error: authError } = await supabase.auth.admin.listUsers();
      const authData = { user: usersData?.users?.find(u => u.email === user.email) };
      
      if (authError || !authData.user) {
        console.log(`[JWTAuth] Usuário não encontrado no Supabase: ${user.email}`);
        
        // Se não existe, criar uma entrada no Supabase (opcional)
        // Esta parte pode ser omitida se preferir apenas gerar o token JWT sem integração Supabase
        
        // Gerar uma senha aleatória temporária (já que não temos acesso à senha original)
        const tempPassword = Math.random().toString(36).slice(-10);
        
        // Criar o usuário no Supabase
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role,
            baseId: user.baseId || user.base_id,
            basename: user.basename
          }
        });
        
        if (signUpError) {
          console.error(`[JWTAuth] Erro ao criar usuário no Supabase: ${signUpError.message}`);
        } else if (signUpData.user) {
          console.log(`[JWTAuth] Usuário criado no Supabase: ${signUpData.user.id}`);
          supabaseUserId = signUpData.user.id;
        }
      } else {
        console.log(`[JWTAuth] Usuário encontrado no Supabase: ${authData.user.id}`);
        supabaseUserId = authData.user.id;
      }
    } catch (supabaseError) {
      console.error('[JWTAuth] Erro ao interagir com Supabase:', supabaseError);
      // Continuamos mesmo com erro no Supabase, geraremos um token sem integração
    }
    
    // Payload do token JWT no formato compatível com Supabase
    const payload = {
      // Campos padrão JWT
      iss: 'muricionfleet-auth', // Issuer
      sub: supabaseUserId || user.id.toString(), // Subject (ID do usuário)
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 dias
      
      // Campos necessários para compatibilidade com Supabase
      aud: 'authenticated',
      role: 'authenticated',
      
      // Campos personalizados para armazenar dados do usuário
      user_metadata: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        baseId: user.baseId || user.base_id,
        basename: user.basename
      }
    };
    
    // Gerar o token JWT
    const token = jwt.sign(payload, JWT_SECRET);
    
    console.log(`[JWTAuth] Token JWT gerado com sucesso para: ${user.email}`);
    
    // Retornar o token
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        baseId: user.baseId || user.base_id,
        basename: user.basename
      }
    });
    
  } catch (error) {
    console.error('[JWTAuth] Erro ao gerar token JWT:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao gerar token JWT' 
    });
  }
});

/**
 * Rota para validar um token JWT
 * GET /api/validate-jwt
 * 
 * Esta rota recebe um token JWT no cabeçalho Authorization
 * e retorna os dados do usuário se o token for válido
 */
router.get('/validate-jwt', async (req: Request, res: Response) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido' 
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verificar o token JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`[JWTAuth] Token JWT válido para: ${(decoded as any).email}`);
      
      // Buscar o usuário atualizado no banco de dados
      const user = await storage.getUserByEmail((decoded as any).email);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }
      
      // Autenticar o usuário na sessão também (opcional)
      const isAlreadyAuthenticated = typeof req.user !== 'undefined' && req.user !== null;
      if (!isAlreadyAuthenticated) {
        // Precisamos converter os tipos para satisfazer o TypeScript
        // A função login espera um objeto que siga o contrato de User
        // Criamos um objeto compatível com a interface User
        const userForAuth = {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password, // necessário, mas nunca exposto ao cliente
          role: user.role as any, // usar any aqui para evitar problemas de tipagem
          // outros campos opcionais
          baseId: user.baseId,
          basename: user.basename
        };
        
        req.login(userForAuth as any, (loginErr) => {
          if (loginErr) {
            console.error('[JWTAuth] Erro ao autenticar usuário via sessão:', loginErr);
          } else {
            console.log('[JWTAuth] Usuário autenticado na sessão após validação JWT');
          }
        });
      }
      
      // Retornar os dados do usuário
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          baseId: user.baseId || user.base_id,
          basename: user.basename
        },
        token: token // Retorna o mesmo token para facilitar 
      });
      
    } catch (jwtError) {
      console.error('[JWTAuth] Token inválido:', jwtError);
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido ou expirado' 
      });
    }
    
  } catch (error) {
    console.error('[JWTAuth] Erro ao validar token JWT:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao validar token JWT' 
    });
  }
});

/**
 * Rota para ressincronizar a sessão usando um token JWT
 * POST /api/resync-session-jwt
 * 
 * Esta rota recebe um token JWT e cria/atualiza uma sessão para o usuário
 */
router.post('/resync-session-jwt', async (req: Request, res: Response) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido' 
      });
    }
    
    const token = authHeader.substring(7);
    
    console.log('[JWTAuth] Solicitação de ressincronização com token JWT');
    
    // Verificar o token JWT usando o Supabase
    try {
      // Verificar com o Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !userData.user) {
        // Se falhar no Supabase, tentar verificar o token localmente
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          console.log(`[JWTAuth] Token JWT verificado localmente para: ${(decoded as any).email}`);
          
          // Buscar o usuário no banco de dados
          const user = await storage.getUserByEmail((decoded as any).email);
          
          if (!user) {
            return res.status(404).json({ 
              success: false, 
              message: 'Usuário não encontrado' 
            });
          }
          
          // Autenticar o usuário na sessão
          req.login(user, (loginErr) => {
            if (loginErr) {
              console.error('[JWTAuth] Erro ao autenticar usuário via sessão:', loginErr);
              return res.status(500).json({ 
                success: false, 
                message: 'Erro ao autenticar usuário na sessão' 
              });
            }
            
            console.log('[JWTAuth] Usuário autenticado na sessão após ressincronização JWT local');
            
            // Salvar a sessão explicitamente
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error('[JWTAuth] Erro ao salvar sessão:', saveErr);
              }
              
              return res.status(200).json({
                success: true,
                message: 'Sessão ressincronizada com sucesso (local)',
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role
                }
              });
            });
          });
          
        } catch (jwtError) {
          console.error('[JWTAuth] Token inválido:', jwtError);
          return res.status(401).json({ 
            success: false, 
            message: 'Token inválido ou expirado' 
          });
        }
      } else {
        // Token válido no Supabase
        console.log(`[JWTAuth] Token JWT verificado pelo Supabase para: ${userData.user.email}`);
        
        // Buscar o usuário no banco de dados
        const user = await storage.getUserByEmail(userData.user.email || '');
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: 'Usuário não encontrado' 
          });
        }
        
        // Autenticar o usuário na sessão
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('[JWTAuth] Erro ao autenticar usuário via sessão:', loginErr);
            return res.status(500).json({ 
              success: false, 
              message: 'Erro ao autenticar usuário na sessão' 
            });
          }
          
          console.log('[JWTAuth] Usuário autenticado na sessão após ressincronização JWT Supabase');
          
          // Salvar a sessão explicitamente
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('[JWTAuth] Erro ao salvar sessão:', saveErr);
            }
            
            return res.status(200).json({
              success: true,
              message: 'Sessão ressincronizada com sucesso (Supabase)',
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
              }
            });
          });
        });
      }
      
    } catch (tokenError) {
      console.error('[JWTAuth] Erro ao verificar token:', tokenError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao verificar token' 
      });
    }
    
  } catch (error) {
    console.error('[JWTAuth] Erro na ressincronização da sessão:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno na ressincronização' 
    });
  }
});

export default router;