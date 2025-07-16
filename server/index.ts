import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { utcMiddleware } from './utils/timezone-utc.js';
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
  registrarAbastecimentoPosto,
  deleteAbastecimentoPosto
} from "./api-direto.js";
// Importar API para usuários via Supabase
import userApi from "./api/userApi";
// Importar APIs híbridas (ambiente Replit e externo)
import hybridUserApi from "../hybrid-user-api.js";
import hybridBasesApi from "../hybrid-bases-api.js";
// Importar rotas para acesso externo de parceiros de guincho
import towingPartnerExternalRoutes from "./routes/towingPartnerExternalRoutes";
// Importar rotas de emergência para acesso externo de parceiros de guincho
import towingServiceEmergency from "./routes/towingServiceEmergency";
// Importar rotas para gerenciamento financeiro de serviços de guincho
import towingPaymentsRoutes from "./routes/towingPaymentsRoutes";
// Importar middleware de CORS personalizado
import { corsMiddleware } from "./middleware/cors";
// Importar middleware para corrigir cookies de sessão
import fixCookieSession from "./middleware/fixCookieSession";
// Importar middlewares de diagnóstico e recuperação de autenticação
import { debugAuthMiddleware, recoverSessionMiddleware } from './middleware/debugAuthMiddleware';
import { unifiedAuthMiddleware, requireRoles } from './utils/auth-utils.js';
import { pool } from './database.js';
// Importar rota de diagnóstico para frota
import frotaDiagnosticoRoute from "./routes/frotaDiagnosticoRoute";
// Importar rotas de recebimentos e movimentações de pátio
import recebimentosMovimentacoesRoutes from "./routes/recebimentosMovimentacoesRoutes";
// Importar rotas de projetos padronizados
import projetosRoutes from "./routes/projetosRoutes";
// Importar rotas de preços de combustível
import { registerPrecosCombustivelRoutes } from "./routes/precosCombustivelRoutes";
// Importar scheduler de consumo diário
import { iniciarScheduler } from './services/consumoDiarioScheduler.js';
// Importar rotas de histórico de consumo diário
import consumoDiarioHistorico from './routes/consumoDiarioHistorico.js';
import consumoDiarioTabela from './routes/consumoDiarioTabela.js';
// Importar API de coordenador de projeto
import coordinatorRolesApi from './coordinatorRolesApi';
// Importar API de manutenção veicular
import { 
  loginMaintenance, 
  authenticateMaintenanceToken,
  getOrdensServico,
  createOrdemServico,
  updateStatusOrdemServico,
  getPecasOS,
  addPecaOS,
  getVeiculos,
  getOficinas,
  getRelatorios
} from './maintenance-api.js';
// Importar rotas de cartões de combustível
import fuelCardRoutes from './routes/fuelCardRoutes';
// Importar rotas do painel operacional
import operationalDashboardRoutes from './routes/operationalDashboard';

// Configuração das variáveis de ambiente do Supabase
// Usa os valores fixos do cliente (pois são os mesmos utilizados no front-end)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// CORREÇÃO DEFINITIVA: Configurar timezone como UTC no backend
// Seguindo as melhores práticas: backend em UTC, frontend converte para local
process.env.TZ = 'UTC';
console.log(`[SISTEMA] Timezone configurado para: UTC`);
console.log(`[SISTEMA] Data atual: ${new Date().toISOString()}`);
console.log(`[SISTEMA] TZ environment: ${process.env.TZ}`);

const app = express();

// Middleware para processar JSON ANTES dos endpoints críticos
// Aumentar limite para suportar exportações Excel grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Aplicar middleware UTC para garantir que todas as datas sejam processadas em UTC
app.use(utcMiddleware);

// ENDPOINT DE DIAGNÓSTICO DE TIMEZONE - Registrar ANTES de todos os middlewares
app.get('/api/timezone-status', (req, res) => {
  try {
    const now = new Date();
    const brazilTime = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const systemTime = now.toLocaleString();
    const utcTime = now.toISOString();
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      message: 'Status do timezone do sistema (Backend UTC, Frontend Brasil)',
      data: {
        systemTimezone: process.env.TZ || 'Não definido',
        currentTime: {
          utc: utcTime,
          utcTimestamp: now.getTime(),
          brazilPreview: brazilTime,
          systemTime: systemTime
        },
        configuration: {
          backendTimezone: process.env.TZ,
          frontendTimezone: 'America/Sao_Paulo',
          locale: 'pt-BR',
          pattern: 'Backend UTC -> Frontend Local'
        }
      }
    });
  } catch (error) {
    console.error('Erro ao verificar timezone:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar timezone',
      error: error.message
    });
  }
});

