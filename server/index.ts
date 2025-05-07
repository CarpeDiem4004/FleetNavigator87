import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// Importar cronJobs para tarefas agendadas
import { initCronJobs } from "./cronJobs";
// Importar migrações
import { runMigrations } from "./migration";
// Importar APIs diretas para postos
import { 
  getHistoricoPosto, 
  getEstatisticasMensaisPosto, 
  getConsumoPorVeiculoPosto,
  getComparativoCombustiveisPosto,
  checkTabelaPosto,
  registrarAbastecimentoPosto
} from "./api-direto.js";
// Importar API para usuários via Supabase
import userApi from "./api/userApi";
// Importar APIs híbridas (ambiente Replit e externo)
import hybridUserApi from "../hybrid-user-api.js";
import hybridBasesApi from "../hybrid-bases-api.js";
// Importar middleware de CORS personalizado
import { corsMiddleware } from "./middleware/cors";
// Importar middleware para corrigir cookies de sessão
import { fixCookieSessionMiddleware } from "./middleware/fixCookieSession";
// Importar middlewares de diagnóstico e recuperação de autenticação
import { debugAuthMiddleware, recoverSessionMiddleware } from './middleware/debugAuthMiddleware';
// Importar rota de diagnóstico para frota
import frotaDiagnosticoRoute from "./routes/frotaDiagnosticoRoute";

// Configuração das variáveis de ambiente do Supabase
// Usa os valores fixos do cliente (pois são os mesmos utilizados no front-end)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const app = express();
// Aplicar middleware CORS personalizado
app.use(corsMiddleware);
// Middlewares padrão do Express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// * IMPORTANTE: É crucial que registerRoutes seja chamado antes dos middlewares de diagnóstico *
// * pois registerRoutes inicializa o Passport.js com setupAuth, que adiciona o método isAuthenticated *

