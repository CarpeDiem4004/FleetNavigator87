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

// Configuração das variáveis de ambiente do Supabase
// Usa os valores fixos do cliente (pois são os mesmos utilizados no front-end)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  
  // Registrar o roteador de API de usuários
  app.use(userApi);
  
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