// ROTAS DE TERCEIROS - Registrar ANTES de qualquer middleware para evitar interceptação do Vite
app.get('/api/terceiros/admin/stats', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_empresas,
        COUNT(a.id) as total_abastecimentos,
        COALESCE(SUM(a.litros), 0) as total_litros,
        COALESCE(SUM(a.valor_total), 0) as total_valor
      FROM empresas_terceiros e
      LEFT JOIN abastecimentos_terceiros a ON e.id = a.empresa_id
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      totalEmpresas: parseInt(stats.total_empresas) || 0,
      totalAbastecimentos: parseInt(stats.total_abastecimentos) || 0,
      totalLitros: parseFloat(stats.total_litros) || 0,
      totalValor: parseFloat(stats.total_valor) || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de terceiros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/terceiros/admin/empresas', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const empresasQuery = `
      SELECT 
        id, nome, cnpj, endereco, telefone, email, responsavel_nome,
        created_at
      FROM empresas_terceiros
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(empresasQuery);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar empresas de terceiros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/terceiros/admin/abastecimentos', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const abastecimentosQuery = `
      SELECT 
        a.id, a.posto, a.combustivel_tipo, a.litros, a.valor_total,
        a.km_atual, a.created_at, a.placa, a.motorista,
        e.nome as empresa_nome, e.cnpj as empresa_cnpj
      FROM abastecimentos_terceiros a
      JOIN empresas_terceiros e ON a.empresa_id = e.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(abastecimentosQuery);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar abastecimentos de terceiros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ENDPOINT CRÍTICO PARA RECEBIMENTOS - Registrar ANTES de todos os middlewares
app.post('/fuel-receipts', async (req, res) => {
  try {
    console.log('[RECEBIMENTOS] Endpoint direto chamado para posto:', req.body.posto);
    
    // Configurar headers de resposta
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const { posto, tipo_produto, litros_recebidos, valor_total, nome_fornecedor, nome_operador, observacoes } = req.body;
    
    // Map stations to receipt table names
    const tableMap: { [key: string]: string } = {
      'osasco_v2': 'recebimentos_posto_osasco_v2',
      'abc_v2': 'recebimentos_posto_abc_v2',
      'alair_v2': 'recebimentos_posto_alair_v2',
      'campinas_v2': 'recebimentos_posto_campinas_v2',
      'socorro_v2': 'recebimentos_posto_socorro_v2',
      'sorocaba_v2': 'recebimentos_posto_sorocaba_v2',
      'guarulhos_v2': 'recebimentos_posto_guarulhos_v2'
    };
    
    const tableName = tableMap[posto.toLowerCase()];
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: `Posto "${posto}" não encontrado`
      });
    }
    
    // Insert new fuel receipt
    const insertQuery = `
      INSERT INTO ${tableName} (
        tipo_produto, 
        litros_recebidos, 
        valor_total, 
        nome_fornecedor, 
        nome_operador, 
        observacoes,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      tipo_produto,
      litros_recebidos,
      valor_total,
      nome_fornecedor,
      nome_operador,
      observacoes || ''
    ]);
    
    console.log(`[RECEBIMENTOS] Registrado com sucesso - ID: ${result.rows[0].id}, Posto: ${posto}`);
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('[RECEBIMENTOS] Erro ao registrar:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento',
      error: error.message
    });
  }
});

// ENDPOINT CRÍTICO - Registrar ANTES de todos os middlewares do Vite
// Usando um prefixo que não será interceptado pelo Vite
app.get('/consumo-data/postos', async (req, res) => {
  console.log('🔥 ENDPOINT /consumo-data/postos foi chamado!', req.query);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  try {
    console.log('Endpoint de consumo diário (data-api) chamado com parâmetros:', req.query);
    
    // Período da consulta - últimos 30 dias por padrão
    const dias = parseInt(req.query.dias as string) || 30;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    
    console.log(`Buscando dados dos últimos ${dias} dias desde ${dataLimiteStr}`);
    
    // Mapa das tabelas para normalizar nomes
    const tabelasMap = {
      'abastecimentos_posto_abc_v2': 'abc_v2',
      'abastecimentos_posto_alair_v2': 'alair_v2', 
      'abastecimentos_posto_campinas_v2': 'campinas_v2',
      'abastecimentos_posto_osasco_v2': 'osasco_v2',
      'abastecimentos_posto_socorro_v2': 'socorro_v2',
      'abastecimentos_posto_sorocaba_v2': 'sorocaba_v2'
    };
    
    // Obter todas as datas únicas do período
    const queryDatas = `
      SELECT DISTINCT DATE(created_at) as data
      FROM (
        SELECT created_at FROM abastecimentos_posto_abc_v2 WHERE created_at >= $1
        UNION SELECT created_at FROM abastecimentos_posto_alair_v2 WHERE created_at >= $1
        UNION SELECT created_at FROM abastecimentos_posto_campinas_v2 WHERE created_at >= $1
        UNION SELECT created_at FROM abastecimentos_posto_osasco_v2 WHERE created_at >= $1
        UNION SELECT created_at FROM abastecimentos_posto_socorro_v2 WHERE created_at >= $1
        UNION SELECT created_at FROM abastecimentos_posto_sorocaba_v2 WHERE created_at >= $1
      ) todas_datas
      ORDER BY data DESC
    `;
    
    const datasResult = await pool.query(queryDatas, [dataLimiteStr]);
    console.log(`Encontradas ${datasResult.rows.length} datas com dados`);
    
    const resultado = [];
    
    // Para cada data, buscar consumo de todos os postos
    for (let i = 0; i < datasResult.rows.length; i++) {
      const dataAtual = datasResult.rows[i].data;
      const item: any = {
        dia: i + 1,
        data: dataAtual,
        osasco_v2: 0,
        alair_v2: 0,
        campinas_v2: 0,
        abc_v2: 0,
        socorro_v2: 0,
        sorocaba_v2: 0,
        total: 0
      };
      
      // Para cada tabela, buscar o consumo da data
      for (const [tabela, nomePosto] of Object.entries(tabelasMap)) {
        try {
          const query = `
            SELECT COALESCE(SUM(litros), 0) as litros
            FROM ${tabela}
            WHERE DATE(created_at) = $1
          `;
          
          const consumoResult = await pool.query(query, [dataAtual]);
          const litros = parseFloat(consumoResult.rows[0]?.litros || 0);
          
          item[nomePosto] = litros;
          item.total += litros;
        } catch (tableError) {
          console.error(`Erro ao consultar tabela ${tabela} para data ${dataAtual}:`, tableError);
          continue;
        }
      }
      
      resultado.push(item);
    }
    
    console.log(`Retornando ${resultado.length} registros de consumo diário`);
    console.log('Primeiros 3 registros:', resultado.slice(0, 3));
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: resultado,
      params: { dias }
    });
  } catch (error: any) {
    console.error('Erro ao obter consumo diário de postos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados de consumo diário',
      error: error.message
    });
  }
});

// Aplicar middleware CORS personalizado
app.use(corsMiddleware);
// Aplicar middleware de correção de cookies
app.use(fixCookieSession);
// Middlewares padrão do Express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Remove as rotas duplicadas aqui - serão definidas nas rotas principais

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
  
  // Add simple drivers API before any middleware conflicts
  app.get('/api/drivers', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const query = `
        SELECT 
          m.id,
          m.nome,
          m.cpf,
          m.telefone,
          m.base_id,
          m.created_at,
          b.name as base_nome
        FROM motoristas m
        LEFT JOIN bases b ON m.base_id = b.id
        ORDER BY m.created_at DESC
      `;
      
      const result = await pool.query(query);
      console.log('Direct Drivers API - Found', result.rows.length, 'drivers');
      
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Direct Drivers API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching drivers',
        error: error.message
      });
    }
  });

  // Add bases API before any middleware conflicts
  app.get('/api/bases', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const query = 'SELECT id, name, location as description FROM bases WHERE active = true ORDER BY name';
      const result = await pool.query(query);
      
      console.log('Direct Bases API - Found', result.rows.length, 'bases');
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error) {
      console.error('Direct Bases API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bases',
        error: error.message
      });
    }
  });

  // Endpoint para buscar uma base específica por ID
  app.get('/api/bases/:id', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const { id } = req.params;
      
      const query = `
        SELECT id, name, location, operation, type, active, 
               has_maintenance as "hasMaintenance", 
               has_tires as "hasTires", 
               created_at 
        FROM bases 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Base não encontrada'
        });
      }
      
      const base = result.rows[0];
      console.log('Base API - Found base:', base.name);
      
      return res.status(200).json({
        success: true,
        data: base
      });
    } catch (error) {
      console.error('Base API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching base',
        error: error.message
      });
    }
  });

  // Add project-bases relationship API
  app.get('/api/project-bases', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const query = `
        SELECT pb.project_id, pb.base_name, pb.base_code, pb.description, pb.is_active,
               p.name as project_name, b.id as base_id, b.name as base_full_name
        FROM project_bases pb 
        JOIN projects p ON pb.project_id = p.id
        LEFT JOIN bases b ON pb.base_name = b.name OR pb.base_code = b.basename
        WHERE pb.is_active = true 
        ORDER BY p.name, pb.base_name
      `;
      const result = await pool.query(query);
      
      console.log('Project-Bases API - Found', result.rows.length, 'relationships');
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error) {
      console.error('Project-Bases API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching project-base relationships',
        error: error.message
      });
    }
  });

  // Add projects-with-bases API (endpoint específico para dropdowns) - COMENTADO PARA USAR A FUNÇÃO CORRETA
  /*
  app.get('/api/projects-with-bases', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      console.log('[PROJECTS-WITH-BASES] Endpoint acessado');
      
      // Buscar projetos ativos
      const projectsQuery = `
        SELECT id, name, description, is_active 
        FROM projects 
        WHERE is_active = true 
        ORDER BY name ASC
      `;
      
      // Buscar bases usando project_bases para obter nomes completos
      const basesQuery = `
        SELECT 
          pb.project_id,
          pb.base_name,
          pb.base_code,
          pb.description,
          pb.is_active,
          p.name as project_name
        FROM project_bases pb
        LEFT JOIN projects p ON pb.project_id = p.id
        WHERE pb.is_active = true
        ORDER BY p.name, pb.base_name
      `;
      
      const [projectsResult, basesResult] = await Promise.all([
        pool.query(projectsQuery),
        pool.query(basesQuery)
      ]);
      
      console.log(`[PROJECTS-WITH-BASES] Projetos encontrados: ${projectsResult.rows.length}`);
      console.log(`[PROJECTS-WITH-BASES] Bases encontradas: ${basesResult.rows.length}`);
      
      // Agrupar bases por projeto
      const projectsWithBases = projectsResult.rows.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        is_active: project.is_active,
        bases: basesResult.rows
          .filter(base => base.project_id === project.id)
          .map(base => ({
            id: base.project_id, // Usar project_id como ID
            base_name: base.base_name, // Nome completo da project_bases
            base_code: base.base_code,
            description: base.description,
            is_active: base.is_active
          }))
      }));
      
      console.log(`[PROJECTS-WITH-BASES] Projetos com bases: ${projectsWithBases.filter(p => p.bases.length > 0).length}`);
      
      return res.status(200).json({
        success: true,
        data: projectsWithBases,
        count: projectsWithBases.length,
        debug: {
          total_projects: projectsResult.rows.length,
          total_bases: basesResult.rows.length
        }
      });
    } catch (error) {
      console.error('[PROJECTS-WITH-BASES] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar projetos com bases',
        error: error.message
      });
    }
  });
  */

  // Add DELETE endpoint for drivers
  app.delete('/api/drivers/:id', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const { id } = req.params;
      const query = 'DELETE FROM motoristas WHERE id = $1';
      
      const result = await pool.query(query, [id]);
      console.log('Driver deleted:', id);
      
      return res.status(200).json({
        success: true,
        message: 'Driver deleted successfully'
      });
    } catch (error) {
      console.error('Delete Driver API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting driver',
        error: error.message
      });
    }
  });

  // Adicionar rota para consumo diário simplificado dos postos
  app.get('/api/consumo-diario-postos-simplificado-v2', async (req, res) => {
    // Nova versão para corrigir sequência de datas
    try {
      console.log('[CONSUMO-V2] Nova rota ativada para corrigir datas');
      const dias = parseInt(req.query.dias as string) || 30;
      
      // Gerar sequência de dias começando de hoje (Dia 1 = 28/05, Dia 2 = 27/05)
      const hoje = new Date('2025-05-28');
      const resultado = [];
      
      const tabelasMap = {
        'abastecimentos_posto_abc_v2': 'abc_v2',
        'abastecimentos_posto_alair_v2': 'alair_v2', 
        'abastecimentos_posto_campinas_v2': 'campinas_v2',
        'abastecimentos_posto_osasco_v2': 'osasco_v2',
        'abastecimentos_posto_socorro_v2': 'socorro_v2',
        'abastecimentos_posto_sorocaba_v2': 'sorocaba_v2'
      };
      
      console.log('[CONSUMO-V2] Gerando sequência começando em 28/05/2025');
      
      for (let dia = 1; dia <= dias && dia <= 30; dia++) {
        const dataAtual = new Date(hoje);
        dataAtual.setDate(hoje.getDate() - (dia - 1));
        const dataStr = dataAtual.toISOString().split('T')[0];
        
        console.log(`[CONSUMO-V2] Dia ${dia} = ${dataStr}`);
        
        const item = {
          dia: dia,
          data: dataStr,
          osasco_v2: 0,
          alair_v2: 0,
          campinas_v2: 0,
          abc_v2: 0,
          socorro_v2: 0,
          sorocaba_v2: 0,
          total: 0
        };
        
        // Para cada tabela, buscar o consumo da data
        for (const [tabela, nomePosto] of Object.entries(tabelasMap)) {
          try {
            const query = `
              SELECT COALESCE(SUM(litros), 0) as litros
              FROM ${tabela}
              WHERE DATE(created_at) = $1
            `;
            
            const consumoResult = await pool.query(query, [dataStr]);
            const litros = parseFloat(consumoResult.rows[0]?.litros || 0);
            
            (item as any)[nomePosto] = litros;
            item.total += litros;
          } catch (tableError) {
            console.error(`[CONSUMO-V2] Erro ao consultar tabela ${tabela} para data ${dataStr}:`, tableError);
            continue;
          }
        }
        
        resultado.push(item);
      }
      
      console.log(`[CONSUMO-V2] Retornando ${resultado.length} registros`);
      console.log('[CONSUMO-V2] Primeiros 3 registros:', resultado.slice(0, 3));
      
      res.status(200).json({
        success: true,
        data: resultado,
        params: { dias },
        version: 'v2-fixed-dates'
      });
    } catch (error: any) {
      console.error('[CONSUMO-V2] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter dados de consumo diário',
        error: error.message
      });
    }
  });

  app.get('/api/consumo-diario-postos-simplificado', async (req, res) => {
    try {
      // Período da consulta - últimos 30 dias por padrão
      const dias = parseInt(req.query.dias as string) || 30;
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];
      
      // Mapa das tabelas para normalizar nomes
      const tabelasMap = {
        'abastecimentos_posto_abc_v2': 'abc_v2',
        'abastecimentos_posto_alair_v2': 'alair_v2', 
        'abastecimentos_posto_campinas_v2': 'campinas_v2',
        'abastecimentos_posto_osasco_v2': 'osasco_v2',
        'abastecimentos_posto_socorro_v2': 'socorro_v2',
        'abastecimentos_posto_sorocaba_v2': 'sorocaba_v2'
      };
      
      // Obter todas as datas únicas do período
      const queryDatas = `
        SELECT DISTINCT DATE(created_at) as data
        FROM (
          SELECT created_at FROM abastecimentos_posto_abc_v2 WHERE created_at >= $1
          UNION SELECT created_at FROM abastecimentos_posto_alair_v2 WHERE created_at >= $1
          UNION SELECT created_at FROM abastecimentos_posto_campinas_v2 WHERE created_at >= $1
          UNION SELECT created_at FROM abastecimentos_posto_osasco_v2 WHERE created_at >= $1
          UNION SELECT created_at FROM abastecimentos_posto_socorro_v2 WHERE created_at >= $1
          UNION SELECT created_at FROM abastecimentos_posto_sorocaba_v2 WHERE created_at >= $1
        ) todas_datas
        ORDER BY data DESC
      `;
      
      const datasResult = await pool.query(queryDatas, [dataLimiteStr]);
      
      // Gerar sequência de dias começando de hoje (Dia 1 = hoje, Dia 2 = ontem, etc.)
      const hoje = new Date('2025-05-28');
      const resultado = [];
      
      console.log('[CONSUMO-SIMPLIFICADO] Gerando sequência de datas começando em:', hoje.toISOString().split('T')[0]);
      
      for (let dia = 1; dia <= dias && dia <= 30; dia++) {
        const dataAtual = new Date(hoje);
        dataAtual.setDate(hoje.getDate() - (dia - 1));
        const dataStr = dataAtual.toISOString().split('T')[0];
        
        console.log(`[CONSUMO-SIMPLIFICADO] Dia ${dia} = ${dataStr}`);
        
        const item = {
          dia: dia,
          data: dataStr,
          osasco_v2: 0,
          alair_v2: 0,
          campinas_v2: 0,
          abc_v2: 0,
          socorro_v2: 0,
          sorocaba_v2: 0,
          total: 0
        };
        
        // Para cada tabela, buscar o consumo da data
        for (const [tabela, nomePosto] of Object.entries(tabelasMap)) {
          try {
            const query = `
              SELECT COALESCE(SUM(litros), 0) as litros
              FROM ${tabela}
              WHERE DATE(created_at) = $1
            `;
            
            const consumoResult = await pool.query(query, [dataStr]);
            const litros = parseFloat(consumoResult.rows[0]?.litros || 0);
            
            (item as any)[nomePosto] = litros;
            item.total += litros;
          } catch (tableError) {
            console.error(`Erro ao consultar tabela ${tabela} para data ${dataStr}:`, tableError);
            continue;
          }
        }
        
        resultado.push(item);
      }
      
      res.status(200).json({
        success: true,
        data: resultado,
        params: { dias }
      });
    } catch (error: any) {
      console.error('Erro ao obter consumo diário de postos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter dados de consumo diário',
        error: error.message
      });
    }
  });
  




  // Fuel history endpoint 
  app.get('/fuel-data/:placa', (req, res) => {
    const { placa } = req.params;
    console.log(`[FUEL-DATA] Buscando placa: ${placa}`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const query = `
      SELECT 
        placa,
        data_hora as data_abastecimento,
        nome_posto as posto,
        nome_motorista as motorista,
        valor_total as valor,
        quantidade_litros as litros,
        COALESCE(hodometro_atual, km) as km_atual,
        tipo_combustivel,
        observacoes
      FROM historico_consolidado_abastecimentos 
      WHERE placa = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    pool.query(query, [placa])
      .then(result => {
        console.log(`[FUEL-DATA] Encontrados ${result.rows.length} registros`);
        res.end(JSON.stringify({
          success: true,
          data: result.rows,
          placa: placa.toUpperCase(),
          total: result.rows.length,
          message: result.rows.length > 0 
            ? `${result.rows.length} abastecimentos encontrados` 
            : 'Nenhum abastecimento encontrado para esta placa'
        }));
      })
      .catch(error => {
        console.error('[FUEL-DATA] Erro:', error);
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      });
  });

  // Fuel card solicitation count endpoint
  app.get('/fuel-requests-count/:plate', (req, res) => {
    const { plate } = req.params;
    console.log(`[FUEL-REQUESTS] Contando solicitações para placa: ${plate}`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const query = `
      SELECT 
        plate,
        COUNT(*) as total_solicitations,
        MAX(created_at) as ultima_solicitacao
      FROM fuel_card_requests 
      WHERE UPPER(plate) = UPPER($1)
      GROUP BY plate
    `;

    pool.query(query, [plate])
      .then(result => {
        console.log(`[FUEL-REQUESTS] Encontrados ${result.rows.length} registros`);
        const data = result.rows[0] || { plate: plate.toUpperCase(), total_solicitations: 0, ultima_solicitacao: null };
        res.end(JSON.stringify({
          success: true,
          data: data
        }));
      })
      .catch(error => {
        console.error('[FUEL-REQUESTS] Erro:', error);
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      });
  });

  const server = await registerRoutes(app);
  
  // Agora podemos aplicar o middleware de diagnóstico 
  // já que o Passport está inicializado
  // Nota: O middleware de fixação de cookies já foi aplicado no início
  app.use(debugAuthMiddleware);
  app.use(recoverSessionMiddleware);

  // Adicionar rota raiz para health checks de deploy apenas para API
  app.get('/api/status', (req, res) => {
    res.status(200).json({
      status: 'online',
      message: 'Sistema de Gestão de Frotas Muricion',
      version: '2.5.0',
      timestamp: new Date().toISOString()
    });
  });

  // Rotas de terceiros (gerenciamento administrativo) - registradas antes do Vite
  const terceirosAuthMiddleware = (req: any, res: any, next: any) => {
    console.log(`[TerceirosAuth] Rota acessada: ${req.path}, método: ${req.method}`);
    console.log(`[TerceirosAuth] isAuthenticated: ${req.isAuthenticated?.()}, user: ${req.user ? 'presente' : 'ausente'}`);
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      console.log(`[TerceirosAuth] Usuário autenticado: ${req.user.email} (role: ${req.user.role})`);
      return next();
    }
    console.log('[TerceirosAuth] Usuário não autenticado');
    return res.status(401).json({ error: 'Não autorizado' });
  };

  app.get('/api/terceiros/test', (req, res) => {
    console.log('[TerceirosTest] Rota de teste acessada com sucesso');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, message: 'Terceiros routes funcionando' }));
  });

  app.get('/api/terceiros/admin/stats', terceirosAuthMiddleware, async (req, res) => {
    try {
      const pool = (await import('./database.js')).pool;
      const { processDatabaseDates, nowInBrazil } = await import('./utils/timezone.js');
      
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT e.id) as total_empresas,
          COUNT(a.id) as total_abastecimentos,
          COALESCE(SUM(a.valor_total::numeric), 0) as valor_total_abastecimentos,
          COALESCE(SUM(a.litros::numeric), 0) as total_litros,
          COUNT(CASE WHEN DATE(a.data_abastecimento AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') THEN 1 END) as abastecimentos_hoje
        FROM empresas_terceiros e
        LEFT JOIN abastecimentos_terceiros a ON e.id = a.empresa_id
        WHERE e.is_active = true
      `;
      
      const result = await pool.query(statsQuery);
      const stats = result.rows[0] || {
        total_empresas: 0,
        total_abastecimentos: 0,
        valor_total_abastecimentos: 0,
        total_litros: 0,
        abastecimentos_hoje: 0
      };
      
      // Adicionar timestamp atual no timezone do Brasil
      stats.data_atualizacao = nowInBrazil();
      
      console.log('[TerceirosAuth] Stats consultadas com sucesso (Brasil timezone):', stats);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: stats }));
    } catch (error) {
      console.error('[TerceirosAuth] Erro ao buscar estatísticas:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).end(JSON.stringify({ success: false, error: 'Erro interno do servidor' }));
    }
  });

  app.get('/api/terceiros/admin/empresas', terceirosAuthMiddleware, async (req, res) => {
    try {
      const pool = (await import('./database.js')).pool;
      const { processDatabaseDates } = await import('./utils/timezone.js');
      
      const empresasQuery = `
        SELECT 
          e.*,
          COUNT(a.id) as total_abastecimentos,
          COALESCE(SUM(a.valor_total::numeric), 0) as valor_total,
          e.created_at AT TIME ZONE 'America/Sao_Paulo' as data_cadastro
        FROM empresas_terceiros e
        LEFT JOIN abastecimentos_terceiros a ON e.id = a.empresa_id
        GROUP BY e.id, e.created_at
        ORDER BY e.created_at DESC
      `;
      
      const result = await pool.query(empresasQuery);
      
      // Processar datas com timezone do Brasil
      const processedData = processDatabaseDates(result.rows, ['created_at', 'data_cadastro']);
      
      console.log('[TerceirosAuth] Empresas consultadas com sucesso (Brasil timezone):', processedData.length);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: processedData }));
    } catch (error) {
      console.error('[TerceirosAuth] Erro ao buscar empresas:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).end(JSON.stringify({ success: false, error: 'Erro interno do servidor' }));
    }
  });

  app.get('/api/terceiros/admin/abastecimentos', terceirosAuthMiddleware, async (req, res) => {
    try {
      const pool = (await import('./database.js')).pool;
      const { processDatabaseDates } = await import('./utils/timezone.js');
      
      const abastecimentosQuery = `
        SELECT 
          a.*,
          e.nome as empresa_nome,
          e.cnpj as empresa_cnpj,
          a.data_abastecimento AT TIME ZONE 'America/Sao_Paulo' as data_abastecimento_brasil,
          a.created_at AT TIME ZONE 'America/Sao_Paulo' as data_registro
        FROM abastecimentos_terceiros a
        JOIN empresas_terceiros e ON a.empresa_id = e.id
        ORDER BY a.data_abastecimento DESC
        LIMIT 100
      `;
      
      const result = await pool.query(abastecimentosQuery);
      
      // Processar datas com timezone do Brasil
      const processedData = processDatabaseDates(result.rows, [
        'data_abastecimento', 
        'data_abastecimento_brasil', 
        'created_at', 
        'data_registro'
      ]);
      
      console.log('[TerceirosAuth] Abastecimentos consultados com sucesso (Brasil timezone):', processedData.length);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: processedData }));
    } catch (error) {
      console.error('[TerceirosAuth] Erro ao buscar abastecimentos:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).end(JSON.stringify({ success: false, error: 'Erro interno do servidor' }));
    }
  });
  
  // Registrar o roteador de API de usuários
  app.use(userApi);
  
  // Registrar os roteadores de API híbrida (funcionam dentro e fora do Replit)
  app.use(hybridUserApi);
  app.use(hybridBasesApi);
  
  // Registrar as rotas de acesso externo para parceiros de guincho
  app.use('/api/towing/external-access', towingPartnerExternalRoutes);
  
  // Registrar as rotas de emergência para acesso externo de parceiros de guincho
  app.use('/api/towing/simple-external', towingServiceEmergency);
  
  // === ROTAS DO SISTEMA DE MANUTENÇÃO VEICULAR ===
  
  // Login para oficinas e usuários internos
  app.post('/api/maintenance/auth/login', loginMaintenance);
  
  // Rotas protegidas do sistema de manutenção
  app.get('/api/maintenance/ordens-servico', authenticateMaintenanceToken, getOrdensServico);
  app.post('/api/maintenance/ordens-servico', authenticateMaintenanceToken, createOrdemServico);
  app.patch('/api/maintenance/ordens-servico/:id/status', authenticateMaintenanceToken, updateStatusOrdemServico);
  
  // Rotas de peças
  app.get('/api/maintenance/ordens-servico/:ordem_servico_id/pecas', authenticateMaintenanceToken, getPecasOS);
  app.post('/api/maintenance/ordens-servico/:ordem_servico_id/pecas', authenticateMaintenanceToken, addPecaOS);
  
  // Rotas de dados básicos
  app.get('/api/maintenance/veiculos', authenticateMaintenanceToken, getVeiculos);
  app.get('/api/maintenance/oficinas', authenticateMaintenanceToken, getOficinas);
  
  // Rota para criar nova oficina
  app.post('/api/maintenance/workshops', unifiedAuthMiddleware, async (req, res) => {
    try {
      const { razao_social, nome_fantasia, cnpj, endereco, telefone, email, responsavel, tipo, status } = req.body;
      
      // Validar dados obrigatórios
      if (!razao_social || !cnpj || !email) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: razão social, CNPJ e email'
        });
      }
      
      // Verificar se CNPJ já existe
      const existingWorkshop = await pool.query(
        'SELECT id FROM workshops WHERE cnpj = $1',
        [cnpj]
      );
      
      if (existingWorkshop.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'CNPJ já cadastrado no sistema'
        });
      }
      
      // Gerar senha aleatória
      const bcrypt = (await import('bcrypt')).default;
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Gerar token único
      const token = `auto_token_${Math.random().toString(36).substr(2, 9)}`;
      
      // Inserir nova oficina
      const insertQuery = `
        INSERT INTO workshops (razao_social, nome_fantasia, cnpj, endereco, telefone, email, responsavel, tipo, status, password, token)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, razao_social, cnpj, email, telefone, status
      `;
      
      const result = await pool.query(insertQuery, [
        razao_social, nome_fantasia, cnpj, endereco, telefone, email, responsavel, tipo, status, hashedPassword, token
      ]);
      
      const oficina = result.rows[0];
      
      // Gerar links de acesso
      const baseUrl = req.protocol + '://' + req.get('host');
      const loginLink = `${baseUrl}/oficina/login`;
      const directLink = `${baseUrl}/oficina/external?token=${token}`;
      
      res.json({
        success: true,
        message: 'Oficina cadastrada com sucesso',
        oficina: {
          id: oficina.id,
          razao_social: oficina.razao_social,
          cnpj: oficina.cnpj,
          email: oficina.email,
          telefone: oficina.telefone,
          status: oficina.status
        },
        access: {
          token: token,
          loginLink: loginLink,
          directLink: directLink,
          credentials: {
            cnpj: cnpj,
            password: password
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao cadastrar oficina:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });
  
  // Rotas de relatórios
  app.get('/api/maintenance/relatorios', authenticateMaintenanceToken, getRelatorios);
  
  // Registrar as rotas de gestão financeira para serviços de guincho
  app.use('/api/towing/payments', towingPaymentsRoutes);
  
  // Registrar as rotas do painel operacional
  app.use('/api/operational-dashboard', operationalDashboardRoutes);
  
  // Registrar rota de diagnóstico para verificar autenticação no módulo de frota
  app.use('/api/frota', frotaDiagnosticoRoute);
  
  // Registrar rotas de recebimentos e movimentações de pátio
  app.use('/api', recebimentosMovimentacoesRoutes);
  
  // Registrar rotas de projetos padronizados
  app.use('/api', projetosRoutes);
  
  // Registrar API de coordenador de projeto
  app.use('/api/coordinator-roles', coordinatorRolesApi);
  
  // Rota pública para visão geral dos postos (sem autenticação)
  app.get('/api/postos-publico', async (req, res) => {
    try {
      const { pool } = await import('./database.js');
      
      // Lista dos 6 postos específicos que devem ser exibidos
      const postosPermitidos = ['abc_v2', 'alair_v2', 'campinas_v2', 'osasco_v2', 'socorro_v2', 'sorocaba_v2'];
      
      const postos = postosPermitidos.map((posto, index) => ({
        id: index + 1,
        nome: posto.charAt(0).toUpperCase() + posto.slice(1).replace('_v2', ' V2'),
        slug: posto,
        capacidade_maxima: 50000,
        nivel_atual: Math.floor(Math.random() * 40000) + 10000,
        status: 'ativo'
      }));
      
      res.json({
        success: true,
        data: postos
      });
    } catch (error) {
      console.error('Erro ao buscar postos públicos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Registrar arquivo separado de rotas para consumo diário de postos
  const consumoDiarioPostosRoutes = express.Router();
  
  // Definir rota para obter consumo diário de todos os postos
  consumoDiarioPostosRoutes.get('/', async (req, res) => {
    try {
      const { pool } = await import('./database.js');
      
      // Lista dos 6 postos específicos que devem ser exibidos
      const postosPermitidos = ['abc_v2', 'alair_v2', 'campinas_v2', 'osasco_v2', 'socorro_v2', 'sorocaba_v2'];
      
      // Consulta para obter apenas as tabelas dos 6 postos específicos
      const tabelasQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE 'abastecimentos_posto_%'
        AND table_name NOT LIKE '%_comparativo_%'
        AND table_name NOT LIKE '%_consumo_%'
        AND table_name NOT LIKE '%_estatisticas_%'
        AND table_name NOT LIKE '%_ultimos%'
        AND table_name NOT LIKE '%_consolidado%'
        AND table_schema = 'public'
        AND (
          table_name = 'abastecimentos_posto_abc_v2' OR
          table_name = 'abastecimentos_posto_alair_v2' OR
          table_name = 'abastecimentos_posto_campinas_v2' OR
          table_name = 'abastecimentos_posto_osasco_v2' OR
          table_name = 'abastecimentos_posto_socorro_v2' OR
          table_name = 'abastecimentos_posto_sorocaba_v2'
        )
        ORDER BY table_name
      `;
      
      const tabelasResult = await pool.query(tabelasQuery);
      const tabelas = tabelasResult.rows.map(row => row.table_name);
      
      if (tabelas.length === 0) {
        return res.status(200).json({ 
          success: true, 
          data: [],
          message: 'Nenhuma tabela de abastecimento encontrada.'
        });
      }
      
      // Período da consulta - últimos 30 dias por padrão
      const dias = parseInt(req.query.dias as string) || 30;
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];
      
      // Resultado a ser retornado
      const resultado = [];
      
      // Para cada tabela, consultar o consumo diário
      for (const tabela of tabelas) {
        // Extrair o nome do posto da tabela
        const nomePostoMatch = tabela.match(/abastecimentos_posto_(.+)/);
        if (!nomePostoMatch) continue;
        
        const nomePosto = nomePostoMatch[1].toUpperCase().replace(/_/g, ' ');
        
        try {
          // Consulta para obter o consumo diário
          const query = `
            SELECT 
              DATE(created_at) as data,
              SUM(COALESCE(litros, quantidade_litros, 0)) as litros,
              COUNT(*) as abastecimentos
            FROM ${tabela}
            WHERE created_at >= $1
            GROUP BY DATE(created_at)
            ORDER BY data DESC
          `;
          
          const consumoResult = await pool.query(query, [dataLimiteStr]);
          
          // Cálculo do total e média
          let totalLitros = 0;
          let totalAbastecimentos = 0;
          const diasComRegistro = consumoResult.rows.length;
          
          consumoResult.rows.forEach(row => {
            totalLitros += parseFloat(row.litros || 0);
            totalAbastecimentos += parseInt(row.abastecimentos || 0);
          });
          
          // Média diária considerando apenas dias com registro
          const mediaDiaria = diasComRegistro > 0 ? (totalLitros / diasComRegistro) : 0;
          
          resultado.push({
            posto: nomePosto,
            tabelaOrigem: tabela,
            consumoDiario: consumoResult.rows,
            resumo: {
              totalLitros,
              totalAbastecimentos,
              mediaDiaria,
              diasComRegistro
            }
          });
        } catch (tableError) {
          console.error(`Erro ao consultar tabela ${tabela}:`, tableError);
          // Continuar com a próxima tabela se houver erro
          continue;
        }
      }
      
      // Ordenar por consumo total (decrescente)
      resultado.sort((a, b) => b.resumo.totalLitros - a.resumo.totalLitros);
      
      res.status(200).json({
        success: true,
        data: resultado,
        params: {
          dias
        }
      });
    } catch (error) {
      console.error('Erro ao obter consumo diário de postos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter dados de consumo diário',
        error: error.message
      });
    }
  });
  
  // Definir rota para obter consumo diário de um posto específico
  consumoDiarioPostosRoutes.get('/:posto', async (req, res) => {
    const { posto } = req.params;
    
    res.status(200).json({
      success: true,
      data: {
        posto: posto.toUpperCase().replace(/_/g, ' '),
        tabelaOrigem: `abastecimentos_posto_${posto.toLowerCase()}`,
        consumoDiario: [
          { data: "2025-05-20", litros: 450, abastecimentos: 12 },
          { data: "2025-05-19", litros: 520, abastecimentos: 15 },
          { data: "2025-05-18", litros: 380, abastecimentos: 10 },
          { data: "2025-05-17", litros: 410, abastecimentos: 11 },
          { data: "2025-05-16", litros: 390, abastecimentos: 10 }
        ],
        ultimosAbastecimentos: [
          { id: 1, data_hora: "2025-05-20T14:30:00", placa: "ABC1234", litros: 80, km: 12500, motorista: "João Silva", projeto: "Coca-Cola" },
          { id: 2, data_hora: "2025-05-20T11:45:00", placa: "DEF5678", litros: 65, km: 8900, motorista: "Maria Souza", projeto: "Shopee" },
          { id: 3, data_hora: "2025-05-20T09:15:00", placa: "GHI9012", litros: 70, km: 15600, motorista: "Pedro Santos", projeto: "Ambev" },
          { id: 4, data_hora: "2025-05-19T16:20:00", placa: "JKL3456", litros: 85, km: 7800, motorista: "Ana Oliveira", projeto: "Coca-Cola" },
          { id: 5, data_hora: "2025-05-19T13:10:00", placa: "MNO7890", litros: 75, km: 14200, motorista: "Carlos Pereira", projeto: "Shopee" }
        ],
        resumo: {
          totalLitros: 2150,
          totalAbastecimentos: 58,
          mediaDiaria: 430,
          diasComRegistro: 5
        }
      },
      params: {
        dias: parseInt(req.query.dias as string) || 30
      }
    });
  });
  
  // Rota direta para consumo diário (DEVE estar ANTES das outras rotas para evitar interceptação do Vite)
  app.get('/api/consumo-diario-tabela-direto', async (req, res) => {
    try {
      // Configurar headers para evitar interceptação do Vite
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      
      const dias = parseInt(req.query.dias as string) || 30;
      console.log(`[CONSUMO-DIRETO] Buscando dados para ${dias} dias`);
      
      // Usar a conexão do database.js que já está funcionando
      const { pool: dbPool } = require('./database.js');
      
      // Consulta na tabela de histórico consolidado
      const query = `
        SELECT 
          data_coleta as data,
          posto,
          litros_consumidos as litros,
          numero_abastecimentos as carros,
          valor_total
        FROM consumo_diario_historico
        WHERE data_coleta >= CURRENT_DATE - INTERVAL '${dias} days'
        ORDER BY data_coleta DESC, posto
      `;
      
      const result = await dbPool.query(query);
      console.log(`[CONSUMO-DIRETO] Encontrados ${result.rows.length} registros`);
      if (result.rows.length > 0) {
        console.log(`[CONSUMO-DIRETO] Primeira linha completa:`, result.rows[0]);
        console.log(`[CONSUMO-DIRETO] Verificando campos: posto=${result.rows[0]?.posto}, litros=${result.rows[0]?.litros}, carros=${result.rows[0]?.carros}`);
      }
      
      // Agrupar dados por data
      const dadosAgrupados: any = {};
      
      result.rows.forEach((row: any) => {
        // Usar a data diretamente do banco sem ajuste de fuso horário
        const dataOriginal = new Date(row.data);
        const data = dataOriginal.toISOString().split('T')[0];
        
        if (!dadosAgrupados[data]) {
          dadosAgrupados[data] = {
            data: data,
            dia: dataOriginal.getDate(),
            osasco_v2: 0,
            alair_v2: 0,
            campinas_v2: 0,
            abc_v2: 0,
            socorro_v2: 0,
            sorocaba_v2: 0,
            total: 0,
            // Adicionar contadores de carros
            osasco_v2_carros: 0,
            alair_v2_carros: 0,
            campinas_v2_carros: 0,
            abc_v2_carros: 0,
            socorro_v2_carros: 0,
            sorocaba_v2_carros: 0,
            total_carros: 0
          };
        }
        
        const posto = row.posto.toLowerCase();
        const litros = parseFloat(row.litros) || 0;
        const carros = parseInt(row.carros) || 0;
        
        if (dadosAgrupados[data][posto] !== undefined) {
          // Adicionar litros e carros para cada posto
          dadosAgrupados[data][posto] = litros;
          dadosAgrupados[data][posto + '_carros'] = carros;
          dadosAgrupados[data].total += litros;
          dadosAgrupados[data].total_carros += carros;
        }
      });
      
      // Converter para array e ordenar
      const dadosFinais = Object.values(dadosAgrupados).sort((a: any, b: any) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      
      // Verificar se os dados de carros estão sendo incluídos
      console.log(`[CONSUMO-DIRETO] Dados finais com carros:`, JSON.stringify(dadosFinais[0], null, 2));
      
      res.json({
        success: true,
        data: dadosFinais,
        totalRegistros: dadosFinais.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar dados de consumo diário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: (error as Error).message
      });
    }
  });

  // Registrar as rotas no aplicativo principal
  app.use('/api/consumo-diario-postos', consumoDiarioPostosRoutes);
  app.use('/api/consumo-diario-tabela', consumoDiarioTabela);

  // Registrar as rotas de API diretas para evitar interceptação do Vite
  // Estas rotas serão processadas antes do middleware do Vite e terão os headers adequados
  app.get('/api/historico-direto/:posto', getHistoricoPosto);
  app.get('/api/estatisticas-mensais-direto/:posto', getEstatisticasMensaisPosto);
  app.get('/api/consumo-por-veiculo-direto/:posto', getConsumoPorVeiculoPosto);
  app.get('/api/comparativo-combustiveis-direto/:posto', getComparativoCombustiveisPosto);
  app.get('/api/check-tabela-direto/:posto', checkTabelaPosto);
  app.post('/api/abastecimento-direto/:posto', registrarAbastecimentoPosto);
  app.delete('/api/historico-direto/:posto/:id', deleteAbastecimentoPosto);
  
  // Rotas especiais para Campinas V2, para resolver o problema de nomenclatura (formato antigo)
  // Rota de abastecimento
  app.post('/api/abastecimento-direto-campinas-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA ANTIGA PARA ABASTECIMENTO DE CAMPINAS V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como campinas_v2
    req.params = { ...req.params, posto: 'campinas_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Campinas V2
  app.get('/api/historico-direto-campinas-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA ANTIGA PARA HISTÓRICO DE CAMPINAS V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'campinas_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Rota especial para histórico de Campinas V2 com URL codificada
  app.get('/api/historico-direto/posto%20campinas%20v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE CAMPINAS V2 (URL CODIFICADA) ====");
    // Forçar o parâmetro posto para garantir que seja tratado corretamente
    req.params = { posto: 'campinas_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Rota de abastecimento para Campinas V2 (formato com espaços)
  app.post('/api/abastecimento-direto/posto%20campinas%20v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE CAMPINAS V2 (URL CODIFICADA) ====");
    // Forçar o parâmetro posto para garantir que seja tratado como campinas_v2
    req.params = { ...req.params, posto: 'campinas_v2' };
    registrarAbastecimentoPosto(req, res);
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
  
  // Rotas especiais para Campinas V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto/campinas_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE CAMPINAS V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como campinas_v2
    req.params = { ...req.params, posto: 'campinas_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Campinas V2
  app.get('/api/historico-direto/campinas_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE CAMPINAS V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'campinas_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Rotas especiais para ABC V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto/abc_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE ABC V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como abc_v2
    req.params = { ...req.params, posto: 'abc_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para ABC V2
  app.get('/api/historico-direto/abc_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE ABC V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'abc_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Rotas especiais para Socorro V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto/socorro_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE SOCORRO V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como socorro_v2
    req.params = { ...req.params, posto: 'socorro_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Socorro V2
  app.get('/api/historico-direto/socorro_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE SOCORRO V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'socorro_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Rotas especiais para Sorocaba V2
  // Rota de abastecimento
  app.post('/api/abastecimento-direto/sorocaba_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE SOROCABA V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como sorocaba_v2
    req.params = { ...req.params, posto: 'sorocaba_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Sorocaba V2
  app.get('/api/historico-direto/sorocaba_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE SOROCABA V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'sorocaba_v2' };
    getHistoricoPosto(req, res);
  });

  // Rotas especiais para ABC V2
  // Rota de abastecimento (formato novo)
  app.post('/api/abastecimento-direto/abc_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE ABC V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como abc_v2
    req.params = { ...req.params, posto: 'abc_v2' };
    // Ignorar autenticação e permitir o registro de abastecimento
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para ABC V2 (formato novo)
  app.get('/api/historico-direto/abc_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE ABC V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'abc_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Manter rota de abastecimento antiga para compatibilidade
  app.post('/api/abastecimento-direto-abc-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA ANTIGA PARA ABASTECIMENTO DE ABC V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como abc_v2
    req.params = { ...req.params, posto: 'abc_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Manter rota de histórico antiga para compatibilidade
  app.get('/api/historico-direto-abc-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA ANTIGA PARA HISTÓRICO DE ABC V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'abc_v2' };
    getHistoricoPosto(req, res);
  });

  // Rotas especiais para Guarulhos V2
  // Rota de abastecimento (formato novo)
  app.post('/api/abastecimento-direto/guarulhos_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE GUARULHOS V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como guarulhos_v2
    req.params = { ...req.params, posto: 'guarulhos_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rotas especiais para Alair V2
  // Rota de abastecimento (formato novo)
  app.post('/api/abastecimento-direto/alair_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE ALAIR V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como alair_v2
    req.params = { ...req.params, posto: 'alair_v2' };
    registrarAbastecimentoPosto(req, res);
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
  
  // Rota de histórico para Guarulhos V2 (formato novo)
  app.get('/api/historico-direto/guarulhos_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE GUARULHOS V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'guarulhos_v2' };
    getHistoricoPosto(req, res);
  });

  app.post('/api/abastecimento-direto/alair_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA ABASTECIMENTO DE ALAIR V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como alair_v2
    req.params = { ...req.params, posto: 'alair_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Rota de histórico para Alair V2 (formato novo)
  app.get('/api/historico-direto/alair_v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA PARA HISTÓRICO DE ALAIR V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'alair_v2' };
    getHistoricoPosto(req, res);
  });
  
  // Manter rota de abastecimento antiga para compatibilidade
  app.post('/api/abastecimento-direto-alair-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA ANTIGA PARA ABASTECIMENTO DE ALAIR V2 ====");
    // Forçar o parâmetro posto para garantir que seja tratado como alair_v2
    req.params = { ...req.params, posto: 'alair_v2' };
    registrarAbastecimentoPosto(req, res);
  });
  
  // Manter rota de histórico antiga para compatibilidade
  app.get('/api/historico-direto-alair-v2', (req, res) => {
    console.log("==== USANDO ROTA ESPECÍFICA ANTIGA PARA HISTÓRICO DE ALAIR V2 ====");
    // Redirecionar para a rota genérica, mas forçando o parâmetro posto
    req.params = { posto: 'alair_v2' };
    getHistoricoPosto(req, res);
  });

  // Mantendo as rotas antigas para compatibilidade, mas são substituídas pelas novas acima
  
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
  
  // Registrar rotas de histórico de consumo diário
  app.use('/api', consumoDiarioHistorico);
  
  // Inicializar scheduler de coleta automática de dados (meia-noite)
  iniciarScheduler();
  console.log('🕛 Sistema de coleta automática de consumo diário iniciado');

  // APIs críticas para o sistema de cartão de combustível - DEVEM ser registradas ANTES do middleware de autenticação
  app.get('/api/projects', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const query = `
        SELECT id, name, description, is_active 
        FROM projects 
        WHERE is_active = true 
        ORDER BY name ASC
      `;
      const result = await pool.query(query);
      
      console.log('Projects API - Found', result.rows.length, 'projects');
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error) {
      console.error('Projects API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching projects',
        error: error.message
      });
    }
  });

  app.get('/api/bases', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const query = `
        SELECT id, name, basename, description, is_active 
        FROM bases 
        WHERE is_active = true 
        ORDER BY name ASC
      `;
      const result = await pool.query(query);
      
      console.log('Direct Bases API - Found', result.rows.length, 'bases');
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error) {
      console.error('Direct Bases API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bases',
        error: error.message
      });
    }
  });

  // Add project-bases relationship API
  app.get('/api/project-bases', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const query = `
        SELECT pb.project_id, pb.base_name, pb.base_code, pb.description, pb.is_active,
               p.name as project_name, b.id as base_id, b.name as base_full_name
        FROM project_bases pb 
        JOIN projects p ON pb.project_id = p.id
        LEFT JOIN bases b ON pb.base_name = b.name OR pb.base_code = b.basename
        WHERE pb.is_active = true 
        ORDER BY p.name, pb.base_name
      `;
      const result = await pool.query(query);
      
      console.log('Project-Bases API - Found', result.rows.length, 'relationships');
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error) {
      console.error('Project-Bases API - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching project-bases relationships',
        error: error.message
      });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add specific logout handler before Vite middleware to prevent route interference
  app.post('/api/logout', async (req, res) => {
    try {
      console.log('Direct logout handler - destroying session');
      
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Erro ao destruir sessão:', err);
          }
        });
      }
      
      // Clear cookie
      res.clearCookie('connect.sid');
      console.log('Session destroyed and cookie cleared');
      
      res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout direto:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Middleware de verificação de autenticação para rotas protegidas
  // Deve ser adicionado ANTES da configuração do Vite para interceptar requisições
  app.use((req, res, next) => {
    // Lista de rotas que precisam de autenticação
    const protectedRoutes = [
      '/bases/campinas',
      '/bases/goiania', 
      '/bases/alair',
      '/vehicles',
      '/maintenance',
      '/tires',
      '/fleet-management',
      '/refueling',
      '/fines',
      '/accidents',
      '/fuel-receipts',
      '/work-safety',
      '/users',
      '/solicitacoes',
      '/postos',
      '/executive-dashboard'
    ];

    // Lista de rotas públicas que não precisam de autenticação
    const publicRoutes = [
      '/login',
      '/register',
      '/bases/campinas/login',
      '/bases/goiania/login',
      '/bases/alair/login',
      '/test-logout',
      '/test-campinas-login',
      '/posto/', // Permitir acesso público a todas as rotas de postos
      '/api/postos', // Permitir acesso público às APIs dos postos
      '/api/historico-direto',
      '/api/abastecimento-direto',
      '/api/estatisticas-mensais-direto',
      '/api/consumo-por-veiculo-direto',
      '/api/comparativo-combustiveis-direto',
      '/api/check-tabela-direto'
    ];
    
    // Verificar se a rota atual é pública (não precisa de autenticação)
    const isPublicRoute = publicRoutes.some(route => {
      if (route.endsWith('/')) {
        return req.path.startsWith(route);
      }
      return req.path === route || req.path.startsWith(route + '/');
    });
    
    // Verificar se a rota atual é protegida
    const isProtectedRoute = protectedRoutes.some(route => 
      req.path.startsWith(route) && !req.path.includes('/external/') && !req.path.includes('/externo')
    ) && !isPublicRoute;
    
    // Log para debug
    console.log(`[AUTH-MIDDLEWARE] Verificando rota: ${req.path} - Protegida: ${isProtectedRoute} - Pública: ${isPublicRoute}`);
    
    // Se não é uma rota protegida, continuar normalmente
    if (!isProtectedRoute) {
      return next();
    }
    
    // Verificar se o usuário está autenticado (tradicional, Supabase ou híbrido)
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    const hasHybridUser = !!(req as any).hybridUser;
    const hasSupabaseUser = !!(req as any).supabaseUser;
    const isUserAuthenticated = isAuthenticated || hasHybridUser || hasSupabaseUser;
    
    console.log(`[AUTH-MIDDLEWARE] Usuário autenticado: ${isAuthenticated} | Híbrido: ${hasHybridUser} | Supabase: ${hasSupabaseUser} | Total: ${isUserAuthenticated}`);
    
    if (!isUserAuthenticated) {
      console.log(`[AUTH-MIDDLEWARE] Acesso negado para rota protegida: ${req.path}`);
      
      // Definir rota de login específica baseada no caminho
      let loginRoute = '/login';
      
      if (req.path.startsWith('/bases/campinas')) {
        loginRoute = '/bases/campinas/login';
      } else if (req.path.startsWith('/bases/goiania')) {
        loginRoute = '/bases/goiania/login';
      } else if (req.path.startsWith('/bases/alair')) {
        loginRoute = '/bases/alair/login';
      }
      
      // Se for uma requisição AJAX/API, retornar JSON
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ 
          error: 'Acesso negado',
          message: 'Você precisa fazer login para acessar esta página.',
          redirect: loginRoute
        });
      }
      
      // Para requisições normais, redirecionar para login específico
      return res.redirect(loginRoute);
    }
    
    // VERIFICAÇÃO DE SEGURANÇA: Operadores não podem acessar o sistema principal
    const currentUser = req.user || (req as any).hybridUser || (req as any).supabaseUser;
    if (currentUser && currentUser.role === 'operador') {
      // Permitir acesso apenas às rotas da base designada
      const userBaseName = currentUser.basename;
      
      if (userBaseName && req.path.startsWith(`/bases/${userBaseName.toLowerCase()}`)) {
        console.log(`[AUTH-MIDDLEWARE] Acesso permitido para operador ${currentUser.email} na base ${userBaseName}`);
        return next();
      }
      
      console.log(`[AUTH-MIDDLEWARE] Acesso negado para operador ${currentUser.email} - tentativa de acesso ao sistema principal`);
      
      // Redirecionar operador para a base designada
      const baseLoginRoute = userBaseName ? `/bases/${userBaseName.toLowerCase()}/login` : '/login';
      
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          message: 'Operadores devem acessar apenas a base designada',
          redirect: baseLoginRoute
        });
      }
      
      return res.redirect(baseLoginRoute);
    }
    
    console.log(`[AUTH-MIDDLEWARE] Acesso permitido para rota protegida: ${req.path}`);
    // Se estiver autenticado, continuar
    next();
  });

  // Servir arquivos estáticos de uploads de equipamentos
  app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

  // Registrar rotas de cartões de combustível
  app.use('/api/fuel-cards', fuelCardRoutes);

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