// [COMENTADO] - Usando apenas o middleware corsMiddleware agora
// O middleware de CORS personalizado foi movido para server/middleware/cors.ts
// e é aplicado na linha app.use(corsMiddleware) acima.

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Executar migrações antes de iniciar o servidor
  try {
    await runMigrations();
    console.log("Migrações executadas com sucesso!");
  } catch (error) {
    console.error("Erro ao executar migrações:", error);
  }
  
  const server = await registerRoutes(app);
  
  // Agora podemos aplicar o middleware de fixação de cookies e diagnóstico 
  // já que o Passport está inicializado
  app.use(fixCookieSessionMiddleware);
  app.use(debugAuthMiddleware);
  app.use(recoverSessionMiddleware);
  
  // Registrar o roteador de API de usuários
  app.use(userApi);
  
  // Registrar os roteadores de API híbrida (funcionam dentro e fora do Replit)
  app.use(hybridUserApi);
  app.use(hybridBasesApi);
  
  // Registrar rota de diagnóstico para verificar autenticação no módulo de frota
  app.use('/api/frota', frotaDiagnosticoRoute);
  
  // Registrar as rotas de API diretas para evitar interceptação do Vite
  // Estas rotas serão processadas antes do middleware do Vite e terão os headers adequados
  app.get('/api/historico-direto/:posto', getHistoricoPosto);
  app.get('/api/estatisticas-mensais-direto/:posto', getEstatisticasMensaisPosto);
  app.get('/api/consumo-por-veiculo-direto/:posto', getConsumoPorVeiculoPosto);
  app.get('/api/comparativo-combustiveis-direto/:posto', getComparativoCombustiveisPosto);
  app.get('/api/check-tabela-direto/:posto', checkTabelaPosto);
  app.post('/api/abastecimento-direto/:posto', registrarAbastecimentoPosto);
  
  // Rotas especiais para Campinas V2, para resolver o problema de nomenclatura
  // Rota de abastecimento
  app.post('/api/abastecimento-direto-campinas-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE CAMPINAS V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como campinas_v2
    req.params = { ...req.params, posto: 'campinas_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Campinas V2
  app.get('/api/historico-direto-campinas-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE CAMPINAS V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'campinas_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Rotas especiais para Osasco, seguindo mesmo padrão de Campinas V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto-osasco', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE OSASCO ====");
    // Forçar o parâmetro posto para garantir que seja tratado como osasco
    req.params = { ...req.params, posto: 'osasco' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Osasco
  app.get('/api/historico-direto-osasco', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE OSASCO ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'osasco' };
    getHistoricoPosto(req, res);
  });

  // Rotas especiais para Osasco V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto/osasco_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE OSASCO V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como osasco_v2
    req.params = { ...req.params, posto: 'osasco_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Osasco V2
  app.get('/api/historico-direto/osasco_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE OSASCO V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'osasco_v2' };
    getHistoricoPosto(req, res);
  });

  // Rotas especiais para ABC V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto-abc-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE ABC V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como abc_v2
    req.params = { ...req.params, posto: 'abc_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para ABC V2
  app.get('/api/historico-direto-abc-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE ABC V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'abc_v2' };
    getHistoricoPosto(req, res);
  });

  // Rotas especiais para Alair V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto-alair-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE ALAIR V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como alair_v2
    req.params = { ...req.params, posto: 'alair_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Alair V2
  app.get('/api/historico-direto-alair-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE ALAIR V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'alair_v2' };
    getHistoricoPosto(req, res);
  });

  // Rotas especiais para Socorro V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto-socorro-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE SOCORRO V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como socorro_v2
    req.params = { ...req.params, posto: 'socorro_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Socorro V2
  app.get('/api/historico-direto-socorro-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE SOCORRO V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'socorro_v2' };
    getHistoricoPosto(req, res);
  });

  // Rotas especiais para Sorocaba V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto-sorocaba-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE SOROCABA V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como sorocaba_v2
    req.params = { ...req.params, posto: 'sorocaba_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Sorocaba V2
  app.get('/api/historico-direto-sorocaba-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE SOROCABA V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'sorocaba_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Rota de diagnóstico específica para autenticação
  app.get('/api/auth-diagnostic', (req, res) => {
    const isAuth = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;
    
    // Para compatibilidade com tipos, não podemos acessar diretamente req.session.cookie
    const sessionObj: any = req.session || {};
    const cookieObj = sessionObj.cookie || {};
    
    // Obter informações detalhadas sobre cookies
    let cookieInfo: any = {};
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map(c => {
        const [key, value] = c.trim().split('=');
        return { key, value: value ? value.substring(0, 10) + '...' : 'vazio' };
      });
      cookieInfo = cookies;
    }
    
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      isAuthenticated: isAuth,
      hasSession: !!req.session,
      sessionID: req.sessionID,
      cookiePresent: !!req.headers.cookie,
      cookies: cookieInfo,
      sessionMaxAge: cookieObj.maxAge,
      sessionExpires: cookieObj.expires,
      sessionSettings: {
        secure: cookieObj.secure,
        httpOnly: cookieObj.httpOnly,
        sameSite: cookieObj.sameSite,
        path: cookieObj.path,
        domain: cookieObj.domain
      },
      passportInfo: {
        initialized: typeof req.isAuthenticated === 'function',
        passportSession: (req.session as any)?.passport,
      },
      user: isAuth && req.user ? {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      } : null,
      requestInfo: {
        host: req.hostname,
        path: req.path,
        method: req.method,
        protocol: req.protocol,
        secure: req.secure,
        origin: req.headers.origin,
        referer: req.headers.referer
      }
    };
    
    console.log('[AuthDiagnostic] Diagnóstico de autenticação executado');
    res.json(status);
  });
  
  // Rota para diagnosticar problemas de CORS com domínio personalizado
  app.get('/api/cors-check', (req, res) => {
    const corsInfo = {
      success: true,
      message: 'Verificação de CORS bem-sucedida',
      requestInfo: {
        host: req.hostname,
        origin: req.headers.origin,
        referer: req.headers.referer,
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        ip: req.ip
      },
      responseHeaders: {
        'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
        'access-control-allow-methods': res.getHeader('Access-Control-Allow-Methods'),
        'access-control-allow-headers': res.getHeader('Access-Control-Allow-Headers'),
        'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials')
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Verificação de CORS:', corsInfo);
    res.json(corsInfo);
  });
  
  // Rota de diagnóstico para postos
  app.get('/api/postos/diagnostico', (req, res) => {
    const isAuth = req.isAuthenticated();
    const sessionInfo = req.session 
      ? {
          id: req.sessionID,
          cookie: req.session.cookie ? {
            domain: req.session.cookie.domain,
            path: req.session.cookie.path,
            secure: req.session.cookie.secure,
            expires: req.session.cookie.expires,
            maxAge: req.session.cookie.maxAge
          } : undefined
        }
      : undefined;
      
    return res.json({
      success: true,
      currentRoute: '/api/postos/diagnostico',
      isAuthenticated: isAuth,
      user: isAuth ? { 
        id: req.user.id, 
        email: req.user.email,
        role: req.user.role
      } : null,
      host: req.hostname,
      path: req.path,
      method: req.method,
      session: sessionInfo,
      headers: {
        cookie: req.headers.cookie,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      },
      isDomainGestaoonfleet: req.hostname.includes('gestaoonfleet.com.br'),
      sugestedAction: !isAuth ? 'Necessário fazer login em gestaoonfleet.com.br/login antes de acessar' : 'Usuário está autenticado'
    });
  });
  
  // Rota especial pública para o domínio personalizado - sem autenticação
  app.get('/postos-info', (req, res) => {
    if (req.hostname.includes('gestaoonfleet.com.br')) {
      console.log(`[Postos] Acesso à página de postos pelo domínio: ${req.hostname}`);
      
      // Redireciona para a SPA que irá lidar com a rota /postos no frontend
      res.redirect('/');
    } else {
      // Se não for o domínio personalizado, retorna erro
      res.status(403).json({ 
        success: false, 
        message: "Esta rota só pode ser acessada através do domínio gestaoonfleet.com.br"
      });
    }
  });
  
  // Rota pública específica para cada posto (sem autenticação)
  // Esta rota ajuda a resolver o problema de acesso pelo domínio personalizado
  app.get('/api/postos/acesso-aberto/:posto', async (req, res) => {
    try {
      const nomePosto = req.params.posto;
      console.log(`[Postos] Acesso aberto ao posto: ${nomePosto} - host: ${req.hostname}`);
      
      // Responde com um redirecionamento para a página de postos
      res.json({
        success: true,
        message: `Acesso ao posto ${nomePosto}`,
        redirectUrl: `/posto/${nomePosto}`,
        host: req.hostname,
        isDomainGestaoonfleet: req.hostname.includes('gestaoonfleet.com.br'),
        isAuthenticated: req.isAuthenticated()
      });
    } catch (error) {
      console.error(`[Postos] Erro no acesso aberto ao posto ${req.params.posto}:`, error);
      res.status(500).json({
        success: false,
        message: `Erro ao acessar posto ${req.params.posto}`,
        error: String(error)
      });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Iniciar tarefas agendadas
    try {
      initCronJobs();
      log('Cron jobs iniciados com sucesso.');
    } catch (error) {
      console.error('Erro ao iniciar cron jobs:', error);
    }
  });
})();
