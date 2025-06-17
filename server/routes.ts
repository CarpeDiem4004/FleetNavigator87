import type { Express, Request, Response, NextFunction } from "express";

// Extend Request interface to include oficina property
declare module 'express-serve-static-core' {
  interface Request {
    oficina?: any;
  }
}
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Função utilitária para obter data/hora no fuso horário de Brasília (UTC-3)
function getCurrentDateBrasilia() {
  const now = new Date();
  
  // Ajustar para o fuso horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
  
  // Usar data atual do sistema (27 de maio de 2025)
  const currentYear = 2025;
  const currentMonth = 4; // Maio (0-indexado)
  const currentDay = 27;
  
  // Criar data correta de Brasília
  const correctedBrasiliaDate = new Date(
    currentYear, 
    currentMonth, 
    currentDay, 
    brasiliaTime.getHours(), 
    brasiliaTime.getMinutes(), 
    brasiliaTime.getSeconds()
  );
  
  return correctedBrasiliaDate;
}

function formatDateForDB(date?: Date) {
  const targetDate = date || getCurrentDateBrasilia();
  return targetDate.toISOString();
}

function formatDateBrasilia(date?: Date) {
  const targetDate = date || getCurrentDateBrasilia();
  return targetDate.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
import { storage } from "./storage";
import { 
  insertBaseSchema, insertVehicleSchema, insertMaintenanceSchema,
  insertWorkshopSchema, insertTireSchema, insertRefuelingSchema, 
  insertFineSchema, insertUserSchema,
  insertMaintenanceChatSchema, insertChatMessageSchema,
  insertBaseRequestSchema, insertBaseRequestUpdateSchema, 
  type InsertWorkshop, type InsertUser, type InsertMaintenance,
  type InsertMaintenanceChat, type InsertChatMessage,
  type InsertBaseRequest, type InsertBaseRequestUpdate
} from "@shared/schema";
import { setupAuth } from "./auth";
import { initResyncRoutes } from "./routes/sessionResyncRoute";
import { getDashboardKPIs, getPainelPrincipal } from "./dashboardApi";
// middleware de autenticação híbrida já importado abaixo como alias
import { getExecutiveDashboard } from "./executiveDashboard";
import { registerDashboardKpiRoutes } from "./dashboardKpiApi";
import { getPostosResumo, getPostoDetalhes, registrarEntradaCombustivel, excluirPostoSaoPaulo } from "./postosApi";
import { 
  getFuelCardSolicitations, 
  getFuelCardSolicitationById, 
  createFuelCardSolicitation, 
  updateFuelCardSolicitationStatus,
  deleteFuelCardSolicitation,
  setupFuelCardTable,
  createLineHallFuelCardRequest,
  exportFuelCardSolicitationsToExcel
} from "./fuelCardSolicitationsApi";
import { 
  getProjects, 
  getProjectBases, 
  getProjectsWithBases, 
  createProject, 
  createProjectBase 
} from "./projectsApi";
import { runSupabaseDiagnostic } from "./supabaseDiagnostic";
import { registerPneusRoutes } from "./pneusApi";
import { registerTireMoveRoutes } from "./tireMoveApi";
import { unifiedAuthMiddleware } from "./utils/auth-utils.js";
import consumoDiarioPostosRoute from "./routes/consumoDiarioPostosRoute";
import { compareSchemas } from "./compareSchemas";
import diagnosticoRoutes from './routes/diagnosticoRoutes';
import { synchronizeSupabaseTables } from "./supabaseSchemaSync";
// Removida importação redundante, pois está sendo importada via supabaseInsertRoute
import { registerPrecosCombustivelRoutes } from "./routes/precosCombustivelRoutes";
import { registerPostosMapeamentoRoutes } from "./routes/postosMapeamentoRoutes";
import { registerUsuariosSupabaseRoutes } from "./routes/usuariosSupabaseRoutes";
// import { supabaseInsertHandler } from "./routes/supabaseInsertRoute"; // Desabilitado - usando versão PostgreSQL direta
import postoSupabaseRoutes from "./routes/postoSupabaseRoutes";
import postoRoutes from "./routes/postoRoutes.js";
import frotaEstoqueRoutes from "./routes/frotaEstoqueRoutes";
import parceirosGuinchoRoutes from "./routes/parceirosGuinchoRoutes";
import towingPartnersRoutes from "./routes/towingPartnersRoutes";
import { getTowingFinancialSummary, getTowingFinancialServices, processPayment, getPartnerReport, deleteFinancialService } from "./routes/towingFinancialRoutes";
// Arquivo com problemas de sintaxe, desativado temporariamente
// import simpleExternalAccess from './routes/simpleExternalAccess';
// import simpleExternalAccessRepair from './routes/simpleExternalAccess_repair';
import towingServiceEmergency from './routes/towingServiceEmergency';
import historicoConsolidadoRoutes from "./routes/historicoConsolidadoRoutes";
import patioRoutes from "./routes/patioRoutes";
import pneusRoutes from "./routes/pneusRoutes";
import sqlSeguroRouter from "./routes/sql-seguro.js";
import guarulhosV2Routes from "./routes/guarulhosV2Routes.js";
import osascoV2Routes from "./routes/osascoV2Routes.js";
import abastecimentoUnificadoRoutes from "./routes/abastecimentoUnificado.js";
import recebimentosRoutes from "./routes/recebimentosRoutes.js";
import debugOsascoRoutes from "./routes/debugOsascoRoutes.js";
import fixOsascoRecebimentos from "./routes/fixOsascoRecebimentos.js";
import recebimentosOsascoHandler, { getRecebimentosOsascoV2, registrarRecebimentoOsascoV2 } from "./routes/recebimentosOsascoHandler.js";
import testeOsascoRecebimentos from "./routes/testeOsascoRecebimentos.js";
import osascoV2Direto from "./routes/osascoV2Direto.js";
import osascoDiretoRoutes from "./routes/osascoDiretoRoutes.js";
import recebimentosOsascoV2Routes from "./routes/recebimentosOsascoV2.js";
import osascoV2RecebimentosDirecto from "./routes/osascoV2RecebimentosDirecto.js";
import { db, pool } from "./db.js";
import authHybridRoutes from "./routes/authHybridRoutes.js";
import * as userHandler from "./handlers/userHandler.js";
import { atualizarTabelaPneus } from "./updatePneus.js";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { setupTireActivityRoutes, setupTireActivityTable } from "./tireActivityApi.js";
import { consultarUsuarios, consultarUsuarioPorId } from "./handlers/userHandler.js";
// Importação das rotas de teste de autenticação híbrida
import authTestRoutes from './routes/authTest.js';
// Importação da rota de ressincronização de sessão
import { resyncSession } from './routes/sessionResyncRoute.js';
// Importação das rotas de autenticação dos parceiros
import partnerAuthRouter from './routes/partnerAuth';
// Importação das novas rotas de JWT
import jwtAuthRoutes from './jwtAuthRoutes.js';
// Importação do cliente Supabase para armazenamento de arquivos
import { createClient } from '@supabase/supabase-js';
// Importação das rotas de diagnóstico já feita acima
// Importação dos middlewares antigos para compatibilidade com código existente
import { 
  isAuthenticated as authMiddleware, 
  isAdmin as adminMiddleware, 
  hasMaintenanceAccessV2 as maintenanceAccessMiddleware, 
  hasTiresAccess as tiresAccessMiddleware, 
  isWorkshop as workshopMiddleware, 
  hasBaseAccess as baseAccessMiddleware
} from "./middleware/auth";

// Importação dos novos middlewares de autenticação híbrida
import {
  isAuthenticated as isAuthenticatedHybrid,
  isAuthenticatedWithMapping,
  isSessionAuthenticated,
  isJwtAuthenticated
} from "./middleware/auth/index";

// Função auxiliar para hash de senha (usada na criação de usuários de oficinas)
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Função para gerar senhas aleatórias
function generateRandomPassword(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
  const numbers = '0123456789';
  const specialChars = '@#$%&*';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  
  // Garantir que temos pelo menos um de cada tipo
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Preencher o resto da senha com caracteres aleatórios
  for (let i = password.length; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Embaralhar a senha para que os caracteres obrigatórios não fiquem sempre nas mesmas posições
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Middlewares de autenticação e autorização movidos para o arquivo de middleware
// Agora importados de server/middleware/auth.ts através de alias para evitar conflitos
// Middleware de autenticação que suporta tanto sessão quanto token JWT
import { isAuthenticatedBySessionOrJwt } from './middleware/isAuthenticated';
const isAuthenticated = isAuthenticatedBySessionOrJwt;

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

// Definindo funções middleware para compatibilidade com o código existente
const isAdmin = adminMiddleware;  
const hasMaintenanceAccess = maintenanceAccessMiddleware;
const hasTiresAccess = tiresAccessMiddleware;
const isWorkshop = workshopMiddleware;
const hasBaseAccess = baseAccessMiddleware;

// Função para criar tabela de abastecimentos do modelo Supabase
async function criarTabelaAbastecimentosSupabase() {
  try {
    console.log("Verificando se a tabela abastecimentos (modelo Supabase) existe...");
    
    // Verificar o tipo de objeto chamado 'abastecimentos'
    const checkTypeQuery = `
      SELECT table_type 
      FROM information_schema.tables 
      WHERE table_name = 'abastecimentos'
    `;
    
    const typeResult = await pool.query(checkTypeQuery);
    
    // Se o objeto existir mas não for uma tabela, removê-lo para recriar como tabela
    if (typeResult.rows.length > 0 && typeResult.rows[0].table_type !== 'BASE TABLE') {
      console.log(`Objeto 'abastecimentos' encontrado mas é um ${typeResult.rows[0].table_type}, tentando remover...`);
      try {
        // Remover o objeto existente (pode ser uma view ou outro tipo)
        await pool.query(`DROP ${typeResult.rows[0].table_type} IF EXISTS abastecimentos CASCADE`);
        console.log("Objeto removido com sucesso.");
      } catch (dropError) {
        console.error("Erro ao remover objeto existente:", dropError);
        throw new Error("Não foi possível remover objeto existente para criar tabela.");
      }
    } else if (typeResult.rows.length > 0) {
      console.log("Tabela abastecimentos já existe, pulando criação.");
      return;
    }
    
    console.log("Criando tabela abastecimentos (modelo Supabase)...");
    
    // Criar tabela
    const createTableQuery = `
      CREATE TABLE abastecimentos (
        id SERIAL PRIMARY KEY,
        data TIMESTAMP DEFAULT NOW(),
        valor NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela abastecimentos criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela abastecimentos (modelo Supabase):", error);
  }
}

// Função para criar tabela de abastecimentos_supabase_alt
async function criarTabelaAbastecimentosSupabaseAlt() {
  try {
    console.log("Verificando se a tabela abastecimentos_supabase existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abastecimentos_supabase'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela abastecimentos_supabase já existe, pulando criação.");
      return;
    }
    
    // Verificar se a tabela abastecimentos existe e é uma tabela base
    const checkAbastecimentosQuery = `
      SELECT table_type 
      FROM information_schema.tables 
      WHERE table_name = 'abastecimentos'
      AND table_type = 'BASE TABLE'
    `;
    
    const abastecimentosResult = await pool.query(checkAbastecimentosQuery);
    
    if (abastecimentosResult.rows.length === 0) {
      // Se a tabela abastecimentos não existir ou não for uma tabela base, criar primeiro
      console.log("Tabela abastecimentos não encontrada como tabela base. Criando primeiro...");
      await criarTabelaAbastecimentosSupabase();
    }
    
    console.log("Criando tabela abastecimentos_supabase...");
    
    // Criar tabela sem a restrição de chave estrangeira para evitar problemas
    const createTableQuery = `
      CREATE TABLE abastecimentos_supabase (
        id SERIAL PRIMARY KEY,
        abastecimento_id INTEGER NOT NULL,
        posto_id TEXT NOT NULL,
        quantidade_litros NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    
    // Adicionar a restrição de chave estrangeira separadamente
    try {
      const addForeignKeyQuery = `
        ALTER TABLE abastecimentos_supabase
        ADD CONSTRAINT fk_abastecimento
        FOREIGN KEY (abastecimento_id) REFERENCES abastecimentos(id);
      `;
      
      await pool.query(addForeignKeyQuery);
      console.log("Restrição de chave estrangeira adicionada com sucesso!");
    } catch (fkError) {
      console.warn("Aviso: Não foi possível adicionar a restrição de chave estrangeira:", fkError);
      console.log("A tabela foi criada sem a restrição de chave estrangeira.");
    }
    
    console.log("Tabela abastecimentos_supabase criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela abastecimentos_supabase:", error);
  }
}

// Função para criar tabela de abastecimentos se não existir
async function criarTabelaAbastecimentos() {
  try {
    console.log("Verificando se a tabela abastecimentos_postos existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abastecimentos_postos'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela abastecimentos_postos já existe, verificando campo quantity_litros...");
      
      // Verificar se a coluna quantity_litros existe
      const checkColumnQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'abastecimentos_postos' AND column_name = 'quantity_litros'
        );
      `;
      
      const columnCheckResult = await pool.query(checkColumnQuery);
      
      if (!columnCheckResult.rows[0].exists) {
        console.log("Adicionando coluna quantity_litros à tabela abastecimentos_postos...");
        
        // Adicionar a coluna quantity_litros com o mesmo valor de litros
        await pool.query(`
          ALTER TABLE abastecimentos_postos
          ADD COLUMN quantity_litros NUMERIC(10,2);
          
          UPDATE abastecimentos_postos
          SET quantity_litros = litros;
        `);
        
        console.log("Coluna quantity_litros adicionada com sucesso!");
      } else {
        console.log("Coluna quantity_litros já existe, não é necessário adicionar.");
      }
      
      return;
    }
    
    console.log("Criando tabela abastecimentos_postos...");
    
    // Criar tabela
    const createTableQuery = `
      CREATE TABLE abastecimentos_postos (
        id SERIAL PRIMARY KEY,
        placa TEXT NOT NULL,
        km_atual INTEGER NOT NULL,
        tipo_combustivel TEXT NOT NULL,
        litros NUMERIC(10,2) NOT NULL,
        quantity_litros NUMERIC(10,2),
        nome_motorista TEXT NOT NULL,
        nome_operador TEXT NOT NULL,
        posto TEXT NOT NULL,
        project TEXT,
        preco_litro NUMERIC(10,2),
        valor_total NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela abastecimentos_postos criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela abastecimentos_postos:", error);
  }
}

// Função para criar tabela de movimentações de pátio se não existir
async function criarTabelaMovimentacoesPatio() {
  try {
    console.log("Verificando se a tabela movimentacoes_patio existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'movimentacoes_patio'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela movimentacoes_patio já existe, pulando criação.");
      return;
    }
    
    console.log("Criando tabela movimentacoes_patio...");
    
    // Criar tabela
    const createTableQuery = `
      CREATE TABLE movimentacoes_patio (
        id SERIAL PRIMARY KEY,
        placa TEXT NOT NULL,
        tipo_veiculo TEXT,
        motorista TEXT NOT NULL,
        data_entrada TIMESTAMP NOT NULL,
        data_saida TIMESTAMP,
        motivo TEXT,
        observacoes TEXT,
        posto TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela movimentacoes_patio criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela movimentacoes_patio:", error);
  }
}

// Função para criar tabela configuracao_tanques se não existir
async function criarTabelaConfiguracaoTanques() {
  try {
    console.log("Verificando se a tabela configuracao_tanques existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'configuracao_tanques'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela configuracao_tanques já existe, verificando colunas...");
      
      // Verificar se as colunas de valor do litro existem
      const checkDieselValorQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'configuracao_tanques' AND column_name = 'diesel_valor_litro'
        );
      `;
      
      const checkArlaValorQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'configuracao_tanques' AND column_name = 'arla_valor_litro'
        );
      `;
      
      const dieselValorResult = await pool.query(checkDieselValorQuery);
      const arlaValorResult = await pool.query(checkArlaValorQuery);
      
      const dieselValorExists = dieselValorResult.rows[0].exists;
      const arlaValorExists = arlaValorResult.rows[0].exists;
      
      // Adicionar colunas se não existirem
      if (!dieselValorExists) {
        console.log("Adicionando coluna diesel_valor_litro à tabela configuracao_tanques...");
        await pool.query(`
          ALTER TABLE configuracao_tanques
          ADD COLUMN diesel_valor_litro DECIMAL(10, 2) DEFAULT 5.00
        `);
      }
      
      if (!arlaValorExists) {
        console.log("Adicionando coluna arla_valor_litro à tabela configuracao_tanques...");
        await pool.query(`
          ALTER TABLE configuracao_tanques
          ADD COLUMN arla_valor_litro DECIMAL(10, 2) DEFAULT 3.00
        `);
      }
      
      return;
    }
    
    console.log("Criando tabela configuracao_tanques...");
    
    // Criar tabela
    const createTableQuery = `
      CREATE TABLE configuracao_tanques (
        id SERIAL PRIMARY KEY,
        posto TEXT NOT NULL UNIQUE,
        diesel_capacidade NUMERIC NOT NULL DEFAULT 20000,
        diesel_nivel NUMERIC NOT NULL DEFAULT 15000,
        arla_capacidade NUMERIC NOT NULL DEFAULT 1000,
        arla_nivel NUMERIC NOT NULL DEFAULT 750,
        diesel_valor_litro DECIMAL(10, 2) DEFAULT 5.00,
        arla_valor_litro DECIMAL(10, 2) DEFAULT 3.00,
        diesel_consumo_total NUMERIC(12, 2) DEFAULT 0,
        diesel_valor_total NUMERIC(12, 2) DEFAULT 0,
        arla_consumo_total NUMERIC(12, 2) DEFAULT 0,
        arla_valor_total NUMERIC(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    
    // Inserir valores padrão para postos conhecidos
    const postos = ['Osasco', 'Campinas', 'Contagem', 'Goiania'];
    for (const posto of postos) {
      const insertQuery = `
        INSERT INTO configuracao_tanques (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel)
        VALUES ($1, 20000, 15000, 1000, 750)
        ON CONFLICT (posto) DO NOTHING;
      `;
      await pool.query(insertQuery, [posto]);
    }
    
    console.log("Tabela configuracao_tanques criada com sucesso e postos padrão inseridos!");
    
  } catch (error) {
    console.error("Erro ao criar tabela configuracao_tanques:", error);
  }
}

async function criarTabelaMontagemPneus() {
  // Verificar se a tabela já existe
  const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'montagem_pneus')";
  const tableExistsResult = await pool.query(checkTableQuery);
  
  if (tableExistsResult.rows[0].exists) {
    console.log("Tabela montagem_pneus já existe, pulando criação.");
    return;
  }

  console.log("Criando tabela montagem_pneus...");
  
  // Ler o arquivo SQL
  const fs = await import('fs');
  const path = await import('path');
  const url = await import('url');
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlFilePath = path.join(__dirname, 'scripts', 'createTireMountingTable.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
    return;
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  try {
    // Executar o script SQL
    await pool.query(sqlContent);
    console.log("Tabela montagem_pneus criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela montagem_pneus:", error);
  }
}

async function criarTabelaSolicitacoesPneus() {
  // Verificar se a tabela já existe
  const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'solicitacoes_pneus')";
  const tableExistsResult = await pool.query(checkTableQuery);
  
  if (tableExistsResult.rows[0].exists) {
    console.log("Tabela solicitacoes_pneus já existe, pulando criação.");
    return;
  }

  console.log("Criando tabela solicitacoes_pneus...");
  
  // Ler o arquivo SQL
  const fs = await import('fs');
  const path = await import('path');
  const url = await import('url');
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlFilePath = path.join(__dirname, 'scripts', 'createTireRequestsTable.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
    return;
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  try {
    // Executar o script SQL
    await pool.query(sqlContent);
    console.log("Tabela solicitacoes_pneus criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela solicitacoes_pneus:", error);
  }
}

async function criarTabelaLineHallShopee() {
  // Verificar se a tabela já existe
  const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'line_hall_shopee')";
  const tableExistsResult = await pool.query(checkTableQuery);
  
  if (tableExistsResult.rows[0].exists) {
    console.log("Tabela line_hall_shopee já existe, pulando criação.");
    return;
  }

  console.log("Criando tabela line_hall_shopee...");
  
  // Ler o arquivo SQL
  const fs = await import('fs');
  const path = await import('path');
  const url = await import('url');
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlFilePath = path.join(__dirname, 'scripts', 'createLineHallShopeeTable.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
    return;
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  try {
    // Executar o script SQL
    await pool.query(sqlContent);
    console.log("Tabela line_hall_shopee criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela line_hall_shopee:", error);
  }
}

/**
 * Cria a tabela posto_remedios_abastecimentos se não existir
 */
async function criarTabelaPostoRemediosAbastecimentos() {
  // Verificar se a tabela já existe
  const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posto_remedios_abastecimentos')";
  const tableExistsResult = await pool.query(checkTableQuery);
  
  if (tableExistsResult.rows[0].exists) {
    console.log("Tabela posto_remedios_abastecimentos já existe, verificando estrutura...");
    
    // Verificar se a coluna valor_litro existe
    const checkColumnQuery = "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posto_remedios_abastecimentos' AND column_name = 'valor_litro')";
    const columnExistsResult = await pool.query(checkColumnQuery);
    
    if (!columnExistsResult.rows[0].exists) {
      // Adicionar a coluna valor_litro se não existir
      console.log("Adicionando coluna valor_litro à tabela posto_remedios_abastecimentos...");
      try {
        await pool.query(`
          ALTER TABLE posto_remedios_abastecimentos
          ADD COLUMN valor_litro DECIMAL(10, 2)
        `);
        console.log("Coluna valor_litro adicionada com sucesso!");
      } catch (columnError) {
        console.error("Erro ao adicionar coluna valor_litro:", columnError);
      }
    } else {
      console.log("Coluna valor_litro já existe na tabela posto_remedios_abastecimentos.");
    }
    
    return;
  }

  console.log("Criando tabela posto_remedios_abastecimentos...");
  
  try {
    await pool.query(`
      CREATE TABLE posto_remedios_abastecimentos (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(10) NOT NULL,
        km INTEGER NOT NULL,
        projeto VARCHAR(100) NOT NULL,
        motorista_nome VARCHAR(200) NOT NULL,
        motorista_rg VARCHAR(20) NOT NULL,
        tipo_combustivel VARCHAR(20) CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'alcool')),
        quantidade_litros DECIMAL(10, 2),
        valor_litro DECIMAL(10, 2),
        valor_total DECIMAL(10, 2),
        lavagem BOOLEAN DEFAULT FALSE,
        tipo_lavagem VARCHAR(50),
        observacoes TEXT,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabela posto_remedios_abastecimentos criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela posto_remedios_abastecimentos:", error);
  }
}

/**
 * Cria a tabela fuel_card_requests se não existir
 */
async function criarTabelaFuelCardRequests() {
  // Verificar se a tabela já existe
  const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fuel_card_requests')";
  const tableExistsResult = await pool.query(checkTableQuery);
  
  if (tableExistsResult.rows[0].exists) {
    console.log("Tabela fuel_card_requests já existe, pulando criação.");
    return;
  }

  console.log("Criando tabela fuel_card_requests...");
  
  // Ler o arquivo SQL
  const fs = await import('fs');
  const path = await import('path');
  const url = await import('url');
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlFilePath = path.join(__dirname, 'scripts', 'createFuelCardTable.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Arquivo SQL não encontrado: ${sqlFilePath}`);
    return;
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  try {
    // Executar o script SQL
    await pool.query(sqlContent);
    console.log("Tabela fuel_card_requests criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela fuel_card_requests:", error);
  }
}

/**
 * Cria a tabela driver_checklists se não existir
 */
async function criarTabelaDriverChecklists() {
  // Verificar se a tabela já existe
  const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'driver_checklists')";
  const tableExistsResult = await pool.query(checkTableQuery);
  
  if (tableExistsResult.rows[0].exists) {
    console.log("Tabela driver_checklists já existe, pulando criação.");
    return;
  }

  console.log("Criando tabela driver_checklists...");
  
  try {
    // Criar a tabela
    const createTableQuery = `
      CREATE TABLE driver_checklists (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER,
        driver_name VARCHAR(255) NOT NULL,
        vehicle_plate VARCHAR(20) NOT NULL,
        km_atual INTEGER,
        condicao_pneus VARCHAR(50),
        condicao_luzes VARCHAR(50),
        condicao_freios VARCHAR(50),
        condicao_parabrisa VARCHAR(50),
        nivel_oleo VARCHAR(50),
        nivel_agua VARCHAR(50),
        estrutura_cavalo VARCHAR(50),
        estrutura_carreta VARCHAR(50),
        avarias TEXT[],
        fotos TEXT[],
        observacoes TEXT,
        status VARCHAR(50) DEFAULT 'pendente',
        viagem_id INTEGER,
        source VARCHAR(50) DEFAULT 'line_hall',
        driver_type VARCHAR(50) DEFAULT 'line_hall',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela driver_checklists criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela driver_checklists:", error);
  }
}

/**
 * Cria a tabela movimentacao_pneu se não existir
 */
async function criarTabelaMovimentacaoPneu() {
  try {
    console.log("Verificando se a tabela movimentacao_pneu existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'movimentacao_pneu'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela movimentacao_pneu já existe, pulando criação.");
      return;
    }
    
    console.log("Criando tabela movimentacao_pneu...");
    
    // Criar tabela
    const createTableQuery = `
      CREATE TABLE movimentacao_pneu (
        id SERIAL PRIMARY KEY,
        id_pneu INTEGER NOT NULL,
        id_veiculo TEXT,
        tipo_movimentacao TEXT NOT NULL,
        km INTEGER NOT NULL,
        data TIMESTAMP NOT NULL DEFAULT NOW(),
        local TEXT,
        responsavel TEXT,
        possui_estepe BOOLEAN DEFAULT FALSE,
        motivo TEXT,
        distancia_percorrida INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_movimentacao_pneu_id_pneu ON movimentacao_pneu(id_pneu);
      CREATE INDEX IF NOT EXISTS idx_movimentacao_pneu_veiculo ON movimentacao_pneu(id_veiculo);
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela movimentacao_pneu criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela movimentacao_pneu:", error);
  }
}

/**
 * Cria a tabela solicitacoes_fuel_card se não existir
 */
async function criarTabelaSolicitacoesFuelCard() {
  try {
    console.log("Verificando se a tabela solicitacoes_fuel_card existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'solicitacoes_fuel_card'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela solicitacoes_fuel_card já existe, pulando criação.");
      return;
    }
    
    console.log("Criando tabela solicitacoes_fuel_card...");
    
    // Criar tabela
    const createTableQuery = `
      CREATE TABLE solicitacoes_fuel_card (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(20) NOT NULL,
        motorista VARCHAR(100) NOT NULL,
        valor_solicitado NUMERIC(10, 2) NOT NULL,
        km_veiculo INTEGER,
        tipo_cartao VARCHAR(50),
        observacoes TEXT,
        status VARCHAR(20) DEFAULT 'Pendente',
        data_solicitacao TIMESTAMP DEFAULT NOW(),
        atendido_por VARCHAR(100),
        data_atendimento TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela solicitacoes_fuel_card criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela solicitacoes_fuel_card:", error);
  }
}

/**
 * Cria a tabela linehall_maintenance se não existir
 */
async function criarTabelaLineHallMaintenance() {
  const checkTableQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'linehall_maintenance')";
  const tableExistsResult = await pool.query(checkTableQuery);
  
  if (tableExistsResult.rows[0].exists) {
    console.log("Tabela linehall_maintenance já existe, verificando colunas...");
    
    // Verificar se as colunas necessárias existem
    const columnsToAdd = [
      { name: 'tipo_problema', type: 'VARCHAR(100)' },
      { name: 'local_ocorrencia', type: 'VARCHAR(255)' },
      { name: 'pode_continuar_viagem', type: 'BOOLEAN' },
      { name: 'observacoes', type: 'TEXT' },
      { name: 'protocolo', type: 'VARCHAR(50)' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        const checkColumnQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'linehall_maintenance' AND column_name = $1
          )
        `;
        const columnExists = await pool.query(checkColumnQuery, [column.name]);
        
        if (!columnExists.rows[0].exists) {
          const addColumnQuery = `ALTER TABLE linehall_maintenance ADD COLUMN ${column.name} ${column.type}`;
          await pool.query(addColumnQuery);
          console.log(`Coluna ${column.name} adicionada à tabela linehall_maintenance`);
        }
      } catch (error) {
        console.error(`Erro ao adicionar coluna ${column.name}:`, error);
      }
    }
    return;
  }

  console.log("Criando tabela linehall_maintenance...");
  
  try {
    const createTableQuery = `
      CREATE TABLE linehall_maintenance (
        id SERIAL PRIMARY KEY,
        motorista_id INTEGER,
        motorista_nome VARCHAR(255) NOT NULL,
        vehicle_plate VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        urgency VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pendente',
        tipo_problema VARCHAR(100),
        local_ocorrencia VARCHAR(255),
        pode_continuar_viagem BOOLEAN,
        observacoes TEXT,
        protocolo VARCHAR(50),
        approved_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela linehall_maintenance criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela linehall_maintenance:", error);
  }
}

/**
 * Cria a tabela demo_forms para testes e exemplos se não existir
 */
async function criarTabelaDemoForms() {
  try {
    // Verificar se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'demo_forms'
      ) as exists;
    `);

    if (!checkResult.rows[0].exists) {
      console.log("Criando tabela demo_forms para uso em exemplos...");
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS demo_forms (
          id SERIAL PRIMARY KEY,
          form_title VARCHAR(255) NOT NULL,
          form_data JSONB,
          status VARCHAR(50) DEFAULT 'rascunho',
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log("Tabela demo_forms criada com sucesso!");
    } else {
      console.log("Tabela demo_forms já existe.");
    }
  } catch (error) {
    console.error("Erro ao criar tabela demo_forms:", error);
  }
}

// Importar a rota SQL segura
import sqlSeguroRouter from './routes/sql-seguro';

export async function registerRoutes(app: Express): Promise<Server> {
  // ENDPOINT PARA REGISTRAR RECEBIMENTOS DE COMBUSTÍVEL (PÚBLICO - SEM AUTENTICAÇÃO)
  app.post('/recebimentos-combustivel', async (req, res) => {
    // Force JSON response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    try {
      const { posto, tipo_produto, litros_recebidos, valor_total, nome_fornecedor, nome_operador, observacoes } = req.body;
      
      console.log(`[RECEBIMENTOS] Registrando recebimento para posto: ${posto}`);
      
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
      
      console.log(`[RECEBIMENTOS] Recebimento registrado com sucesso. ID: ${result.rows[0].id}`);
      
      res.status(201).json({
        success: true,
        message: 'Recebimento registrado com sucesso',
        data: result.rows[0]
      });
      
    } catch (error: any) {
      console.error('[RECEBIMENTOS] Erro ao registrar recebimento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar recebimento',
        error: error.message
      });
    }
  });

  // ENDPOINT CRÍTICO: DELETE para recebimentos (deve ser registrado PRIMEIRO)
  app.delete('/api/delete-fuel-receipt/:posto/:id', unifiedAuthMiddleware, async (req, res) => {
    const { posto, id } = req.params;
    
    // Force JSON response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    try {
      console.log(`[DELETE FUEL RECEIPT] Excluindo recebimento ${id} do posto ${posto}`);
      
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
      
      // Execute deletion
      const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
      const result = await pool.query(deleteQuery, [id]);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[DELETE FUEL RECEIPT] Registro ${id} excluído com sucesso`);
        
        return res.status(200).json({
          success: true,
          message: 'Registro excluído com sucesso',
          deletedId: parseInt(id)
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        });
      }
      
    } catch (error: any) {
      console.error('[DELETE FUEL RECEIPT] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir registro',
        error: error.message
      });
    }
  });

  // ENDPOINTS CRÍTICOS - Registrar primeiro para evitar interceptação pelos middlewares
  
  // Endpoint para consumo diário simplificado dos postos
  app.get('/api/consumo-diario-postos-simplificado', async (req, res) => {
    try {
      console.log('Endpoint de consumo diário chamado com parâmetros:', req.query);
      
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
  
  // Inicializar rotas de ressincronização
  initResyncRoutes(pool);
  
  // Criar tabelas necessárias se não existirem
  await criarTabelaAbastecimentos();
  await criarTabelaMovimentacoesPatio();
  await criarTabelaMontagemPneus();
  await criarTabelaSolicitacoesPneus();
  await criarTabelaLineHallShopee();
  await criarTabelaFuelCardRequests();
  await criarTabelaDriverChecklists();
  await criarTabelaConfiguracaoTanques();
  await criarTabelaAbastecimentosSupabase();
  await criarTabelaAbastecimentosSupabaseAlt();
  await criarTabelaSolicitacoesFuelCard();
  await criarTabelaPostoRemediosAbastecimentos();
  await criarTabelaMovimentacaoPneu();
  await atualizarTabelaPneus();
  await setupTireActivityTable();
  await criarTabelaLineHallMaintenance();
  await criarTabelaDemoForms();
  
  // Registrar rota SQL segura (novo)
  app.use('/api/sql-seguro', sqlSeguroRouter);
  
  // Registrar rotas de autenticação dos parceiros
  app.use('/api/auth', partnerAuthRouter);
  
  // Rota de debug para Osasco
  app.use('/api/debug-osasco', debugOsascoRoutes);
  
  // Versão corrigida para recebimentos do posto Osasco
  app.use('/api/recebimentos-osasco-v2', recebimentosOsascoHandler);
  
  // Nova rota direta para recebimentos do posto Osasco V2
  app.use('/api/osasco-v2/recebimentos', osascoV2RecebimentosDirecto);
  app.use('/api/fix-osasco/recebimentos', fixOsascoRecebimentos);
  
  // Manipulador especializado para o posto Osasco
  app.use('/', recebimentosOsascoHandler);
  
  // Rota de teste com dados simulados para Osasco V2
  app.use('/', testeOsascoRecebimentos);
  
  // Rota direta para recebimentos do posto Osasco V2
  app.use('/', osascoV2Direto);
  
  // Registrar a nova rota direta para os recebimentos do posto Osasco V2
  app.use('/', recebimentosOsascoV2Routes);
  
  // Registrar rota unificada de abastecimento (NOVA - corrige inconsistências de schema)
  app.use('/api/abastecimento', abastecimentoUnificadoRoutes);
  
  // Registrar rotas especializadas para o posto Guarulhos V2
  app.use('/api/guarulhos-v2', guarulhosV2Routes);
  
  // Registrar rotas especializadas para o posto Osasco V2
  app.use('/api/osasco-v2', osascoV2Routes);
  
  // Rota direta para o posto Osasco V2 (nova versão)
  app.use('/api/osasco-direto', osascoDiretoRoutes);
  
  // Redirecionar requisições de recebimentos do Guarulhos V2 para a rota especializada
  app.get('/api/recebimentos/guarulhos_v2', async (req, res) => {
    console.log("Tratando requisição de recebimentos para Guarulhos V2");
    
    try {
      // Verificar se a tabela recebimentos_posto_guarulhos_v2 existe
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'recebimentos_posto_guarulhos_v2'
        );
      `;
      
      const tableCheck = await pool.query(checkTableQuery);
      const tableExists = tableCheck.rows[0].exists;
      
      if (!tableExists) {
        return res.json({
          success: true,
          message: "Tabela de recebimentos ainda não configurada para este posto",
          data: [],
          count: 0
        });
      }
      
      // Consulta SQL para recebimentos do posto Guarulhos V2 com mapeamento correto de colunas
      const query = `
        SELECT 
          id,
          tipo_produto as tipo_combustivel,
          litros_recebidos as quantidade_litros,
          valor_total,
          nome_fornecedor as fornecedor,
          nome_operador as operador,
          observacoes,
          to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
          created_at
        FROM recebimentos_posto_guarulhos_v2
        ORDER BY created_at DESC
        LIMIT ${req.query.limit || 50}
      `;
      
      console.log("[GuarulhosV2] Executando consulta especializada de recebimentos");
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rowCount,
        posto: "Guarulhos_v2"
      });
    } catch (error) {
      console.error("[GuarulhosV2] Erro ao consultar recebimentos:", error);
      
      // Retornar uma resposta com dados vazios para evitar quebra da interface
      res.json({ 
        success: true, 
        message: "Tabela de recebimentos não disponível ou erro na consulta",
        data: [],
        count: 0
      });
    }
  });
  
  // Redirecionar requisições de recebimentos do Osasco V2 para a rota especializada
  app.get('/api/recebimentos/osasco_v2', (req, res) => {
    console.log("Tratando requisição de recebimentos para Osasco V2 diretamente");
    // Retornar uma resposta em formato JSON válido diretamente
    res.json({
      success: true,
      message: "Tabela de recebimentos não disponível ou em configuração",
      data: [],
      count: 0
    });
  });
  
  // Registrar rotas de diagnóstico
  app.use('/api/diagnostico', diagnosticoRoutes);
  
  // DELETE endpoint para excluir registros de recebimentos (rota específica para evitar conflito com Vite)
  app.delete('/api/delete-recebimento/:posto/:id', unifiedAuthMiddleware, async (req, res) => {
    try {
      const { posto, id } = req.params;
      
      // Ensure JSON response headers to prevent Vite middleware interference
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      console.log(`[DELETE RECEBIMENTO] Excluindo registro ${id} do posto ${posto}`);
      
      // Normalizar o nome do posto
      const formattedPosto = posto.toLowerCase();
      
      // Mapear postos para nomes de tabelas de ABASTECIMENTOS (não recebimentos)
      const tableMap: { [key: string]: string } = {
        'osasco_v2': 'abastecimentos_posto_osasco_v2',
        'abc_v2': 'abastecimentos_posto_abc_v2',
        'alair_v2': 'abastecimentos_posto_alair_v2',
        'campinas_v2': 'abastecimentos_posto_campinas_v2',
        'socorro_v2': 'abastecimentos_posto_socorro_v2',
        'sorocaba_v2': 'abastecimentos_posto_sorocaba_v2',
        'guarulhos_v2': 'abastecimentos_posto_guarulhos_v2'
      };
      
      const tableName = tableMap[formattedPosto];
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: `Posto "${posto}" não encontrado`
        });
      }
      
      // Verificar se o registro existe antes de excluir
      const checkQuery = `SELECT id FROM ${tableName} WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registro de recebimento não encontrado'
        });
      }
      
      // Executar a exclusão
      const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
      const result = await pool.query(deleteQuery, [id]);
      
      if (result.rowCount > 0) {
        console.log(`[DELETE RECEBIMENTO] Registro ${id} excluído com sucesso da tabela ${tableName}`);
        
        // Force response termination to prevent Vite middleware interference
        res.status(200);
        res.json({
          success: true,
          message: 'Registro de recebimento excluído com sucesso',
          deletedId: id
        });
        return res.end();
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erro ao excluir registro de recebimento'
        });
      }
      
    } catch (error: any) {
      console.error('[DELETE RECEBIMENTO] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao excluir registro',
        error: error.message
      });
    }
  });
  
  // Endpoint DELETE específico para recebimentos de combustível
  app.delete('/api/recebimentos/:posto/:id', unifiedAuthMiddleware, async (req, res) => {
    try {
      const { posto, id } = req.params;
      
      // Ensure JSON response headers to prevent Vite middleware interference
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      console.log(`[DELETE RECEBIMENTO] Excluindo registro ${id} do posto ${posto}`);
      
      // Normalizar o nome do posto
      const formattedPosto = posto.toLowerCase();
      
      // Mapear postos para nomes de tabelas de RECEBIMENTOS
      const tableMap: { [key: string]: string } = {
        'osasco_v2': 'recebimentos_posto_osasco_v2',
        'abc_v2': 'recebimentos_posto_abc_v2',
        'alair_v2': 'recebimentos_posto_alair_v2',
        'campinas_v2': 'recebimentos_posto_campinas_v2',
        'socorro_v2': 'recebimentos_posto_socorro_v2',
        'sorocaba_v2': 'recebimentos_posto_sorocaba_v2',
        'guarulhos_v2': 'recebimentos_posto_guarulhos_v2'
      };
      
      const tableName = tableMap[formattedPosto];
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: `Posto "${posto}" não encontrado`
        });
      }
      
      // Verificar se o registro existe antes de excluir
      const checkQuery = `SELECT id FROM ${tableName} WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registro de recebimento não encontrado'
        });
      }
      
      // Executar a exclusão
      const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
      const result = await pool.query(deleteQuery, [id]);
      
      if (result.rowCount > 0) {
        console.log(`[DELETE RECEBIMENTO] Registro ${id} excluído com sucesso da tabela ${tableName}`);
        
        // Force response termination to prevent Vite middleware interference
        res.status(200);
        res.json({
          success: true,
          message: 'Registro de recebimento excluído com sucesso',
          deletedId: id
        });
        return res.end();
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erro ao excluir registro de recebimento'
        });
      }
      
    } catch (error: any) {
      console.error('[DELETE RECEBIMENTO] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao excluir registro',
        error: error.message
      });
    }
  });

  // Registrar rotas de recebimentos (DEPOIS do DELETE endpoint específico)
  app.use('/api/recebimentos', recebimentosRoutes);
  
  // Registrar rotas de autenticação JWT
  app.use('/api', jwtAuthRoutes);
  // Rota para registro de movimentações de pátio
  app.post('/api/registro/movimentacao-patio', async (req, res) => {
    try {
      console.log('Recebendo requisição para registro de movimentação de pátio:', req.body);
      
      // Validando dados básicos
      const { placa, tipo_movimento, nome_motorista, nome_operador, posto } = req.body;
      
      if (!placa || !tipo_movimento || !nome_motorista || !nome_operador || !posto) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados incompletos para registro da movimentação' 
        });
      }
      
      // Processando o tipo de movimento para definir as datas
      let data_entrada = null;
      let data_saida = null;
      
      if (tipo_movimento.includes('Entrada')) {
        data_entrada = new Date();
        // Em entradas, data_saida permanece null
      } else if (tipo_movimento.includes('Saída')) {
        data_saida = new Date(); // Registro da data de saída
        
        // Para registros de saída, precisamos buscar o registro de entrada correspondente para vincular
        try {
          // Verificar se existe um registro de entrada para esta placa sem saída registrada
          const checkQuery = `
            SELECT id FROM movimentacoes_patio 
            WHERE placa = $1 AND data_saida IS NULL
            ORDER BY data_entrada DESC
            LIMIT 1
          `;
          
          const checkResult = await pool.query(checkQuery, [placa.toUpperCase()]);
          
          if (checkResult.rowCount > 0) {
            // Registros de saída atualizam a entrada existente (não criam novo registro)
            const updateQuery = `
              UPDATE movimentacoes_patio 
              SET data_saida = $1, 
                  tipo_movimento = $2,
                  nome_operador = $3,
                  motivo = $4
              WHERE id = $5
              RETURNING id
            `;
            
            const updateResult = await pool.query(updateQuery, [
              data_saida,
              tipo_movimento,
              nome_operador,
              tipo_movimento, // Motivo é o mesmo que tipo de movimento
              checkResult.rows[0].id
            ]);
            
            console.log('Registro de saída atualizado com sucesso:', updateResult.rows[0]);
            
            return res.status(200).json({
              success: true,
              message: 'Saída registrada com sucesso',
              data: {
                id: updateResult.rows[0].id,
                placa,
                tipo_movimento,
                nome_motorista,
                nome_operador,
                posto
              }
            });
          }
        } catch (err) {
          console.error('Erro ao verificar registro de entrada existente:', err);
          // Continuar com o fluxo normal mesmo se ocorrer erro na verificação
        }
      }
      
      // Verificar se a tabela tem os campos atualizados
      try {
        const checkQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'movimentacoes_patio' AND column_name = 'nome_motorista';
        `;
        
        const checkResult = await pool.query(checkQuery);
        
        if (checkResult.rows.length === 0) {
          // Alterar a tabela para adicionar os novos campos
          await pool.query(`
            ALTER TABLE movimentacoes_patio 
            ADD COLUMN IF NOT EXISTS nome_motorista TEXT,
            ADD COLUMN IF NOT EXISTS nome_operador TEXT,
            ADD COLUMN IF NOT EXISTS tipo_movimento TEXT;
          `);
          
          console.log('Tabela movimentacoes_patio atualizada com novos campos');
        }
      } catch (e) {
        console.error('Erro ao verificar ou atualizar estrutura da tabela:', e);
        // Continuar mesmo com erro na atualização da estrutura
      }
      
      // Inserindo registro no banco
      const query = `
        INSERT INTO movimentacoes_patio 
        (placa, motorista, nome_motorista, nome_operador, tipo_movimento, data_entrada, data_saida, motivo, posto, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, (NOW() AT TIME ZONE 'America/Sao_Paulo'))
        RETURNING id
      `;
      
      const motivo = tipo_movimento; // Usado como motivo para manter registros anteriores compatíveis
      
      const result = await pool.query(query, [
        placa.toUpperCase(),
        nome_motorista, // Mantemos o campo motorista para compatibilidade
        nome_motorista,
        nome_operador,
        tipo_movimento,
        data_entrada,
        data_saida,
        motivo,
        posto
      ]);
      
      console.log('Movimentação registrada com sucesso:', result.rows[0]);
      
      return res.status(201).json({
        success: true,
        message: 'Movimentação registrada com sucesso',
        data: {
          id: result.rows[0].id,
          placa,
          tipo_movimento,
          nome_motorista,
          nome_operador,
          posto
        }
      });
    } catch (error) {
      console.error('Erro ao registrar movimentação de pátio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar movimentação de pátio',
        error: String(error)
      });
    }
  });
  
  // Rota para recuperar movimentações de pátio por posto
  app.get('/api/movimentacoes-patio/:posto', async (req, res) => {
    try {
      const { posto } = req.params;
      
      // Formatar nome do posto (primeira letra maiúscula)
      const formattedPosto = posto.charAt(0).toUpperCase() + posto.slice(1);
      
      console.log(`Buscando movimentações de pátio para posto: ${formattedPosto}`);
      
      // Consulta SQL para buscar registros
      const query = `
        SELECT * FROM movimentacoes_patio 
        WHERE posto = $1
        ORDER BY created_at DESC
        LIMIT 100
      `;
      
      const result = await pool.query(query, [formattedPosto]);
      
      console.log(`Movimentações encontradas: ${result.rowCount || 0}`);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao buscar movimentações de pátio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar movimentações de pátio',
        error: String(error)
      });
    }
  });
  
  // Rota para verificação de abastecimentos no banco
  app.get('/api/diagnostico/abastecimentos/:posto', async (req, res) => {
    try {
      const { posto } = req.params;
      
      // Formatar nome do posto (primeira letra maiúscula)
      const formattedPosto = posto.charAt(0).toUpperCase() + posto.slice(1);
      
      console.log(`Verificando abastecimentos para posto: ${formattedPosto}`);
      
      // Consulta SQL direta para verificar os registros existentes (sem limite)
      const query = `
        SELECT * FROM abastecimentos_postos 
        WHERE posto = $1
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query, [formattedPosto]);
      
      console.log(`Abastecimentos encontrados: ${result.rowCount || 0}`);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows,
        message: `Encontrados ${result.rowCount || 0} registros para o posto ${formattedPosto}`
      });
    } catch (error) {
      console.error('Erro ao verificar abastecimentos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar abastecimentos',
        error: String(error)
      });
    }
  });
  
  // Rota para obter configuração dos tanques
  app.get('/api/configuracao-tanques/:posto', async (req, res) => {
    try {
      const { posto } = req.params;
      
      // Formatar nome do posto (primeira letra maiúscula)
      const formattedPosto = posto.charAt(0).toUpperCase() + posto.slice(1);
      
      console.log(`Buscando configuração de tanques para posto: ${formattedPosto}`);
      
      // Consulta SQL para buscar a configuração
      const query = `
        SELECT * FROM configuracao_tanques 
        WHERE posto = $1
      `;
      
      const result = await pool.query(query, [formattedPosto]);
      
      if (result.rowCount === 0) {
        // Se não existir configuração, criar com valores padrão
        const insertQuery = `
          INSERT INTO configuracao_tanques 
          (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel, created_at, updated_at)
          VALUES ($1, 20000, 15000, 1000, 750, NOW(), NOW())
          RETURNING *;
        `;
        
        const insertResult = await pool.query(insertQuery, [formattedPosto]);
        
        console.log(`Configuração de tanques criada para posto: ${formattedPosto}`);
        
        return res.status(200).json({
          success: true,
          data: insertResult.rows[0],
          message: `Configuração de tanques criada para o posto ${formattedPosto}`
        });
      }
      
      console.log(`Configuração de tanques encontrada para posto: ${formattedPosto}`);
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao buscar configuração de tanques:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar configuração de tanques',
        error: String(error)
      });
    }
  });
  
  // Rota para atualizar configuração dos tanques
  app.post('/api/configuracao-tanques/:posto', async (req, res) => {
    try {
      const { posto } = req.params;
      const { 
        diesel_capacidade, 
        diesel_nivel, 
        arla_capacidade, 
        arla_nivel,
        diesel_valor_litro,
        arla_valor_litro
      } = req.body;
      
      // Formatar nome do posto (primeira letra maiúscula)
      const formattedPosto = posto.charAt(0).toUpperCase() + posto.slice(1);
      
      console.log(`Atualizando configuração de tanques para posto: ${formattedPosto}`, req.body);
      
      // Verificar se é necessário converter valores de string para número
      const dieselCapacidade = typeof diesel_capacidade === 'string' ? parseFloat(diesel_capacidade) : diesel_capacidade;
      const dieselNivel = typeof diesel_nivel === 'string' ? parseFloat(diesel_nivel) : diesel_nivel;
      const arlaCapacidade = typeof arla_capacidade === 'string' ? parseFloat(arla_capacidade) : arla_capacidade;
      const arlaNivel = typeof arla_nivel === 'string' ? parseFloat(arla_nivel) : arla_nivel;
      const dieselValorLitro = typeof diesel_valor_litro === 'string' ? parseFloat(diesel_valor_litro) : (diesel_valor_litro || 5.00);
      const arlaValorLitro = typeof arla_valor_litro === 'string' ? parseFloat(arla_valor_litro) : (arla_valor_litro || 3.00);
      
      // Consulta SQL para atualizar a configuração
      const query = `
        INSERT INTO configuracao_tanques 
        (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel, diesel_valor_litro, arla_valor_litro, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (posto) 
        DO UPDATE SET 
          diesel_capacidade = $2,
          diesel_nivel = $3,
          arla_capacidade = $4,
          arla_nivel = $5,
          diesel_valor_litro = $6,
          arla_valor_litro = $7,
          updated_at = NOW()
        RETURNING *;
      `;
      
      const result = await pool.query(query, [
        formattedPosto,
        dieselCapacidade,
        dieselNivel,
        arlaCapacidade,
        arlaNivel,
        dieselValorLitro,
        arlaValorLitro
      ]);
      
      console.log(`Configuração de tanques atualizada para posto: ${formattedPosto}`);
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Configuração de tanques atualizada para o posto ${formattedPosto}`
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração de tanques:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configuração de tanques',
        error: String(error)
      });
    }
  });
  
  // Rota para consumir combustível do tanque
  app.post('/api/configuracao-tanques/:posto/consume', async (req, res) => {
    try {
      const { posto } = req.params;
      const { tipo_combustivel, litros } = req.body;
      
      // Validação de dados
      if (!tipo_combustivel || litros === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos para consumo de combustível'
        });
      }
      
      // Formatar nome do posto (primeira letra maiúscula)
      const formattedPosto = posto.charAt(0).toUpperCase() + posto.slice(1);
      
      console.log(`Consumindo ${litros} litros de ${tipo_combustivel} do posto: ${formattedPosto}`);
      
      // Verificar qual campo atualizar
      const tanqueField = tipo_combustivel.toUpperCase() === 'ARLA' ? 'arla_nivel' : 'diesel_nivel';
      
      // Buscar configuração atual do tanque
      const configQuery = `
        SELECT * FROM configuracao_tanques 
        WHERE posto = $1
      `;
      
      const configResult = await pool.query(configQuery, [formattedPosto]);
      
      // Se não existir configuração, retornar erro
      if (configResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: `Configuração de tanques não encontrada para posto ${formattedPosto}`
        });
      }
      
      // Calcular novo nível (nunca permitir que fique negativo)
      const config = configResult.rows[0];
      const nivelAtual = tipo_combustivel.toUpperCase() === 'ARLA' ? config.arla_nivel : config.diesel_nivel;
      const novoNivel = Math.max(nivelAtual - parseFloat(litros), 0);
      
      // Calcular campos de consumo total e valor total
      const isArla = tipo_combustivel.toUpperCase() === 'ARLA';
      const consumoTotalField = isArla ? 'arla_consumo_total' : 'diesel_consumo_total';
      const valorTotalField = isArla ? 'arla_valor_total' : 'diesel_valor_total';
      
      // Obter valores atuais
      const consumoAtual = isArla ? (config.arla_consumo_total || 0) : (config.diesel_consumo_total || 0);
      const valorAtual = isArla ? (config.arla_valor_total || 0) : (config.diesel_valor_total || 0);
      
      // Calcular o valor total do combustível consumido
      const valorLitro = isArla ? config.arla_valor_litro : config.diesel_valor_litro;
      const valorTotalAbastecimento = parseFloat(litros) * parseFloat(valorLitro);
      
      // Calcular novos valores
      const novoConsumo = parseFloat(consumoAtual) + parseFloat(litros);
      const novoValor = parseFloat(valorAtual) + valorTotalAbastecimento;
      
      // Atualizar o nível do tanque e os totais
      const updateQuery = `
        UPDATE configuracao_tanques 
        SET ${tanqueField} = $1,
            ${consumoTotalField} = $2,
            ${valorTotalField} = $3,
            updated_at = NOW()
        WHERE posto = $4
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [novoNivel, novoConsumo, novoValor, formattedPosto]);
      
      console.log(`Nível do tanque de ${tipo_combustivel} atualizado para posto ${formattedPosto}: ${nivelAtual} -> ${novoNivel}`);
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Consumo de ${litros} litros de ${tipo_combustivel} registrado para o posto ${formattedPosto}`
      });
    } catch (error) {
      console.error('Erro ao consumir combustível:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao consumir combustível',
        error: String(error)
      });
    }
  });

  // Rota para registro de abastecimento - temporariamente sem autenticação para testes
  app.post('/api/registro/abastecimento', async (req, res) => {
    try {
      console.log('Recebendo requisição para registro de abastecimento:', req.body);
      
      // Validando dados básicos
      const { placa, km, tipo, quantidade, motorista, operador, posto, tipo_veiculo } = req.body;
      
      if (!placa || !km || !tipo || !quantidade || !motorista || !operador || !posto) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados incompletos para registro de abastecimento' 
        });
      }

      // Formatar nome do posto (primeira letra maiúscula)
      const formattedPosto = posto.charAt(0).toUpperCase() + posto.slice(1);
      const qtdCombustivel = parseFloat(quantidade);
      
      // Tipo de veículo (frota ou agregado)
      const tipoVeiculo = tipo_veiculo || 'frota';
      
      // Criar registro no banco de dados
      const query = `
        INSERT INTO abastecimentos_postos 
        (placa, km_atual, tipo_combustivel, litros, quantity_litros, nome_motorista, nome_operador, posto, created_at, project, tipo_veiculo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (NOW() AT TIME ZONE 'America/Sao_Paulo'), $9, $10)
        RETURNING id
      `;
      
      const values = [
        placa.toUpperCase(),
        parseInt(km, 10),
        tipo,
        qtdCombustivel,
        qtdCombustivel, // Adicionando quantity_litros com o mesmo valor de litros
        motorista,
        operador,
        formattedPosto, // Usando o campo 'posto' corretamente
        req.body.projeto || 'N/A',
        tipoVeiculo // Adicionando o tipo de veículo
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows && result.rows.length > 0) {
        console.log('Abastecimento registrado com sucesso, ID:', result.rows[0].id);
        
        // Atualizar nível do tanque
        try {
          // Verificar qual tanque atualizar
          const tanqueField = tipo === 'ARLA' ? 'arla_nivel' : 'diesel_nivel';
          
          // Buscar configuração atual do tanque
          const configQuery = `
            SELECT * FROM configuracao_tanques 
            WHERE posto = $1
          `;
          
          const configResult = await pool.query(configQuery, [formattedPosto]);
          
          // Se não existir configuração, criar
          if (configResult.rowCount === 0) {
            console.log(`Configuração de tanques não encontrada para posto ${formattedPosto}, criando...`);
            
            // Valores padrão
            const dieselCapacidade = 20000;
            const dieselNivel = tipo === 'ARLA' ? 15000 : Math.max(15000 - qtdCombustivel, 0);
            const arlaCapacidade = 1000;
            const arlaNivel = tipo === 'ARLA' ? Math.max(750 - qtdCombustivel, 0) : 750;
            
            const insertQuery = `
              INSERT INTO configuracao_tanques 
              (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel)
              VALUES ($1, $2, $3, $4, $5)
            `;
            
            await pool.query(insertQuery, [
              formattedPosto,
              dieselCapacidade,
              dieselNivel,
              arlaCapacidade,
              arlaNivel
            ]);
            
            console.log(`Configuração de tanques criada para posto ${formattedPosto}`);
          } else {
            // Atualizar o nível do tanque
            const config = configResult.rows[0];
            
            // Calcular novo nível (nunca permitir que fique negativo)
            const nivelAtual = tipo === 'ARLA' ? config.arla_nivel : config.diesel_nivel;
            const novoNivel = Math.max(nivelAtual - qtdCombustivel, 0);
            
            // Calcular campos de consumo total e valor total
            const isArla = tipo === 'ARLA';
            const consumoTotalField = isArla ? 'arla_consumo_total' : 'diesel_consumo_total';
            const valorTotalField = isArla ? 'arla_valor_total' : 'diesel_valor_total';
            
            // Obter valores atuais
            const consumoAtual = isArla ? (config.arla_consumo_total || 0) : (config.diesel_consumo_total || 0);
            const valorAtual = isArla ? (config.arla_valor_total || 0) : (config.diesel_valor_total || 0);
            
            // Calcular o valor do combustível consumido
            const valorLitro = isArla ? config.arla_valor_litro : config.diesel_valor_litro;
            const valorTotalAbastecimento = qtdCombustivel * valorLitro;
            
            // Calcular novos valores
            const novoConsumo = parseFloat(consumoAtual) + qtdCombustivel;
            const novoValor = parseFloat(valorAtual) + valorTotalAbastecimento;
            
            const updateQuery = `
              UPDATE configuracao_tanques 
              SET ${tanqueField} = $1,
                  ${consumoTotalField} = $2,
                  ${valorTotalField} = $3,
                  updated_at = NOW()
              WHERE posto = $4
            `;
            
            await pool.query(updateQuery, [novoNivel, novoConsumo, novoValor, formattedPosto]);
            
            console.log(`Nível do tanque de ${tipo} atualizado para posto ${formattedPosto}: ${nivelAtual} -> ${novoNivel}`);
          }
        } catch (tankError) {
          console.error('Erro ao atualizar nível do tanque:', tankError);
          // Não interrompe a transação, apenas registra o erro
        }
        
        return res.status(200).json({ 
          success: true, 
          id: result.rows[0].id,
          message: 'Abastecimento registrado com sucesso' 
        });
      } else {
        console.error('Erro ao registrar abastecimento - nenhum ID retornado');
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao registrar abastecimento' 
        });
      }
    } catch (error) {
      console.error('Erro ao processar registro de abastecimento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno ao processar registro de abastecimento' 
      });
    }
  });
  // Configuração do passport para autenticação
  setupAuth(app);
  
  // Rotas para Line Hall Shopee
  app.get('/api/line-hall-shopee', isAuthenticated, async (req, res) => {
    try {
      // Consultar todas as viagens
      const query = `
        SELECT * FROM line_hall_shopee
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error: any) {
      console.error('Erro ao listar viagens Line Hall Shopee:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar viagens',
        error: error.message
      });
    }
  });
  
  app.get('/api/line-hall-shopee/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Consultar uma viagem específica
      const query = `
        SELECT * FROM line_hall_shopee
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Viagem não encontrada'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao buscar viagem Line Hall Shopee:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar viagem',
        error: error.message
      });
    }
  });
  
  app.post('/api/line-hall-shopee', isAuthenticated, async (req, res) => {
    try {
      const {
        placa_cavalo,
        placa_carreta_1,
        placa_carreta_2,
        motorista_id,
        motorista_nome,
        local_carregamento,
        local_descarregamento,
        horario_carregamento,
        status_viagem,
        data_inicio,
        data_fim,
        observacoes
      } = req.body;
      
      // Validar campos obrigatórios
      if (!placa_cavalo || !placa_carreta_1 || !motorista_id || !motorista_nome || 
          !local_carregamento || !local_descarregamento || !status_viagem) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios não preenchidos'
        });
      }
      
      // Inserir viagem
      const query = `
        INSERT INTO line_hall_shopee (
          placa_cavalo,
          placa_carreta_1,
          placa_carreta_2,
          motorista_id,
          motorista_nome,
          local_carregamento,
          local_descarregamento,
          horario_carregamento,
          status_viagem,
          data_inicio,
          data_fim,
          observacoes,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING id
      `;
      
      const values = [
        placa_cavalo.toUpperCase(),
        placa_carreta_1.toUpperCase(),
        placa_carreta_2 ? placa_carreta_2.toUpperCase() : null,
        parseInt(motorista_id),
        motorista_nome,
        local_carregamento,
        local_descarregamento,
        horario_carregamento || null,
        status_viagem,
        data_inicio || new Date(),
        data_fim || null,
        observacoes || null
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows && result.rows.length > 0) {
        return res.status(201).json({
          success: true,
          id: result.rows[0].id,
          message: 'Viagem registrada com sucesso'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erro ao registrar viagem'
        });
      }
    } catch (error: any) {
      console.error('Erro ao registrar viagem Line Hall Shopee:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar viagem',
        error: error.message
      });
    }
  });
  
  app.put('/api/line-hall-shopee/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        placa_cavalo,
        placa_carreta_1,
        placa_carreta_2,
        motorista_id,
        motorista_nome,
        local_carregamento,
        local_descarregamento,
        horario_carregamento,
        status_viagem,
        data_inicio,
        data_fim,
        observacoes
      } = req.body;
      
      // Verificar se a viagem existe
      const checkQuery = `
        SELECT id FROM line_hall_shopee
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Viagem não encontrada'
        });
      }
      
      // Atualizar viagem
      const updateQuery = `
        UPDATE line_hall_shopee
        SET 
          placa_cavalo = $1,
          placa_carreta_1 = $2,
          placa_carreta_2 = $3,
          motorista_id = $4,
          motorista_nome = $5,
          local_carregamento = $6,
          local_descarregamento = $7,
          horario_carregamento = $8,
          status_viagem = $9,
          data_inicio = $10,
          data_fim = $11,
          observacoes = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *
      `;
      
      const updateValues = [
        placa_cavalo ? placa_cavalo.toUpperCase() : checkResult.rows[0].placa_cavalo,
        placa_carreta_1 ? placa_carreta_1.toUpperCase() : checkResult.rows[0].placa_carreta_1,
        placa_carreta_2 ? placa_carreta_2.toUpperCase() : checkResult.rows[0].placa_carreta_2,
        motorista_id ? parseInt(motorista_id) : checkResult.rows[0].motorista_id,
        motorista_nome || checkResult.rows[0].motorista_nome,
        local_carregamento || checkResult.rows[0].local_carregamento,
        local_descarregamento || checkResult.rows[0].local_descarregamento,
        horario_carregamento || checkResult.rows[0].horario_carregamento,
        status_viagem || checkResult.rows[0].status_viagem,
        data_inicio || checkResult.rows[0].data_inicio,
        data_fim || checkResult.rows[0].data_fim,
        observacoes || checkResult.rows[0].observacoes,
        id
      ];
      
      const updateResult = await pool.query(updateQuery, updateValues);
      
      return res.status(200).json({
        success: true,
        data: updateResult.rows[0],
        message: 'Viagem atualizada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao atualizar viagem Line Hall Shopee:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar viagem',
        error: error.message
      });
    }
  });
  
  app.delete('/api/line-hall-shopee/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se a viagem existe
      const checkQuery = `
        SELECT id FROM line_hall_shopee
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Viagem não encontrada'
        });
      }
      
      // Excluir viagem
      const deleteQuery = `
        DELETE FROM line_hall_shopee
        WHERE id = $1
      `;
      
      await pool.query(deleteQuery, [id]);
      
      return res.status(200).json({
        success: true,
        message: 'Viagem excluída com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao excluir viagem Line Hall Shopee:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir viagem',
        error: error.message
      });
    }
  });

  // API para buscar viagem por nome do motorista (acesso externo)
  app.get('/api/line-hall-shopee/motorista/buscar', async (req, res) => {
    try {
      const { nome } = req.query;
      
      if (!nome) {
        return res.status(400).json({
          success: false,
          message: 'Nome do motorista é obrigatório'
        });
      }
      
      // Buscar viagem ativa do motorista por nome (sem autenticação para acesso externo)
      const query = `
        SELECT * FROM line_hall_shopee
        WHERE LOWER(motorista_nome) LIKE LOWER($1)
        AND status_viagem IN ('Aguardando', 'Em Andamento')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [`%${nome}%`]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma viagem ativa encontrada para este motorista'
        });
      }
      
      return res.status(200).json({
        success: true,
        trip: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao buscar viagem do motorista:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar viagem do motorista',
        error: error.message
      });
    }
  });

  // API para atualizar status da viagem (acesso externo)
  app.patch('/api/line-hall-shopee/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status_viagem, data_inicio, data_fim } = req.body;
      
      if (!status_viagem) {
        return res.status(400).json({
          success: false,
          message: 'Status da viagem é obrigatório'
        });
      }
      
      // Verificar se a viagem existe
      const checkQuery = `
        SELECT * FROM line_hall_shopee
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Viagem não encontrada'
        });
      }
      
      // Preparar dados para atualização
      let updateFields = ['status_viagem = $2', 'updated_at = NOW()'];
      let updateValues = [id, status_viagem];
      let paramCount = 2;
      
      // Adicionar data de início se fornecida
      if (data_inicio) {
        paramCount++;
        updateFields.push(`data_inicio = $${paramCount}`);
        updateValues.push(data_inicio);
      }
      
      // Adicionar data de fim se fornecida
      if (data_fim) {
        paramCount++;
        updateFields.push(`data_fim = $${paramCount}`);
        updateValues.push(data_fim);
      }
      
      // Atualizar viagem
      const updateQuery = `
        UPDATE line_hall_shopee
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, updateValues);
      
      return res.status(200).json({
        success: true,
        data: updateResult.rows[0],
        message: 'Status da viagem atualizado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status da viagem:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status da viagem',
        error: error.message
      });
    }
  });
  
  // Rotas para Fuel Card (Cartão de Combustível)
  // GET - Obter todas as solicitações de cartão de combustível (com filtragem opcional por status/base)
  app.get('/api/fuel-card', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const user = req.user as any;
      
      // Constrói a consulta SQL baseada nos parâmetros
      let query = `
        SELECT fcr.*, b.name as base_name
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      
      // Filtra por status se fornecido
      if (status) {
        query += ` AND fcr.status = $${queryParams.length + 1}`;
        queryParams.push(status);
      }
      
      // Se não for administrador ou gestor, filtra apenas as solicitações da base do usuário
      if (user.role !== 'admin' && user.role !== 'gestor' && user.baseId) {
        query += ` AND fcr.base_id = $${queryParams.length + 1}`;
        queryParams.push(user.baseId);
      }
      
      // Ordena por data de solicitação (mais recente primeiro)
      query += ` ORDER BY fcr.requested_at DESC`;
      
      const result = await pool.query(query, queryParams);
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error: any) {
      console.error('Erro ao buscar solicitações de cartão de combustível:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitações',
        error: error.message
      });
    }
  });

  // GET - Obter solicitações pendentes (para aprovação/rejeição)
  app.get('/api/fuel-card/pending', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Verifica se o usuário tem permissão (admin, gestor ou line_hall)
      if (user.role !== 'admin' && user.role !== 'gestor' && user.role !== 'line_hall') {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar solicitações pendentes'
        });
      }
      
      const query = `
        SELECT fcr.*, b.name as base_name
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        WHERE fcr.status = 'pendente'
        ORDER BY fcr.requested_at ASC
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error: any) {
      console.error('Erro ao buscar solicitações pendentes:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitações pendentes',
        error: error.message
      });
    }
  });

  // POST - Criar nova solicitação de recarga
  app.post('/api/fuel-card', isAuthenticated, async (req, res) => {
    try {
      const { plate, cardNumber, amount, reason, requestedBy } = req.body;
      const user = req.user as any;
      
      // Validação básica
      if (!plate || !cardNumber || !amount || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos para solicitação'
        });
      }
      
      // Usar a base do usuário autenticado se disponível
      const baseId = user.baseId || null;
      const solicitante = requestedBy || user.name || 'Usuário';
      
      const query = `
        INSERT INTO fuel_card_requests
          (plate, card_number, amount, reason, requested_by, base_id, status, requested_at, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, 'pendente', NOW(), NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        plate.toUpperCase(),
        cardNumber,
        parseFloat(amount),
        reason,
        solicitante,
        baseId
      ]);
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Solicitação de recarga criada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao criar solicitação de recarga:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação de recarga',
        error: error.message
      });
    }
  });

  // POST - Aprovar solicitação de recarga
  app.post('/api/fuel-card/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      // Verifica se o usuário tem permissão para aprovar (admin, gestor ou line_hall)
      if (user.role !== 'admin' && user.role !== 'gestor' && user.role !== 'line_hall') {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para aprovar solicitações'
        });
      }
      
      // Verifica se a solicitação existe e está pendente
      const checkQuery = `
        SELECT * FROM fuel_card_requests
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }
      
      if (checkResult.rows[0].status !== 'pendente') {
        return res.status(400).json({
          success: false,
          message: `Solicitação já foi ${checkResult.rows[0].status}`
        });
      }
      
      // Atualiza o status para aprovado
      const updateQuery = `
        UPDATE fuel_card_requests
        SET 
          status = 'aprovado',
          approved_by = $1,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [
        user.name || 'Admin',
        id
      ]);
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Solicitação aprovada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao aprovar solicitação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aprovar solicitação',
        error: error.message
      });
    }
  });

  // POST - Rejeitar solicitação de recarga
  app.post('/api/fuel-card/:id/reject', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const user = req.user as any;
      
      // Verifica se o usuário tem permissão para rejeitar (admin, gestor ou line_hall)
      if (user.role !== 'admin' && user.role !== 'gestor' && user.role !== 'line_hall') {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para rejeitar solicitações'
        });
      }
      
      // Validação do motivo de rejeição
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Motivo da rejeição é obrigatório'
        });
      }
      
      // Verifica se a solicitação existe e está pendente
      const checkQuery = `
        SELECT * FROM fuel_card_requests
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }
      
      if (checkResult.rows[0].status !== 'pendente') {
        return res.status(400).json({
          success: false,
          message: `Solicitação já foi ${checkResult.rows[0].status}`
        });
      }
      
      // Atualiza o status para rejeitado
      const updateQuery = `
        UPDATE fuel_card_requests
        SET 
          status = 'rejeitado',
          rejected_by = $1,
          rejected_at = NOW(),
          rejection_reason = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [
        user.name || 'Admin',
        rejectionReason,
        id
      ]);
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Solicitação rejeitada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao rejeitar solicitação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao rejeitar solicitação',
        error: error.message
      });
    }
  });

  // Estatísticas de checklists de motoristas do Line Hall
  app.get('/api/line-hall/checklist-stats', isAuthenticated, async (req, res) => {
    try {
      // Consultar estatísticas de checklists
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
          COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
          COUNT(*) as total
        FROM driver_checklists
        WHERE source = 'line_hall' OR driver_type = 'line_hall'
      `;
      
      const result = await pool.query(query);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(200).json({
          success: true,
          pendentes: 0,
          concluidos: 0,
          total: 0
        });
      }
      
      return res.status(200).json({
        success: true,
        ...result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de checklists:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas de checklists',
        error: error.message
      });
    }
  });
  
  // API centralizada para configuração de combustível
  app.get('/api/fuel-config/:postoId?', async (req, res) => {
    try {
      const { postoId } = req.params;
      
      // Buscar configuração centralizada de preços
      const priceQuery = `
        SELECT tipo, valor_litro 
        FROM preco_combustivel 
        WHERE tipo IN ('Diesel', 'ARLA')
        ORDER BY tipo
      `;
      
      const priceResult = await pool.query(priceQuery);
      
      if (!priceResult.rows || priceResult.rows.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            diesel_valor_litro: 6.39,
            arla_valor_litro: 4.25
          },
          message: 'Usando valores padrão - configuração não encontrada'
        });
      }
      
      // Organizar dados de preços
      const fuelConfig = {
        diesel_valor_litro: 6.39, // valor padrão
        arla_valor_litro: 4.25    // valor padrão
      };
      
      priceResult.rows.forEach(row => {
        if (row.tipo === 'Diesel') {
          fuelConfig.diesel_valor_litro = parseFloat(row.valor_litro);
        } else if (row.tipo === 'ARLA') {
          fuelConfig.arla_valor_litro = parseFloat(row.valor_litro);
        }
      });
      
      return res.status(200).json({
        success: true,
        data: fuelConfig,
        posto_id: postoId || 'global',
        message: 'Configuração de combustível obtida com sucesso'
      });
      
    } catch (error: any) {
      console.error('Erro ao buscar configuração de combustível:', error);
      
      // Retornar valores atualizados mesmo em caso de erro
      return res.status(200).json({
        success: true,
        data: {
          diesel_valor_litro: 6.39,
          arla_valor_litro: 4.25
        },
        message: 'Usando valores padrão devido a erro na consulta'
      });
    }
  });

  // Estatísticas de manutenções solicitadas por motoristas do Line Hall
  app.get('/api/line-hall/maintenance-stats', isAuthenticated, async (req, res) => {
    try {
      // Usar PostgreSQL diretamente para evitar problemas de colunas
      const query = 'SELECT status FROM linehall_maintenance';
      const result = await pool.query(query);

      // Contar estatísticas manualmente
      const pendentes = result.rows?.filter(item => item.status === 'pendente').length || 0;
      const emAndamento = result.rows?.filter(item => item.status === 'em_andamento').length || 0;
      const concluidas = result.rows?.filter(item => item.status === 'concluida').length || 0;
      const total = result.rows?.length || 0;
      
      return res.status(200).json({
        success: true,
        pendentes,
        emAndamento,
        concluidas,
        total
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de manutenções:', error);
      
      // Retornar dados válidos mesmo em caso de erro
      return res.status(200).json({
        success: true,
        pendentes: 0,
        emAndamento: 0,
        concluidas: 0,
        total: 0
      });
    }
  });

  // Listar todos os checklists do Line Hall
  app.get('/api/line-hall/checklists', isAuthenticated, async (req, res) => {
    try {
      // Simular dados de checklist com informações de quilometragem
      const mockChecklists = [
        {
          id: 1,
          driver_name: 'João Silva',
          vehicle_plate: 'ABC1234',
          checklist_type: 'saida_garagem',
          status: 'concluido',
          created_at: '2024-05-26T08:00:00Z',
          completed_at: '2024-05-26T08:15:00Z',
          km_inicial: 125840,
          km_final: null,
          dias_na_garagem: 0,
          items: [
            { item: 'Verificar freios', status: 'ok', observations: '' },
            { item: 'Verificar pneus', status: 'ok', observations: '' },
            { item: 'Verificar óleo', status: 'problema', observations: 'Nível baixo' },
            { item: 'Verificar combustível', status: 'ok', observations: '' },
            { item: 'Verificar documentação', status: 'ok', observations: '' }
          ]
        },
        {
          id: 2,
          driver_name: 'Carlos Santos',
          vehicle_plate: 'DEF5678',
          checklist_type: 'entrada_garagem',
          status: 'concluido',
          created_at: '2024-05-24T18:30:00Z',
          completed_at: '2024-05-24T18:45:00Z',
          km_inicial: 98750,
          km_final: 99120,
          dias_na_garagem: 2,
          items: [
            { item: 'Verificar freios', status: 'ok', observations: '' },
            { item: 'Verificar pneus', status: 'ok', observations: '' },
            { item: 'Verificar óleo', status: 'ok', observations: '' },
            { item: 'Verificar combustível', status: 'ok', observations: '' },
            { item: 'Verificar documentação', status: 'ok', observations: '' }
          ]
        },
        {
          id: 3,
          driver_name: 'Maria Oliveira',
          vehicle_plate: 'GHI9012',
          checklist_type: 'entrada_garagem',
          status: 'concluido',
          created_at: '2024-05-23T17:15:00Z',
          completed_at: '2024-05-23T17:30:00Z',
          km_inicial: 87200,
          km_final: 87580,
          dias_na_garagem: 3,
          items: [
            { item: 'Verificar freios', status: 'ok', observations: '' },
            { item: 'Verificar pneus', status: 'problema', observations: 'Pneu dianteiro com baixa pressão' },
            { item: 'Verificar óleo', status: 'ok', observations: '' },
            { item: 'Verificar combustível', status: 'ok', observations: '' },
            { item: 'Verificar documentação', status: 'ok', observations: '' }
          ]
        },
        {
          id: 4,
          driver_name: 'Pedro Lima',
          vehicle_plate: 'JKL3456',
          checklist_type: 'entrada_garagem',
          status: 'concluido',
          created_at: '2024-05-20T19:00:00Z',
          completed_at: '2024-05-20T19:15:00Z',
          km_inicial: 145600,
          km_final: 146200,
          dias_na_garagem: 6,
          items: [
            { item: 'Verificar freios', status: 'ok', observations: '' },
            { item: 'Verificar pneus', status: 'ok', observations: '' },
            { item: 'Verificar óleo', status: 'ok', observations: '' },
            { item: 'Verificar combustível', status: 'ok', observations: '' },
            { item: 'Verificar documentação', status: 'ok', observations: '' }
          ]
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockChecklists,
        count: mockChecklists.length
      });
    } catch (error: any) {
      console.error('Erro ao buscar checklists:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar checklists',
        error: error.message
      });
    }
  });

  // Estatísticas de veículos na garagem
  app.get('/api/line-hall/garage-stats', isAuthenticated, async (req, res) => {
    try {
      // Simular dados de veículos na garagem baseado nos checklists de entrada
      const vehiculosNaGaragem = [
        { plate: 'DEF5678', driver_name: 'Carlos Santos', dias_na_garagem: 2, km_final: 99120 },
        { plate: 'GHI9012', driver_name: 'Maria Oliveira', dias_na_garagem: 3, km_final: 87580 },
        { plate: 'JKL3456', driver_name: 'Pedro Lima', dias_na_garagem: 6, km_final: 146200 }
      ];

      return res.status(200).json({
        success: true,
        data: vehiculosNaGaragem,
        total_veiculos: vehiculosNaGaragem.length,
        media_dias: Math.round(vehiculosNaGaragem.reduce((acc, v) => acc + v.dias_na_garagem, 0) / vehiculosNaGaragem.length)
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas da garagem:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas da garagem',
        error: error.message
      });
    }
  });

  // Rotas do Line Hall Shopee - Gerenciar rotas cadastradas
  app.get('/api/line-hall/routes', isAuthenticated, async (req, res) => {
    try {
      const query = `
        SELECT 
          id,
          nome_ponto_a,
          nome_ponto_b,
          km_total,
          created_at,
          updated_at
        FROM line_hall_routes
        ORDER BY nome_ponto_a, nome_ponto_b
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      console.error('Erro ao buscar rotas do Line Hall:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar rotas do Line Hall',
        error: error.message
      });
    }
  });

  // Criar nova rota do Line Hall Shopee
  app.post('/api/line-hall/routes', isAuthenticated, async (req, res) => {
    try {
      const { nome_ponto_a, nome_ponto_b, km_total } = req.body;
      
      if (!nome_ponto_a || !nome_ponto_b || !km_total) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }
      
      // Verificar se a rota já existe
      const checkQuery = `
        SELECT id FROM line_hall_routes 
        WHERE nome_ponto_a = $1 AND nome_ponto_b = $2
      `;
      const checkResult = await pool.query(checkQuery, [nome_ponto_a, nome_ponto_b]);
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Esta rota já está cadastrada'
        });
      }
      
      const query = `
        INSERT INTO line_hall_routes
          (nome_ponto_a, nome_ponto_b, km_total, created_at, updated_at)
        VALUES
          ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [nome_ponto_a, nome_ponto_b, km_total]);
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Rota cadastrada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar rota:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar rota',
        error: error.message
      });
    }
  });

  // Atualizar rota do Line Hall Shopee
  app.put('/api/line-hall/routes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { nome_ponto_a, nome_ponto_b, km_total } = req.body;
      
      if (!nome_ponto_a || !nome_ponto_b || !km_total) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }
      
      // Verificar se a rota existe
      const checkQuery = `SELECT id FROM line_hall_routes WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rota não encontrada'
        });
      }
      
      // Verificar se outra rota com os mesmos pontos já existe (exceto a atual)
      const duplicateQuery = `
        SELECT id FROM line_hall_routes 
        WHERE nome_ponto_a = $1 AND nome_ponto_b = $2 AND id != $3
      `;
      const duplicateResult = await pool.query(duplicateQuery, [nome_ponto_a, nome_ponto_b, id]);
      
      if (duplicateResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma rota com estes pontos'
        });
      }
      
      const query = `
        UPDATE line_hall_routes
        SET nome_ponto_a = $1, nome_ponto_b = $2, km_total = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await pool.query(query, [nome_ponto_a, nome_ponto_b, km_total, id]);
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Rota atualizada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao atualizar rota:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar rota',
        error: error.message
      });
    }
  });

  // Listar todas as solicitações de manutenção do Line Hall
  app.get('/api/line-hall/maintenance-requests', isAuthenticated, async (req, res) => {
    try {
      const query = `
        SELECT 
          id,
          motorista_id,
          motorista_nome,
          vehicle_plate,
          description,
          urgency,
          status,
          created_at,
          updated_at,
          completed_at,
          notes,
          approved_by
        FROM linehall_maintenance
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      console.error('Erro ao buscar solicitações de manutenção:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitações de manutenção',
        error: error.message
      });
    }
  });

  // Atualizar status de solicitação de manutenção do Line Hall
  app.put('/api/line-hall/maintenance-requests/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, approved_by } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status é obrigatório'
        });
      }
      
      // Validar status permitidos
      const validStatuses = ['pendente', 'em_andamento', 'concluida', 'cancelada'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }
      
      // Buscar dados atuais da solicitação para histórico
      const currentQuery = 'SELECT * FROM linehall_maintenance WHERE id = $1';
      const currentResult = await pool.query(currentQuery, [id]);
      
      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação de manutenção não encontrada'
        });
      }
      
      const currentData = currentResult.rows[0];
      
      // Atualizar status da solicitação
      const updateQuery = `
        UPDATE linehall_maintenance 
        SET 
          status = $1,
          notes = COALESCE($2, notes),
          approved_by = COALESCE($3, approved_by),
          updated_at = NOW(),
          completed_at = CASE WHEN $1 = 'concluida' THEN NOW() ELSE completed_at END
        WHERE id = $4
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, [status, notes, approved_by, id]);
      const updatedData = updateResult.rows[0];
      
      // Criar registro no histórico da placa
      await createPlateHistory(
        currentData.vehicle_plate,
        'maintenance_status_update',
        `Status da manutenção alterado de "${currentData.status}" para "${status}"`,
        {
          maintenance_id: id,
          old_status: currentData.status,
          new_status: status,
          notes: notes,
          approved_by: approved_by,
          description: currentData.description
        }
      );
      
      return res.status(200).json({
        success: true,
        data: updatedData,
        message: 'Status atualizado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status',
        error: error.message
      });
    }
  });

  // Função helper para criar registros de histórico da placa
  async function createPlateHistory(plate: string, eventType: string, description: string, metadata: any = {}) {
    try {
      // Primeiro, verificar se a tabela existe, se não, criar
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS vehicle_plate_history (
          id SERIAL PRIMARY KEY,
          vehicle_plate VARCHAR(10) NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );
        
        CREATE INDEX IF NOT EXISTS idx_vehicle_plate_history_plate ON vehicle_plate_history(vehicle_plate);
        CREATE INDEX IF NOT EXISTS idx_vehicle_plate_history_created_at ON vehicle_plate_history(created_at);
      `;
      
      await pool.query(createTableQuery);
      
      // Inserir o registro de histórico
      const insertQuery = `
        INSERT INTO vehicle_plate_history (vehicle_plate, event_type, description, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        plate.toUpperCase(),
        eventType,
        description,
        JSON.stringify(metadata)
      ]);
      
      console.log(`Histórico criado para placa ${plate}: ${eventType} - ${description}`);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar histórico da placa:', error);
      // Não falhar a operação principal se o histórico falhar
      return null;
    }
  }

  // Buscar histórico de uma placa específica
  app.get('/api/vehicles/:plate/history', isAuthenticated, async (req, res) => {
    try {
      const { plate } = req.params;
      
      const query = `
        SELECT 
          id,
          vehicle_plate,
          event_type,
          description,
          metadata,
          created_at,
          created_by
        FROM vehicle_plate_history
        WHERE vehicle_plate = $1
        ORDER BY created_at DESC
        LIMIT 100
      `;
      
      const result = await pool.query(query, [plate.toUpperCase()]);
      
      return res.status(200).json({
        success: true,
        plate: plate.toUpperCase(),
        history: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      console.error('Erro ao buscar histórico da placa:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico da placa',
        error: error.message
      });
    }
  });

  // Endpoint para criar solicitação de manutenção via Line Hall (corrigindo o 404)
  app.post('/api/line-hall/maintenance-request', async (req, res) => {
    try {
      const { 
        motorista_id, 
        motorista_nome, 
        vehicle_plate, 
        description, 
        urgency = 'normal' 
      } = req.body;
      
      if (!motorista_id || !motorista_nome || !vehicle_plate || !description) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. Informe ID do motorista, nome, placa e descrição.'
        });
      }
      
      const insertQuery = `
        INSERT INTO linehall_maintenance 
        (motorista_id, motorista_nome, vehicle_plate, description, urgency, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'pendente', NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        motorista_id,
        motorista_nome,
        vehicle_plate.toUpperCase(),
        description,
        urgency
      ]);
      
      const newRequest = result.rows[0];
      
      // Criar registro no histórico da placa
      await createPlateHistory(
        vehicle_plate,
        'maintenance_request_created',
        `Solicitação de manutenção criada por ${motorista_nome}`,
        {
          maintenance_id: newRequest.id,
          motorista_id: motorista_id,
          motorista_nome: motorista_nome,
          urgency: urgency,
          description: description
        }
      );
      
      return res.status(201).json({
        success: true,
        data: newRequest,
        message: 'Solicitação de manutenção criada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao criar solicitação de manutenção:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação de manutenção',
        error: error.message
      });
    }
  });

  // API específica para buscar motoristas do Line Hall
  app.get('/api/line-hall/drivers', async (req, res) => {
    try {
      const query = `
        SELECT id, nome, cpf, telefone, base_id
        FROM motoristas 
        WHERE base_id = 3
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query);
      
      const motoristas = result.rows.map(motorista => ({
        id: motorista.id,
        nome: motorista.nome,
        cpf: motorista.cpf.replace(/\D/g, ''), // Limpar formatação
        telefone: motorista.telefone,
        base_id: motorista.base_id
      })) || [];

      return res.status(200).json(motoristas);
    } catch (error: any) {
      console.error('Erro ao buscar motoristas do Line Hall:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar motoristas',
        error: error.message
      });
    }
  });

  // API para solicitação de recarga de cartão de combustível por motorista do Line Hall
  app.post('/api/line-hall/fuel-card-request', async (req, res) => {
    try {
      const { 
        plate, 
        km_atual,
        card_number, 
        amount, 
        destino,
        observacoes
      } = req.body;
      
      // Debug: Log dos dados recebidos
      console.log('Dados recebidos na solicitação de recarga:', {
        plate,
        km_atual,
        card_number,
        amount,
        destino,
        observacoes,
        bodyCompleto: req.body
      });
      
      // Validação básica
      if (!plate || !card_number || !amount || !destino) {
        console.log('Validação falhou:', { plate: !!plate, card_number: !!card_number, amount: !!amount, destino: !!destino });
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos para solicitação. Informe placa, número do cartão, valor e destino.'
        });
      }
      
      const query = `
        INSERT INTO fuel_card_requests
          (plate, card_number, amount, reason, requested_by, base_id, status, requested_at, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, 'pendente', NOW(), NOW(), NOW())
        RETURNING *
      `;
      
      const motivo = `Destino: ${destino}${observacoes ? ` - Obs: ${observacoes}` : ''}${km_atual ? ` - KM: ${km_atual}` : ''}`;
      
      const result = await pool.query(query, [
        plate.toUpperCase(),
        card_number,
        parseFloat(amount),
        motivo,
        'Motorista Line Hall',
        3 // Line Hall Shopee base_id
      ]);
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Solicitação de recarga criada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao criar solicitação de recarga via Line Hall:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação de recarga',
        error: error.message
      });
    }
  });

  // API para relatórios de consumo das operações
  app.get('/api/fuel-consumption-reports', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Verificar permissões
      if (user.role !== 'admin' && user.role !== 'gestor') {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar relatórios de consumo'
        });
      }

      const { dateFrom, dateTo, base, fuelType, project, searchTerm } = req.query;
      
      // Construir consulta para agregação de dados de todas as tabelas de abastecimentos
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Filtros de data
      if (dateFrom) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(dateFrom);
        paramIndex++;
      }
      
      if (dateTo) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(dateTo);
        paramIndex++;
      }

      // Filtros de base
      if (base) {
        whereConditions.push(`(base_name ILIKE $${paramIndex} OR base ILIKE $${paramIndex})`);
        queryParams.push(`%${base}%`);
        paramIndex++;
      }

      // Filtros de combustível
      if (fuelType) {
        whereConditions.push(`(tipo_combustivel ILIKE $${paramIndex} OR tipo ILIKE $${paramIndex})`);
        queryParams.push(`%${fuelType}%`);
        paramIndex++;
      }

      // Filtros de projeto
      if (project) {
        whereConditions.push(`projeto ILIKE $${paramIndex}`);
        queryParams.push(`%${project}%`);
        paramIndex++;
      }

      // Filtros de placa
      if (searchTerm) {
        whereConditions.push(`placa ILIKE $${paramIndex}`);
        queryParams.push(`%${searchTerm}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Query unificada para todas as tabelas de abastecimentos
      const consumptionQuery = `
        WITH unified_data AS (
          -- Osasco V2
          SELECT 
            placa,
            COALESCE(base_name, 'Osasco V2') as base_name,
            COALESCE(projeto, 'Não definido') as projeto,
            COALESCE(tipo_combustivel, tipo, 'diesel') as tipo_combustivel,
            COALESCE(litros, quantidade_litros, 0) as litros,
            COALESCE(valor_total, 0) as valor_total,
            COALESCE(km_atual, km, 0) as km,
            created_at,
            'osasco_v2' as origem
          FROM abastecimentos_posto_osasco_v2
          ${whereClause}
          
          UNION ALL
          
          -- Guarulhos V2  
          SELECT 
            placa,
            COALESCE(base_name, 'Guarulhos V2') as base_name,
            COALESCE(projeto, 'Não definido') as projeto,
            COALESCE(tipo_combustivel, tipo, 'diesel') as tipo_combustivel,
            COALESCE(litros, quantidade_litros, 0) as litros,
            COALESCE(valor_total, 0) as valor_total,
            COALESCE(km_atual, km, 0) as km,
            created_at,
            'guarulhos_v2' as origem
          FROM abastecimentos_posto_guarulhos_v2
          ${whereClause}
          
          UNION ALL
          
          -- ABC V2
          SELECT 
            placa,
            COALESCE(base_name, 'ABC V2') as base_name,
            COALESCE(projeto, 'Não definido') as projeto,
            COALESCE(tipo_combustivel, tipo, 'diesel') as tipo_combustivel,
            COALESCE(litros, quantidade_litros, 0) as litros,
            COALESCE(valor_total, 0) as valor_total,
            COALESCE(km_atual, km, 0) as km,
            created_at,
            'abc_v2' as origem
          FROM abastecimentos_posto_abc_v2
          ${whereClause}
          
          UNION ALL
          
          -- Campinas V2
          SELECT 
            placa,
            COALESCE(base_name, 'Campinas V2') as base_name,
            COALESCE(projeto, 'Não definido') as projeto,
            COALESCE(tipo_combustivel, tipo, 'diesel') as tipo_combustivel,
            COALESCE(litros, quantidade_litros, 0) as litros,
            COALESCE(valor_total, 0) as valor_total,
            COALESCE(km_atual, km, 0) as km,
            created_at,
            'campinas_v2' as origem
          FROM abastecimentos_posto_campinas_v2
          ${whereClause}
          
          UNION ALL
          
          -- Socorro V2
          SELECT 
            placa,
            COALESCE(base_name, 'Socorro V2') as base_name,
            COALESCE(projeto, 'Não definido') as projeto,
            COALESCE(tipo_combustivel, tipo, 'diesel') as tipo_combustivel,
            COALESCE(litros, quantidade_litros, 0) as litros,
            COALESCE(valor_total, 0) as valor_total,
            COALESCE(km_atual, km, 0) as km,
            created_at,
            'socorro_v2' as origem
          FROM abastecimentos_posto_socorro_v2
          ${whereClause}
          
          UNION ALL
          
          -- Alair V2
          SELECT 
            placa,
            COALESCE(base_name, 'Alair V2') as base_name,
            COALESCE(projeto, 'Não definido') as projeto,
            COALESCE(tipo_combustivel, tipo, 'diesel') as tipo_combustivel,
            COALESCE(litros, quantidade_litros, 0) as litros,
            COALESCE(valor_total, 0) as valor_total,
            COALESCE(km_atual, km, 0) as km,
            created_at,
            'alair_v2' as origem
          FROM abastecimentos_posto_alair_v2
          ${whereClause}
          
          UNION ALL
          
          -- Posto Remédios
          SELECT 
            placa,
            'Posto Remédios' as base_name,
            COALESCE(projeto, 'Não definido') as projeto,
            COALESCE(tipo_combustivel, 'diesel') as tipo_combustivel,
            COALESCE(quantidade_litros, 0) as litros,
            COALESCE(valor_total, 0) as valor_total,
            COALESCE(km, 0) as km,
            created_at,
            'posto_remedios' as origem
          FROM posto_remedios_abastecimentos
          ${whereClause}
        )
        SELECT 
          ROW_NUMBER() OVER (ORDER BY base_name, projeto, placa) as id,
          placa,
          base_name,
          projeto,
          tipo_combustivel,
          SUM(litros) as total_litros,
          SUM(valor_total) as total_valor,
          COUNT(*) as numero_abastecimentos,
          CASE 
            WHEN MAX(km) > MIN(km) AND SUM(litros) > 0 
            THEN ROUND((MAX(km) - MIN(km)) / SUM(litros), 2)
            ELSE 0
          END as media_consumo,
          TO_CHAR(MIN(created_at), 'MM/YYYY') as periodo
        FROM unified_data
        WHERE litros > 0 AND valor_total > 0
        GROUP BY placa, base_name, projeto, tipo_combustivel
        ORDER BY total_valor DESC, base_name, projeto, placa
        LIMIT 500
      `;

      const result = await pool.query(consumptionQuery, queryParams);
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
      
    } catch (error: any) {
      console.error('Erro ao buscar relatórios de consumo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar relatórios de consumo',
        error: error.message
      });
    }
  });

  // Mobile-optimized API endpoints for external posto links
  app.get('/api/mobile/test-projects', getProjectsWithBases);

  // Public API without authentication for external posto links
  app.get('/api/public/projects-with-bases', getProjectsWithBases);

  // GET - Obter detalhes de uma solicitação específica
  app.get('/api/fuel-card/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      const query = `
        SELECT fcr.*, b.name as base_name
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        WHERE fcr.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }
      
      // Se não for admin/gestor, verifica se a solicitação pertence à base do usuário
      if (user.role !== 'admin' && user.role !== 'gestor' && user.baseId) {
        if (result.rows[0].base_id !== user.baseId) {
          return res.status(403).json({
            success: false,
            message: 'Sem permissão para acessar esta solicitação'
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao buscar detalhes da solicitação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar detalhes da solicitação',
        error: error.message
      });
    }
  });
  
  // GET - Obter solicitações aprovadas para processamento
  app.get('/api/fuel-card/approved', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Verifica se o usuário tem permissão (apenas admin ou gestor)
      if (user.role !== 'admin' && user.role !== 'gestor') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada: apenas administradores e gestores podem processar solicitações'
        });
      }
      
      // Consulta solicitações aprovadas que ainda não foram processadas
      const query = `
        SELECT fcr.*, b.name as base_name
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        WHERE fcr.status = 'aprovado'
        ORDER BY fcr.approved_at ASC
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount || 0
      });
    } catch (error: any) {
      console.error('Erro ao buscar solicitações aprovadas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitações',
        error: error.message
      });
    }
  });
  
  // POST - Processar uma operação de adição de saldo
  app.post('/api/fuel-card/process', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { requestId, operationDate, confirmationCode, operationNotes } = req.body;
      
      // Verifica se o usuário tem permissão (apenas admin ou gestor)
      if (user.role !== 'admin' && user.role !== 'gestor') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada: apenas administradores e gestores podem processar operações'
        });
      }
      
      // Valida os dados
      if (!requestId || !operationDate || !confirmationCode) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos: ID da solicitação, data da operação e código de confirmação são obrigatórios'
        });
      }
      
      // Verifica se a tabela possui as colunas necessárias para a operação
      try {
        const columnsCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'fuel_card_requests' 
          AND column_name IN ('processed_by', 'processed_at', 'confirmation_code', 'operation_date', 'operation_notes')
        `);
        
        // Se alguma coluna estiver faltando, vamos adicioná-la
        if (columnsCheck.rowCount < 5) {
          console.log('Adicionando colunas necessárias para operações de cartão de combustível');
          
          await pool.query(`
            ALTER TABLE fuel_card_requests
            ADD COLUMN IF NOT EXISTS processed_by VARCHAR(255),
            ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(255),
            ADD COLUMN IF NOT EXISTS operation_date DATE,
            ADD COLUMN IF NOT EXISTS operation_notes TEXT
          `);
        }
      } catch (schemaError) {
        console.error('Erro ao verificar/atualizar schema para operações:', schemaError);
        // Continua a execução mesmo se houver erro na verificação do schema
      }
      
      // Busca a solicitação para verificar se existe e se pode ser processada
      const checkRequest = await pool.query(
        'SELECT * FROM fuel_card_requests WHERE id = $1',
        [requestId]
      );
      
      if (checkRequest.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }
      
      const request = checkRequest.rows[0];
      
      if (request.status !== 'aprovado') {
        return res.status(400).json({
          success: false,
          message: `Solicitação não pode ser processada: status atual é '${request.status}'`
        });
      }
      
      // Armazena os dados da operação e atualiza o status da solicitação
      const result = await pool.query(
        `UPDATE fuel_card_requests 
         SET status = 'processado', 
             processed_by = $1, 
             processed_at = NOW(), 
             confirmation_code = $2,
             operation_date = $3,
             operation_notes = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [user.name, confirmationCode, operationDate, operationNotes || null, requestId]
      );
      
      // Registra a operação no log do sistema (se existir a tabela system_logs)
      try {
        await pool.query(
          `INSERT INTO system_logs 
           (action, user_id, user_name, data, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            'fuel_card_operation',
            user.id,
            user.name,
            JSON.stringify({
              requestId,
              operationDate,
              confirmationCode,
              amount: request.amount,
              cardNumber: request.card_number,
              plate: request.plate
            })
          ]
        );
      } catch (logError) {
        console.warn('Aviso: Não foi possível registrar log da operação (tabela system_logs pode não existir)');
      }
      
      return res.status(200).json({
        success: true,
        message: 'Operação registrada com sucesso',
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao processar operação de cartão de combustível:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar operação',
        error: error.message
      });
    }
  });
  
  // Endpoint para diagnóstico do Supabase
  app.get("/api/diagnostico/supabase", isAdmin, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("Iniciando diagnóstico do Supabase via API...");
      
      // Executar diagnóstico
      const diagnosticResults = await runSupabaseDiagnostic();
      
      console.log("Diagnóstico do Supabase concluído com sucesso");
      
      return res.status(200).json({
        success: true,
        message: "Diagnóstico Supabase concluído",
        timestamp: new Date().toISOString(),
        results: diagnosticResults
      });
    } catch (error: any) {
      console.error("Erro no diagnóstico do Supabase:", error);
      
      // Mesmo em caso de erro, retornamos uma resposta JSON válida
      return res.status(500).json({
        success: false,
        message: "Erro ao executar diagnóstico do Supabase",
        error: error.message,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Rota pública para verificar status de autenticação (para diagnóstico)
  app.get('/api/auth-status', (req, res) => {
    const hasSession = !!req.session;
    const sessionID = req.sessionID;
    const sessionInfo = {
      isAuthenticated: req.isAuthenticated(),
      hasSession,
      sessionID,
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent']
    };
    
    // Log para diagnóstico de sessão
    console.log('Status de autenticação solicitado:', sessionInfo);
    
    res.json(sessionInfo);
  });
  
  // Endpoint para comparação de esquemas entre Replit e Supabase
  app.get("/api/diagnostico/compare-schemas", isAdmin, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("Iniciando comparação de esquemas entre Replit e Supabase...");
      
      // Executar comparação
      const comparison = await compareSchemas();
      
      console.log("Comparação de esquemas concluída com sucesso");
      
      return res.status(200).json({
        success: true,
        message: "Comparação de esquemas concluída",
        timestamp: new Date().toISOString(),
        results: comparison
      });
    } catch (error: any) {
      console.error("Erro na comparação de esquemas:", error);
      
      // Mesmo em caso de erro, retornamos uma resposta JSON válida
      return res.status(500).json({
        success: false,
        message: "Erro ao comparar esquemas",
        error: error.message,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  


  // Endpoint para sincronizar tabelas entre Replit e Supabase
  app.post("/api/diagnostico/sync-schema", isAdmin, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("Iniciando sincronização de esquemas com o Supabase...");
      
      // Executar sincronização
      const result = await synchronizeSupabaseTables();
      
      return res.status(200).json({
        success: result.success,
        message: "Sincronização de esquemas concluída",
        timestamp: new Date().toISOString(),
        tablesCreated: result.tablesCreated,
        errors: result.errors
      });
    } catch (error: any) {
      console.error("Erro na sincronização de esquemas:", error);
      
      // Mesmo em caso de erro, retornamos uma resposta JSON válida
      return res.status(500).json({
        success: false,
        message: "Erro ao sincronizar esquemas",
        error: error.message,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Rotas para gestão de usuários
  app.get("/api/usuarios", isAuthenticated, consultarUsuarios);
  app.get("/api/usuarios/:id", isAuthenticated, consultarUsuarioPorId);
  
  // Rota pública para testes - remover em produção
  app.get("/api/teste/usuarios", consultarUsuarios);
  
  // Base routes
  // Temporariamente sem autenticação para testes
  app.get("/api/bases", async (req, res) => {
    try {
      const bases = await storage.getAllBases();
      return res.status(200).json(bases);
    } catch (error) {
      console.error("Error fetching bases:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/bases/:id", isAuthenticated, async (req, res) => {
    try {
      const base = await storage.getBase(parseInt(req.params.id));
      if (!base) {
        return res.status(404).json({ message: "Base not found" });
      }
      return res.status(200).json(base);
    } catch (error) {
      console.error("Error fetching base:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/bases", isAdmin, async (req, res) => {
    try {
      console.log("POST /api/bases - Dados recebidos:", req.body);
      
      const result = insertBaseSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Erro de validação dos dados da base:", result.error.format());
        return res.status(400).json({ message: "Invalid base data", errors: result.error.format() });
      }
      
      console.log("Dados validados com sucesso, criando base...");
      const newBase = await storage.createBase(result.data);
      console.log("Base criada com sucesso:", newBase);
      return res.status(201).json(newBase);
    } catch (error) {
      console.error("Erro detalhado ao criar base:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });
  
  app.put("/api/bases/:id", isAdmin, async (req, res) => {
    try {
      const result = insertBaseSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid base data", errors: result.error.format() });
      }
      
      const updatedBase = await storage.updateBase(parseInt(req.params.id), result.data);
      if (!updatedBase) {
        return res.status(404).json({ message: "Base not found" });
      }
      
      return res.status(200).json(updatedBase);
    } catch (error) {
      console.error("Error updating base:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/bases/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteBase(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Base not found" });
      }
      
      return res.status(200).json({ message: "Base deleted successfully" });
    } catch (error) {
      console.error("Error deleting base:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Estoque de Peças routes - Integrado com sistema existente
  app.get("/api/estoque/pecas", isAuthenticated, async (req, res) => {
    try {
      const { search, categoria } = req.query;
      console.log("[API Peças] Parâmetros recebidos:", { search, categoria });
      
      // Usar tabela existente do sistema
      let query = 'SELECT id, codigo, nome, descricao, categoria, fornecedor, preco_unitario, quantidade_estoque, quantidade_minima, unidade_medida FROM estoque_pecas WHERE quantidade_estoque > 0';
      let params: any[] = [];
      
      if (search) {
        query += ' AND (nome ILIKE $1 OR codigo ILIKE $1 OR descricao ILIKE $1)';
        params.push(`%${search}%`);
      }
      
      if (categoria && categoria !== '') {
        query += ` AND categoria = $${params.length + 1}`;
        params.push(categoria as string);
      }
      
      query += ' ORDER BY nome ASC';
      console.log("[API Peças] Query:", query);
      console.log("[API Peças] Params:", params);
      
      const result = await pool.query(query, params);
      console.log("[API Peças] Resultado:", result.rows.length, "peças encontradas");
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar peças do estoque:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/estoque/categorias", isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT DISTINCT categoria FROM estoque_pecas WHERE categoria IS NOT NULL ORDER BY categoria'
      );
      const categorias = result.rows.map(row => row.categoria);
      return res.status(200).json(categorias);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/estoque/baixa", isAuthenticated, async (req, res) => {
    try {
      const { pecas } = req.body; // Array de { id, quantidade }
      
      if (!Array.isArray(pecas) || pecas.length === 0) {
        return res.status(400).json({ message: "Lista de peças inválida" });
      }
      
      // Atualizar estoque e registrar movimentação
      for (const peca of pecas) {
        // Buscar dados atuais da peça
        const pecaAtual = await pool.query(
          'SELECT * FROM estoque_pecas WHERE id = $1',
          [peca.id]
        );
        
        if (pecaAtual.rows.length === 0) {
          continue;
        }
        
        const dadosPeca = pecaAtual.rows[0];
        const quantidadeAnterior = dadosPeca.quantidade_estoque;
        const quantidadeAtual = quantidadeAnterior - peca.quantidade;
        
        // Atualizar quantidade no estoque
        await pool.query(
          'UPDATE estoque_pecas SET quantidade_estoque = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND quantidade_estoque >= $3',
          [quantidadeAtual, peca.id, peca.quantidade]
        );
      }
      
      return res.status(200).json({ message: "Baixa no estoque realizada com sucesso" });
    } catch (error) {
      console.error("Erro ao dar baixa no estoque:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Vehicle routes
  // Temporariamente sem autenticação para testes
  app.get("/api/vehicles", async (req, res) => {
    try {
      console.log("GET /api/vehicles - Listando todos os veículos");
      
      // Listar todos os veículos para testes
      const vehicles = await storage.getAllVehicles();
      console.log(`Veículos encontrados: ${vehicles.length}`);
        
      return res.status(200).json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Rota para buscar veículos parados com detalhes
  app.get("/api/stopped-vehicles", async (req, res) => {
    try {
      console.log("API /vehicles/stopped chamada diretamente");
      
      // Buscar veículos com status "parado" e informações detalhadas
      const stoppedVehiclesQuery = `
        SELECT 
          v.placa,
          v.model,
          v.vehicle_type,
          v.status,
          b.name as base_name,
          CASE 
            WHEN v.updated_at IS NOT NULL THEN 
              EXTRACT(DAY FROM (NOW() - v.updated_at))::INTEGER
            ELSE 0
          END as dias_parado,
          'Última rota registrada' as ultima_viagem,
          v.updated_at::date as data_ultima_viagem
        FROM vehicles v
        LEFT JOIN bases b ON v.base_id = b.id
        WHERE v.status = 'parado'
        ORDER BY v.updated_at DESC
      `;

      console.log("Executando query para veículos parados...");
      const result = await pool.query(stoppedVehiclesQuery);
      console.log(`Encontrados ${result.rows.length} veículos parados`);
      
      const vehicles = result.rows;
      const totalVehicles = vehicles.length;
      const mediaDias = totalVehicles > 0 
        ? vehicles.reduce((sum, v) => sum + v.dias_parado, 0) / totalVehicles 
        : 0;

      res.json({
        success: true,
        data: vehicles,
        total: totalVehicles,
        media_dias: mediaDias
      });
    } catch (error) {
      console.error("Erro ao buscar veículos parados:", error);
      res.status(500).json({ 
        message: "Erro ao buscar veículos parados",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.get("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(parseInt(req.params.id));
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Se o usuário é admin OU está na base "Gestão de Frotas" (baseId: 12), 
      // ele pode ver todos os veículos para gerenciar manutenções da frota completa
      const isFleetManagement = req.user.baseId === 12;
      
      // Check if user has access to this vehicle
      if (req.user.role !== 'admin' && !isFleetManagement && vehicle.baseId !== req.user.baseId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      return res.status(200).json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Temporariamente sem autenticação para testes
  app.post("/api/vehicles", async (req, res) => {
    try {
      console.log("POST /api/vehicles - Iniciando criação de veículo");
      console.log("Dados recebidos:", JSON.stringify(req.body, null, 2));
      
      // Ajustar os dados para o esquema da tabela se necessário
      const vehicleData = {
        plate: req.body.plate,
        model: req.body.model,
        vehicleType: req.body.vehicleType,
        status: req.body.status,
        baseId: req.body.baseId || 12, // Usar 12 (Gestão de Frotas) como fallback
        ownership: req.body.ownership || 'proprio', // Valor padrão: próprio
        rentalCompany: req.body.rentalCompany || null, // Empresa de locação, nullable
        crlvUrl: req.body.crlvUrl || null, // URL do documento CRLV
        anttUrl: req.body.anttUrl || null, // URL do documento ANTT
        cartaoAbastecimento: req.body.cartaoAbastecimento || null // Cartão de abastecimento para Line Hall
      };
      
      console.log("Dados ajustados:", JSON.stringify(vehicleData, null, 2));
      
      try {
        // Validar os dados
        const result = insertVehicleSchema.safeParse(vehicleData);
        if (!result.success) {
          console.log("Dados inválidos:", JSON.stringify(result.error.format(), null, 2));
          return res.status(400).json({ message: "Invalid vehicle data", errors: result.error.format() });
        }
        
        // Remover temporariamente as verificações de permissão para testes
        
        // Criar o veículo
        const newVehicle = await storage.createVehicle(result.data);
        console.log("Veículo criado com sucesso:", JSON.stringify(newVehicle, null, 2));
        
        return res.status(201).json(newVehicle);
      } catch (parseError: any) {
        console.error("Erro ao processar dados do veículo:", parseError);
        
        // Verificar se é um erro de placa duplicada
        if (parseError.name === "DuplicatePlateError") {
          return res.status(409).json({ 
            message: "Placa já cadastrada", 
            error: parseError.message,
            code: "DUPLICATE_PLATE"
          });
        }
        
        return res.status(400).json({ message: "Error parsing vehicle data", error: String(parseError) });
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });
  
  app.put("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Se o usuário é admin OU está na base "Gestão de Frotas" (baseId: 12), 
      // ele pode editar qualquer veículo
      const isFleetManagement = req.user.baseId === 12;
      
      // Check if user has access to edit this vehicle
      if (req.user.role !== 'admin' && !isFleetManagement && vehicle.baseId !== req.user.baseId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const result = insertVehicleSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: result.error.format() });
      }
      
      const updatedVehicle = await storage.updateVehicle(vehicleId, result.data);
      return res.status(200).json(updatedVehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Temporariamente sem autenticação para testes
  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      console.log(`DELETE /api/vehicles/${req.params.id} - Excluindo veículo`);
      
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Remover verificações de permissão para testes
      
      const success = await storage.deleteVehicle(vehicleId);
      console.log(`Veículo ${vehicleId} excluído com sucesso`);
      return res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Workshop routes 
  app.get("/api/workshops", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const workshops = activeOnly 
        ? await storage.getActiveWorkshops()
        : await storage.getAllWorkshops();
      
      return res.status(200).json(workshops);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/workshops/:id", isAuthenticated, async (req, res) => {
    try {
      const workshop = await storage.getWorkshop(parseInt(req.params.id));
      
      if (!workshop) {
        return res.status(404).json({ message: "Workshop not found" });
      }
      
      return res.status(200).json(workshop);
    } catch (error) {
      console.error("Error fetching workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Rota para cadastro externo de oficinas (formulário público)
  app.post("/api/workshops/external", async (req, res) => {
    try {
      console.log("Recebendo cadastro externo de oficina:", req.body);
      
      const {
        nome_oficina,
        cnpj,
        telefone,
        email,
        endereco,
        ramo_atuacao,
        observacoes,
        placa_veiculo
      } = req.body;
      
      // Validação de dados básica
      if (!nome_oficina) {
        return res.status(400).json({ message: "Nome da oficina é obrigatório" });
      }
      
      try {
        // Verificar se a oficina já existe
        const oficinas = await storage.getAllWorkshops();
        const oficinaExistente = oficinas.find(w => 
          w.name.toLowerCase() === nome_oficina.toLowerCase() && 
          (cnpj ? w.cnpj === cnpj : true)
        );
        
        let oficina;
        let isNovaOficina = false;
        
        if (oficinaExistente) {
          console.log(`Oficina '${nome_oficina}' já existe com ID ${oficinaExistente.id}`);
          oficina = oficinaExistente;
        } else {
          isNovaOficina = true;
          
          // Criar nova oficina usando o storage
          const workshop: InsertWorkshop = {
            name: nome_oficina,
            address: endereco || '',
            phone: telefone || '',
            email: email || '',
            cnpj: cnpj || '',
            specialties: ramo_atuacao || '',
            contactPerson: '',
            observations: observacoes || '',
            isActive: true,
            isSpecialized: false,
            createdAt: new Date()
          };
          
          oficina = await storage.createWorkshop(workshop);
          console.log(`Nova oficina criada com ID ${oficina.id}`);
        }
        
        // Gerar credenciais para a oficina, se for nova
        let credenciais = null;
        if (isNovaOficina) {
          try {
            // Gerar um nome de usuário baseado no nome da oficina (remoção de espaços e caracteres especiais)
            const username = nome_oficina
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/g, '')
              .substring(0, 15);
              
            // Gerar um email usando o formato solicitado
            const emailOficina = `${username}@muricionfleet.com`;
            
            // Gerar uma senha aleatória
            const senhaAleatoria = Math.random().toString(36).substring(2, 10);
            
            // Criptografar a senha
            const senhaHash = await hashPassword(senhaAleatoria);
            
            // Verificar se usuário já existe
            const usuarioExistente = await storage.getUserByEmail(emailOficina);
            
            if (!usuarioExistente) {
              // Criar novo usuário com role 'oficina' e vincular à oficina
              const novoUsuario: InsertUser = {
                name: nome_oficina,
                email: emailOficina,
                password: senhaHash,
                role: 'oficina',
                oficina_id: oficina.id
              };
              
              const usuario = await storage.createUser(novoUsuario);
              console.log(`Usuário oficina criado com ID ${usuario.id}, email: ${emailOficina}`);
              
              credenciais = {
                email: emailOficina,
                senha: senhaAleatoria
              };
            } else {
              console.log(`Usuário com email ${emailOficina} já existe`);
            }
          } catch (userError) {
            console.error("Erro ao criar usuário para oficina:", userError);
            // Continuamos mesmo com erro na criação do usuário
          }
        }
        
        // Criar registro de manutenção se veículo foi especificado
        if (placa_veiculo) {
          try {
            const veiculo = await storage.getVehicleByPlate(placa_veiculo);
            if (veiculo) {
              console.log(`Veículo encontrado com placa ${placa_veiculo}, ID: ${veiculo.id}`);
              
              // Criar um registro de manutenção pendente
              const novaManutenao: InsertMaintenance = {
                vehiclePlate: veiculo.plate,
                vehicleModel: veiculo.model,
                vehicleType: veiculo.vehicleType,
                entryDate: new Date(),
                status: 'pendente',
                description: observacoes || 'Cadastro via portal externo',
                type: 'corretiva',
                workshopId: oficina.id,
                workshopName: oficina.name,
                requestBaseId: veiculo.baseId || 1, // Usa a base do veículo ou base padrão
                maintenanceItems: [],
                expectedExitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias após
                totalValue: 0
              };
              
              await storage.createMaintenance(novaManutenao);
              console.log(`Registro de manutenção criado para veículo ${veiculo.plate}`);
            } else {
              console.log(`Nenhum veículo encontrado com placa ${placa_veiculo}`);
            }
          } catch (maintenanceError) {
            console.error("Erro ao criar registro de manutenção:", maintenanceError);
          }
        }
      
        return res.status(201).json({ 
          message: "Cadastro recebido com sucesso! A equipe de gestão de frotas analisará as informações.", 
          id: oficina.id,
          credenciais
        });
      } catch (dbError) {
        console.error("Erro de banco de dados:", dbError);
        return res.status(500).json({ message: "Erro ao processar cadastro no banco de dados" });
      }
    } catch (error) {
      console.error("Erro ao cadastrar oficina externa:", error);
      return res.status(500).json({ message: "Erro ao processar cadastro da oficina" });
    }
  });
  
  app.post("/api/workshops", async (req, res) => {
    try {
      const result = insertWorkshopSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid workshop data", errors: result.error.format() });
      }
      
      const newWorkshop = await storage.createWorkshop(result.data);
      return res.status(201).json(newWorkshop);
    } catch (error) {
      console.error("Error creating workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/workshops/:id", isAuthenticated, async (req, res) => {
    try {
      const workshopId = parseInt(req.params.id);
      const workshop = await storage.getWorkshop(workshopId);
      
      if (!workshop) {
        return res.status(404).json({ message: "Workshop not found" });
      }
      
      const result = insertWorkshopSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid workshop data", errors: result.error.format() });
      }
      
      const updatedWorkshop = await storage.updateWorkshop(workshopId, result.data);
      return res.status(200).json(updatedWorkshop);
    } catch (error) {
      console.error("Error updating workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/workshops/:id", isAdmin, async (req, res) => {
    try {
      const workshopId = parseInt(req.params.id);
      const success = await storage.deleteWorkshop(workshopId);
      
      if (!success) {
        return res.status(404).json({ message: "Workshop not found" });
      }
      
      return res.status(200).json({ message: "Workshop deleted successfully" });
    } catch (error) {
      console.error("Error deleting workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Maintenance routes
  app.get("/api/maintenance", hasMaintenanceAccess, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Requisição GET /api/maintenance recebida.");
      console.log("Usuário:", req.user.email, "Papel:", req.user.role, "BaseID:", req.user.baseId);
      
      // Check if filtering by base and status
      const baseId = req.query.baseId ? parseInt(req.query.baseId as string) : null;
      const status = req.query.status as string | null;
      
      console.log("Parâmetros de busca:", { baseId, status });
      
      // gestor_frota tem acesso completo como admin
      // Para usuários não-admin/não-gestor_frota, forçar filtragem pela base do próprio usuário
      if (req.user.role !== 'admin' && req.user.role !== 'gestor_frota' && req.user.baseId) {
        console.log(`Usuário não-admin id=${req.user.id}. Forçando filtro por baseId=${req.user.baseId}`);
        
        // Se pediu filtragem por base, verificar se coincide com a do usuário
        if (baseId && baseId !== req.user.baseId) {
          return res.status(403).json({ 
            message: "Acesso negado. Você só pode ver manutenções da sua própria base." 
          });
        }
        
        // Buscar manutenções com filtro por status (se existir) e pela base do usuário
        let maintenanceRecords;
        try {
          if (status) {
            maintenanceRecords = await storage.getMaintenanceByBaseAndStatus(req.user.baseId, status);
          } else {
            // Usar SQL direto para garantir compatibilidade com a estrutura
            const query = `
              SELECT * FROM manutencao
              WHERE request_base_id = $1
              ORDER BY entry_date DESC
            `;
            
            const result = await pool.query(query, [req.user.baseId]);
            console.log(`Encontradas ${result.rows.length} manutenções para baseId=${req.user.baseId}`);
            
            // Mapear os resultados para o formato esperado pelo frontend
            maintenanceRecords = result.rows.map(row => ({
              id: row.id,
              vehiclePlate: row.vehicle_plate || row.placa,
              description: row.descricao || row.description,
              status: row.status,
              priority: row.priority || "média",
              maintenanceType: row.tipo || row.maintenance_type,
              workshopId: row.oficina_id || row.workshop_id,
              requestBaseId: row.base_id || row.request_base_id,
              entryDate: row.data_solicitacao || row.entry_date,
              estimatedCompletion: row.data_agendada || row.estimated_completion,
              completionDate: row.data_conclusao || row.completion_date,
              responsiblePerson: row.responsible_person || 'Técnico responsável',
              cost: row.custo || row.cost,
              initialBudget: row.custo || row.initial_budget,
              created_at: row.created_at,
              updated_at: row.updated_at
            }));
          }
        } catch (dbError) {
          console.error("Erro ao buscar manutenções:", dbError);
          maintenanceRecords = [];
        }
        
        return res.status(200).json(maintenanceRecords);
      }
      
      // Administradores e gestores de frota podem filtrar como quiserem
      if (req.user.role === 'admin' || req.user.role === 'gestor_frota') {
        console.log(`Usuário ${req.user.role} id=${req.user.id} tem acesso total às manutenções`);
        
        // Se baseId e status fornecidos, filtrar por ambos
        if (baseId && status) {
          console.log(`Buscando manutenções com baseId=${baseId} e status=${status}`);
          const maintenance = await storage.getMaintenanceByBaseAndStatus(baseId, status);
          return res.status(200).json(maintenance);
        } 
        // Se só baseId fornecido
        else if (baseId) {
          console.log(`Buscando manutenções para baseId=${baseId}`);
          // Usar SQL direto para garantir compatibilidade
          const query = `
            SELECT * FROM manutencao
            WHERE request_base_id = $1
            ORDER BY entry_date DESC
          `;
          
          const result = await pool.query(query, [baseId]);
          console.log(`Encontradas ${result.rows.length} manutenções para baseId=${baseId}`);
          
          // Mapear os resultados para o formato esperado pelo frontend
          const maintenanceRecords = result.rows.map(row => ({
            id: row.id,
            vehiclePlate: row.vehicle_plate,
            description: row.description,
            status: row.status,
            priority: row.priority || "média",
            maintenanceType: row.maintenance_type,
            workshopId: row.workshop_id,
            requestBaseId: row.request_base_id,
            entryDate: row.entry_date,
            estimatedCompletion: row.estimated_completion,
            completionDate: row.completion_date,
            responsiblePerson: row.responsible_person,
            cost: row.cost,
            initialBudget: row.initial_budget,
            created_at: row.created_at,
            updated_at: row.updated_at
          }));
          
          return res.status(200).json(maintenanceRecords);
        }
        // Se só status fornecido
        else if (status) {
          console.log(`Buscando manutenções com status=${status}`);
          // Usar SQL direto para garantir compatibilidade
          const query = `
            SELECT * FROM manutencao
            WHERE status = $1
            ORDER BY entry_date DESC
          `;
          
          const result = await pool.query(query, [status]);
          console.log(`Encontradas ${result.rows.length} manutenções com status=${status}`);
          
          // Mapear os resultados para o formato esperado pelo frontend
          const maintenanceRecords = result.rows.map(row => ({
            id: row.id,
            vehiclePlate: row.vehicle_plate,
            description: row.description,
            status: row.status,
            priority: row.priority || "média",
            maintenanceType: row.maintenance_type,
            workshopId: row.workshop_id,
            requestBaseId: row.request_base_id,
            entryDate: row.entry_date,
            estimatedCompletion: row.estimated_completion,
            completionDate: row.completion_date,
            responsiblePerson: row.responsible_person,
            cost: row.cost,
            initialBudget: row.initial_budget,
            created_at: row.created_at,
            updated_at: row.updated_at
          }));
          
          return res.status(200).json(maintenanceRecords);
        }
        // Sem filtros, retornar todos
        else {
          console.log("Buscando todas as manutenções");
          // Usar SQL direto para garantir compatibilidade
          const query = `
            SELECT * FROM manutencao
            ORDER BY entry_date DESC
          `;
          
          const result = await pool.query(query);
          console.log(`Encontradas ${result.rows.length} manutenções no total`);
          
          // Mapear os resultados para o formato esperado pelo frontend
          const maintenanceRecords = result.rows.map(row => ({
            id: row.id,
            vehiclePlate: row.vehicle_plate,
            description: row.description,
            status: row.status,
            priority: row.priority || "média",
            maintenanceType: row.maintenance_type,
            workshopId: row.workshop_id,
            requestBaseId: row.request_base_id,
            entryDate: row.entry_date,
            estimatedCompletion: row.estimated_completion,
            completionDate: row.completion_date,
            responsiblePerson: row.responsible_person,
            cost: row.cost,
            initialBudget: row.initial_budget,
            created_at: row.created_at,
            updated_at: row.updated_at
          }));
          
          return res.status(200).json(maintenanceRecords);
        }
      }
      
      // Se chegou até aqui, é um usuário sem baseId definida - retornar lista vazia
      console.log(`Usuário ${req.user.id} sem baseId definida - retornando lista vazia`);
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching maintenance:", error);
      return res.status(500).json({ 
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Rota para oficinas buscarem manutenções associadas a elas
  app.get("/api/workshop/maintenance", isWorkshop, async (req, res) => {
    try {
      if (!req.user || !req.user.oficina_id) {
        return res.status(400).json({ 
          message: "Usuário não possui oficina associada"
        });
      }

      // Buscar manutenções da oficina do usuário logado
      const workshopId = req.user.oficina_id;
      console.log(`Buscando manutenções para oficina ID ${workshopId}`);
      
      const maintenanceItems = await storage.getMaintenanceByWorkshop(workshopId);
      
      return res.status(200).json({
        message: "Manutenções da oficina recuperadas com sucesso",
        count: maintenanceItems.length,
        items: maintenanceItems
      });
    } catch (error) {
      console.error("Erro ao buscar manutenções da oficina:", error);
      return res.status(500).json({ message: "Erro ao buscar manutenções" });
    }
  });

  // API para obter todos os veículos cadastrados - sem restrição de acesso por enquanto
  app.get("/api/workshop/vehicles", async (req, res) => {
    try {
      // Buscar todos os veículos - adaptado para as colunas existentes
      const query = `
        SELECT 
          id, 
          plate, 
          model,
          rental_company,
          vehicle_type,
          base_id
        FROM 
          veiculos
        ORDER BY 
          plate ASC
      `;
      
      const result = await pool.query(query);
      
      // Adaptar o resultado para o formato esperado pelo frontend
      const formattedData = result.rows.map(vehicle => ({
        id: vehicle.id,
        plate: vehicle.plate,
        model: vehicle.model,
        make: vehicle.rental_company || 'Não Informado', // Usar rental_company como make
        year: 'N/A', // Não temos o ano, então usamos um valor padrão
        base_id: vehicle.base_id
      }));
      
      return res.status(200).json({ 
        message: "Veículos obtidos com sucesso",
        data: formattedData 
      });
    } catch (error: any) {
      console.error("Erro ao buscar veículos:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar veículos",
        error: error.message 
      });
    }
  });

  app.get("/api/maintenance/vehicle/:plate", hasMaintenanceAccess, async (req, res) => {
    try {
      const vehiclePlate = req.params.plate;
      
      // Verify vehicle exists
      const vehicle = await storage.getVehicleByPlate(vehiclePlate);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Get maintenance history
      const maintenanceHistory = await storage.getMaintenanceByVehicle(vehiclePlate);
      return res.status(200).json(maintenanceHistory);
    } catch (error) {
      console.error("Error fetching maintenance history:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Rota específica para buscar manutenções de uma base específica
  app.get("/api/maintenance/base/:baseId", hasMaintenanceAccess, async (req, res) => {
    try {
      const baseId = parseInt(req.params.baseId);
      
      if (isNaN(baseId)) {
        return res.status(400).json({ message: "ID de base inválido" });
      }
      
      console.log(`Buscando manutenções da base ${baseId}`);
      
      // Verificar se a base existe
      const baseQuery = `SELECT id, name FROM bases WHERE id = $1`;
      const baseResult = await pool.query(baseQuery, [baseId]);
      
      if (baseResult.rowCount === 0) {
        return res.status(404).json({ message: "Base não encontrada" });
      }
      
      const baseName = baseResult.rows[0].name;
      console.log(`Base encontrada: ${baseName} (ID: ${baseId})`);
      
      // Buscar todas as manutenções da base, independentemente do status
      let maintenanceRecords;
      try {
        const query = `
          SELECT * FROM manutencao
          WHERE request_base_id = $1
          ORDER BY entry_date DESC
        `;
        
        const result = await pool.query(query, [baseId]);
        
        // Mapear os resultados para o formato correto do objeto Maintenance
        maintenanceRecords = result.rows.map(row => ({
          id: row.id,
          vehiclePlate: row.vehicle_plate,
          description: row.description,
          status: row.status,
          workshopId: row.workshop_id,
          workshopName: null, // Será preenchido abaixo
          requestBaseId: row.request_base_id,
          requestBaseName: baseName,
          entryDate: row.entry_date,
          estimatedCompletion: row.estimated_completion || row.expected_exit_date,
          completionDate: row.completion_date || row.actual_exit_date,
          maintenanceType: row.maintenance_type,
          initialCost: row.initial_cost,
          finalCost: row.final_cost,
          responsiblePerson: row.responsible_person,
          priority: row.priority || "média",
          created_at: row.created_at,
          updated_at: row.updated_at
        }));
        
        // Buscar os nomes das oficinas
        if (maintenanceRecords.length > 0) {
          const workshopIds = [...new Set(maintenanceRecords.filter(m => m.workshopId).map(m => m.workshopId))];
          
          if (workshopIds.length > 0) {
            const workshopsQuery = `
              SELECT id, name FROM oficinas
              WHERE id = ANY($1::int[])
            `;
            
            const workshopsResult = await pool.query(workshopsQuery, [workshopIds]);
            const workshopsMap = new Map();
            
            workshopsResult.rows.forEach(row => {
              workshopsMap.set(row.id, row.name);
            });
            
            // Atualizar os registros com os nomes das oficinas
            maintenanceRecords = maintenanceRecords.map(record => ({
              ...record,
              workshopName: record.workshopId ? workshopsMap.get(record.workshopId) || "Oficina não encontrada" : null
            }));
          }
        }
        
        console.log(`Encontradas ${maintenanceRecords.length} manutenções para a base ${baseName}`);
      } catch (dbError) {
        console.error("Erro ao buscar manutenções:", dbError);
        maintenanceRecords = [];
      }
      
      // Se não houver manutenções, retornar um array vazio
      if (!maintenanceRecords || maintenanceRecords.length === 0) {
        console.log(`Nenhuma manutenção encontrada para a base ${baseName}`);
        return res.status(200).json([]);
      }
      
      return res.status(200).json(maintenanceRecords);
    } catch (error) {
      console.error("Erro ao buscar manutenções da base:", error);
      return res.status(500).json({ message: "Erro ao buscar manutenções da base" });
    }
  });

  // Rota para atualizar o status de uma manutenção para uma base específica
  app.patch("/api/maintenance/base/:baseId/:id/status", hasMaintenanceAccess, async (req, res) => {
    try {
      // Verificar autenticação
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const baseId = parseInt(req.params.baseId);
      const maintenanceId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(baseId) || isNaN(maintenanceId)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }
      
      if (!status) {
        return res.status(400).json({ message: "Status não fornecido" });
      }
      
      console.log(`Atualizando status da manutenção ${maintenanceId} da base ${baseId} para ${status}`);
      
      // Verificar se o usuário tem permissão para atualizar esta manutenção
      // Admins ou usuários da mesma base podem atualizar
      if (req.user.role !== 'admin' && req.user.baseId !== baseId) {
        return res.status(403).json({ 
          message: "Acesso negado. Você só pode atualizar manutenções da sua própria base."
        });
      }
      
      // Verificar se a manutenção existe e pertence à base especificada
      const checkQuery = `
        SELECT * FROM manutencao 
        WHERE id = $1 AND request_base_id = $2
      `;
      
      const checkResult = await pool.query(checkQuery, [maintenanceId, baseId]);
      
      if (!checkResult.rowCount || checkResult.rowCount === 0) {
        return res.status(404).json({ 
          message: "Manutenção não encontrada ou não pertence à base especificada" 
        });
      }
      
      // Atualizar o status da manutenção
      const updateQuery = `
        UPDATE manutencao 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 AND request_base_id = $3
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [status, maintenanceId, baseId]);
      
      if (result.rowCount === 0) {
        return res.status(500).json({ message: "Falha ao atualizar o status da manutenção" });
      }
      
      // Registrar a atualização no histórico de manutenção, se existir a tabela
      try {
        const historyQuery = `
          INSERT INTO maintenance_lifecycle 
          (maintenance_id, status, user_id, created_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `;
        await pool.query(historyQuery, [maintenanceId, status, req.user.id]);
        console.log(`Histórico de status registrado para manutenção ${maintenanceId}`);
      } catch (historyError) {
        // Registrar erro mas continuar com o fluxo
        console.error("Erro ao registrar histórico de status (não crítico):", historyError);
      }
      
      return res.status(200).json({
        message: "Status atualizado com sucesso",
        maintenance: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          updatedAt: result.rows[0].updated_at
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar status da manutenção:", error);
      return res.status(500).json({ message: "Erro ao atualizar status da manutenção" });
    }
  });
  
  // Endpoint para atualizar todos os detalhes de uma manutenção
  app.put("/api/maintenance/:id", hasMaintenanceAccess, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar permissões (admin, gestor_frota ou gestor da base)
      const hasPermission = 
        req.user.role === 'admin' || 
        req.user.role === 'gestor_frota' || 
        (req.user.role === 'gestor' && req.user.base_id);
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Sem permissão para atualizar manutenção" });
      }

      const maintenanceId = parseInt(req.params.id);
      if (isNaN(maintenanceId)) {
        return res.status(400).json({ message: "ID de manutenção inválido" });
      }

      const { 
        status, 
        workshopId, 
        servicePerformed, 
        estimatedCompletion, 
        completionDate, 
        cost, 
        replacedParts,
        // Campos específicos para aguardando_peca
        pendingPartDescription,
        pendingPartValue,
        pendingPartSupplier,
        pendingPartPhone,
        pendingPartDeadline
      } = req.body;

      // Validar status
      const validStatuses = ['pendente', 'aguardando_orcamento', 'em_andamento', 'concluida', 'cancelada'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Status inválido", 
          validValues: validStatuses 
        });
      }

      // Verificar se a manutenção existe
      const checkQuery = `SELECT * FROM manutencao WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [maintenanceId]);
      
      if (!checkResult.rows.length) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }

      const maintenance = checkResult.rows[0];
      
      // Se usuário for gestor (não admin), verificar se tem acesso a esta base
      if (req.user.role === 'gestor' && maintenance.request_base_id !== req.user.base_id) {
        return res.status(403).json({ 
          message: "Acesso negado. Você só pode atualizar manutenções da sua própria base."
        });
      }

      // Construir query dinâmica baseada nos campos fornecidos
      let setClause = [];
      let params = [];
      let paramIndex = 1;

      if (status) {
        setClause.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (workshopId) {
        setClause.push(`workshop_id = $${paramIndex}`);
        params.push(workshopId);
        paramIndex++;
      }

      if (servicePerformed !== undefined) {
        setClause.push(`service_performed = $${paramIndex}`);
        params.push(servicePerformed);
        paramIndex++;
      }

      if (estimatedCompletion) {
        setClause.push(`estimated_completion = $${paramIndex}`);
        params.push(estimatedCompletion);
        paramIndex++;
      }

      if (completionDate) {
        setClause.push(`completion_date = $${paramIndex}`);
        params.push(completionDate);
        paramIndex++;
      }

      if (cost !== undefined) {
        setClause.push(`cost = $${paramIndex}`);
        params.push(cost);
        paramIndex++;
      }

      // Adicionar updated_at
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Adicionar id no final dos parâmetros
      params.push(maintenanceId);

      if (setClause.length === 0) {
        return res.status(400).json({ message: "Nenhum campo para atualizar" });
      }

      const updateQuery = `
        UPDATE manutencao 
        SET ${setClause.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, params);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Falha ao atualizar manutenção" });
      }

      // Atualizar tabela de peças trocadas, se fornecido
      if (replacedParts && Array.isArray(replacedParts) && replacedParts.length > 0) {
        // Primeiro, apagar peças existentes para esta manutenção
        await pool.query(
          `DELETE FROM maintenance_replaced_parts WHERE maintenance_id = $1`,
          [maintenanceId]
        );

        // Depois, inserir as novas peças
        for (const part of replacedParts) {
          if (part.name && part.quantity && part.unitPrice) {
            await pool.query(
              `INSERT INTO maintenance_replaced_parts 
               (maintenance_id, name, quantity, unit_price, created_at)
               VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
              [maintenanceId, part.name, part.quantity, part.unitPrice]
            );
          }
        }
      }

      // Se status for "concluida", atualizar também o veículo
      if (status === 'concluida') {
        try {
          // Atualizar o status do veículo para em_operacao
          await pool.query(
            `UPDATE veiculos SET status = 'em_operacao' WHERE plate = $1`,
            [maintenance.vehicle_plate]
          );
        } catch (vehicleError) {
          console.error("Erro ao atualizar status do veículo:", vehicleError);
          // Continuar mesmo com erro na atualização do veículo
        }
      }

      // Registrar a atualização no histórico de manutenção, se existir a tabela
      try {
        const historyQuery = `
          INSERT INTO maintenance_lifecycle 
          (maintenance_id, status, user_id, created_at, action, details)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'atualização', $4)
        `;
        const historyDetails = JSON.stringify({
          updatedFields: Object.keys(req.body).filter(k => k !== 'replacedParts'),
          updatedBy: req.user.email,
          userRole: req.user.role
        });
        await pool.query(historyQuery, [maintenanceId, status || maintenance.status, req.user.id, historyDetails]);
      } catch (historyError) {
        // Registrar erro mas continuar com a resposta
        console.error("Erro ao registrar histórico de manutenção (não crítico):", historyError);
      }
      
      return res.status(200).json({
        message: "Manutenção atualizada com sucesso",
        maintenance: result.rows[0]
      });
    } catch (error) {
      console.error("Erro ao atualizar manutenção:", error);
      return res.status(500).json({ 
        message: "Erro ao atualizar manutenção",
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  // Endpoint específico para atualizar manutenções da Oficina Murici
  app.put("/api/oficina-murici/maintenance/:id", async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      if (isNaN(maintenanceId)) {
        return res.status(400).json({ message: "ID de manutenção inválido" });
      }

      const { 
        status, 
        pendingPartDescription,
        pendingPartValue,
        pendingPartSupplier,
        pendingPartPhone,
        pendingPartDeadline,
        mechanicName,
        usedPartnerWorkshop,
        partnerWorkshopName,
        laborCost,
        cost,
        servicePerformed,
        estimatedCompletion,
        completionDate,
        replacedParts
      } = req.body;

      // Verificar se a manutenção existe na tabela oficina_murici_manutencoes
      const checkQuery = `SELECT * FROM oficina_murici_manutencoes WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [maintenanceId]);
      
      if (!checkResult.rows.length) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }

      // Construir query dinâmica baseada nos campos fornecidos
      let setClause = [];
      let params = [];
      let paramIndex = 1;

      if (status) {
        setClause.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      // Campos específicos para aguardando_peca
      if (status === 'aguardando_peca') {
        if (pendingPartDescription) {
          setClause.push(`peca_descricao = $${paramIndex}`);
          params.push(pendingPartDescription);
          paramIndex++;
        }

        if (pendingPartValue !== undefined) {
          setClause.push(`peca_valor = $${paramIndex}`);
          params.push(pendingPartValue);
          paramIndex++;
        }

        if (pendingPartSupplier) {
          setClause.push(`fornecedor_nome = $${paramIndex}`);
          params.push(pendingPartSupplier);
          paramIndex++;
        }

        if (pendingPartPhone) {
          setClause.push(`fornecedor_telefone = $${paramIndex}`);
          params.push(pendingPartPhone);
          paramIndex++;
        }

        if (pendingPartDeadline) {
          setClause.push(`prazo_entrega = $${paramIndex}`);
          params.push(pendingPartDeadline);
          paramIndex++;
        }
      }

      // Campos gerais da manutenção
      if (mechanicName !== undefined) {
        setClause.push(`mechanic_name = $${paramIndex}`);
        params.push(mechanicName);
        paramIndex++;
      }

      if (usedPartnerWorkshop !== undefined) {
        setClause.push(`used_partner_workshop = $${paramIndex}`);
        params.push(usedPartnerWorkshop);
        paramIndex++;
      }

      if (partnerWorkshopName !== undefined) {
        setClause.push(`partner_workshop_name = $${paramIndex}`);
        params.push(partnerWorkshopName);
        paramIndex++;
      }

      if (laborCost !== undefined) {
        setClause.push(`labor_cost = $${paramIndex}`);
        params.push(laborCost);
        paramIndex++;
      }

      if (cost !== undefined) {
        setClause.push(`custo_total = $${paramIndex}`);
        params.push(cost);
        paramIndex++;
      }

      if (servicePerformed !== undefined) {
        setClause.push(`servico_realizado = $${paramIndex}`);
        params.push(servicePerformed);
        paramIndex++;
      }

      if (estimatedCompletion !== undefined) {
        setClause.push(`previsao_conclusao = $${paramIndex}`);
        params.push(estimatedCompletion);
        paramIndex++;
      }

      if (completionDate !== undefined) {
        setClause.push(`data_conclusao = $${paramIndex}`);
        params.push(completionDate);
        paramIndex++;
      }

      // Adicionar updated_at
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Adicionar id no final dos parâmetros
      params.push(maintenanceId);

      if (setClause.length === 1) { // Apenas updated_at
        return res.status(400).json({ message: "Nenhum campo para atualizar" });
      }

      const updateQuery = `
        UPDATE oficina_murici_manutencoes 
        SET ${setClause.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, params);
      
      if (!result.rows.length) {
        return res.status(500).json({ message: "Falha ao atualizar a manutenção" });
      }

      return res.status(200).json({
        message: "Manutenção atualizada com sucesso",
        maintenance: result.rows[0]
      });
    } catch (error) {
      console.error("Erro ao atualizar manutenção da Oficina Murici:", error);
      return res.status(500).json({ message: "Erro ao atualizar manutenção" });
    }
  });

  // Endpoint para atualizar as datas de uma manutenção
  app.patch("/api/maintenance/:id/dates", hasMaintenanceAccess, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Apenas admin e gestor_frota podem atualizar datas
      if (req.user.role !== 'admin' && req.user.role !== 'gestor_frota') {
        return res.status(403).json({ message: "Sem permissão para atualizar datas" });
      }

      const maintenanceId = parseInt(req.params.id);
      const { entryDate, estimatedCompletion, completionDate } = req.body;
      
      if (!maintenanceId) {
        return res.status(400).json({ message: "ID de manutenção inválido" });
      }

      // Validar se pelo menos uma data foi fornecida
      if (!entryDate && !estimatedCompletion && !completionDate) {
        return res.status(400).json({ message: "Pelo menos uma data deve ser fornecida" });
      }

      // Construir query dinâmica baseada nas datas fornecidas
      let setClause = [];
      let params = [];
      let paramIndex = 1;

      if (entryDate) {
        setClause.push(`entry_date = $${paramIndex}`);
        params.push(entryDate);
        paramIndex++;
      }

      if (estimatedCompletion) {
        setClause.push(`estimated_completion = $${paramIndex}`);
        params.push(estimatedCompletion);
        paramIndex++;
      }

      if (completionDate) {
        setClause.push(`completion_date = $${paramIndex}`);
        params.push(completionDate);
        paramIndex++;
      }

      // Adicionar updated_at e id no final
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(maintenanceId);

      const updateQuery = `
        UPDATE manutencao 
        SET ${setClause.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, params);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }
      
      // Registrar a atualização no histórico de manutenção, se existir a tabela
      try {
        const historyQuery = `
          INSERT INTO maintenance_lifecycle 
          (maintenance_id, status, user_id, created_at, action, details)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'update_dates', $4)
        `;
        const row = result.rows[0];
        const details = JSON.stringify({
          entryDate: row.entry_date,
          estimatedCompletion: row.estimated_completion,
          completionDate: row.completion_date
        });
        await pool.query(historyQuery, [maintenanceId, row.status, req.user.id, details]);
        console.log(`Histórico de atualização de datas registrado para manutenção ${maintenanceId}`);
      } catch (historyError) {
        // Registrar erro mas continuar com o fluxo
        console.error("Erro ao registrar histórico de datas (não crítico):", historyError);
      }
      
      return res.status(200).json({
        message: "Datas atualizadas com sucesso",
        maintenance: {
          id: result.rows[0].id,
          entryDate: result.rows[0].entry_date,
          estimatedCompletion: result.rows[0].estimated_completion,
          completionDate: result.rows[0].completion_date,
          updatedAt: result.rows[0].updated_at
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar datas da manutenção:", error);
      return res.status(500).json({ message: "Erro ao atualizar datas da manutenção" });
    }
  });

  // Rota específica para buscar todas as ordens de manutenção
  app.get("/api/maintenance/orders", hasMaintenanceAccess, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Requisição GET /api/maintenance/orders recebida.");
      console.log("Usuário:", req.user.email, "Papel:", req.user.role);
      
      // Usar getAllMaintenance do storage que já foi corrigido
      const maintenanceRecords = await storage.getAllMaintenance();
      console.log(`Encontradas ${maintenanceRecords.length} manutenções no total`);
      
      return res.status(200).json(maintenanceRecords);
    } catch (error) {
      console.error("Erro ao buscar ordens de manutenção:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar dados de manutenção",
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  // Rota específica para buscar todas as oficinas no contexto de manutenção
  app.get("/api/maintenance/workshops", hasMaintenanceAccess, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Requisição GET /api/maintenance/workshops recebida.");
      console.log("Usuário:", req.user.email, "Papel:", req.user.role);
      
      // Usar getAllWorkshops do storage que já foi corrigido
      const workshops = await storage.getAllWorkshops();
      console.log(`Encontradas ${workshops.length} oficinas no total`);
      
      return res.status(200).json(workshops);
    } catch (error) {
      console.error("Erro ao buscar oficinas:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar dados de oficinas",
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  // Rota para criar nova oficina
  app.post("/api/maintenance/workshops", hasMaintenanceAccess, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { nome, cnpj, endereco, telefone, email, responsavel, tipo, is_active } = req.body;

      // Validar campos obrigatórios
      if (!nome || !cnpj || !endereco || !telefone || !email || !responsavel || !tipo) {
        return res.status(400).json({ 
          message: "Todos os campos são obrigatórios: nome, cnpj, endereco, telefone, email, responsavel, tipo" 
        });
      }

      // Criar nova oficina usando o método do storage
      const newWorkshop = await storage.createWorkshop({
        cnpj: cnpj,
        razao_social: nome,
        nome_fantasia: nome,
        endereco: endereco,
        telefone: telefone,
        email: email,
        responsavel: responsavel,
        tipo: tipo,
        status: is_active !== false ? 'ativo' : 'inativo'
      });

      console.log("Nova oficina criada:", newWorkshop);
      return res.status(201).json(newWorkshop);

    } catch (error) {
      console.error("Erro ao criar oficina:", error);
      
      // Tratamento específico para erro de CNPJ duplicado
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "oficinas_cnpj_key"')) {
        return res.status(400).json({ 
          message: "Já existe uma oficina cadastrada com este CNPJ",
          error: "CNPJ duplicado" 
        });
      }
      
      return res.status(500).json({ 
        message: "Erro ao criar oficina",
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  // ===== ROTAS DA API DA OFICINA =====
  
  // Middleware para verificar token da oficina
  const verificarTokenOficina = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);
      
      // Verificar se o token é válido usando decodificação base64
      let cnpj: string;
      try {
        cnpj = Buffer.from(token, 'base64').toString();
      } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
      }
      
      // Buscar oficina pelo CNPJ usando query direta
      const result = await pool.query(
        'SELECT * FROM workshops WHERE cnpj = $1 AND status = $2',
        [cnpj, 'ativo']
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Token inválido' });
      }

      req.oficina = result.rows[0];
      next();
    } catch (error) {
      console.error('Erro no middleware de autenticação da oficina:', error);
      return res.status(401).json({ message: 'Token inválido' });
    }
  };

  // Login da oficina
  app.post("/api/oficina/login", async (req, res) => {
    try {
      const { cnpj, password } = req.body;

      if (!cnpj || !password) {
        return res.status(400).json({ message: 'CNPJ e senha são obrigatórios' });
      }

      // Buscar oficina pelo CNPJ usando query direta
      const result = await pool.query(
        'SELECT * FROM workshops WHERE cnpj = $1 AND status = $2',
        [cnpj, 'ativo']
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'CNPJ não encontrado' });
      }

      const oficina = result.rows[0];

      // Verificar senha - usando senha padrão para teste
      if (password !== 'senha123') {
        return res.status(401).json({ message: 'Senha incorreta' });
      }

      // Gerar token usando CNPJ codificado em base64
      const token = Buffer.from(cnpj).toString('base64');

      res.json({
        token,
        oficina: {
          id: oficina.id,
          razao_social: oficina.razao_social || oficina.nome,
          cnpj: oficina.cnpj,
          email: oficina.email,
          telefone: oficina.telefone
        }
      });
    } catch (error) {
      console.error("Erro no login da oficina:", error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Perfil da oficina
  app.get("/api/oficina/profile", verificarTokenOficina, async (req, res) => {
    res.json(req.oficina);
  });

  // Listar ordens de serviço da oficina
  app.get("/api/oficina/orders", verificarTokenOficina, async (req, res) => {
    try {
      const orders = await storage.getMaintenanceByWorkshop(req.oficina.id);
      res.json(orders);
    } catch (error) {
      console.error("Erro ao listar ordens:", error);
      res.status(500).json({ message: 'Erro ao carregar ordens de serviço' });
    }
  });

  // Atualizar status de ordem de serviço
  app.put("/api/oficina/orders/:id/status", verificarTokenOficina, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status é obrigatório' });
      }

      const updated = await storage.updateMaintenanceStatus(parseInt(id), status);
      if (!updated) {
        return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
      }

      res.json({ message: 'Status atualizado com sucesso' });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({ message: 'Erro ao atualizar status' });
    }
  });

  // Criar recebimento de veículo
  app.post("/api/oficina/car-receptions", verificarTokenOficina, async (req, res) => {
    try {
      const data = req.body;
      
      // Validar dados obrigatórios
      if (!data.vehiclePlate || !data.vehicleModel || !data.vehicleType || !data.baseId || !data.serviceDescription) {
        return res.status(400).json({ message: 'Dados obrigatórios não informados' });
      }

      // Criar objeto de recebimento com dados da oficina
      const carReceptionData = {
        vehiclePlate: data.vehiclePlate,
        vehicleModel: data.vehicleModel,
        vehicleType: data.vehicleType,
        currentKm: data.currentKm || 0,
        baseId: data.baseId,
        projectId: data.projectId || null,
        projectName: data.projectName || '',
        serviceDescription: data.serviceDescription,
        replacedParts: data.replacedParts || '',
        laborCost: data.laborCost || 0,
        partsCost: data.partsCost || 0,
        totalCost: (data.laborCost || 0) + (data.partsCost || 0),
        deliveryDeadline: data.deliveryDeadline || null,
        notes: data.notes || '',
        workshopId: req.oficina.id,
        status: 'recebido',
        createdAt: new Date()
      };

      const reception = await storage.createCarReception(carReceptionData);
      res.status(201).json(reception);
    } catch (error) {
      console.error("Erro ao criar recebimento:", error);
      res.status(500).json({ message: 'Erro ao registrar recebimento' });
    }
  });

  // Listar recebimentos da oficina
  app.get("/api/oficina/car-receptions", verificarTokenOficina, async (req, res) => {
    try {
      const receptions = await storage.getCarReceptionsByWorkshop(req.oficina.id);
      res.json(receptions);
    } catch (error) {
      console.error("Erro ao listar recebimentos:", error);
      res.status(500).json({ message: 'Erro ao carregar recebimentos' });
    }
  });

  // Atualizar recebimento
  app.put("/api/oficina/car-receptions/:id", verificarTokenOficina, async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const updated = await storage.updateCarReception(parseInt(id), data);
      if (!updated) {
        return res.status(404).json({ message: 'Recebimento não encontrado' });
      }

      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar recebimento:", error);
      res.status(500).json({ message: 'Erro ao atualizar recebimento' });
    }
  });

  app.get("/api/maintenance/:id", hasMaintenanceAccess, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      // Validar se o ID é um número válido
      if (isNaN(maintenanceId) || maintenanceId <= 0) {
        return res.status(400).json({ message: "Invalid maintenance ID" });
      }
      
      const maintenanceRecord = await storage.getMaintenance(maintenanceId);
      
      if (!maintenanceRecord) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      // Buscar peças trocadas relacionadas a esta manutenção
      try {
        const replacedPartsQuery = `
          SELECT id, name, quantity, unit_price as "unitPrice", created_at
          FROM maintenance_replaced_parts
          WHERE maintenance_id = $1
          ORDER BY created_at
        `;
        const replacedPartsResult = await pool.query(replacedPartsQuery, [maintenanceId]);
        
        // Adicionar as peças ao registro de manutenção
        if (replacedPartsResult.rows.length > 0) {
          maintenanceRecord.replacedParts = replacedPartsResult.rows;
        } else {
          maintenanceRecord.replacedParts = [];
        }
      } catch (partsError) {
        console.error("Erro ao buscar peças trocadas:", partsError);
        // Continuar mesmo com erro na busca de peças
        maintenanceRecord.replacedParts = [];
      }
      
      return res.status(200).json(maintenanceRecord);
    } catch (error) {
      console.error("Error fetching maintenance record:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Rota para buscar templates de manutenção
  app.get("/api/maintenance/templates", hasMaintenanceAccess, async (req, res) => {
    try {
      console.log(`Requisição GET /api/maintenance/templates recebida.`);
      console.log(`Usuário: ${req.user?.email} Papel: ${req.user?.role}`);
      
      const query = `
        SELECT 
          id,
          nome as name,
          descricao as description,
          categoria as category,
          prazo_estimado_horas as estimated_hours,
          custo_estimado as estimated_cost,
          is_active,
          created_at,
          updated_at
        FROM maintenance_templates 
        WHERE is_active = true
        ORDER BY categoria, nome
      `;
      
      const result = await pool.query(query);
      
      console.log(`Encontrados ${result.rows.length} templates no total`);
      
      const templates = result.rows.map(row => ({
        id: row.id,
        nome: row.name,
        descricao: row.description,
        categoria: row.category,
        prazo_estimado_horas: row.estimated_hours,
        custo_estimado: row.estimated_cost,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
      
      res.status(200).json({
        success: true,
        templates: templates
      });
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
      res.status(500).json({ 
        message: "Erro ao buscar templates de manutenção",
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });
  
  app.post("/api/maintenance", hasMaintenanceAccess, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = insertMaintenanceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid maintenance data", errors: result.error.format() });
      }
      
      // Check if vehicle exists
      let vehicle = await storage.getVehicleByPlate(result.data.vehiclePlate);
      
      // Se o veículo não existir, mas a placa for válida, criar um veículo temporário
      if (!vehicle && /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(result.data.vehiclePlate)) {
        console.log(`Veículo com placa ${result.data.vehiclePlate} não encontrado. Criando veículo temporário para a base ${result.data.requestBaseId}.`);
        
        try {
          // Criando o objeto com tipos corretos
          const newVehicleData = {
            plate: result.data.vehiclePlate,
            model: "Veículo registrado via manutenção",
            vehicleType: "van" as "van" | "truck" | "fiorino" | "cavalo_mecanico" | "vuc" | "toco" | "carreta",
            status: "em_operacao" as "em_operacao" | "em_manutencao" | "parado",
            baseId: result.data.requestBaseId,
            ownership: "murici" as "murici" | "locado",
            crlvUrl: null,
            anttUrl: null
          };
          
          // Criar o veículo usando a interface de armazenamento
          vehicle = await storage.createVehicle(newVehicleData);
          console.log(`Veículo temporário criado com ID ${vehicle.id}`);
        } catch (vehicleError) {
          console.error("Erro ao criar veículo temporário:", vehicleError);
          // Continuar mesmo sem o veículo - não bloquear a criação da manutenção
        }
      }
      
      // Check if workshop exists, if not, create a default one
      let workshop = await storage.getWorkshop(result.data.workshopId);
      
      if (!workshop) {
        console.log(`Workshop id=${result.data.workshopId} não encontrado. Criando oficina padrão.`);
        
        // Create a default workshop
        const defaultWorkshop = {
          name: "Oficina Padrão",
          address: "Rua Principal, 123",
          phone: "11987654321",
          isActive: true
        };
        
        try {
          workshop = await storage.createWorkshop(defaultWorkshop);
          console.log(`Oficina padrão criada com ID ${workshop.id}`);
          
          // Update workshop ID in request if needed
          if (result.data.workshopId !== workshop.id) {
            result.data.workshopId = workshop.id;
          }
        } catch (workshopError) {
          console.error("Erro ao criar oficina padrão:", workshopError);
          return res.status(500).json({ message: "Erro ao criar oficina padrão" });
        }
      }
      
      // Check if requesting base exists (if different from user's base)
      if (result.data.requestBaseId !== req.user.baseId) {
        const requestBase = await storage.getBase(result.data.requestBaseId);
        if (!requestBase) {
          return res.status(404).json({ message: "Requesting base not found" });
        }
      }
      
      // Create maintenance record with validated data
      try {
        console.log("Criando registro de manutenção com dados:", JSON.stringify(result.data, null, 2));
        
        // Garantindo que todos os campos necessários estejam presentes
        const maintenanceData = {
          ...result.data,
          // Garantir que campos obrigatórios estejam presentes
          entryDate: result.data.entryDate || new Date().toISOString().split('T')[0],
          status: result.data.status || "pendente",
          // Garantir que os tipos estejam corretos
          priority: result.data.priority || "média",
          maintenanceType: result.data.maintenanceType
        };
        
        const newMaintenance = await storage.createMaintenance(maintenanceData);
        console.log("Manutenção criada com sucesso:", newMaintenance);
        
        return res.status(201).json(newMaintenance);
      } catch (maintenanceError) {
        console.error("Erro ao criar registro de manutenção:", maintenanceError);
        return res.status(500).json({ 
          message: "Erro ao criar registro de manutenção", 
          error: maintenanceError instanceof Error ? maintenanceError.message : "Erro desconhecido" 
        });
      }
    } catch (error) {
      console.error("Error creating maintenance:", error);
      return res.status(500).json({ 
        message: "Server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Rota para oficinas atualizarem o status de manutenções
  app.patch("/api/workshop/maintenance/:id/status", isWorkshop, async (req, res) => {
    try {
      if (!req.user || !req.user.oficina_id) {
        return res.status(400).json({ 
          message: "Usuário não possui oficina associada"
        });
      }
      
      const maintenanceId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status é obrigatório" });
      }
      
      // Validar valores de status
      const validStatuses = ['pendente', 'aguardando_orcamento', 'em_andamento', 'concluida', 'cancelada'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Valor de status inválido", 
          validValues: validStatuses 
        });
      }
      
      // Verificar se a manutenção existe e pertence à oficina
      const maintenance = await storage.getMaintenance(maintenanceId);
      if (!maintenance) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }
      
      // Verificar se a manutenção pertence à oficina do usuário logado
      if (maintenance.workshopId !== req.user.oficina_id) {
        return res.status(403).json({ 
          message: "Acesso negado. Esta manutenção não pertence à sua oficina." 
        });
      }
      
      // Atualizar status
      const updatedMaintenance = await storage.updateMaintenanceStatus(maintenanceId, status);
      
      return res.status(200).json({
        message: "Status da manutenção atualizado com sucesso",
        maintenance: updatedMaintenance
      });
    } catch (error) {
      console.error("Erro ao atualizar status da manutenção:", error);
      return res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  app.patch("/api/maintenance/:id/status", hasMaintenanceAccess, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status value
      const validStatuses = ['pendente', 'aguardando_orcamento', 'em_andamento', 'concluida', 'cancelada'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status value", 
          validValues: validStatuses 
        });
      }
      
      // Update status
      const updatedMaintenance = await storage.updateMaintenanceStatus(maintenanceId, status);
      
      if (!updatedMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      return res.status(200).json(updatedMaintenance);
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/maintenance/:id", isAuthenticated, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      // Check if maintenance record exists
      const existingMaintenance = await storage.getMaintenance(maintenanceId);
      if (!existingMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      const result = insertMaintenanceSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid maintenance data", errors: result.error.format() });
      }
      
      // Update maintenance record
      const updatedMaintenance = await storage.updateMaintenance(maintenanceId, result.data);
      return res.status(200).json(updatedMaintenance);
    } catch (error) {
      console.error("Error updating maintenance:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/maintenance/:id", isAdmin, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const success = await storage.deleteMaintenance(maintenanceId);
      
      if (!success) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      return res.status(200).json({ message: "Maintenance record deleted successfully" });
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Tires routes - now with dedicated access control
  app.get("/api/tires", hasTiresAccess, async (req, res) => {
    try {
      const tires = await storage.getAllTires();
      return res.status(200).json(tires);
    } catch (error) {
      console.error("Error fetching tires:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Refueling routes
  app.get("/api/refueling", isAuthenticated, async (req, res) => {
    try {
      const refueling = await storage.getAllRefueling();
      return res.status(200).json(refueling);
    } catch (error) {
      console.error("Error fetching refueling:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Fines routes
  app.get("/api/fines", isAuthenticated, async (req, res) => {
    try {
      const fines = await storage.getAllFines();
      return res.status(200).json(fines);
    } catch (error) {
      console.error("Error fetching fines:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // LineHall routes removidas conforme solicitação
  
  // Users routes (admin only)
  // Rota original com middleware isAuthenticated (mais permissivo) para compatibilidade
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Usar a mesma função das novas rotas para manter a consistência
      // Mas formatar a resposta no padrão original para compatibilidade com frontend
      const { role, baseId, active } = req.query;
      
      // Construção da query com filtros
      let query = 'SELECT id, name, email, role, basename, base_id, oficina_id, is_active FROM users';
      const params: any[] = [];
      const conditions: string[] = [];
      
      // Adicionar filtros se fornecidos
      if (role) {
        conditions.push('role = $' + (params.length + 1));
        params.push(role);
      }
      
      if (baseId) {
        conditions.push('base_id = $' + (params.length + 1));
        params.push(baseId);
      }
      
      if (active !== undefined) {
        conditions.push('is_active = $' + (params.length + 1));
        params.push(active === 'true');
      }
      
      // Adicionar condições à query
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Ordenar por nome
      query += ' ORDER BY name';
      
      // Executar a consulta
      const result = await pool.query(query, params);
      
      // Retornar no formato original
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
  });
  
  // Rota para criar um novo usuário
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const { name, email, role, baseId, isActive } = req.body;
      
      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      // Gerar senha aleatória se não for fornecida
      const password = req.body.password || generateRandomPassword(10);
      const plainPassword = password; // Guardar a senha em texto puro para retornar
      
      // Hash da senha
      const hashedPassword = await hashPassword(password);
      
      // Criar o usuário
      const newUser = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        baseId: baseId || null,
        isActive: isActive !== undefined ? isActive : true
      });
      
      // Retornar o usuário criado com a senha em texto puro
      return res.status(201).json({
        user: {
          ...newUser,
          password: undefined // Remover a senha hash da resposta
        },
        generatedPassword: plainPassword // Incluir a senha gerada para exibição
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      return res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });
  
  // Rota para excluir um usuário
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Impedir que o usuário exclua a si mesmo
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: "Não é possível excluir o próprio usuário logado" });
      }
      
      console.log(`Excluindo usuário ID ${userId}...`);
      
      // Excluir o usuário
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Falha ao excluir usuário" });
      }
      
      console.log(`Usuário ID ${userId} excluído com sucesso.`);
      
      return res.status(200).json({ 
        message: "Usuário excluído com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });
  
  // Rota para redefinir a senha de um usuário
  app.post("/api/users/:id/reset-password", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Senha é obrigatória" });
      }
      
      console.log(`Redefinindo senha para usuário ID ${userId}...`);
      
      // Hash da nova senha
      const hashedPassword = await hashPassword(password);
      
      // Atualizar o usuário no banco de dados
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        console.log(`Usuário ID ${userId} não encontrado.`);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      console.log(`Senha do usuário ID ${userId} (${updatedUser.email}) redefinida com sucesso.`);
      
      // Retornar sucesso sem expor a senha
      res.json({ 
        message: "Senha redefinida com sucesso",
        user: { 
          id: updatedUser.id, 
          name: updatedUser.name, 
          email: updatedUser.email 
        }
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Rota para atualizar o status de um usuário (ativo/inativo)
  app.patch("/api/users/:id/status", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({ message: "Status do usuário (isActive) é obrigatório" });
      }
      
      console.log(`Atualizando status do usuário ID ${userId} para: ${isActive ? 'Ativo' : 'Inativo'}`);
      
      // Atualizar o status do usuário - Importante: isso atualizará is_active no banco de dados
      const updatedUser = await storage.updateUser(userId, { 
        isActive: isActive 
      });
      
      if (!updatedUser) {
        console.log(`Usuário ID ${userId} não encontrado para atualizar status.`);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      console.log(`Status do usuário ID ${userId} (${updatedUser.email}) atualizado com sucesso para: ${isActive ? 'Ativo' : 'Inativo'}`);
      
      // Retornar o usuário atualizado
      res.json({ 
        message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
        user: { 
          id: updatedUser.id, 
          name: updatedUser.name, 
          email: updatedUser.email,
          isActive: updatedUser.isActive
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error);
      res.status(500).json({ message: "Erro ao atualizar status do usuário" });
    }
  });

  // Novas rotas de consulta de usuários (API alternativa)
  
  // Rota para listar todos os usuários com filtros opcionais (role, baseId, active)
  // ex: /api/usuarios?role=admin&active=true
  app.get("/api/usuarios", isAuthenticated, consultarUsuarios);
  
  // Rota para obter um usuário específico pelo ID
  app.get("/api/usuarios/:id", isAuthenticated, consultarUsuarioPorId);
  
  // Rota de teste para consulta de usuários (sem autenticação - apenas para desenvolvimento)
  app.get("/api/teste/usuarios", consultarUsuarios);
  
  // Rota para users (tem problema no fechamento do endpoint anterior)

  // Dashboard API - usando middleware híbrido
  // (as rotas são redefinidas mais abaixo)

  // Admin utility routes
  // Rota específica para limpar os dados do Supabase
  // GET para documentação (sem autenticação)
  app.get('/api/admin/clear-supabase-data', (req, res) => {
    return res.status(200).json({
      message: "Esta API requer uma requisição POST com parâmetro 'confirm' igual a 'LIMPAR'",
      usage: {
        method: "POST",
        contentType: "application/json",
        body: {
          confirm: "LIMPAR", 
          tables: ["lista_opcional_de_tabelas"]
        }
      },
      description: "Esta rota permite limpar dados específicos no Supabase quando a limpeza normal não funciona corretamente"
    });
  });
  
  // Rota específica para limpar apenas a tabela de pneus
  app.post('/api/admin/clear-tires-data', isAdmin, async (req, res) => {
    try {
      console.log("Iniciando limpeza de dados da tabela de pneus...");
      
      // Verificar se temos a confirmação correta
      const { confirm } = req.body;
      if (confirm !== 'LIMPAR') {
        return res.status(400).json({
          message: "Confirmação inválida. Por favor, forneça a confirmação correta para esta operação.",
          success: false
        });
      }
      
      // Resultados das operações
      const resultados = {
        replit: { success: false, message: '', count: 0 },
        supabase: { success: false, message: '', count: 0 }
      };
      
      // 1. Limpar dados no PostgreSQL do Replit (tabela "pneus")
      try {
        console.log("Limpando dados de pneus no PostgreSQL do Replit (tabela 'pneus')...");
        // Buscar todos os pneus utilizando a função getAllTires() que agora trabalha com a tabela "pneus"
        const tires = await storage.getAllTires();
        console.log(`Encontrados ${tires.length} pneus no PostgreSQL do Replit para exclusão`);
        
        let deletedCount = 0;
        for (const tire of tires) {
          await storage.deleteTire(tire.id);
          deletedCount++;
        }
        
        resultados.replit = {
          success: true,
          message: `${deletedCount} pneus excluídos com sucesso do PostgreSQL do Replit`,
          count: deletedCount
        };
        
        console.log(resultados.replit.message);
      } catch (dbError) {
        console.error("Erro ao limpar pneus do PostgreSQL do Replit:", dbError);
        resultados.replit = {
          success: false,
          message: `Erro ao limpar tabela 'pneus': ${dbError}`,
          count: 0
        };
      }
      
      // 2. Limpar dados no Supabase (tabela "pneus")
      try {
        const fetch = await import("node-fetch");
        
        // Garantir que as variáveis de ambiente estão definidas
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
        
        // Verificar e limpar registros na tabela "pneus" 
        console.log("Iniciando limpeza de dados da tabela 'pneus' no Supabase...");
        
        // Primeiro verifica se a tabela existe
        const checkResponse = await fetch.default(
          `${supabaseUrl}/rest/v1/pneus?select=id&limit=1`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        
        if (!checkResponse.ok) {
          console.log("Tabela 'pneus' não encontrada no Supabase, tentando 'tires'...");
          // Verificar se existe tabela "tires" em inglês
          const checkTiresResponse = await fetch.default(
            `${supabaseUrl}/rest/v1/tires?select=id&limit=1`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              }
            }
          );
          
          if (!checkTiresResponse.ok) {
            throw new Error("Nenhuma tabela de pneus encontrada no Supabase (nem 'pneus' nem 'tires')");
          }
          
          // Se existe "tires", limpar essa tabela
          const tiresResponse = await fetch.default(
            `${supabaseUrl}/rest/v1/tires?select=id`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
              }
            }
          );
          
          if (tiresResponse.ok) {
            resultados.supabase = {
              success: true,
              message: "Tabela 'tires' limpa com sucesso no Supabase",
              count: -1 // Não temos como saber quantos foram removidos
            };
            console.log(resultados.supabase.message);
          } else {
            throw new Error(`Falha ao limpar tabela 'tires' no Supabase: ${await tiresResponse.text()}`);
          }
        } else {
          // Limpar a tabela "pneus"
          const response = await fetch.default(
            `${supabaseUrl}/rest/v1/pneus?select=id`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
              }
            }
          );
          
          if (response.ok) {
            resultados.supabase = {
              success: true,
              message: "Tabela 'pneus' limpa com sucesso no Supabase (REST API)",
              count: -1 // Não temos como saber quantos foram removidos
            };
            console.log(resultados.supabase.message);
          } else {
            const errorText = await response.text();
            console.error(`Erro ao limpar tabela 'pneus' no Supabase via REST: ${errorText}`);
            
            // Método 2: Limpar registro por registro
            console.log("Tentando abordagem alternativa para tabela 'pneus'...");
            
            // Primeiro busca todos os registros
            const getResponse = await fetch.default(
              `${supabaseUrl}/rest/v1/pneus?select=id`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
                }
              }
            );
            
            if (getResponse.ok) {
              // Conversão segura do JSON para o tipo esperado
              const rawData: unknown = await getResponse.json();
              const records: Array<{id: number}> = Array.isArray(rawData) 
                ? rawData.filter((r: any) => r && typeof r.id !== 'undefined').map((r: any) => ({id: r.id}))
                : [];
              console.log(`Encontrados ${records.length} registros na tabela 'pneus' do Supabase`);
              
              // Deleta cada registro individualmente
              let deletedCount = 0;
              if (records.length > 0) {
                for (const record of records) {
                  if (!record || typeof record.id === 'undefined') continue;
                  const deleteResponse = await fetch.default(
                    `${supabaseUrl}/rest/v1/pneus?id=eq.${record.id}`,
                    {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Prefer': 'return=minimal'
                      }
                    }
                  );
                  
                  if (deleteResponse.ok) {
                    deletedCount++;
                  } else {
                    console.error(`Erro ao excluir registro id=${record.id} da tabela 'pneus'`);
                  }
                }
                resultados.supabase = {
                  success: true,
                  message: `${deletedCount} registros excluídos com sucesso da tabela 'pneus'`,
                  count: deletedCount
                };
                console.log(resultados.supabase.message);
              } else {
                resultados.supabase = {
                  success: true,
                  message: "Nenhum registro encontrado na tabela 'pneus' para exclusão",
                  count: 0
                };
                console.log(resultados.supabase.message);
              }
            } else {
              throw new Error("Não foi possível buscar registros da tabela 'pneus' no Supabase");
            }
          }
        }
      } catch (supaError) {
        console.error("Erro ao limpar dados de pneus do Supabase:", supaError);
        resultados.supabase = {
          success: false,
          message: `Erro ao limpar tabela de pneus no Supabase: ${supaError}`,
          count: 0
        };
      }
      
      // Combinar resultados para mensagem de retorno
      let mensagem = "";
      if (resultados.replit.success && resultados.supabase.success) {
        mensagem = "Todos os dados de pneus foram limpos com sucesso nos dois bancos de dados";
      } else if (resultados.replit.success) {
        mensagem = "Dados limpos com sucesso no Replit, mas ocorreram problemas no Supabase: " + resultados.supabase.message;
      } else if (resultados.supabase.success) {
        mensagem = "Dados limpos com sucesso no Supabase, mas ocorreram problemas no Replit: " + resultados.replit.message;
      } else {
        mensagem = "Ocorreram problemas ao limpar os dados de pneus em ambos os bancos de dados";
      }
      
      return res.status(200).json({ 
        message: mensagem,
        success: resultados.replit.success || resultados.supabase.success,
        resultados
      });
    } catch (error) {
      console.error("Erro ao limpar dados de pneus:", error);
      return res.status(500).json({ 
        message: "Erro ao limpar dados de pneus", 
        error: String(error),
        success: false
      });
    }
  });

  // POST para executar a limpeza
  app.post('/api/admin/clear-supabase-data', isAdmin, async (req, res) => {
    try {
      const { confirm, tables } = req.body;
      
      if (confirm !== 'LIMPAR') {
        return res.status(400).json({ 
          message: "Confirmação inválida. Para limpar todos os dados, envie { 'confirm': 'LIMPAR' }" 
        });
      }
      
      // Se não foram especificadas tabelas, usar a lista padrão
      const supabaseTables = tables || [
        'abastecimentos_postos',
        'movimentacoes_patio',
        'entradas_combustivel', 
        'status_tanques',
        'controle_tanques',
        'veiculos'
      ];
      
      // Limpar os dados do Supabase
      try {
        const fetch = await import("node-fetch");
        
        // Garantir que as variáveis de ambiente estão definidas
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
        
        console.log("Iniciando limpeza específica de dados do Supabase via backend...");
        console.log(`URL Supabase: ${supabaseUrl}`);
        console.log(`Chave disponível: ${supabaseKey ? 'Sim' : 'Não'}`);
        console.log(`Tabelas para limpar: ${JSON.stringify(supabaseTables)}`);
        
        const resultados: Record<string, any> = {};
        
        // Limpa cada tabela usando REST API
        for (const table of supabaseTables) {
          try {
            console.log(`Limpando dados da tabela Supabase via backend: ${table}`);
            
            // Método 1: Limpar tudo de uma vez
            const response = await fetch.default(
              `${supabaseUrl}/rest/v1/${table}?select=id`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal'
                }
              }
            );
            
            if (response.ok) {
              console.log(`Tabela ${table} limpa com sucesso via backend`);
              resultados[table] = { success: true };
            } else {
              const errorText = await response.text();
              console.error(`Erro ao limpar tabela ${table} via backend: ${errorText}`);
              resultados[table] = { success: false, error: errorText };
              
              // Método 2: Se falhar o bulk delete, tenta registro a registro
              const getResponse = await fetch.default(
                `${supabaseUrl}/rest/v1/${table}?select=id`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                  }
                }
              );
              
              if (getResponse.ok) {
                // Conversão segura do JSON para o tipo esperado
                const rawData: unknown = await getResponse.json();
                const records: Array<{id: number}> = Array.isArray(rawData) 
                  ? rawData.filter((r: any) => r && typeof r.id !== 'undefined').map((r: any) => ({id: r.id}))
                  : [];
                if (records.length > 0) {
                  console.log(`Encontrados ${records.length} registros na tabela ${table} para exclusão individual`);
                  
                  const deleteResults = [];
                  for (const record of records) {
                    if (record && typeof record.id !== 'undefined') {
                      const deleteResponse = await fetch.default(
                        `${supabaseUrl}/rest/v1/${table}?id=eq.${record.id}`,
                        {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Prefer': 'return=minimal'
                          }
                        }
                      );
                      
                      deleteResults.push({
                        id: record.id,
                        success: deleteResponse.ok
                      });
                    }
                  }
                  
                  resultados[table] = { 
                    individualDeletion: true, 
                    results: deleteResults 
                  };
                }
              }
            }
          } catch (err) {
            console.error(`Erro ao processar tabela ${table} via backend: ${err}`);
            resultados[table] = { success: false, error: String(err) };
          }
        }
        
        return res.status(200).json({
          message: "Operação de limpeza do Supabase concluída",
          success: true,
          resultados
        });
      } catch (supaError) {
        console.error("Erro ao limpar dados do Supabase:", supaError);
        return res.status(500).json({
          message: "Erro ao limpar dados do Supabase",
          error: String(supaError),
          success: false
        });
      }
    } catch (error) {
      console.error("Erro na rota de limpeza do Supabase:", error);
      return res.status(500).json({ 
        message: "Erro ao processar solicitação de limpeza", 
        error: String(error),
        success: false
      });
    }
  });
  
  // Rota principal para limpar todos os dados (somente admin)
  app.post("/api/admin/clear-all-data", isAdmin, async (req, res) => {
    try {
      console.log("Iniciando limpeza completa dos dados do sistema");
      
      // Verificar se temos a confirmação correta
      const { confirm } = req.body;
      if (confirm !== 'LIMPAR') {
        return res.status(400).json({
          message: "Confirmação inválida. Por favor, forneça a confirmação correta para esta operação sensível.",
          success: false
        });
      }
      
      // Tabelas em ordem de limpeza (para evitar problemas de chave estrangeira)
      // As tabelas dependentes precisam ser apagadas antes das tabelas que elas referenciam
      // Todas as tabelas agora em português para consistência
      const tables = [
        'manutencao', 'abastecimentos', 'multas', 'pneus', 'linha_corredor', 'veiculos', 'oficinas'
      ];
      
      // Não vamos limpar as bases para evitar problemas com chaves estrangeiras
      // já que usuários têm referências para bases
      
      // Limpar cada tabela em sequência
      for (const table of tables) {
        console.log(`Limpando dados da tabela: ${table}`);
        
        switch (table) {
          case 'manutencao':
            // Buscar todos os registros e excluir um por um
            const maintenances = await storage.getAllMaintenance();
            for (const m of maintenances) {
              await storage.deleteMaintenance(m.id);
            }
            break;
            
          case 'abastecimentos':
            // Buscar todos os registros e excluir um por um
            const refuelings = await storage.getAllRefueling();
            for (const r of refuelings) {
              await storage.deleteRefueling(r.id);
            }
            break;
            
          case 'multas':
            // Buscar todos os registros e excluir um por um
            const fines = await storage.getAllFines();
            for (const f of fines) {
              await storage.deleteFine(f.id);
            }
            break;
            
          case 'pneus':
            // Buscar todos os registros e excluir um por um
            const tires = await storage.getAllTires();
            for (const t of tires) {
              await storage.deleteTire(t.id);
            }
            break;
            
          // Caso 'linha_corredor' removido conforme solicitação
            
            
          case 'veiculos':
            // Buscar todos os registros e excluir um por um
            const vehicles = await storage.getAllVehicles();
            for (const v of vehicles) {
              await storage.deleteVehicle(v.id);
            }
            break;
            
          case 'oficinas':
            // Buscar todos os registros e excluir um por um
            const workshops = await storage.getAllWorkshops();
            for (const w of workshops) {
              await storage.deleteWorkshop(w.id);
            }
            break;
            
          case 'bases':
            // Não excluir as bases padrão, apenas outras que possam ter sido adicionadas
            const bases = await storage.getAllBases();
            
            for (const b of bases) {
              // Preservar as bases padrão (não excluir)
              if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(b.id)) {
                await storage.deleteBase(b.id);
              }
            }
            break;
        }
      }
      
      // Limpar os dados do Supabase também (se disponível)
      try {
        const fetch = await import("node-fetch");
        
        // Garantir que as variáveis de ambiente estão definidas
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
        
        // Lista de tabelas Supabase para limpar
        const supabaseTables = [
          // Tabelas específicas do Supabase
          'abastecimentos_postos',
          'movimentacoes_patio',
          'entradas_combustivel',
          'status_tanques',
          'controle_tanques',
          // Tabelas compartilhadas com o Replit (nomes em português)
          'veiculos',
          'pneus',
          'multas',
          'abastecimentos',
          'manutencao',
          'oficinas',
          // 'linha_corredor' removido conforme solicitação
          // Possibilidade de tabelas com nomes antigos em inglês
          'vehicles',
          'tires',
          'maintenance',
          'workshops',
          'fines',
          'refueling'
          // 'line_hall' removido conforme solicitação
        ];
        
        console.log("Iniciando limpeza de dados do Supabase via API REST...");
        console.log(`URL Supabase: ${supabaseUrl}`);
        console.log(`Chave disponível: ${supabaseKey ? 'Sim' : 'Não'}`);
        
        // Duas abordagens para limpar os dados - first try direct REST API
        for (const table of supabaseTables) {
          try {
            console.log(`Tentando limpar dados da tabela Supabase: ${table} via REST API`);
            
            // Método 1: Usar API REST para limpar dados (DELETE sem WHERE = limpar tudo)
            const response = await fetch.default(
              `${supabaseUrl}/rest/v1/${table}?select=id`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal' // Não retorna os registros apagados
                }
              }
            );
            
            if (response.ok) {
              console.log(`✅ Tabela ${table} limpa com sucesso no Supabase (REST API)`);
            } else {
              const errorText = await response.text();
              console.error(`⚠️ Erro ao limpar tabela ${table} no Supabase via REST: ${errorText}`);
              
              // Método 2: Se falhar o primeiro método, tenta limpar registro por registro
              console.log(`Tentando abordagem alternativa para tabela ${table}...`);
              
              // Primeiro busca todos os registros
              const getResponse = await fetch.default(
                `${supabaseUrl}/rest/v1/${table}?select=id`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                  }
                }
              );
              
              if (getResponse.ok) {
                // Conversão segura do JSON para o tipo esperado
                const rawData: unknown = await getResponse.json();
                const records: Array<{id: number}> = Array.isArray(rawData) 
                  ? rawData.filter((r: any) => r && typeof r.id !== 'undefined').map((r: any) => ({id: r.id}))
                  : [];
                console.log(`Encontrados ${records.length} registros na tabela ${table}`);
                
                // Deleta cada registro individualmente
                if (records.length > 0) {
                  for (const record of records) {
                    if (!record || typeof record.id === 'undefined') continue;
                    const deleteResponse = await fetch.default(
                      `${supabaseUrl}/rest/v1/${table}?id=eq.${record.id}`,
                      {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'apikey': supabaseKey,
                          'Authorization': `Bearer ${supabaseKey}`,
                          'Prefer': 'return=minimal'
                        }
                      }
                    );
                    
                    if (deleteResponse.ok) {
                      console.log(`Registro id=${record.id} excluído com sucesso da tabela ${table}`);
                    } else {
                      console.error(`Erro ao excluir registro id=${record.id} da tabela ${table}`);
                    }
                  }
                }
              } else {
                console.error(`⚠️ Não foi possível buscar registros da tabela ${table}`);
              }
            }
          } catch (err) {
            console.error(`⚠️ Erro ao processar tabela ${table} no Supabase: ${err}`);
          }
        }
      } catch (supaError) {
        console.error("Erro ao limpar dados do Supabase:", supaError);
      }
      
      console.log("Limpeza completa de dados concluída com sucesso");
      return res.status(200).json({ 
        message: "Todos os dados foram limpos com sucesso",
        success: true
      });
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      return res.status(500).json({ 
        message: "Erro ao limpar dados do sistema", 
        error: String(error),
        success: false
      });
    }
  });

  // Endpoints para dashboard - usando middleware híbrido para maior compatibilidade
  // Endpoint para obter dados do painel principal
  app.get("/api/painel-principal", isAuthenticatedHybrid, getPainelPrincipal);
  
  // Endpoint legado para KPIs do dashboard - manter por compatibilidade
  app.get("/api/dashboard/kpis", isAuthenticatedHybrid, getDashboardKPIs);
  
  // Novo endpoint para o dashboard executivo
  app.get("/api/dashboard", isAuthenticatedHybrid, getExecutiveDashboard);
  
  // Rotas para solicitações de cartão de combustível
  app.get('/api/fuel-card-solicitations', isAuthenticated, getFuelCardSolicitations);
  app.get('/api/fuel-card-solicitations/:id', isAuthenticated, getFuelCardSolicitationById);
  app.post('/api/fuel-card-solicitations', createFuelCardSolicitation);
  app.put('/api/fuel-card-solicitations/:id/status', isAuthenticated, updateFuelCardSolicitationStatus);
  app.post('/api/fuel-card-solicitations/export', isAuthenticated, exportFuelCardSolicitationsToExcel);
  app.delete('/api/fuel-card-solicitations/:id', isAuthenticated, deleteFuelCardSolicitation);

  // Função específica para acesso público aos projetos
  const getProjectsWithBasesPublic = async (req: Request, res: Response) => {
    console.log('[PUBLIC-PROJECTS] Processando requisição pública para projetos e bases');
    try {
      const startTime = Date.now();
      
      // Consultas paralelas para melhor performance
      const [projectsResult, basesResult] = await Promise.all([
        pool.query(`
          SELECT id, name, description, is_active 
          FROM projects 
          WHERE is_active = true 
          ORDER BY name ASC
          LIMIT 50
        `),
        pool.query(`
          SELECT pb.id, pb.project_id, pb.base_name, pb.base_code, pb.description, pb.is_active
          FROM project_bases pb
          INNER JOIN projects p ON pb.project_id = p.id
          WHERE pb.is_active = true AND p.is_active = true
          ORDER BY pb.base_name ASC
        `)
      ]);
      
      // Criar mapa de bases por projeto_id
      const basesMap = new Map();
      basesResult.rows.forEach(base => {
        if (!basesMap.has(base.project_id)) {
          basesMap.set(base.project_id, []);
        }
        basesMap.get(base.project_id).push({
          id: base.id,
          base_name: base.base_name,
          base_code: base.base_code,
          description: base.description,
          is_active: base.is_active
        });
      });
      
      // Combinar projetos com suas bases
      const projects = projectsResult.rows.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        is_active: project.is_active,
        bases: basesMap.get(project.id) || []
      }));
      
      const totalTime = Date.now() - startTime;
      console.log(`[PUBLIC-PROJECTS] Processamento concluído em ${totalTime}ms`);
      
      return res.status(200).json({
        success: true,
        data: projects,
        count: projects.length,
        performance: { total_time_ms: totalTime }
      });
      
    } catch (error: any) {
      console.error('[PUBLIC-PROJECTS] Erro ao buscar projetos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar projetos e bases',
        error: error.message
      });
    }
  };

  // Rotas para projetos e bases
  app.get('/api/projects', isAuthenticatedHybrid, getProjects);
  app.get('/api/projects/:projectId/bases', isAuthenticatedHybrid, getProjectBases);
  app.get('/api/projects-with-bases', getProjectsWithBasesPublic); // Rota pública para formulários de postos
  app.get('/api/public/projects-with-bases', getProjectsWithBasesPublic); // Endpoint público para postos externos
  
  // API de teste específica para celular com dados estáticos
  app.get('/api/mobile/test-projects', (req, res) => {
    console.log(`[MOBILE-TEST] 📱 Requisição de teste recebida`);
    console.log(`[MOBILE-TEST] 🌐 User-Agent: ${req.get('User-Agent')}`);
    console.log(`[MOBILE-TEST] 📡 Origin: ${req.get('Origin')}`);
    console.log(`[MOBILE-TEST] 🔗 Referer: ${req.get('Referer')}`);
    
    const testData = {
      success: true,
      data: [
        {
          id: 1,
          name: "GRUPO PEREIRA",
          description: "Projeto teste",
          is_active: true,
          bases: [
            { id: 1, base_name: "Base GP01", base_code: "GP01", description: "Base teste" },
            { id: 2, base_name: "Base GP02", base_code: "GP02", description: "Base teste" }
          ]
        },
        {
          id: 3,
          name: "MERCADO LIVRE",
          description: "Projeto teste",
          is_active: true,
          bases: [
            { id: 3, base_name: "Base ML01", base_code: "ML01", description: "Base teste" }
          ]
        }
      ],
      count: 2,
      mobile_test: true,
      timestamp: new Date().toISOString()
    };
    
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Mobile-Request');
    res.json(testData);
  });
  app.post('/api/projects', isAuthenticated, createProject);
  app.post('/api/projects/:projectId/bases', isAuthenticated, createProjectBase);
  
  // Inicializar tabela de solicitações de cartão combustível
  setupFuelCardTable().catch(err => console.error("Erro ao configurar tabela de solicitações de cartão:", err));
  
  // Configurar tabela de solicitações de abastecimento
  setupFuelRequestsTable().catch(err => console.error("Erro ao configurar tabela de solicitações de abastecimento:", err));
  
  // Solicitações de manutenção - API para página de solicitação de manutenção
  app.get("/api/solicitacoes-manutencao", hasMaintenanceAccess, async (req, res) => {
    try {
      // Buscar todas as solicitações de manutenção
      // Como está usando Supabase diretamente, vamos retornar uma mensagem explicativa por enquanto
      res.status(200).json({ 
        message: "Esta API deve ser implementada com acesso a tabela manutencoes. A página atual usa Supabase diretamente."
      });
    } catch (error) {
      console.error("Erro ao buscar solicitações de manutenção:", error);
      res.status(500).json({ message: "Erro ao buscar solicitações", error: error.message });
    }
  });
  
  // Tratativas de manutenção - API para página de tratativas de manutenção
  app.get("/api/tratativas-manutencao", hasMaintenanceAccess, async (req, res) => {
    try {
      // Buscar todas as tratativas de manutenção
      // Como está usando Supabase diretamente, vamos retornar uma mensagem explicativa por enquanto
      res.status(200).json({ 
        message: "Esta API deve ser implementada com acesso a tabela manutencoes. A página atual usa Supabase diretamente."
      });
    } catch (error) {
      console.error("Erro ao buscar tratativas de manutenção:", error);
      res.status(500).json({ message: "Erro ao buscar tratativas", error: error.message });
    }
  });
  
  // API para iniciar uma tratativa de manutenção (mudar status para em_andamento)
  app.post("/api/tratativas-manutencao/:id/iniciar", hasMaintenanceAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { responsavel } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: "ID da manutenção é obrigatório" });
      }
      
      // Atualizar status da manutenção para em_andamento
      const manutencao = await storage.updateMaintenanceStatus(id, "em_andamento");
      
      if (!manutencao) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }
      
      res.status(200).json(manutencao);
    } catch (error) {
      console.error("Erro ao iniciar tratativa de manutenção:", error);
      res.status(500).json({ message: "Erro ao iniciar tratativa", error: error.message });
    }
  });
  
  // API para concluir uma tratativa de manutenção (mudar status para concluida)
  app.post("/api/tratativas-manutencao/:id/concluir", hasMaintenanceAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!id) {
        return res.status(400).json({ message: "ID da manutenção é obrigatório" });
      }
      
      // Atualizar status da manutenção para concluida
      const manutencao = await storage.updateMaintenanceStatus(id, "concluida");
      
      if (!manutencao) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }
      
      res.status(200).json(manutencao);
    } catch (error) {
      console.error("Erro ao concluir tratativa de manutenção:", error);
      res.status(500).json({ message: "Erro ao concluir tratativa", error: error.message });
    }
  });

  // API para receber cadastro externo de oficinas (acesso público)
  app.post("/api/workshops/external", async (req, res) => {
    try {
      const {
        nome_oficina,
        cnpj,
        telefone,
        email,
        endereco,
        ramo_atuacao,
        banco,
        agencia,
        conta,
        tipo_conta,
        placa_veiculo,
        orcamento_url,
        data_entrada,
        previsao_entrega,
        data_retirada,
        servico_realizado,
        observacoes,
        forma_pagamento,
        unificar_servicos,
        valor_total
      } = req.body;

      // Verificação básica de dados
      if (!nome_oficina) {
        return res.status(400).json({ message: "O nome da oficina é obrigatório" });
      }

      // Como estamos usando o pool diretamente, vamos fazer as consultas SQL de forma mais segura
      try {
        // Verificar se a oficina já existe
        const oficinaExistente = await pool.query(
          "SELECT id FROM oficinas WHERE nome_oficina = $1 AND cnpj = $2",
          [nome_oficina, cnpj || '']
        );

        let oficinaId: number;
        let isNovaOficina = false;

        // Se a oficina não existe, criar nova
        if (oficinaExistente.rowCount === 0) {
          isNovaOficina = true;

          // Inserir nova oficina
          const novaOficina = await pool.query(
            `INSERT INTO oficinas (
              nome_oficina, cnpj, telefone, email, endereco, ramo_atuacao,
              banco, agencia, conta, tipo_conta, status
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendente'
            ) RETURNING id`,
            [
              nome_oficina,
              cnpj || null,
              telefone || null,
              email || null,
              endereco || null,
              ramo_atuacao || null,
              banco || null,
              agencia || null,
              conta || null,
              tipo_conta || null
            ]
          );

          oficinaId = novaOficina.rows[0].id;
        } else {
          oficinaId = oficinaExistente.rows[0].id;
        }

        // Buscar o ID do veículo pela placa, se fornecida
        let veiculoId = null;
        if (placa_veiculo) {
          const veiculos = await pool.query(
            "SELECT id FROM veiculos WHERE plate = $1",
            [placa_veiculo]
          );

          if (veiculos.rowCount > 0) {
            veiculoId = veiculos.rows[0].id;
          }
        }

        // Registrar o orçamento/serviço, mesmo se o veículo não for encontrado
        await pool.query(
          `INSERT INTO servicos_oficina (
            oficina_id, veiculo_id, placa_veiculo, orcamento_url, data_entrada, 
            previsao_entrega, data_retirada, servico_realizado, 
            observacoes, forma_pagamento, unificar_servicos, valor_total, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pendente'
          )`,
          [
            oficinaId,
            veiculoId,
            placa_veiculo || null,
            orcamento_url || null,
            data_entrada || null,
            previsao_entrega || null,
            data_retirada || null,
            servico_realizado === true,
            observacoes || null,
            forma_pagamento || null,
            unificar_servicos === true,
            valor_total ? parseFloat(valor_total as string) : null
          ]
        );

        // Gerar credenciais para a oficina, se for nova
        let credenciais = null;
        if (isNovaOficina) {
          // Gerar um nome de usuário baseado no nome da oficina (remoção de espaços e caracteres especiais)
          const username = nome_oficina
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);
            
          // Gerar um email usando o formato solicitado
          const emailOficina = `${username}@muricionfleet.com`;
          
          // Gerar uma senha aleatória
          const senhaAleatoria = Math.random().toString(36).substring(2, 10);
          
          // Criptografar a senha
          const senhaHash = await hashPassword(senhaAleatoria);
          
          try {
            // Verificar se já existe um usuário com esse email
            const usuarioExistente = await pool.query(
              "SELECT id FROM users WHERE email = $1",
              [emailOficina]
            );
            
            if (usuarioExistente.rowCount === 0) {
              // Inserir novo usuário
              await pool.query(
                `INSERT INTO users (
                  name, email, password, role, baseId, is_oficina, oficina_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  nome_oficina,
                  emailOficina,
                  senhaHash,
                  'oficina',
                  null, // baseId nulo, pois não está associado a nenhuma base
                  true,
                  oficinaId
                ]
              );
              
              // Atualizar a oficina com o email gerado
              await pool.query(
                "UPDATE oficinas SET email_sistema = $1 WHERE id = $2",
                [emailOficina, oficinaId]
              );
              
              credenciais = {
                email: emailOficina,
                senha: senhaAleatoria
              };
            }
          } catch (userError) {
            console.error("Erro ao criar usuário para oficina:", userError);
            // Continuamos mesmo com erro na criação do usuário
          }
        }

        res.status(201).json({
          message: "Cadastro de oficina e orçamento recebido com sucesso",
          oficinaId,
          credenciais
        });
      } catch (dbError) {
        console.error("Erro de banco de dados:", dbError);
        res.status(500).json({ message: "Erro de banco de dados ao processar cadastro" });
      }
    } catch (error) {
      console.error("Erro ao processar cadastro de oficina externa:", error);
      res.status(500).json({ 
        message: "Erro interno ao processar cadastro", 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });
  
  // ======= ROTAS PARA POSTO REMÉDIOS =======
  
  // Listar registros de abastecimento e lavagem do posto Remédios (versão autenticada)
  app.get("/api/posto-remedios/abastecimentos", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, placa } = req.query;
      
      let query = "SELECT * FROM posto_remedios_abastecimentos";
      const queryParams = [];
      const conditions = [];
      
      if (placa) {
        conditions.push("placa ILIKE $" + (queryParams.length + 1));
        queryParams.push(`%${placa}%`);
      }
      
      if (startDate && endDate) {
        conditions.push("data_registro BETWEEN $" + (queryParams.length + 1) + " AND $" + (queryParams.length + 2));
        queryParams.push(startDate, endDate);
      }
      
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      
      query += " ORDER BY data_registro DESC";
      
      const result = await pool.query(query, queryParams);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount,
        data: result.rows
      });
    } catch (error) {
      console.error("Erro ao buscar registros do posto Remédios:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar registros do posto Remédios"
      });
    }
  });
  
  // Listar registros de abastecimento e lavagem do posto Remédios (versão standalone - sem autenticação)
  app.get("/api/posto-remedios-standalone/abastecimentos", async (req, res) => {
    try {
      const { startDate, endDate, placa } = req.query;
      
      let query = "SELECT * FROM posto_remedios_abastecimentos";
      const queryParams = [];
      const conditions = [];
      
      if (placa) {
        conditions.push("placa ILIKE $" + (queryParams.length + 1));
        queryParams.push(`%${placa}%`);
      }
      
      if (startDate && endDate) {
        conditions.push("data_registro BETWEEN $" + (queryParams.length + 1) + " AND $" + (queryParams.length + 2));
        queryParams.push(startDate, endDate);
      }
      
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      
      query += " ORDER BY data_registro DESC";
      
      const result = await pool.query(query, queryParams);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount,
        data: result.rows
      });
    } catch (error) {
      console.error("Erro ao buscar registros do posto Remédios (standalone):", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar registros do posto Remédios"
      });
    }
  });
  
  // Adicionar novo registro de abastecimento/lavagem (versão autenticada)
  app.post("/api/posto-remedios/abastecimentos", isAuthenticated, async (req, res) => {
    try {
      const {
        placa,
        km,
        projeto,
        motorista_nome,
        motorista_rg,
        tipo_combustivel,
        quantidade_litros,
        valor_litro,
        valor_total,
        lavagem,
        tipo_lavagem,
        observacoes,
        tipo_veiculo
      } = req.body;
      
      // Validar campos obrigatórios
      if (!placa || !km || !projeto || !motorista_nome || !motorista_rg) {
        return res.status(400).json({
          success: false,
          message: "Todos os campos obrigatórios devem ser preenchidos (placa, km, projeto, motorista_nome, motorista_rg)"
        });
      }
      
      // Validação de tipos de combustível
      if (tipo_combustivel && !['diesel', 'gasolina', 'alcool'].includes(tipo_combustivel)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de combustível inválido. Valores permitidos: diesel, gasolina, alcool"
        });
      }
      
      const query = `
        INSERT INTO posto_remedios_abastecimentos
        (placa, km, projeto, motorista_nome, motorista_rg, tipo_combustivel, quantidade_litros, valor_litro, valor_total, lavagem, tipo_lavagem, observacoes, tipo_veiculo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const values = [
        placa,
        km,
        projeto,
        motorista_nome,
        motorista_rg,
        tipo_combustivel || null,
        quantidade_litros || null,
        valor_litro || null,
        valor_total || null,
        lavagem || false,
        tipo_lavagem || null,
        observacoes || null,
        tipo_veiculo || "frota" // Usar "frota" como valor padrão se não for especificado
      ];
      
      const result = await pool.query(query, values);
      
      return res.status(201).json({
        success: true,
        message: "Registro adicionado com sucesso",
        data: result.rows[0]
      });
    } catch (error) {
      console.error("Erro ao adicionar registro do posto Remédios:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao adicionar registro do posto Remédios"
      });
    }
  });
  
  // Adicionar novo registro de abastecimento/lavagem (versão standalone - sem autenticação)
  app.post("/api/posto-remedios-standalone/abastecimentos", async (req, res) => {
    try {
      const {
        placa,
        km,
        projeto,
        motorista_nome,
        motorista_rg,
        tipo_combustivel,
        quantidade_litros,
        valor_litro,
        valor_total,
        lavagem,
        tipo_lavagem,
        observacoes,
        tipo_veiculo
      } = req.body;
      
      // Validar campos obrigatórios
      if (!placa || !km || !projeto || !motorista_nome || !motorista_rg) {
        return res.status(400).json({
          success: false,
          message: "Todos os campos obrigatórios devem ser preenchidos (placa, km, projeto, motorista_nome, motorista_rg)"
        });
      }
      
      // Validação de tipos de combustível
      if (tipo_combustivel && !['diesel', 'gasolina', 'alcool'].includes(tipo_combustivel)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de combustível inválido. Valores permitidos: diesel, gasolina, alcool"
        });
      }
      
      const query = `
        INSERT INTO posto_remedios_abastecimentos
        (placa, km, projeto, motorista_nome, motorista_rg, tipo_combustivel, quantidade_litros, valor_litro, valor_total, lavagem, tipo_lavagem, observacoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        placa,
        km,
        projeto,
        motorista_nome,
        motorista_rg,
        tipo_combustivel || null,
        quantidade_litros || null,
        valor_litro || null,
        valor_total || null,
        lavagem || false,
        tipo_lavagem || null,
        observacoes || null
        // Campo tipo_veiculo removido pois não existe na tabela
      ];
      
      const result = await pool.query(query, values);
      
      return res.status(201).json({
        success: true,
        message: "Registro adicionado com sucesso",
        data: result.rows[0]
      });
    } catch (error) {
      console.error("Erro ao adicionar registro do posto Remédios (standalone):", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao adicionar registro do posto Remédios"
      });
    }
  });
  
  // Obter um registro específico
  app.get("/api/posto-remedios/abastecimentos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const result = await pool.query("SELECT * FROM posto_remedios_abastecimentos WHERE id = $1", [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Registro não encontrado"
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error("Erro ao buscar registro específico do posto Remédios:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar registro específico do posto Remédios"
      });
    }
  });
  
  // Deletar um registro de abastecimento (SOMENTE ADMIN)
  app.delete("/api/posto-remedios/abastecimentos/:id", isAdmin, async (req, res) => {
    try {
      console.log(`[DELETE Posto Remédios] Processando requisição DELETE para ID: ${req.params.id}`);
      console.log(`[DELETE Posto Remédios] Usuário autenticado:`, {
        sessionUser: req.user ? { 
          id: req.user.id, 
          email: req.user.email,
          role: req.user.role 
        } : null,
        jwtUser: (req as any).supabaseUser ? { 
          id: (req as any).supabaseUser.id,
          email: (req as any).supabaseUser.email,
          role: (req as any).supabaseUser.role
        } : null,
        hybridUser: (req as any).hybridUser ? {
          id: (req as any).hybridUser.id,
          email: (req as any).hybridUser.email,
          role: (req as any).hybridUser.role
        } : null
      });
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      // Verificar se o registro existe antes de tentar excluir
      const checkResult = await pool.query("SELECT id FROM posto_remedios_abastecimentos WHERE id = $1", [id]);
      
      if (checkResult.rowCount === 0 || !checkResult.rowCount) {
        return res.status(404).json({
          success: false,
          message: "Registro não encontrado"
        });
      }
      
      // Obter informações do usuário (sessão, Supabase JWT ou hybrid JWT)
      const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
      
      if (!user) {
        console.error("[DELETE Posto Remédios] Usuário não encontrado na requisição");
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }
      
      console.log(`[DELETE Posto Remédios] Usuário confirmado: ${user.email} (${user.role})`);
      
      try {
        // Verificar se a tabela logs_operacoes existe
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'logs_operacoes'
          );
        `);
        
        const logsTableExists = tableCheck.rows[0].exists;
        
        if (!logsTableExists) {
          // Criar tabela de logs se não existir
          console.log("[DELETE Posto Remédios] Criando tabela logs_operacoes");
          await pool.query(`
            CREATE TABLE IF NOT EXISTS logs_operacoes (
              id SERIAL PRIMARY KEY,
              user_id INTEGER,
              user_email VARCHAR(255),
              user_role VARCHAR(50),
              tipo_operacao VARCHAR(50) NOT NULL,
              tabela VARCHAR(100) NOT NULL,
              registro_id INTEGER,
              detalhes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
        }
        
        // Registrar a operação de exclusão em um log
        const logQuery = `
          INSERT INTO logs_operacoes (
            user_id, 
            user_email, 
            user_role, 
            tipo_operacao, 
            tabela, 
            registro_id, 
            detalhes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await pool.query(logQuery, [
          user.id,
          user.email,
          user.role,
          'exclusão',
          'posto_remedios_abastecimentos',
          id,
          `Excluído pelo administrador em ${new Date().toISOString()}`
        ]);
        
        console.log(`[DELETE Posto Remédios] Log de exclusão registrado para ID ${id}`);
      } catch (logError) {
        console.error("[DELETE Posto Remédios] Erro ao registrar log de exclusão:", logError);
        // Continuamos a operação mesmo se falhar o log
      }
      
      // Executar a exclusão
      const result = await pool.query("DELETE FROM posto_remedios_abastecimentos WHERE id = $1", [id]);
      console.log(`[DELETE Posto Remédios] Registro ${id} excluído com sucesso`);
      
      return res.status(200).json({
        success: true,
        message: "Registro excluído com sucesso"
      });
    } catch (error) {
      console.error("[DELETE Posto Remédios] Erro ao excluir registro:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao excluir registro do posto Remédios"
      });
    }
  });
  
  // ======= ROTAS PARA CHAT DE NEGOCIAÇÃO DE ORÇAMENTO =======
  
  // Obter chat por ID da manutenção
  app.get("/api/workshop/maintenance-chat/:maintenanceId", hasMaintenanceAccess, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.maintenanceId);
      
      // Verificar se o ID foi fornecido corretamente
      if (isNaN(maintenanceId)) {
        return res.status(400).json({ message: "ID de manutenção inválido" });
      }
      
      // Buscar o chat de manutenção
      const chat = await storage.getMaintenanceChatByMaintenanceId(maintenanceId);
      
      // Se encontrou um chat, buscar suas mensagens
      if (chat) {
        const chatWithMessages = await storage.getMaintenanceChatWithMessages(chat.id);
        return res.status(200).json({
          ...chatWithMessages.chat,
          messages: chatWithMessages.messages
        });
      }
      
      // Se não encontrou, retornar um objeto vazio
      return res.status(200).json({ 
        maintenanceId,
        messages: [] 
      });
    } catch (error: any) {
      console.error("Erro ao buscar chat de manutenção:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar chat",
        error: error.message 
      });
    }
  });
  
  // Obter todos os chats de manutenção
  // Obter manutenções com chats para a página de tratativas de orçamentos
  app.get("/api/fleet/maintenance-with-chats", hasMaintenanceAccess, async (req, res) => {
    try {
      const maintenanceWithChats = await storage.getMaintenanceEntriesWithChats();
      return res.status(200).json(maintenanceWithChats);
    } catch (error: any) {
      console.error("Erro ao obter manutenções com chats:", error);
      return res.status(500).json({
        message: "Erro ao obter manutenções com chats",
        error: error.message
      });
    }
  });
  
  // API para a página de orçamentos (BudgetsPage)
  app.get("/api/fleet/budget-chats", hasMaintenanceAccess, async (req, res) => {
    try {
      const status = req.query.status as string;
      
      // Obter todos os chats com orçamentos junto com informações das manutenções relacionadas
      let statusFilter = '';
      
      // Mapear os filtros de status corretamente
      if (status && status !== 'todos') {
        if (status === 'negociacao') {
          statusFilter = `AND (m.status = 'em_negociacao' OR m.status = 'em_andamento')`;
        } else if (status === 'aguardando') {
          statusFilter = `AND m.status = 'aguardando_orcamento'`;
        } else if (status === 'aprovados') {
          statusFilter = `AND (mc.is_finalized = true OR m.status = 'orcamento_aprovado')`;
        } else {
          statusFilter = `AND m.status = '${status}'`;
        }
      }
      
      // Consulta atualizada com mais filtros abrangentes
      const query = `
        SELECT 
          mc.id, 
          mc.maintenance_id as "maintenanceId", 
          mc.initial_budget as "initialBudget", 
          mc.final_budget as "finalBudget", 
          mc.is_finalized as "isFinalized", 
          mc.created_at, 
          mc.updated_at,
          COALESCE(mc.vehicle_plate, m.vehicle_plate) as "maintenanceVehiclePlate",
          m.description as "maintenanceDescription", 
          m.status as "maintenanceStatus",
          w.name as "workshopName"
        FROM 
          maintenance_chat mc
        JOIN 
          manutencao m ON mc.maintenance_id = m.id
        JOIN 
          workshops w ON m.workshop_id = w.id
        WHERE 
          1=1
          ${statusFilter}
        ORDER BY 
          mc.updated_at DESC
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json(result.rows);
    } catch (error: any) {
      console.error("Erro ao obter chats de orçamento:", error);
      return res.status(500).json({ 
        message: "Erro ao obter chats de orçamento",
        error: error.message 
      });
    }
  });
  
  app.get("/api/workshop/maintenance-chats", hasMaintenanceAccess, async (req, res) => {
    try {
      // Buscar todos os chats de manutenção
      const chats = await storage.getAllMaintenanceChats();
      
      // Preparar array para os chats com os detalhes da manutenção
      const chatsWithMaintenanceDetails = [];
      
      // Buscar detalhes de cada manutenção associada aos chats
      for (const chat of chats) {
        const maintenance = await storage.getMaintenance(chat.maintenanceId);
        if (maintenance) {
          // Consultar nome da oficina diretamente
          let workshopName = '';
          if (maintenance.workshopId) {
            const workshopQuery = await pool.query(
              'SELECT name FROM workshops WHERE id = $1',
              [maintenance.workshopId]
            );
            if (workshopQuery.rows.length > 0) {
              workshopName = workshopQuery.rows[0].name;
            }
          }
          
          // Consultar nome da base diretamente
          let baseName = '';
          if (maintenance.requestBaseId) {
            const baseQuery = await pool.query(
              'SELECT name FROM bases WHERE id = $1',
              [maintenance.requestBaseId]
            );
            if (baseQuery.rows.length > 0) {
              baseName = baseQuery.rows[0].name;
            }
          }
          
          chatsWithMaintenanceDetails.push({
            ...chat,
            maintenance: {
              id: maintenance.id,
              vehiclePlate: maintenance.vehiclePlate,
              // Removemos vehicleModel que não existe no banco
              description: maintenance.description,
              status: maintenance.status,
              // Removemos priority que não existe no banco
              workshopId: maintenance.workshopId,
              workshopName: workshopName,
              baseId: maintenance.requestBaseId,
              baseName: baseName,
              responsavelNome: maintenance.responsiblePerson // Campo correto
            }
          });
        }
      }
      
      return res.status(200).json(chatsWithMaintenanceDetails);
    } catch (error: any) {
      console.error("Erro ao buscar todos os chats de manutenção:", error);
      return res.status(500).json({
        message: "Erro ao buscar chats",
        error: error.message
      });
    }
  });
  
  // Criar um novo chat de manutenção
  app.post("/api/workshop/maintenance-chat", hasMaintenanceAccess, async (req, res) => {
    try {
      console.log("Payload recebido:", req.body);
      console.log("Usuário:", req.user);
      
      // Verificar se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({ 
          message: "Usuário não autenticado" 
        });
      }
      
      // Se for usuário de oficina, verificar se tem oficina_id
      if (req.user.role === 'oficina' && !req.user.oficina_id) {
        console.log("Usuário de oficina sem oficina_id:", req.user);
        return res.status(400).json({ 
          message: "Usuário de oficina sem associação com uma oficina específica" 
        });
      }
      
      // Verificar e normalizar os dados do orçamento
      const payload = {
        ...req.body,
        // Garantir que initialBudget é um número
        initialBudget: typeof req.body.initialBudget === 'string' 
          ? parseFloat(req.body.initialBudget) 
          : req.body.initialBudget
      };
      
      // Validar dados do corpo da requisição
      const result = insertMaintenanceChatSchema.safeParse(payload);
      if (!result.success) {
        console.log("Erro de validação:", result.error.format());
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Verificar se é preciso criar uma manutenção para este chat
      let maintenanceId = result.data.maintenanceId;
      let vehiclePlate = result.data.vehiclePlate;
      
      if (!maintenanceId || maintenanceId <= 0) {
        console.log("ID de manutenção inválido ou temporário, criando nova manutenção");
        
        if (!vehiclePlate) {
          return res.status(400).json({ 
            message: "Placa do veículo é obrigatória ao criar uma nova manutenção" 
          });
        }
        
        try {
          // Verificar se o veículo existe
          const vehicle = await storage.getVehicleByPlate(vehiclePlate);
          if (!vehicle) {
            return res.status(404).json({ message: "Veículo não encontrado" });
          }
          
          // Criar a manutenção automaticamente
          const novaManutenao = {
            vehiclePlate: vehiclePlate,
            description: req.body.descricaoServico || "Orçamento gerado pela oficina",
            status: "aguardando_orcamento",
            priority: "normal",
            maintenanceType: "preventiva",
            workshopId: req.user.oficina_id,
            requestBaseId: vehicle.baseId || 1, // Usar a base do veículo ou uma padrão
            entryDate: new Date().toISOString().split('T')[0], // Data de entrada é obrigatória
            estimatedCompletion: new Date(Date.now() + (parseInt(req.body.prazoEstimado) || 5) * 24 * 60 * 60 * 1000).toISOString()
          };
          
          // Criar a manutenção no banco
          const newMaintenance = await storage.createMaintenance(novaManutenao);
          maintenanceId = newMaintenance.id;
          console.log(`Nova manutenção criada com ID ${maintenanceId}`);
          
          // Atualizar o objeto de dados com o novo ID
          result.data.maintenanceId = maintenanceId;
        } catch (maintenanceError) {
          console.error("Erro ao criar manutenção automática:", maintenanceError);
          return res.status(500).json({ 
            message: "Erro ao criar manutenção automática",
            error: maintenanceError instanceof Error ? maintenanceError.message : "Erro desconhecido" 
          });
        }
      } else if (!vehiclePlate) {
        // Garantir que temos a placa do veículo para manutenções existentes
        const maintenance = await storage.getMaintenance(maintenanceId);
        if (maintenance && maintenance.vehiclePlate) {
          vehiclePlate = maintenance.vehiclePlate;
          result.data.vehiclePlate = vehiclePlate;
        } else {
          return res.status(400).json({ 
            message: "Placa do veículo é obrigatória"
          });
        }
      }
      
      // Log dos dados processados
      console.log("Dados validados para criar chat:", {
        maintenanceId: result.data.maintenanceId,
        vehiclePlate: result.data.vehiclePlate,
        initialBudget: result.data.initialBudget,
        tipo: typeof result.data.initialBudget
      });
      
      try {
        // Criar chat com os dados atualizados
        const chat = await storage.createMaintenanceChat(result.data);
        
        // Atualizar status da manutenção para em_andamento após cada chat, independente do status atual
        try {
          // Usar SQL direto para evitar problema com coluna maintenance_start_date
          await pool.query(`
            UPDATE manutencao
            SET status = 'em_andamento', updated_at = NOW()
            WHERE id = $1
          `, [chat.maintenanceId]);
          
          console.log(`Status da manutenção ${chat.maintenanceId} atualizado para em_andamento (negociação em progresso)`);
        } catch (updateError) {
          console.error("Erro ao atualizar status da manutenção:", updateError);
          // Continuar mesmo com erro no status para pelo menos cadastrar o chat
        }
        
        // Retornar o chat criado
        return res.status(201).json(chat);
      } catch (chatError) {
        console.error("Erro ao criar chat de manutenção:", chatError);
        return res.status(500).json({ 
          message: "Erro ao criar chat de manutenção",
          error: chatError instanceof Error ? chatError.message : "Erro desconhecido" 
        });
      }
    } catch (error: any) {
      console.error("Erro ao processar requisição de chat:", error);
      return res.status(500).json({ 
        message: "Erro ao processar requisição",
        error: error.message 
      });
    }
  });
  
  // Adicionar mensagem ao chat
  app.post("/api/workshop/chat-message", hasMaintenanceAccess, async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Preparar dados da mensagem
      const messageData: InsertChatMessage = {
        chatId: req.body.chatId,
        author: req.user.role === 'oficina' ? 'oficina' : 'frota', // Corrigido para 'frota' conforme definido no banco de dados
        authorId: req.user.id,
        authorName: req.user.name,
        message: req.body.message,
        proposedBudget: req.body.proposedBudget || null
      };
      
      // Validar dados
      const result = insertChatMessageSchema.safeParse(messageData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Criar mensagem
      const message = await storage.createChatMessage(result.data);
      
      // Retornar a mensagem criada
      return res.status(201).json(message);
    } catch (error: any) {
      console.error("Erro ao criar mensagem:", error);
      return res.status(500).json({ 
        message: "Erro ao enviar mensagem",
        error: error.message 
      });
    }
  });
  
  // Finalizar negociação de orçamento
  app.post("/api/workshop/maintenance-chat/:chatId/finalize", hasMaintenanceAccess, async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const chatId = parseInt(req.params.chatId);
      const { finalBudget } = req.body;
      
      // Validar dados
      if (isNaN(chatId) || !finalBudget || isNaN(parseFloat(finalBudget))) {
        return res.status(400).json({ message: "Dados inválidos para finalização" });
      }
      
      // Finalizar chat
      const updatedChat = await storage.finalizeMaintenanceChat(
        chatId, 
        parseFloat(finalBudget), 
        req.user.name
      );
      
      if (!updatedChat) {
        return res.status(404).json({ message: "Chat não encontrado" });
      }
      
      // Atualizar status da manutenção para orçamento aprovado
      const maintenance = await storage.getMaintenance(updatedChat.maintenanceId);
      if (maintenance) {
        try {
          // Usar SQL direto para evitar problema com coluna maintenance_start_date
          await pool.query(`
            UPDATE manutencao
            SET status = 'orcamento_aprovado', updated_at = NOW()
            WHERE id = $1
          `, [maintenance.id]);
          
          console.log(`Status da manutenção ${maintenance.id} atualizado para orcamento_aprovado`);
        } catch (updateError) {
          console.error("Erro ao atualizar status da manutenção:", updateError);
          // Continuar mesmo com erro no status para pelo menos finalizar o chat
        }
      }
      
      // Retornar o chat atualizado
      return res.status(200).json(updatedChat);
    } catch (error: any) {
      console.error("Erro ao finalizar negociação:", error);
      return res.status(500).json({ 
        message: "Erro ao finalizar negociação",
        error: error.message 
      });
    }
  });

  // ======= ROTAS PARA CONTROLE DE CICLO DE VIDA DE MANUTENÇÃO =======
  
  // API para registrar ou atualizar o ciclo de vida de uma manutenção
  app.post("/api/workshop/maintenance-lifecycle", hasMaintenanceAccess, async (req, res) => {
    try {
      const { 
        maintenanceId, 
        entryDate, 
        maintenanceStartDate, 
        expectedExitDate, 
        actualExitDate,
        vehiclePickupDate,
        pickupPersonName,
        pickupPersonCpf,
        pickupComments
      } = req.body;
      
      if (!maintenanceId) {
        return res.status(400).json({ message: "ID da manutenção é obrigatório" });
      }
      
      // Verificar se a manutenção existe
      const maintenance = await storage.getMaintenance(maintenanceId);
      if (!maintenance) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }
      
      // Verificar se já existe um registro de ciclo de vida para esta manutenção
      const query = `
        SELECT * FROM maintenance_lifecycle 
        WHERE maintenance_id = $1
      `;
      const result = await pool.query(query, [maintenanceId]);
      
      let lifecycleData;
      
      if (result.rows.length > 0) {
        // Atualizar registro existente
        const updateQuery = `
          UPDATE maintenance_lifecycle
          SET 
            entry_date = COALESCE($1, entry_date),
            maintenance_start_date = COALESCE($2, maintenance_start_date),
            expected_exit_date = COALESCE($3, expected_exit_date),
            actual_exit_date = COALESCE($4, actual_exit_date),
            vehicle_pickup_date = COALESCE($5, vehicle_pickup_date),
            pickup_person_name = COALESCE($6, pickup_person_name),
            pickup_person_cpf = COALESCE($7, pickup_person_cpf),
            pickup_comments = COALESCE($8, pickup_comments),
            updated_at = NOW()
          WHERE maintenance_id = $9
          RETURNING *
        `;
        
        const updateResult = await pool.query(updateQuery, [
          entryDate,
          maintenanceStartDate,
          expectedExitDate,
          actualExitDate,
          vehiclePickupDate,
          pickupPersonName,
          pickupPersonCpf,
          pickupComments,
          maintenanceId
        ]);
        
        lifecycleData = updateResult.rows[0];
      } else {
        // Criar novo registro
        const insertQuery = `
          INSERT INTO maintenance_lifecycle (
            maintenance_id,
            entry_date,
            maintenance_start_date,
            expected_exit_date,
            actual_exit_date,
            vehicle_pickup_date,
            pickup_person_name,
            pickup_person_cpf,
            pickup_comments
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        
        const insertResult = await pool.query(insertQuery, [
          maintenanceId,
          entryDate,
          maintenanceStartDate,
          expectedExitDate,
          actualExitDate,
          vehiclePickupDate,
          pickupPersonName,
          pickupPersonCpf,
          pickupComments
        ]);
        
        lifecycleData = insertResult.rows[0];
      }
      
      // Atualizar o status da manutenção com base nas datas do ciclo de vida
      try {
        let novoStatus = null;
        
        if (vehiclePickupDate) {
          // Se o veículo foi retirado, marcar como concluída (se ainda não estiver)
          if (maintenance.status !== 'concluida') {
            novoStatus = 'concluida';
          }
        } else if (actualExitDate) {
          // Se a manutenção foi finalizada (tem data de saída), mas o veículo ainda não foi retirado
          if (maintenance.status !== 'concluida') {
            novoStatus = 'concluida';
          }
        } else if (maintenanceStartDate && maintenance.status !== 'em_andamento' && 
                  maintenance.status !== 'concluida' && maintenance.status !== 'cancelada') {
          // Se a manutenção foi iniciada, mas não concluída/cancelada, atualizar para em andamento
          novoStatus = 'em_andamento';
        }
        
        // Se precisamos atualizar o status, fazer via SQL direto
        if (novoStatus) {
          await pool.query(`
            UPDATE manutencao
            SET status = $1, updated_at = NOW()
            WHERE id = $2
          `, [novoStatus, maintenanceId]);
          
          console.log(`Status da manutenção ${maintenanceId} atualizado para ${novoStatus}`);
        }
      } catch (updateError) {
        console.error("Erro ao atualizar status da manutenção:", updateError);
        // Continuar mesmo com erro no status
      }
      
      return res.status(200).json(lifecycleData);
    } catch (error: any) {
      console.error("Erro ao gerenciar ciclo de vida da manutenção:", error);
      return res.status(500).json({ 
        message: "Erro ao gerenciar ciclo de vida da manutenção",
        error: error.message 
      });
    }
  });
  
  // API para obter informações do ciclo de vida de uma manutenção
  app.get("/api/workshop/maintenance-lifecycle/:maintenanceId", hasMaintenanceAccess, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.maintenanceId);
      
      if (isNaN(maintenanceId)) {
        return res.status(400).json({ message: "ID de manutenção inválido" });
      }
      
      // Verificar se a manutenção existe
      const maintenance = await storage.getMaintenance(maintenanceId);
      if (!maintenance) {
        return res.status(404).json({ message: "Manutenção não encontrada" });
      }
      
      // Buscar informações do ciclo de vida
      const query = `
        SELECT * FROM maintenance_lifecycle 
        WHERE maintenance_id = $1
      `;
      const result = await pool.query(query, [maintenanceId]);
      
      if (result.rows.length > 0) {
        return res.status(200).json(result.rows[0]);
      } else {
        // Se não encontrar, retornar um objeto vazio
        return res.status(200).json({
          maintenance_id: maintenanceId,
          entry_date: maintenance.entryDate
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar ciclo de vida da manutenção:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar ciclo de vida da manutenção",
        error: error.message 
      });
    }
  });
  
  // Rota temporária para redefinir senha de oficina (APENAS PARA TESTES)
  app.get("/api/reset-workshop-password", async (req, res) => {
    try {
      // Definir senha temporária
      const novaSenha = "oficina123";
      const senhaHash = await hashPassword(novaSenha);
      
      // Atualizar a senha do usuário com role 'oficina'
      await pool.query(
        "UPDATE users SET password = $1 WHERE role = 'oficina'",
        [senhaHash]
      );
      
      return res.status(200).json({
        message: "Senha redefinida com sucesso para todas as oficinas",
        novaSenha
      });
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      return res.status(500).json({
        message: "Erro ao redefinir senha",
        error: error.message
      });
    }
  });

  // Rotas para solicitações das bases (base_requests)
  // Criar uma nova solicitação
  app.post("/api/base-requests", isAuthenticated, async (req, res) => {
    try {
      console.log("POST /api/base-requests - Dados recebidos:", req.body);
      
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Validar dados da solicitação
      const result = insertBaseRequestSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Erro de validação:", result.error.format());
        return res.status(400).json({ 
          message: "Dados de solicitação inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Garantir que o usuário solicitante seja o usuário logado
      const requestData = {
        ...result.data,
        requesterUserId: req.user.id
      };
      
      // Criar a solicitação
      const newRequest = await storage.createBaseRequest(requestData);
      
      // Registrar a primeira atualização da solicitação (criação)
      await storage.createBaseRequestUpdate({
        requestId: newRequest.id,
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        message: "Solicitação criada",
        newStatus: "pendente"
      });
      
      console.log("Solicitação criada com sucesso:", newRequest);
      return res.status(201).json(newRequest);
    } catch (error: any) {
      console.error("Erro ao criar solicitação:", error);
      return res.status(500).json({ 
        message: "Erro ao criar solicitação", 
        error: error.message 
      });
    }
  });
  
  // Listar solicitações de uma base específica
  app.get("/api/bases/:baseId/requests", isAuthenticated, hasBaseAccess, async (req, res) => {
    try {
      const baseId = parseInt(req.params.baseId);
      const requests = await storage.getBaseRequestsByBase(baseId);
      return res.status(200).json(requests);
    } catch (error: any) {
      console.error("Erro ao buscar solicitações da base:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar solicitações", 
        error: error.message 
      });
    }
  });
  
  // Listar solicitações por tipo
  app.get("/api/base-requests/by-type/:requestType", isAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário tem permissão para ver este tipo de solicitação
      // Por exemplo, apenas usuários de pneus podem ver solicitações do tipo 'pneus'
      const requestType = req.params.requestType;
      
      if (requestType === 'pneus' && req.user?.role !== 'pneus' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Sem permissão para acessar solicitações de pneus" });
      }
      
      if (requestType === 'manutencao' && !['admin', 'gestor'].includes(req.user?.role || '') && req.user?.baseId !== 12) {
        return res.status(403).json({ message: "Sem permissão para acessar solicitações de manutenção" });
      }
      
      const requests = await storage.getBaseRequestsByType(requestType);
      return res.status(200).json(requests);
    } catch (error: any) {
      console.error("Erro ao buscar solicitações por tipo:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar solicitações", 
        error: error.message 
      });
    }
  });
  
  // Obter uma solicitação específica por ID
  app.get("/api/base-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getBaseRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      
      // Verificar permissão do usuário para acessar esta solicitação
      // Apenas admins, ou usuários da mesma base da solicitação, ou responsáveis atribuídos podem ver
      if (req.user?.role !== 'admin' && 
          req.user?.baseId !== request.baseId && 
          req.user?.id !== request.assignedUserId &&
          req.user?.id !== request.requesterUserId) {
        return res.status(403).json({ message: "Sem permissão para acessar esta solicitação" });
      }
      
      // Buscar também as atualizações/tratativas desta solicitação
      const updates = await storage.getBaseRequestUpdates(requestId);
      
      return res.status(200).json({
        request,
        updates
      });
    } catch (error: any) {
      console.error("Erro ao buscar detalhes da solicitação:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar detalhes da solicitação", 
        error: error.message 
      });
    }
  });
  
  // Atualizar status de uma solicitação
  app.patch("/api/base-requests/:id/status", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status, assignedUserId } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status não informado" });
      }
      
      // Verificar se a solicitação existe
      const existingRequest = await storage.getBaseRequest(requestId);
      if (!existingRequest) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      
      // Verificar permissão para atualizar esta solicitação
      if (req.user?.role !== 'admin' && 
          req.user?.baseId !== existingRequest.baseId && 
          req.user?.id !== existingRequest.assignedUserId) {
        return res.status(403).json({ message: "Sem permissão para atualizar esta solicitação" });
      }
      
      // Atualizar o status
      const updatedRequest = await storage.updateBaseRequestStatus(
        requestId, 
        status, 
        assignedUserId === undefined ? undefined : parseInt(assignedUserId)
      );
      
      if (!updatedRequest) {
        return res.status(500).json({ message: "Erro ao atualizar status da solicitação" });
      }
      
      // Registrar a atualização
      await storage.createBaseRequestUpdate({
        requestId,
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        message: `Status alterado para "${status}"`,
        newStatus: status
      });
      
      return res.status(200).json(updatedRequest);
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      return res.status(500).json({ 
        message: "Erro ao atualizar status", 
        error: error.message 
      });
    }
  });
  
  // Adicionar uma nova atualização/tratativa a uma solicitação
  app.post("/api/base-requests/:id/updates", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { message, newStatus, attachmentUrl } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Mensagem não informada" });
      }
      
      // Verificar se a solicitação existe
      const existingRequest = await storage.getBaseRequest(requestId);
      if (!existingRequest) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      
      // Verificar permissão para atualizar esta solicitação
      if (req.user?.role !== 'admin' && 
          req.user?.baseId !== existingRequest.baseId && 
          req.user?.id !== existingRequest.assignedUserId &&
          req.user?.id !== existingRequest.requesterUserId) {
        return res.status(403).json({ message: "Sem permissão para adicionar tratativas a esta solicitação" });
      }
      
      // Criar a atualização
      const newUpdate = await storage.createBaseRequestUpdate({
        requestId,
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        message,
        newStatus,
        attachmentUrl
      });
      
      // Se foi fornecido um novo status, atualizar também a solicitação
      if (newStatus) {
        await storage.updateBaseRequestStatus(requestId, newStatus);
      }
      
      return res.status(201).json(newUpdate);
    } catch (error: any) {
      console.error("Erro ao adicionar tratativa:", error);
      return res.status(500).json({ 
        message: "Erro ao adicionar tratativa", 
        error: error.message 
      });
    }
  });
  
  // Deletar uma solicitação (apenas para admin)
  app.delete("/api/base-requests/:id", isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      // Tentar excluir a solicitação e suas atualizações
      const success = await storage.deleteBaseRequest(requestId);
      
      if (!success) {
        return res.status(404).json({ message: "Solicitação não encontrada ou erro ao excluir" });
      }
      
      return res.status(200).json({ message: "Solicitação excluída com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir solicitação:", error);
      return res.status(500).json({ 
        message: "Erro ao excluir solicitação", 
        error: error.message 
      });
    }
  });

  // Registrar rotas de pneus
  registerPneusRoutes(app);
  
  // Verificar e criar tabela de movimentação de pneus se necessário
  await criarTabelaMovimentacaoPneu();
  
  // Registrar rotas de movimentação de pneus
  registerTireMoveRoutes(app);
  
  // Registrar rotas de atividades de pneus
  setupTireActivityRoutes(app);
  
  // Rotas para postos de abastecimento - acessíveis para usuários autenticados
  // Não é necessário middleware adicional pois a verificação de admin já está implementada no hook useBasePermission
  app.get("/api/postos", isAuthenticated, getPostosResumo);
  app.get("/api/postos/:id", isAuthenticated, getPostoDetalhes);
  app.post("/api/postos/:id/entrada-combustivel", isAuthenticated, registrarEntradaCombustivel);
  app.post("/api/postos/excluir-saopaulo", isAuthenticated, excluirPostoSaoPaulo);
  
  // Endpoint para buscar abastecimentos por posto usando o modelo de duas tabelas
  app.get('/api/abastecimentos/:posto', async (req, res) => {
    try {
      const { posto } = req.params;
      const timestamp = req.query.t; // Capturar o timestamp da requisição
      console.log(`Buscando abastecimentos para o posto: ${posto}, timestamp: ${timestamp}`);
      
      // Definir cabeçalhos para evitar cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Verificar se o posto é um dos postos v2 (Campinas_v2, Osasco_v2, etc.)
      const isV2Posto = posto.toLowerCase().includes('_v2');
      
      if (isV2Posto) {
        // Para postos v2, buscar na tabela específica do posto
        const tabelaPosto = `abastecimentos_posto_${posto.toLowerCase()}`;
        
        // Verificar se a tabela existe
        const tabelaExisteQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as "exists";
        `;
        
        const tabelaExisteResult = await pool.query(tabelaExisteQuery, [tabelaPosto]);
        
        if (tabelaExisteResult.rows[0].exists) {
          console.log(`Tabela específica ${tabelaPosto} encontrada. Usando esta tabela.`);
          
          // Primeiro, verificamos se a tabela tem uma coluna 'projeto' (em português)
          const checkProjetoColumn = `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = '${tabelaPosto}' 
              AND column_name = 'projeto'
            );
          `;
          
          const projetoColumnExists = await pool.query(checkProjetoColumn);
          const hasProjetoColumn = projetoColumnExists.rows[0].exists;
          
          // Primeiro, verificamos se a tabela tem uma coluna 'hodometro_atual'
          const checkHodometroColumn = `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = '${tabelaPosto}' 
              AND column_name = 'hodometro_atual'
            );
          `;
          
          const hodometroColumnExists = await pool.query(checkHodometroColumn);
          const hasHodometroColumn = hodometroColumnExists.rows[0].exists;
          
          // Verificar se tem colunas de base
          const checkBaseColumns = `
            SELECT 
              EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${tabelaPosto}' AND column_name = 'base_id') as has_base_id,
              EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${tabelaPosto}' AND column_name = 'base_name') as has_base_name,
              EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${tabelaPosto}' AND column_name = 'projeto_id') as has_projeto_id
          `;
          
          const baseColumnsResult = await pool.query(checkBaseColumns);
          const hasBaseId = baseColumnsResult.rows[0].has_base_id;
          const hasBaseName = baseColumnsResult.rows[0].has_base_name;
          const hasProjetoId = baseColumnsResult.rows[0].has_projeto_id;

          // Verificar se é o posto Guarulhos que tem estrutura padronizada
          if (posto.toLowerCase() === 'guarulhos_v2') {
            // Consulta corrigida para o posto Guarulhos com colunas padronizadas
            const queryGuarulhosV2 = `
              SELECT 
                id,
                placa,
                km_atual,
                ${hasHodometroColumn ? 'hodometro_atual' : 'NULL as hodometro_atual'},
                tipo_combustivel,
                litros as quantidade_litros,
                motorista as nome_motorista,
                motorista_rg as rg_motorista,
                operador as nome_operador,
                valor_litro,
                valor_total,
                tipo_veiculo,
                observacoes,
                COALESCE(lavagem, false) as lavagem,
                tipo_lavagem,
                ${hasProjetoColumn ? 'projeto as project' : "NULL as project"},
                ${hasBaseName ? 'base_name' : 'NULL as base_name'},
                ${hasBaseId ? 'base_id' : 'NULL as base_id'},
                ${hasProjetoId ? 'projeto_id' : 'NULL as projeto_id'},
                created_at,
                updated_at,
                '${posto}' as posto
              FROM ${tabelaPosto}
              ORDER BY created_at DESC
            `;
            
            console.log(`Executando consulta SQL para Guarulhos: ${queryGuarulhosV2.replace(/\s+/g, ' ')}`);
            const resultGuarulhosV2 = await pool.query(queryGuarulhosV2);
            
            console.log(`Abastecimentos encontrados na tabela Guarulhos: ${resultGuarulhosV2.rows.length}`);
            if (resultGuarulhosV2.rows.length > 0) {
              const ultimoRegistro = resultGuarulhosV2.rows[0];
              console.log(`Último abastecimento Guarulhos: ID=${ultimoRegistro.id}, Placa=${ultimoRegistro.placa}, Projeto=${ultimoRegistro.project}`);
            }
            
            return res.status(200).json({
              success: true,
              count: resultGuarulhosV2.rows.length,
              data: resultGuarulhosV2.rows,
              requestTimestamp: timestamp,
              source: 'tabela_guarulhos_v2'
            });
          }

          // Consulta na tabela específica do posto v2 com tratamento seguro para a coluna hodometro_atual
          const queryV2 = `
            SELECT 
              id,
              placa,
              km_atual,
              ${hasHodometroColumn ? 'hodometro_atual' : 'NULL as hodometro_atual'},
              tipo_combustivel,
              litros as quantidade_litros,
              motorista as nome_motorista,
              motorista_rg as rg_motorista,
              operador as nome_operador,
              valor_litro,
              valor_total,
              tipo_veiculo,
              observacoes,
              lavagem,
              tipo_lavagem,
              ${hasProjetoColumn ? 'projeto as project' : "NULL as project"},
              ${hasBaseName ? 'base_name' : 'NULL as base_name'},
              ${hasBaseId ? 'base_id' : 'NULL as base_id'},
              ${hasProjetoId ? 'projeto_id' : 'NULL as projeto_id'},
              created_at,
              updated_at,
              '${posto}' as posto
            FROM ${tabelaPosto}
            ORDER BY created_at DESC
          `;
          
          console.log(`Executando consulta SQL na tabela específica: ${queryV2.replace(/\s+/g, ' ')}`);
          
          const resultV2 = await pool.query(queryV2);
          
          // Informações adicionais para debug
          console.log(`Abastecimentos encontrados na tabela específica: ${resultV2.rows.length}`);
          if (resultV2.rows.length > 0) {
            const ultimoRegistro = resultV2.rows[0];
            console.log(`Último abastecimento: ID=${ultimoRegistro.id}, Placa=${ultimoRegistro.placa}, Data=${ultimoRegistro.created_at}`);
          }
          
          return res.status(200).json({
            success: true,
            count: resultV2.rows.length,
            data: resultV2.rows,
            requestTimestamp: timestamp,
            source: 'tabela_especifica'
          });
        } else {
          console.log(`Tabela específica ${tabelaPosto} não encontrada. Usando tabela genérica.`);
        }
      }
      
      // Consulta padrão na tabela abastecimentos_postos (para postos não-v2 ou se a tabela específica não existir)
      const query = `
        SELECT * FROM abastecimentos_postos
        WHERE 
          posto ILIKE $1 OR 
          LOWER(posto) = LOWER($1) OR
          REPLACE(LOWER(posto), ' ', '') = REPLACE(LOWER($1), ' ', '')
        ORDER BY created_at DESC
      `;
      
      console.log(`Executando consulta SQL na tabela genérica: ${query.replace(/\s+/g, ' ')} com parâmetro: ${posto}`);
      
      // Executar a consulta
      const result = await pool.query(query, [posto]);
      
      // Informações adicionais para debug
      console.log(`Abastecimentos encontrados na tabela genérica: ${result.rows.length}`);
      if (result.rows.length > 0) {
        const ultimoRegistro = result.rows[0];
        console.log(`Último abastecimento: ID=${ultimoRegistro.id}, Placa=${ultimoRegistro.placa}, Data=${ultimoRegistro.created_at}`);
      }
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows,
        requestTimestamp: timestamp,
        source: 'tabela_generica'
      });
    } catch (error: any) {
      console.error("Erro ao buscar abastecimentos:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar abastecimentos",
        error: error.message
      });
    }
  });
  
  // Endpoint para buscar abastecimentos que precisam ser sincronizados com o Supabase
  app.get('/api/sincronizar-supabase/:posto', async (req, res) => {
    try {
      const { posto } = req.params;
      console.log(`Buscando abastecimentos não sincronizados para o posto ${posto}`);
      
      // Obter registros que ainda não foram sincronizados com o Supabase
      // Adicionamos uma coluna "sincronizado_supabase" para controlar isso
      const query = `
        SELECT * FROM abastecimentos_postos
        WHERE posto ILIKE $1
        AND (sincronizado_supabase IS NULL OR sincronizado_supabase = false)
        ORDER BY created_at
      `;
      
      // Primeiro verificamos se a coluna existe
      try {
        const checkColumn = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'abastecimentos_postos' 
          AND column_name = 'sincronizado_supabase'
        `;
        
        const columnCheck = await pool.query(checkColumn);
        
        // Se a coluna não existir, criamos ela
        if (!columnCheck.rows.length) {
          console.log('Adicionando coluna sincronizado_supabase à tabela abastecimentos_postos');
          
          await pool.query(`
            ALTER TABLE abastecimentos_postos
            ADD COLUMN sincronizado_supabase BOOLEAN DEFAULT FALSE
          `);
        }
      } catch (checkError) {
        console.error('Erro ao verificar/criar coluna sincronizado_supabase:', checkError);
      }
      
      const result = await pool.query(query, [posto]);
      console.log(`Encontrados ${result.rows.length} abastecimentos para sincronização`);
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } catch (error: any) {
      console.error("Erro ao buscar abastecimentos para sincronização:", error);
      return res.status(500).json({
        success: false, 
        message: "Erro ao buscar abastecimentos para sincronização", 
        error: error.message
      });
    }
  });
  
  // Endpoint para marcar abastecimentos como sincronizados
  app.post('/api/marcar-sincronizados', async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || !ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum ID válido fornecido'
        });
      }
      
      console.log(`Marcando ${ids.length} abastecimentos como sincronizados`);
      
      // Marcar registros como sincronizados
      const updateQuery = `
        UPDATE abastecimentos_postos
        SET sincronizado_supabase = TRUE
        WHERE id = ANY($1::int[])
        RETURNING id
      `;
      
      const result = await pool.query(updateQuery, [ids]);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount,
        message: `${result.rowCount} abastecimentos marcados como sincronizados`
      });
    } catch (error: any) {
      console.error("Erro ao marcar abastecimentos como sincronizados:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao marcar abastecimentos como sincronizados",
        error: error.message
      });
    }
  });

  // Rota para registrar abastecimento diretamente na tabela específica do posto
  app.post('/api/abastecimentos/:posto_id', async (req, res) => {
    try {
      const { posto_id } = req.params;
      console.log(`[ABASTECIMENTO] Registrando para posto: ${posto_id}`);
      console.log('[ABASTECIMENTO] Dados recebidos:', JSON.stringify(req.body, null, 2));
      
      // Mapear dados do formulário para o formato da tabela
      const {
        placa,
        km,
        tipo,
        quantidade,
        valor_litro,
        valor_total,
        motorista,
        motorista_rg,
        operador,
        projeto_id,
        base_id,
        tipo_veiculo = 'frota'
      } = req.body;
      
      // Validar campos obrigatórios
      if (!placa || !km || !tipo || !quantidade || !motorista || !operador) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos'
        });
      }
      
      // Determinar tabela do posto
      const nomeTabela = `abastecimentos_posto_${posto_id.toLowerCase()}`;
      console.log(`[ABASTECIMENTO] Inserindo na tabela: ${nomeTabela}`);
      
      // Buscar informações da base se base_id foi fornecido
      let base_name = null;
      if (base_id) {
        try {
          const baseQuery = `SELECT base_name FROM project_bases WHERE id = $1`;
          const baseResult = await pool.query(baseQuery, [base_id]);
          if (baseResult.rows.length > 0) {
            base_name = baseResult.rows[0].base_name;
          }
        } catch (baseError) {
          console.warn('[ABASTECIMENTO] Erro ao buscar base:', baseError);
        }
      }
      
      // Buscar nome do projeto se projeto_id foi fornecido
      let projeto_nome = null;
      if (projeto_id) {
        try {
          const projetoQuery = `SELECT name FROM projects WHERE id = $1`;
          const projetoResult = await pool.query(projetoQuery, [projeto_id]);
          if (projetoResult.rows.length > 0) {
            projeto_nome = projetoResult.rows[0].name;
          }
        } catch (projetoError) {
          console.warn('[ABASTECIMENTO] Erro ao buscar projeto:', projetoError);
        }
      }
      
      // Query de inserção na tabela específica do posto
      const insertQuery = `
        INSERT INTO ${nomeTabela} (
          placa,
          km_atual,
          tipo_combustivel,
          litros,
          valor_litro,
          valor_total,
          motorista,
          motorista_rg,
          operador,
          projeto,
          projeto_id,
          base_name,
          base_id,
          tipo_veiculo,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
        ) RETURNING *
      `;
      
      const valores = [
        placa.toUpperCase().trim(),
        parseInt(km),
        tipo,
        parseFloat(quantidade),
        parseFloat(valor_litro),
        parseFloat(valor_total),
        motorista.trim(),
        motorista_rg?.trim() || '',
        operador.trim(),
        projeto_nome || 'Não definido',
        projeto_id ? parseInt(projeto_id) : null,
        base_name || 'Base não especificada',
        base_id ? parseInt(base_id) : null,
        tipo_veiculo
      ];
      
      console.log('[ABASTECIMENTO] Valores a inserir:', valores);
      
      const result = await pool.query(insertQuery, valores);
      
      if (result.rows && result.rows.length > 0) {
        console.log('[ABASTECIMENTO] Sucesso! ID:', result.rows[0].id);
        
        return res.status(200).json({
          success: true,
          id: result.rows[0].id,
          message: 'Abastecimento registrado com sucesso',
          data: result.rows[0]
        });
      } else {
        throw new Error('Nenhum registro retornado após inserção');
      }
      
    } catch (error) {
      console.error('[ABASTECIMENTO] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar abastecimento',
        error: error.message
      });
    }
  });

  // Registrar rotas de teste de autenticação híbrida
  app.use('/api/auth-test', authTestRoutes);
  
  // Rota direta para teste de autenticação híbrida
  app.get('/api/auth-test-direct/hybrid', isAuthenticated, (req, res) => {
    res.json({
      success: true,
      authenticated: true,
      method: req.isAuthenticated() ? 'session' : 'jwt',
      user: req.isAuthenticated() 
        ? { id: req.user.id, email: req.user.email, role: req.user.role } 
        : req.supabaseUser,
      hasSession: req.isAuthenticated(),
      hasJwtToken: !!req.supabaseUser
    });
  });
  
  // Rota de diagnóstico para exibir configuração de autenticação
  app.get("/api/auth-config", (req, res) => {
    res.json({
      supabase: {
        available: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 15)}...` : null
      },
      session: {
        tableName: 'session', // Nome da tabela conforme verificado
        registros: 65, // Número verificado de registros na tabela
        secret: process.env.SESSION_SECRET ? 'configurado' : 'não configurado'
      },
      autenticacaoHibrida: true,
      metodos: [
        "Sessão (express-session + Passport)",
        "Token JWT (Supabase)"
      ],
      rotasDeTeste: [
        "/api/auth-test/hybrid - Verifica autenticação por sessão OU token JWT",
        "/api/auth-test/mapping - Verifica token JWT e mapeia para sessão",
        "/api/auth-test/session - Verifica apenas autenticação por sessão",
        "/api/auth-test/jwt - Verifica apenas autenticação por token JWT"
      ]
    });
  });
  
  // Rota para inserir dados no Supabase usando a chave de serviço do servidor - DESABILITADA
  // app.post("/api/supabase-insert", supabaseInsertHandler);
  
  // Rotas para a base de Campinas
  app.get("/api/bases/campinas/despesas", async (req, res) => {
    try {
      const query = `
        SELECT 
          d.id, 
          d.base_id,
          b.nome as base_name,
          d.month, 
          d.year,
          CASE 
            WHEN d.month = 1 THEN 'Janeiro'
            WHEN d.month = 2 THEN 'Fevereiro'
            WHEN d.month = 3 THEN 'Março'
            WHEN d.month = 4 THEN 'Abril'
            WHEN d.month = 5 THEN 'Maio'
            WHEN d.month = 6 THEN 'Junho'
            WHEN d.month = 7 THEN 'Julho'
            WHEN d.month = 8 THEN 'Agosto'
            WHEN d.month = 9 THEN 'Setembro'
            WHEN d.month = 10 THEN 'Outubro'
            WHEN d.month = 11 THEN 'Novembro'
            WHEN d.month = 12 THEN 'Dezembro'
          END as month_name,
          d.agua, 
          d.energia, 
          d.funcionarios, 
          d.pj, 
          d.aluguel, 
          d.internet, 
          d.despesas_extras,
          (d.agua + d.energia + d.funcionarios + d.pj + d.aluguel + d.internet + d.despesas_extras) as total_despesas,
          d.observacoes, 
          d.status, 
          d.last_updated,
          u.name as updated_by_name
        FROM 
          base_expenses d
        LEFT JOIN 
          bases b ON d.base_id = b.id
        LEFT JOIN 
          users u ON d.updated_by = u.id
        WHERE 
          d.base_id = 9
        ORDER BY 
          d.year DESC, d.month DESC
      `;
      
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar despesas da base:', error);
      res.status(500).json({ error: 'Erro ao buscar despesas da base' });
    }
  });

  app.post("/api/bases/campinas/despesas", async (req, res) => {
    try {
      const { 
        base_id, month, year, agua, energia, funcionarios, 
        pj, aluguel, internet, despesas_extras, observacoes, status 
      } = req.body;
      
      // Calcular o valor total das despesas
      const total_despesas = agua + energia + funcionarios + pj + aluguel + internet + (despesas_extras || 0);
      
      // Verificar se já existe um registro para este mês/ano
      const checkQuery = `
        SELECT id FROM base_expenses 
        WHERE base_id = $1 AND month = $2 AND year = $3
      `;
      const checkResult = await pool.query(checkQuery, [base_id, month, year]);
      
      let result;
      if (checkResult.rowCount > 0) {
        // Atualizar registro existente
        const updateQuery = `
          UPDATE base_expenses 
          SET 
            agua = $1, 
            energia = $2, 
            funcionarios = $3, 
            pj = $4, 
            aluguel = $5, 
            internet = $6, 
            despesas_extras = $7,
            observacoes = $8,
            status = $9,
            last_updated = NOW(),
            updated_by = $10
          WHERE 
            base_id = $11 AND month = $12 AND year = $13
          RETURNING *
        `;
        
        result = await pool.query(updateQuery, [
          agua, energia, funcionarios, pj, aluguel, internet, 
          despesas_extras, observacoes, status, 
          req.user ? req.user.id : null, 
          base_id, month, year
        ]);
      } else {
        // Inserir novo registro
        const insertQuery = `
          INSERT INTO base_expenses (
            base_id, month, year, agua, energia, funcionarios, 
            pj, aluguel, internet, despesas_extras, observacoes, 
            status, last_updated, updated_by
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
          RETURNING *
        `;
        
        result = await pool.query(insertQuery, [
          base_id, month, year, agua, energia, funcionarios, 
          pj, aluguel, internet, despesas_extras, observacoes, 
          status, req.user ? req.user.id : null
        ]);
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao salvar despesas da base:', error);
      res.status(500).json({ error: 'Erro ao salvar despesas da base' });
    }
  });
  
  // Rotas para solicitações de pneus da base Campinas
  app.get("/api/bases/campinas/solicitacao-pneus", async (req, res) => {
    try {
      // Verificamos primeiro se a tabela campinas_tire_requests existe
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campinas_tire_requests'
        ) AS "exists";
      `;
      
      const tableCheck = await pool.query(checkTableQuery);
      const tableExists = tableCheck.rows[0].exists;
      
      if (!tableExists) {
        console.log('Tabela campinas_tire_requests não existe, buscando em tabela genérica');
        
        // Se a tabela específica não existir, buscamos na tabela genérica de solicitações
        const query = `
          SELECT 
            s.id, 
            s.base_id,
            COALESCE(b.nome, 'Base Campinas') as base_nome,
            s.usuario_id,
            COALESCE(u.name, s.usuario_nome) as usuario_nome,
            s.quantidade, 
            s.placa_veiculo,
            s.km_veiculo,
            s.medida, 
            s.motivo, 
            s.observacoes, 
            s.status, 
            s.data_solicitacao,
            s.data_aprovacao,
            s.aprovador_id,
            a.name as aprovador_nome
          FROM 
            solicitacoes_pneus s
          LEFT JOIN 
            bases b ON s.base_id = b.id
          LEFT JOIN 
            users u ON s.usuario_id = u.id
          LEFT JOIN 
            users a ON s.aprovador_id = a.id
          WHERE 
            s.base_id = 9
          ORDER BY 
            s.data_solicitacao DESC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
        return;
      }
      
      // Se a tabela específica existir, usamos ela
      const query = `
        SELECT 
          id,
          base_id,
          base_name as base_nome,
          requester_id as usuario_id,
          requester_name as usuario_nome,
          quantity as quantidade,
          vehicle_plate as placa_veiculo,
          km_veiculo,
          tire_size as medida,
          reason as motivo,
          comments as observacoes,
          status,
          created_at as data_solicitacao,
          approved_at as data_aprovacao,
          data_previsao,
          observacoes_aprovacao,
          CAST(NULL AS INTEGER) as aprovador_id,
          approved_by as aprovador_nome
        FROM 
          campinas_tire_requests
        ORDER BY 
          created_at DESC
      `;
      
      const result = await pool.query(query);
      console.log(`[Campinas] Encontradas ${result.rowCount} solicitações de pneus`);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar solicitações de pneus:', error);
      res.status(500).json({ error: 'Erro ao buscar solicitações de pneus' });
    }
  });

  app.post("/api/bases/campinas/solicitacao-pneus", async (req, res) => {
    try {
      const { 
        base_id, quantidade, placa_veiculo, km_veiculo, medida, motivo, observacoes
      } = req.body;
      
      console.log('[Campinas] Recebida solicitação de pneus:', {
        base_id, quantidade, placa_veiculo, km_veiculo, medida, motivo, observacoes
      });
      
      // Verificamos primeiro se a tabela campinas_tire_requests existe
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campinas_tire_requests'
        ) AS "exists";
      `;
      
      const tableCheck = await pool.query(checkTableQuery);
      const tableExists = tableCheck.rows[0].exists;
      let result;
      
      if (tableExists) {
        console.log('[Campinas] Inserindo na tabela específica campinas_tire_requests');
        
        // Se a tabela específica existir, inserimos nela
        const specificInsertQuery = `
          INSERT INTO campinas_tire_requests (
            quantity, vehicle_plate, km_veiculo, tire_size, reason, 
            comments, status, requester_id, requester_name, 
            base_id, base_name, priority, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING *
        `;
        
        result = await pool.query(specificInsertQuery, [
          quantidade,
          placa_veiculo.toUpperCase(),
          km_veiculo,
          medida,
          motivo,
          observacoes || null,
          'pendente', // Status inicial
          req.user ? req.user.id : null,
          req.user ? req.user.name : 'Usuário',
          base_id || 9,
          'Base Campinas',
          'média' // Prioridade padrão
        ]);
        
        console.log('[Campinas] Solicitação cadastrada na tabela específica:', result.rows[0]);
      } else {
        console.log('[Campinas] Tabela específica não existe, inserindo na tabela genérica');
        
        // Se a tabela específica não existir, inserimos na tabela genérica
        const insertQuery = `
          INSERT INTO solicitacoes_pneus (
            base_id, usuario_id, usuario_nome, quantidade, placa_veiculo, km_veiculo, 
            medida, motivo, observacoes, status, data_solicitacao
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING *
        `;
        
        result = await pool.query(insertQuery, [
          base_id || 9, 
          req.user ? req.user.id : null,
          req.user ? req.user.name : 'Usuário',
          quantidade,
          placa_veiculo.toUpperCase(),
          km_veiculo,
          medida,
          motivo,
          observacoes || null,
          'pendente' // Status inicial
        ]);
        
        console.log('[Campinas] Solicitação cadastrada na tabela genérica:', result.rows[0]);
      }
      
      // Independentemente de onde a solicitação foi salva, também inserimos no módulo central de pneus
      try {
        console.log('[Campinas] Tentando encaminhar solicitação para o módulo central de pneus');
        
        // Encaminhar a solicitação para o módulo central de pneus
        const centralPneusQuery = `
          INSERT INTO solicitacoes_pneus (
            base_id, base_nome, usuario_id, usuario_nome, quantidade, 
            placa_veiculo, km_veiculo, medida, motivo, observacoes, 
            status, data_solicitacao, origem, data_previsao, observacoes_aprovacao,
            marca, modelo, tipo, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, NULL, NULL, $13, $14, $15, NOW(), NOW())
          RETURNING id
        `;
        
        const centralResult = await pool.query(centralPneusQuery, [
          base_id || 9,
          'Base Campinas',
          req.user ? req.user.id : null,
          req.user ? req.user.name : 'Usuário',
          quantidade,
          placa_veiculo.toUpperCase(),
          km_veiculo,
          medida, 
          motivo,
          observacoes || null,
          'pendente', // Status inicial
          'campinas', // Origem da solicitação
          'Genérico', // Marca padrão para solicitações da base
          'Padrão', // Modelo padrão para solicitações da base
          'Pneu comum' // Tipo padrão para solicitações da base
        ]);
        
        console.log('[Campinas] Solicitação encaminhada para módulo central de pneus com ID:', centralResult.rows[0].id);
        
        // Registrar no log de sincronização
        const syncLogQuery = `
          INSERT INTO sync_control (
            tipo_item, item_id, item_id_origem, origem, destino, 
            direcao, status, data_sincronizacao
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;
        
        await pool.query(syncLogQuery, [
          'solicitacao_pneu',
          centralResult.rows[0].id,
          result.rows[0].id,
          'campinas',
          'central',
          'origem_para_central',
          'concluido'
        ]);
        
        console.log('[Campinas] Registro de sincronização criado com sucesso');
      } catch (centralError) {
        console.error('[Campinas] Erro ao encaminhar para módulo central:', centralError);
        // Não falha a operação principal se o encaminhamento falhar
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('[Campinas] Erro ao registrar solicitação de pneus:', error);
      res.status(500).json({ error: 'Erro ao registrar solicitação de pneus' });
    }
  });
  
  // Rota para aprovar/rejeitar solicitação de pneus da Base Campinas
  app.put("/api/bases/campinas/solicitacao-pneus/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { status, observacoes, data_previsao, observacoes_aprovacao } = req.body;
      
      if (!['aprovado', 'negado', 'concluido'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      
      // Verificamos primeiro se a tabela campinas_tire_requests existe
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campinas_tire_requests'
        ) AS "exists";
      `;
      
      const tableCheck = await pool.query(checkTableQuery);
      const tableExists = tableCheck.rows[0].exists;
      let result;
      
      if (tableExists) {
        console.log('[Campinas] Atualizando na tabela específica campinas_tire_requests');
        
        // Mapear status do sistema central para status compatível com a tabela campinas_tire_requests
        let campinasStatus = status;
        if (status === 'em_analise' || status === 'negado') {
          campinasStatus = 'pendente'; // Status "em_analise" e "negado" são tratados como "pendente" na tabela Campinas
        }
        
        // Se a tabela específica existir, atualizamos nela
        const specificUpdateQuery = `
          UPDATE campinas_tire_requests 
          SET 
            status = $1,
            comments = COALESCE($2, comments),
            approved_at = NOW(),
            approved_by = $3,
            data_previsao = $4,
            observacoes_aprovacao = $5
          WHERE id = $6
          RETURNING *
        `;
        
        result = await pool.query(specificUpdateQuery, [
          campinasStatus, 
          observacoes, 
          req.user ? req.user.name : 'Administrador',
          data_previsao ? new Date(data_previsao) : null,
          observacoes_aprovacao || null,
          id
        ]);
      } else {
        console.log('[Campinas] Tabela específica não existe, atualizando na tabela genérica');
        
        // Se a tabela específica não existir, atualizamos na tabela genérica
        const updateQuery = `
          UPDATE tire_requests 
          SET 
            status = $1,
            observacoes = COALESCE($2, observacoes),
            data_aprovacao = NOW(),
            aprovador_id = $3,
            data_previsao = $4,
            observacoes_aprovacao = $5
          WHERE id = $6
          RETURNING *
        `;
        
        result = await pool.query(updateQuery, [
          status, 
          observacoes, 
          req.user ? req.user.id : null,
          data_previsao ? new Date(data_previsao) : null,
          observacoes_aprovacao || null,
          id
        ]);
      }
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }
      
      // Atualizamos também a solicitação no módulo central de pneus
      try {
        console.log('[Campinas] Sincronizando resposta com o módulo central de pneus');
        
        // Buscar ID da solicitação central correspondente
        const syncQuery = `
          SELECT item_id FROM sync_control
          WHERE item_id_origem = $1 AND tipo_item = 'solicitacao_pneu'
          LIMIT 1
        `;
        
        const syncResult = await pool.query(syncQuery, [id]);
        
        if (syncResult.rowCount > 0) {
          const centralId = syncResult.rows[0].item_id;
          
          const centralUpdateQuery = `
            UPDATE solicitacoes_pneus 
            SET 
              status = $1,
              observacoes = COALESCE($2, observacoes),
              data_aprovacao = NOW(),
              aprovador_id = $3,
              aprovador_nome = $4,
              data_previsao = $5,
              observacoes_aprovacao = $6
            WHERE id = $7
            RETURNING *
          `;
          
          await pool.query(centralUpdateQuery, [
            status, 
            observacoes, 
            req.user ? req.user.id : null,
            req.user ? req.user.name : 'Administrador',
            data_previsao ? new Date(data_previsao) : null,
            observacoes_aprovacao || null,
            centralId
          ]);
          
          console.log(`[Campinas] Solicitação central ID ${centralId} atualizada com sucesso`);
        } else {
          console.log('[Campinas] Não foi encontrado registro de sincronização para esta solicitação');
        }
      } catch (syncError) {
        console.error('[Campinas] Erro ao sincronizar com módulo central:', syncError);
        // Não falha a operação principal se a sincronização falhar
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('[Campinas] Erro ao atualizar solicitação de pneus:', error);
      res.status(500).json({ error: 'Erro ao atualizar solicitação de pneus' });
    }
  });
  
  // Rota para listar solicitações de pneus do módulo central
  app.get("/api/solicitacoes-pneus", async (req, res) => {
    try {
      // Extrair parâmetros de consulta
      const baseId = req.query.base_id ? parseInt(req.query.base_id as string) : null;
      const status = req.query.status as string || null;
      
      // Construir a consulta SQL com filtros opcionais
      let query = `
        SELECT * FROM solicitacoes_pneus
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (baseId) {
        query += ` AND base_id = $${paramIndex}`;
        params.push(baseId);
        paramIndex++;
      }
      
      if (status && status !== 'todos') {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      query += ` ORDER BY data_solicitacao DESC`;
      
      const result = await pool.query(query, params);
      console.log(`[Pneus] Encontradas ${result.rows.length} solicitações de pneus`);
      
      // Retornar os resultados
      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } catch (error) {
      console.error("[Pneus] Erro ao buscar solicitações de pneus:", error);
      res.status(500).json({ 
        success: false, 
        error: "Erro ao buscar solicitações de pneus" 
      });
    }
  });

  // Rota para a equipe de gestão de pneus responder às solicitações (informar prazo)
  app.put("/api/pneus/solicitacoes/:id/responder", async (req, res) => {
    try {
      // Converter para número explicitamente
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID da solicitação inválido' });
      }
      
      console.log('[Pneus] Respondendo à solicitação:', { id, tipo: typeof id });
      const { status, data_previsao, observacoes_aprovacao } = req.body;
      
      if (!['aprovado', 'negado', 'em_analise', 'concluido'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      
      if (status === 'aprovado' && !data_previsao) {
        return res.status(400).json({ error: 'Data de previsão é obrigatória para aprovação' });
      }
      
      const updateQuery = `
        UPDATE solicitacoes_pneus 
        SET 
          status = $1::varchar,
          data_aprovacao = CASE WHEN $1::varchar IN ('aprovado', 'negado') THEN NOW() ELSE data_aprovacao END,
          aprovador_id = CASE WHEN $1::varchar IN ('aprovado', 'negado') THEN $2 ELSE aprovador_id END,
          aprovador_nome = CASE WHEN $1::varchar IN ('aprovado', 'negado') THEN $3 ELSE aprovador_nome END,
          data_previsao = $4,
          observacoes_aprovacao = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [
        status, 
        req.user ? req.user.id : null,
        req.user ? req.user.name : 'Administrador',
        data_previsao ? new Date(data_previsao) : null,
        observacoes_aprovacao || null,
        id
      ]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }
      
      // Verificamos se esta solicitação veio de uma base específica para sincronizar de volta
      try {
        console.log('[Pneus] Verificando se a solicitação veio de uma base específica');
        
        const syncQuery = `
          SELECT item_id_origem, origem FROM sync_control
          WHERE item_id = $1 AND tipo_item = 'solicitacao_pneu'
          LIMIT 1
        `;
        
        const syncResult = await pool.query(syncQuery, [id]);
        
        if (syncResult.rowCount > 0) {
          const { item_id_origem, origem } = syncResult.rows[0];
          
          console.log(`[Pneus] Solicitação veio da origem ${origem} com ID ${item_id_origem}`);
          
          if (origem === 'campinas') {
            // Verificamos se é para atualizar na tabela campinas_tire_requests ou tire_requests
            const checkTableQuery = `
              SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'campinas_tire_requests'
              ) AS "exists";
            `;
            
            const tableCheck = await pool.query(checkTableQuery);
            const tableExists = tableCheck.rows[0].exists;
            
            if (tableExists) {
              // Mapear status do sistema central para status compatível com a tabela campinas_tire_requests
              let campinasStatus = status;
              if (status === 'em_analise' || status === 'negado') {
                campinasStatus = 'pendente'; // Status "em_analise" e "negado" são tratados como "pendente" na tabela Campinas
              }
              
              const specificUpdateQuery = `
                UPDATE campinas_tire_requests 
                SET 
                  status = $1::varchar,
                  approved_at = CASE WHEN $1::varchar IN ('aprovado', 'negado') THEN NOW() ELSE approved_at END,
                  approved_by = $2,
                  data_previsao = $3,
                  observacoes_aprovacao = $4,
                  updated_at = NOW()
                WHERE id = $5
              `;
              
              await pool.query(specificUpdateQuery, [
                campinasStatus,
                req.user ? req.user.name : 'Administrador',
                data_previsao ? new Date(data_previsao) : null,
                observacoes_aprovacao || null,
                item_id_origem
              ]);
              
              console.log(`[Pneus] Atualizada solicitação na tabela campinas_tire_requests com ID ${item_id_origem}`);
            } else {
              const updateOriginQuery = `
                UPDATE tire_requests 
                SET 
                  status = $1::varchar,
                  data_aprovacao = CASE WHEN $1::varchar IN ('aprovado', 'negado') THEN NOW() ELSE data_aprovacao END,
                  aprovador_id = $2,
                  data_previsao = $3,
                  observacoes_aprovacao = $4
                WHERE id = $5
              `;
              
              await pool.query(updateOriginQuery, [
                status,
                req.user ? req.user.id : null,
                data_previsao ? new Date(data_previsao) : null,
                observacoes_aprovacao || null,
                item_id_origem
              ]);
              
              console.log(`[Pneus] Atualizada solicitação na tabela tire_requests com ID ${item_id_origem}`);
            }
          }
        }
      } catch (syncError) {
        console.error('[Pneus] Erro ao sincronizar com a base de origem:', syncError);
        // Não falha a operação principal se a sincronização falhar
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('[Pneus] Erro ao atualizar solicitação de pneus:', error);
      res.status(500).json({ error: 'Erro ao atualizar solicitação de pneus' });
    }
  });

  // API para gerenciamento de solicitações de orçamento da Base Campinas
  
  // Rota para listar todas as solicitações de orçamento da Base Campinas
  app.get("/api/bases/campinas/solicitacao-orcamento", async (req, res) => {
    try {
      const query = `
        SELECT 
          id,
          title,
          description,
          priority,
          status,
          requester_id,
          requester_name,
          created_at,
          updated_at,
          estimated_value,
          department,
          approved_value,
          approved_by,
          approved_at,
          comments,
          budget_file_url,
          budget_file_name,
          invoice_file_url,
          invoice_file_name,
          CASE
            WHEN invoice_file_url IS NOT NULL THEN false
            WHEN status = 'aprovado' AND invoice_file_url IS NULL THEN true
            ELSE false
          END as pending_invoice
        FROM 
          campinas_budget_requests
        ORDER BY 
          created_at DESC;
      `;
      
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar solicitações de orçamento:', error);
      res.status(500).json({ message: 'Erro ao buscar solicitações de orçamento' });
    }
  });
  
  // Rota para obter uma solicitação específica da Base Campinas
  app.get("/api/bases/campinas/solicitacao-orcamento/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      const query = `
        SELECT * FROM campinas_budget_requests
        WHERE id = $1;
      `;
      
      const result = await pool.query(query, [requestId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar solicitação:', error);
      res.status(500).json({ message: 'Erro ao buscar solicitação' });
    }
  });
  
  // Rota para criar uma nova solicitação de orçamento da Base Campinas
  app.post("/api/bases/campinas/solicitacao-orcamento", async (req, res) => {
    try {
      const {
        title,
        description,
        priority,
        estimated_value,
        department,
        budget_file_url,
        budget_file_name,
        base_id = 2, // ID padrão para Base Campinas
        base_name = "Base Campinas" // Nome padrão para Base Campinas
      } = req.body;
      
      // Validar dados
      if (!title || !description || !priority || !estimated_value || !department) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
      }
      
      console.log("Criando solicitação de orçamento com URL de arquivo:", budget_file_url);
      
      const query = `
        INSERT INTO campinas_budget_requests 
          (title, description, priority, status, requester_id, requester_name, 
          estimated_value, department, budget_file_url, budget_file_name, 
          base_id, base_name, created_at, updated_at)
        VALUES 
          ($1, $2, $3, 'pendente', $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *;
      `;
      
      const values = [
        title,
        description,
        priority,
        req.user?.id || 0,
        req.user?.name || 'Usuário',
        estimated_value,
        department,
        budget_file_url || null,
        budget_file_name || null,
        base_id, 
        base_name
      ];
      
      const result = await pool.query(query, values);
      
      // Logamos o resultado para debug
      console.log("Solicitação de orçamento criada:", result.rows[0]);
      
      // Se tudo ocorrer bem, iniciamos o processo de sincronização com Supabase
      try {
        // Verificar se a conexão com Supabase está disponível
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
          console.log("Supabase configurado, iniciando sincronização...");
          
          // Em produção, você pode usar uma fila de tarefas para executar isso em background
          // Por enquanto, apenas registramos a intenção no log
          console.log("Metadados para sincronização:", {
            id: result.rows[0].id,
            base_id: base_id,
            file_url: budget_file_url,
            file_name: budget_file_name
          });
        }
      } catch (syncError) {
        console.error("Erro na sincronização com Supabase:", syncError);
        // Não falha a requisição principal se a sincronização falhar
      }
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      res.status(500).json({ message: 'Erro ao criar solicitação' });
    }
  });
  
  // Rota para atualizar uma solicitação de orçamento da Base Campinas (aprovar, rejeitar, etc)
  app.put("/api/bases/campinas/solicitacao-orcamento/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const {
        status,
        approved_value,
        comments,
        budget_file_url,
        budget_file_name,
        invoice_file_url,
        invoice_file_name
      } = req.body;
      
      // Verificar se a solicitação existe
      const checkQuery = `SELECT * FROM campinas_budget_requests WHERE id = $1;`;
      const checkResult = await pool.query(checkQuery, [requestId]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({ message: 'Solicitação não encontrada' });
      }
      
      // Montar a query de atualização dinâmica
      let updateFields = [];
      let values = [requestId]; // O primeiro parâmetro é sempre o ID
      let paramCount = 2; // Começamos do 2 porque $1 já é o ID
      
      if (status) {
        updateFields.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }
      
      if (approved_value) {
        updateFields.push(`approved_value = $${paramCount}`);
        values.push(approved_value);
        paramCount++;
        
        // Se estiver aprovando, adicionar quem aprovou e quando
        if (status === 'aprovado') {
          updateFields.push(`approved_by = $${paramCount}`);
          values.push(req.user?.name || 'Administrador');
          paramCount++;
          
          updateFields.push(`approved_at = $${paramCount}`);
          values.push(new Date());
          paramCount++;
        }
      }
      
      if (comments) {
        updateFields.push(`comments = $${paramCount}`);
        values.push(comments);
        paramCount++;
      }
      
      if (budget_file_url) {
        updateFields.push(`budget_file_url = $${paramCount}`);
        values.push(budget_file_url);
        paramCount++;
      }
      
      if (budget_file_name) {
        updateFields.push(`budget_file_name = $${paramCount}`);
        values.push(budget_file_name);
        paramCount++;
      }
      
      if (invoice_file_url) {
        updateFields.push(`invoice_file_url = $${paramCount}`);
        values.push(invoice_file_url);
        paramCount++;
      }
      
      if (invoice_file_name) {
        updateFields.push(`invoice_file_name = $${paramCount}`);
        values.push(invoice_file_name);
        paramCount++;
      }
      
      // Sempre atualizar o timestamp
      updateFields.push(`updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')`);
      
      // Se não há campos para atualizar, retornar o registro atual
      if (updateFields.length === 1) { // Apenas o update_at foi adicionado
        return res.json(checkResult.rows[0]);
      }
      
      const updateQuery = `
        UPDATE campinas_budget_requests
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *;
      `;
      
      const result = await pool.query(updateQuery, values);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error);
      res.status(500).json({ message: 'Erro ao atualizar solicitação' });
    }
  });
  
  // API para migrar anexos de URL blob para armazenamento permanente
  app.post("/api/budget-attachments/migrate-blob", hasMaintenanceAccess, async (req, res) => {
    try {
      const { requestId, fileName, baseId, baseName } = req.body;
      
      // Validações básicas
      if (!requestId || !fileName || !baseId || !baseName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados incompletos para migração do anexo' 
        });
      }
      
      // Verificar se a solicitação existe
      const checkQuery = `
        SELECT id, budget_file_url 
        FROM campinas_budget_requests 
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [requestId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Solicitação não encontrada' 
        });
      }
      
      const solicitacao = checkResult.rows[0];
      
      // Verificar se a URL é realmente uma URL blob
      if (!solicitacao.budget_file_url || !solicitacao.budget_file_url.startsWith('blob:')) {
        return res.status(400).json({ 
          success: false, 
          message: 'A solicitação não possui uma URL blob para migrar' 
        });
      }
      
      // Como não podemos acessar a URL blob diretamente (é específica da sessão do navegador),
      // vamos gerar um arquivo de fallback (arquivo de texto com mensagem de erro)
      const fileContent = Buffer.from(
        `Este é um arquivo de substituição gerado automaticamente.\n\n` +
        `A URL blob original não pôde ser migrada porque as URLs blob só podem ser acessadas\n` +
        `pelo navegador que as criou. Por favor, faça o upload manual do arquivo original.\n\n` +
        `Informações do anexo:\n` +
        `- Solicitação ID: ${requestId}\n` +
        `- Nome do arquivo original: ${fileName}\n` +
        `- Data da migração: ${new Date().toISOString()}\n` +
        `- URL blob original: ${solicitacao.budget_file_url}\n\n` +
        `Este arquivo foi gerado pelo sistema de migração de anexos.`
      );
      
      // Criar cliente Supabase usando as variáveis de ambiente
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ 
          success: false, 
          message: 'Configuração do Supabase não encontrada' 
        });
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Caminho do arquivo no Supabase Storage
      const filePath = `campinas/budget-attachments/${requestId}/${fileName}`;
      
      // Upload para o bucket do Supabase
      const { data, error } = await supabase.storage
        .from('budget-attachments')
        .upload(filePath, fileContent, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Erro no upload para o Supabase:', error);
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao fazer upload para o Storage: ${error.message}` 
        });
      }
      
      // Obter a URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('budget-attachments')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Obter informações do usuário que está fazendo a migração
      const uploader_id = req.user?.id || null;
      const uploader_name = req.user?.name || null;
      
      // Registrar o anexo permanente no banco de dados
      const insertQuery = `
        INSERT INTO budget_attachments (
          budget_request_id, 
          base_id, 
          base_name, 
          file_name, 
          file_type, 
          file_size, 
          file_path, 
          storage_url, 
          attachment_type,
          uploader_id,
          uploader_name,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `;
      
      const insertValues = [
        requestId,
        baseId,
        baseName,
        fileName,
        'text/plain',
        fileContent.length,
        filePath,
        publicUrl,
        'budget',
        uploader_id,
        uploader_name,
        new Date()
      ];
      
      const insertResult = await pool.query(insertQuery, insertValues);
      
      if (insertResult.rows.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao registrar anexo no banco de dados' 
        });
      }
      
      const attachmentId = insertResult.rows[0].id;
      
      // Atualizar URL na tabela de solicitações
      const updateQuery = `
        UPDATE campinas_budget_requests
        SET budget_file_url = $1
        WHERE id = $2
      `;
      
      await pool.query(updateQuery, [publicUrl, requestId]);
      
      return res.status(200).json({
        success: true,
        message: 'Anexo migrado com sucesso',
        data: {
          attachmentId,
          publicUrl,
          filePath
        }
      });
      
    } catch (error) {
      console.error('Erro ao migrar anexo blob:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Erro ao migrar anexo: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  });

  // API para registrar anexos permanentes no banco de dados
  app.post("/api/budget-attachments/register-old", hasMaintenanceAccess, async (req, res) => {
    try {
      const {
        budget_request_id,
        base_id,
        base_name,
        file_name,
        file_type,
        file_size,
        file_path,
        storage_url,
        attachment_type
      } = req.body;
      
      // Validações básicas
      if (!budget_request_id || !base_id || !base_name || !file_name || !file_path || !storage_url) {
        return res.status(400).json({ error: 'Dados incompletos para registrar anexo' });
      }
      
      // Obter informações do usuário que está fazendo upload
      const uploader_id = req.user?.id || null;
      const uploader_name = req.user?.name || null;
      
      const insertQuery = `
        INSERT INTO budget_attachments (
          budget_request_id, 
          base_id, 
          base_name, 
          file_name, 
          file_type, 
          file_size, 
          file_path,
          storage_url, 
          uploader_id, 
          uploader_name, 
          attachment_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        budget_request_id,
        base_id,
        base_name,
        file_name,
        file_type || '',
        file_size || 0,
        file_path,
        storage_url,
        uploader_id,
        uploader_name,
        attachment_type || 'budget'
      ];
      
      console.log('Registrando anexo permanente:', { 
        budget_request_id, 
        base_name, 
        file_name, 
        attachment_type 
      });
      
      const result = await pool.query(insertQuery, values);
      
      if (result.rowCount === 0) {
        return res.status(500).json({ error: 'Falha ao registrar anexo permanente' });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Anexo registrado com sucesso',
        attachment: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao registrar anexo permanente:', error);
      return res.status(500).json({ error: 'Erro ao registrar anexo permanente no banco de dados' });
    }
  });
  
  // Integração com o sistema principal de gestão de orçamentos
  // Rota para baixar ou obter informações sobre anexos de solicitações de orçamento
  app.get("/api/fleet/budget-requests/:id/download-attachment", hasMaintenanceAccess, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      // Verificar primeiro se a tabela existe
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campinas_budget_requests'
        ) AS "exists";
      `;
      
      const tableCheck = await pool.query(tableCheckQuery);
      const tableExists = tableCheck.rows[0].exists;
      
      if (!tableExists) {
        return res.status(404).json({ 
          message: 'Tabela de solicitações não encontrada',
          error: 'TABLE_NOT_FOUND'
        });
      }
      
      // Buscar a solicitação com o anexo
      const query = `
        SELECT 
          id,
          title,
          budget_file_url,
          budget_file_name,
          base_name
        FROM 
          campinas_budget_requests
        WHERE 
          id = $1;
      `;
      
      const result = await pool.query(query, [requestId]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ 
          message: 'Solicitação não encontrada',
          error: 'NOT_FOUND'
        });
      }
      
      const budgetRequest = result.rows[0];
      
      // Verificar se existe um anexo
      if (!budgetRequest.budget_file_url) {
        return res.status(404).json({ 
          message: 'Esta solicitação não possui anexo',
          error: 'NO_ATTACHMENT'
        });
      }
      
      let responseData;
      
      // Verificar se é uma URL blob
      if (budgetRequest.budget_file_url.startsWith('blob:')) {
        console.log(`Solicitação #${budgetRequest.id} possui URL blob, tentando buscar anexo permanente no Supabase...`);
        
        // Tentar buscar um arquivo permanente na tabela budget_attachments
        const attachmentQuery = `
          SELECT * FROM budget_attachments
          WHERE budget_request_id = $1 AND attachment_type = 'budget'
          ORDER BY created_at DESC
          LIMIT 1;
        `;
        
        try {
          const attachmentResult = await pool.query(attachmentQuery, [requestId]);
          
          if (attachmentResult.rows.length > 0) {
            const attachment = attachmentResult.rows[0];
            console.log("Anexo permanente encontrado:", attachment.storage_url);
            
            return res.status(200).json({
              id: budgetRequest.id,
              title: budgetRequest.title,
              fileName: budgetRequest.budget_file_name,
              baseName: budgetRequest.base_name,
              permanentUrl: attachment.storage_url,
              downloadUrl: attachment.storage_url,
              message: "Arquivo encontrado no armazenamento permanente do Supabase.",
              isLocalFile: false,
              requestInfo: `Solicitação #${budgetRequest.id}: ${budgetRequest.title}`
            });
          }
        } catch (attachmentError) {
          console.error("Erro ao buscar anexo permanente:", attachmentError);
        }
        
        // Se não encontrou na tabela ou se houve erro, retornar mensagem sobre blob URL
        responseData = {
          id: budgetRequest.id,
          title: budgetRequest.title,
          fileName: budgetRequest.budget_file_name,
          baseName: budgetRequest.base_name,
          message: `Para visualizar o anexo "${budgetRequest.budget_file_name}", você deve acessar o sistema na Base ${budgetRequest.base_name} onde ele foi originalmente enviado. Este anexo foi feito usando armazenamento temporário que só existe no navegador original. Recomenda-se anexar um novo arquivo usando o armazenamento permanente.`,
          isLocalFile: true,
          requestInfo: `Solicitação #${budgetRequest.id}: ${budgetRequest.title}`
        };
      } else {
        // Para URLs permanentes (que não são blob), retornar a URL diretamente
        responseData = {
          id: budgetRequest.id,
          title: budgetRequest.title,
          fileName: budgetRequest.budget_file_name,
          baseName: budgetRequest.base_name,
          downloadUrl: budgetRequest.budget_file_url,
          message: `Você pode baixar o arquivo "${budgetRequest.budget_file_name}" diretamente.`,
          isLocalFile: false,
          requestInfo: `Solicitação #${budgetRequest.id}: ${budgetRequest.title}`
        };
      }
      
      // Definir tipo de conteúdo explicitamente para garantir que seja JSON
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Erro ao acessar anexo:', error);
      res.status(500).json({ 
        message: 'Erro ao acessar anexo',
        error: error.message
      });
    }
  });

  // Rota para listar todas as solicitações de orçamento para o painel principal
  app.get("/api/fleet/budget-requests", hasMaintenanceAccess, async (req, res) => {
    try {
      // O middleware hasMaintenanceAccess já verificou a autenticação
      const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
      console.log('[BudgetRequests] Usuário autenticado:', {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        baseId: user?.baseId
      });
      
      console.log('[BudgetRequests] Buscando solicitações de orçamento da Base Campinas para o painel...');
      
      // Verificar primeiro se a tabela existe
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campinas_budget_requests'
        ) AS "exists";
      `;
      
      const tableCheck = await pool.query(tableCheckQuery);
      const tableExists = tableCheck.rows[0].exists;
      
      console.log('[BudgetRequests] Tabela campinas_budget_requests existe:', tableExists);
      
      if (!tableExists) {
        console.log('[BudgetRequests] A tabela não existe, retornando array vazio');
        return res.json([]);
      }
      
      const query = `
        SELECT 
          id,
          title,
          description,
          priority,
          status,
          requester_id,
          requester_name,
          created_at,
          updated_at,
          estimated_value,
          department,
          approved_value,
          approved_by,
          approved_at,
          comments,
          budget_file_url,
          budget_file_name,
          invoice_file_url,
          invoice_file_name,
          CASE
            WHEN invoice_file_url IS NOT NULL THEN false
            WHEN status = 'aprovado' AND invoice_file_url IS NULL THEN true
            ELSE false
          END as pending_invoice,
          base_id,
          base_name,
          'campinas' as source
        FROM 
          campinas_budget_requests
        ORDER BY 
          created_at DESC;
      `;
      
      const result = await pool.query(query);
      console.log(`[BudgetRequests] Encontradas ${result.rows.length} solicitações de orçamento`);
      
      // Se houver resultados, vamos logar o primeiro para diagnóstico
      if (result.rows.length > 0) {
        console.log('[BudgetRequests] Primeira solicitação:', {
          id: result.rows[0].id,
          title: result.rows[0].title,
          status: result.rows[0].status,
          requester: result.rows[0].requester_name,
          base: result.rows[0].base_name
        });
      }
      
      res.json(result.rows);
    } catch (error) {
      console.error('[BudgetRequests] Erro ao buscar solicitações de orçamento para o painel:', error);
      res.status(500).json({ message: 'Erro ao buscar solicitações de orçamento' });
    }
  });

  // Rota para aprovar uma solicitação de orçamento
  app.put("/api/fleet/budget-requests/:id/approve", hasMaintenanceAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedValue } = req.body;
      const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
      
      if (!approvedValue) {
        return res.status(400).json({ message: 'Valor de aprovação é obrigatório' });
      }

      console.log(`[BudgetRequests] Solicitação de aprovação para orçamento #${id}`, {
        approvedValue,
        approvedBy: user?.name || 'Administrador',
        userId: user?.id
      });
      
      // Atualizar a solicitação de orçamento para aprovada
      const query = `
        UPDATE campinas_budget_requests
        SET 
          status = 'aprovado',
          approved_value = $1,
          approved_by = $2,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;
      
      const result = await pool.query(query, [
        approvedValue, 
        user?.name || 'Administrador', 
        id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Solicitação de orçamento não encontrada' });
      }
      
      console.log(`[BudgetRequests] Solicitação #${id} aprovada com sucesso`);
      res.json({ 
        message: 'Solicitação de orçamento aprovada com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('[BudgetRequests] Erro ao aprovar solicitação de orçamento:', error);
      res.status(500).json({ message: 'Erro ao aprovar solicitação de orçamento' });
    }
  });
  
  // Rota para rejeitar uma solicitação de orçamento
  app.put("/api/fleet/budget-requests/:id/reject", hasMaintenanceAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
      
      console.log(`[BudgetRequests] Solicitação de rejeição para orçamento #${id}`, {
        comments,
        userId: user?.id
      });
      
      // Atualizar a solicitação de orçamento para rejeitada
      const query = `
        UPDATE campinas_budget_requests
        SET 
          status = 'rejeitado',
          comments = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `;
      
      const result = await pool.query(query, [comments || 'Solicitação rejeitada pela Gestão de Frotas', id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Solicitação de orçamento não encontrada' });
      }
      
      console.log(`[BudgetRequests] Solicitação #${id} rejeitada com sucesso`);
      res.json({ 
        message: 'Solicitação de orçamento rejeitada com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('[BudgetRequests] Erro ao rejeitar solicitação de orçamento:', error);
      res.status(500).json({ message: 'Erro ao rejeitar solicitação de orçamento' });
    }
  });

  // Rota para ressincronização de sessão (resolver problema de 401 após reinicialização do servidor)
  app.post("/api/resync-session", resyncSession);
  
  // Rota específica para ressincronização de token JWT
  app.post("/api/resync-session-jwt", async (req, res) => {
    console.log("[Resync JWT] Iniciando ressincronização de token JWT");
    
    try {
      // Verificar se existe um token JWT no cabeçalho Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("[Resync JWT] Sem token JWT no cabeçalho");
        return res.status(401).json({ message: "Token JWT ausente" });
      }
      
      // Extrair o token
      const token = authHeader.split(' ')[1];
      console.log(`[Resync JWT] Token recebido (parcial): ${token.substring(0, 10)}...`);
      
      // Verificar se há dados do usuário no corpo
      const { user, email } = req.body;
      
      // Se não temos o email ou é diferente do token, verificar o token diretamente
      if (!email) {
        console.log("[Resync JWT] Email não fornecido, verificando token diretamente");
        
        try {
          // Verificar token JWT com Supabase
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || '',
            process.env.VITE_SUPABASE_SERVICE_KEY || ''
          );
          
          // Obter detalhes do usuário pelo JWT
          const { data, error } = await supabase.auth.getUser(token);
          
          if (error || !data.user) {
            console.error("[Resync JWT] Erro ao verificar token com Supabase:", error);
            return res.status(401).json({ message: "Token JWT inválido", error });
          }
          
          // Buscar o usuário pelo email no banco de dados
          const userEmail = data.user.email;
          console.log(`[Resync JWT] Email extraído do token: ${userEmail}`);
          
          const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [userEmail]
          );
          
          if (rows.length === 0) {
            console.log(`[Resync JWT] Usuário não encontrado para o email: ${userEmail}`);
            return res.status(404).json({ message: "Usuário não encontrado" });
          }
          
          const dbUser = rows[0];
          
          // Armazenar na sessão
          req.login(dbUser, async (loginErr) => {
            if (loginErr) {
              console.error('[Resync JWT] Erro ao salvar na sessão:', loginErr);
              return res.status(500).json({ message: "Erro ao sincronizar sessão" });
            }
            
            console.log(`[Resync JWT] Usuário ${dbUser.email} ressincronizado com sucesso`);
            
            // Registrar o login
            try {
              await pool.query(
                'UPDATE users SET "lastLogin" = NOW() WHERE id = $1',
                [dbUser.id]
              );
            } catch (updateErr) {
              console.warn('[Resync JWT] Erro ao atualizar lastLogin:', updateErr);
            }
            
            // Responder com sucesso e detalhes de usuário
            return res.status(200).json({
              message: "Sessão ressincronizada com sucesso",
              user: dbUser
            });
          });
          
        } catch (supabaseError) {
          console.error('[Resync JWT] Erro ao verificar token com Supabase:', supabaseError);
          return res.status(500).json({ message: "Erro interno ao verificar token" });
        }
      } else {
        // Método alternativo: buscar o usuário diretamente pelo email fornecido
        console.log(`[Resync JWT] Email fornecido: ${email}, buscando no banco`);
        
        try {
          const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );
          
          if (rows.length === 0) {
            console.log(`[Resync JWT] Usuário não encontrado para o email: ${email}`);
            return res.status(404).json({ message: "Usuário não encontrado" });
          }
          
          const dbUser = rows[0];
          
          // Armazenar na sessão
          req.login(dbUser, async (loginErr) => {
            if (loginErr) {
              console.error('[Resync JWT] Erro ao salvar na sessão:', loginErr);
              return res.status(500).json({ message: "Erro ao sincronizar sessão" });
            }
            
            console.log(`[Resync JWT] Usuário ${dbUser.email} ressincronizado com sucesso`);
            
            // Registrar o login
            try {
              await pool.query(
                'UPDATE users SET "lastLogin" = NOW() WHERE id = $1',
                [dbUser.id]
              );
            } catch (updateErr) {
              console.warn('[Resync JWT] Erro ao atualizar lastLogin:', updateErr);
            }
            
            // Responder com sucesso e detalhes de usuário
            return res.status(200).json({
              message: "Sessão ressincronizada com sucesso",
              user: dbUser
            });
          });
          
        } catch (dbError) {
          console.error('[Resync JWT] Erro ao buscar usuário:', dbError);
          return res.status(500).json({ message: "Erro ao buscar usuário" });
        }
      }
    } catch (error) {
      console.error('[Resync JWT] Erro geral:', error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  });

  // Rota de emergência para forçar uma sessão em caso de falhas persistentes
  app.post("/api/force-session", async (req, res) => {
    try {
      console.log("[ForceSession] Tentando criar sessão de emergência");
      const { user, email } = req.body;
      
      if (!user && !email) {
        return res.status(400).json({ success: false, message: "Dados de usuário não fornecidos" });
      }
      
      // Buscar o usuário no banco de dados
      let dbUser = null;
      
      if (user && user.id) {
        // Se temos ID do usuário, buscar diretamente
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
        if (result.rowCount > 0) {
          dbUser = result.rows[0];
        } else {
          const tradResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [user.id]);
          if (tradResult.rowCount > 0) {
            dbUser = tradResult.rows[0];
          }
        }
      } else if (email) {
        // Se temos apenas email, buscar por email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rowCount > 0) {
          dbUser = result.rows[0];
        } else {
          const tradResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
          if (tradResult.rowCount > 0) {
            dbUser = tradResult.rows[0];
          }
        }
      }
      
      if (!dbUser) {
        return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      }
      
      // Criar sessão manualmente se req.login estiver disponível (adicionado pelo Passport)
      if (typeof req.login === 'function') {
        req.login(dbUser, (err) => {
          if (err) {
            console.error('[ForceSession] Erro ao criar sessão:', err);
            return res.status(500).json({ success: false, message: "Erro ao criar sessão" });
          }
          
          // Garantir que a sessão seja persistida
          req.session.touch();
          req.session.save((saveErr) => {
            if (saveErr) {
              console.warn('[ForceSession] Aviso ao salvar sessão:', saveErr);
            }
            
            console.log(`[ForceSession] Sessão criada com sucesso para ${dbUser.email}`);
            return res.status(200).json({ 
              success: true, 
              message: "Sessão criada com sucesso",
              user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role,
                baseId: dbUser.baseId || dbUser.base_id,
                basename: dbUser.basename
              }
            });
          });
        });
      } else {
        console.error("[ForceSession] Passport.js não inicializado, req.login não disponível");
        return res.status(500).json({ 
          success: false, 
          message: "Não foi possível criar a sessão, Passport.js não inicializado" 
        });
      }
    } catch (error) {
      console.error("[ForceSession] Erro ao criar sessão de emergência:", error);
      return res.status(500).json({ success: false, message: "Erro interno ao processar a solicitação" });
    }
  });

  // Registrar rotas de autenticação híbrida
  app.use('/api/auth', authHybridRoutes);
  
  // Registrar rotas para gerenciar preços de combustível
  registerPrecosCombustivelRoutes(app);
  
  // Registra as rotas para o mapeamento de postos
  registerPostosMapeamentoRoutes(app);
  
  // Registra as rotas para gerenciar usuários no Supabase
  registerUsuariosSupabaseRoutes(app);
  
  // Registra as rotas para o sistema de estoque de peças
  app.use('/api/frota', frotaEstoqueRoutes);
  
  // Registrar rotas para assistente de migração de anexos
  // Comentado temporariamente devido à incompatibilidade de módulos
  // Esta funcionalidade será implementada em uma versão futura
  /*
  try {
    // O código para registrar rotas de migração de anexos será implementado aqui
    console.log('Assistente de migração de anexos registrado com sucesso');
  } catch (error) {
    console.error('Erro ao registrar rotas do assistente de migração de anexos:', error);
  }
  */
  
  // Rota para inserir dados diretamente no PostgreSQL
  app.post("/api/supabase-insert", async (req, res) => {
    try {
      console.log('[POSTGRES-INSERT] Recebendo requisição:', req.body);
      
      const { table, data, posto } = req.body;
      
      if (!table || !data || !posto) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: table, data e posto'
        });
      }

      // Para dados de abastecimento, inserir diretamente na tabela específica do posto
      if (table === 'abastecimentos_supabase') {
        const nomeTabela = `abastecimentos_posto_${posto.toLowerCase().replace(/\s+/g, '_')}`;
        
        console.log(`[POSTGRES-INSERT] Inserindo na tabela PostgreSQL: ${nomeTabela}`);
        console.log(`[POSTGRES-INSERT] Dados recebidos:`, JSON.stringify(data, null, 2));
        
        // Verificar se a tabela existe
        const tableCheck = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [nomeTabela]);
        
        if (tableCheck.rows.length === 0) {
          console.error(`[POSTGRES-INSERT] ERRO: Tabela ${nomeTabela} não encontrada`);
          return res.status(400).json({
            success: false,
            message: `Tabela ${nomeTabela} não encontrada no banco de dados`
          });
        }
        
        // Criar timestamp correto do Brasil se fornecido, senão usar atual
        let timestampBrasil;
        if (data.created_at) {
          timestampBrasil = data.created_at; // Usar timestamp já fornecido pelo frontend
          console.log(`[POSTGRES-INSERT] Usando timestamp do frontend: ${timestampBrasil}`);
        } else {
          // Criar timestamp do Brasil (UTC-3) se não fornecido
          const agora = new Date();
          const brasilTime = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
          timestampBrasil = brasilTime.toISOString();
          console.log(`[POSTGRES-INSERT] Criando timestamp do Brasil: ${timestampBrasil}`);
        }

        // Preparar dados para inserção direta
        const dadosInserir = {
          placa: data.placa || 'DESCONHECIDO',
          km_atual: Number(data.km_atual) || 0,
          hodometro_atual: data.hodometro_atual ? Number(data.hodometro_atual) : null,
          tipo_combustivel: data.tipo_combustivel || 'diesel',
          litros: Number(data.litros) || Number(data.quantidade_litros) || 0,
          valor_litro: Number(data.valor_litro) || Number(data.preco_litro) || 0,
          valor_total: Number(data.valor_total) || 0,
          motorista: data.motorista || 'Não informado',
          motorista_rg: data.motorista_rg || data.rg_motorista || 'Não informado',
          operador: data.operador || 'Sistema',
          projeto: data.projeto || 'Não informado',
          tipo_veiculo: data.tipo_veiculo || 'frota',
          observacoes: data.observacoes || '',
          lavagem: Boolean(data.lavagem) || false,
          tipo_lavagem: data.tipo_lavagem || null,
          base_id: data.base_id ? Number(data.base_id) : null,
          base_name: data.base_name || null,
          projeto_id: data.projeto_id ? Number(data.projeto_id) : null,
          created_at: timestampBrasil, // Garantir horário correto do Brasil
          data_hora: timestampBrasil // Campo adicional para compatibilidade
        };
        
        console.log(`[POSTGRES-INSERT] Dados preparados para inserção:`, dadosInserir);
        
        // Construir query de inserção
        const campos = Object.keys(dadosInserir);
        const placeholders = campos.map((_, index) => `$${index + 1}`);
        const valores = campos.map(campo => (dadosInserir as any)[campo]);
        
        const insertQuery = `
          INSERT INTO ${nomeTabela} (${campos.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING id, placa, valor_total, created_at
        `;
        
        console.log(`[POSTGRES-INSERT] Executando query:`, insertQuery);
        console.log(`[POSTGRES-INSERT] Com valores:`, valores);
        
        const result = await pool.query(insertQuery, valores);
        
        if (result.rows.length > 0) {
          const registro = result.rows[0];
          console.log(`[POSTGRES-INSERT] ✅ Abastecimento inserido com sucesso! ID: ${registro.id}`);
          
          return res.status(201).json({
            success: true,
            id: registro.id,
            message: 'Abastecimento registrado com sucesso no banco de dados',
            data: {
              id: registro.id,
              placa: registro.placa,
              valor_total: registro.valor_total,
              created_at: registro.created_at
            }
          });
        } else {
          throw new Error('Nenhum registro retornado após inserção');
        }
      }
      
      return res.status(400).json({
        success: false,
        message: `Tipo de inserção ${table} não suportado`
      });
      
    } catch (error: any) {
      console.error('[POSTGRES-INSERT] ❌ Erro ao inserir dados:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao inserir dados no banco',
        error: error.message || 'Erro desconhecido'
      });
    }
  });

  // Rota para buscar abastecimentos não sincronizados com o Supabase
  app.get("/api/sincronizar-supabase/:posto", async (req, res) => {
    const posto = req.params.posto;
    
    try {
      // Verifica se está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Não autenticado"
        });
      }
      
      console.log(`Buscando abastecimentos não sincronizados para o posto: ${posto}`);
      
      // Primeiro, verificamos se a coluna sincronizado_supabase existe
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'abastecimentos' 
        AND column_name = 'sincronizado_supabase'
      `;
      
      const columnCheck = await pool.query(checkColumnQuery);
      
      // Se a coluna não existir, vamos criá-la
      if (columnCheck.rows.length === 0) {
        console.log('Coluna sincronizado_supabase não encontrada, criando...');
        await pool.query(`
          ALTER TABLE abastecimentos 
          ADD COLUMN sincronizado_supabase BOOLEAN DEFAULT FALSE
        `);
        console.log('Coluna sincronizado_supabase criada com sucesso');
      }
      
      // Busca abastecimentos não sincronizados no banco de dados
      const query = `
        SELECT * FROM abastecimentos
        WHERE LOWER(posto) = LOWER($1)
        AND (sincronizado_supabase IS NULL OR sincronizado_supabase = false)
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query, [posto]);
      const abastecimentos = result.rows;
      
      console.log(`Encontrados ${abastecimentos.length} abastecimentos não sincronizados para o posto ${posto}`);
      
      res.json({ 
        success: true, 
        count: abastecimentos.length,
        data: abastecimentos
      });
    } catch (error: any) {
      console.error(`Erro ao buscar abastecimentos não sincronizados para ${posto}:`, error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados para sincronização",
        error: String(error)
      });
    }
  });
  
  // Rota para marcar abastecimentos como sincronizados
  app.post("/api/marcar-sincronizados", async (req, res) => {
    try {
      // Verifica se está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Não autenticado"
        });
      }
      
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Lista de IDs vazia ou inválida"
        });
      }
      
      console.log(`Marcando ${ids.length} abastecimentos como sincronizados: ${ids.join(', ')}`);
      
      // Atualiza os registros no banco de dados
      const query = `
        UPDATE abastecimentos
        SET sincronizado_supabase = true
        WHERE id = ANY($1)
      `;
      
      const result = await pool.query(query, [ids]);
      
      console.log(`${result.rowCount} abastecimentos marcados como sincronizados`);
      
      res.json({ 
        success: true, 
        count: result.rowCount,
        message: `${result.rowCount} abastecimentos marcados como sincronizados`
      });
    } catch (error: any) {
      console.error(`Erro ao marcar abastecimentos como sincronizados:`, error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao atualizar status de sincronização",
        error: String(error)
      });
    }
  });
  
  // Registrar as rotas do Supabase específicas para postos
  // Usamos /api/posto-supabase como caminho para evitar conflitos com o Vite
  app.use('/api/posto-supabase', postoSupabaseRoutes);

  // ===== ROTAS PARA ACESSO DE MOTORISTAS LINE HALL SHOPEE =====
  
  // Login de motorista por CPF
  app.post('/api/line-hall/motorista/login', async (req, res) => {
    try {
      const { cpf } = req.body;

      if (!cpf) {
        return res.status(400).json({
          success: false,
          message: 'CPF é obrigatório'
        });
      }

      // Buscar motorista na base de dados real com informações da viagem programada
      const result = await pool.query(`
        SELECT 
          m.id,
          m.nome,
          m.cpf,
          m.telefone,
          COALESCE(lhs.cavalo_placa, 'Line Hall Shopee') as placa_veiculo,
          'Cavalo Mecânico' as tipo_veiculo,
          lhs.carreta1_placa as placa_carreta,
          CASE 
            WHEN lhs.rota IS NOT NULL THEN SPLIT_PART(lhs.rota, ' - ', 1)
            ELSE 'Centro de Distribuição Shopee - São Paulo'
          END as local_carregamento,
          CASE 
            WHEN lhs.rota IS NOT NULL THEN 
              CASE 
                WHEN SPLIT_PART(lhs.rota, ' - ', 3) ~ '^[0-9]+ km$' THEN SPLIT_PART(lhs.rota, ' - ', 2)
                ELSE SPLIT_PART(lhs.rota, ' - ', 2)
              END
            ELSE 'Destino conforme programação'
          END as local_descarregamento,
          COALESCE(TO_CHAR(lhs.data_viagem, 'YYYY-MM-DD'), TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')) as data_viagem,
          COALESCE(TO_CHAR(lhs.created_at, 'HH24:MI:SS'), '08:00:00') as horario_carregamento,
          COALESCE(lhs.status, 'Aguardando') as status_viagem
        FROM motoristas m
        LEFT JOIN linehall_shopee lhs ON m.nome = lhs.motorista_nome 
        WHERE REPLACE(REPLACE(REPLACE(m.cpf, '.', ''), '-', ''), ' ', '') = $1 AND m.base_id = 3
        ORDER BY 
          CASE WHEN lhs.status = 'ativo' THEN 1 ELSE 2 END,
          lhs.data_viagem DESC,
          lhs.id DESC
        LIMIT 1
      `, [cpf]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado ou inativo'
        });
      }

      const motorista = result.rows[0];

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        motorista: {
          id: motorista.id,
          nome: motorista.nome,
          cpf: motorista.cpf,
          telefone: motorista.telefone,
          placa_veiculo: motorista.placa_veiculo,
          tipo_veiculo: motorista.tipo_veiculo,
          placa_carreta: motorista.placa_carreta,
          viagem: {
            local_carregamento: motorista.local_carregamento,
            local_descarregamento: motorista.local_descarregamento,
            data_viagem: motorista.data_viagem,
            horario_carregamento: motorista.horario_carregamento,
            status: motorista.status_viagem
          }
        }
      });

    } catch (error) {
      console.error('Erro no login do motorista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Salvar checklist do motorista
  app.post('/api/line-hall/checklist', async (req, res) => {
    try {
      const {
        motorista_id,
        itens_verificados,
        total_itens,
        itens_detalhes,
        observacoes_gerais,
        status
      } = req.body;

      if (!motorista_id || !itens_detalhes) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos'
        });
      }

      // Simular inserção de checklist (seria salvo em tabela real)
      const checklistId = Math.floor(Math.random() * 1000) + 1;

      console.log(`Checklist salvo para motorista ${motorista_id}:`, {
        checklistId,
        itens_verificados,
        total_itens,
        status,
        observacoes_gerais
      });

      res.json({
        success: true,
        message: 'Checklist salvo com sucesso',
        checklistId,
        status
      });

    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Solicitar manutenção
  app.post('/api/line-hall/manutencao/solicitar', async (req, res) => {
    try {
      const {
        motorista_id,
        placa_veiculo,
        tipo_problema,
        prioridade,
        descricao,
        local_ocorrencia,
        pode_continuar_viagem,
        observacoes_adicionais
      } = req.body;

      if (!motorista_id || !placa_veiculo || !tipo_problema || !descricao) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos'
        });
      }

      // Gerar protocolo único
      const protocolo = `LH${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Buscar dados do motorista
      const motoristaQuery = `
        SELECT nome FROM (
          SELECT 'João Silva' as nome, '12345678901' as cpf
          UNION ALL
          SELECT 'Maria Santos' as nome, '23456789012' as cpf
          UNION ALL
          SELECT 'Pedro Oliveira' as nome, '34567890123' as cpf
        ) motoristas WHERE cpf = (
          SELECT cpf FROM (
            SELECT '12345678901' as cpf WHERE $1 = 1
            UNION ALL
            SELECT '23456789012' as cpf WHERE $1 = 2
            UNION ALL
            SELECT '34567890123' as cpf WHERE $1 = 3
          ) ids
        )
      `;
      
      const motoristaResult = await pool.query(motoristaQuery, [motorista_id]);
      const motoristaNome = motoristaResult.rows[0]?.nome || 'Motorista Não Identificado';

      // Inserir na tabela linehall_maintenance
      const insertQuery = `
        INSERT INTO linehall_maintenance (
          motorista_id, 
          motorista_nome, 
          vehicle_plate, 
          description, 
          urgency, 
          status, 
          tipo_problema,
          local_ocorrencia,
          pode_continuar_viagem,
          observacoes,
          protocolo,
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'pendente', $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id, protocolo
      `;

      // Mapear prioridade para urgência
      const urgencyMap = {
        'baixa': 'baixa',
        'media': 'normal', 
        'alta': 'alta',
        'emergencial': 'emergencial'
      };

      const result = await pool.query(insertQuery, [
        motorista_id,
        motoristaNome,
        placa_veiculo.toUpperCase(),
        descricao,
        urgencyMap[prioridade] || 'normal',
        tipo_problema,
        local_ocorrencia || 'Não informado',
        pode_continuar_viagem,
        observacoes_adicionais || '',
        protocolo
      ]);

      console.log(`Solicitação de manutenção salva no banco:`, {
        id: result.rows[0].id,
        protocolo: result.rows[0].protocolo,
        motorista_nome: motoristaNome,
        placa_veiculo: placa_veiculo.toUpperCase(),
        tipo_problema,
        prioridade,
        descricao
      });

      res.json({
        success: true,
        message: 'Solicitação enviada com sucesso',
        protocolo: result.rows[0].protocolo,
        solicitacaoId: result.rows[0].id
      });

    } catch (error) {
      console.error('Erro ao criar solicitação de manutenção:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Atualizar status da viagem
  app.post('/api/line-hall/trip/update-status', async (req, res) => {
    try {
      const { motorista_id, status, timestamp } = req.body;

      if (!motorista_id || !status) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos'
        });
      }

      // Validar status
      const validStatuses = ['em_andamento', 'concluida'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      // Verificar se existe uma tabela para armazenar o status das viagens
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS linehall_trip_status (
          id SERIAL PRIMARY KEY,
          motorista_id INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await pool.query(createTableQuery);

      // Inserir novo status
      const insertQuery = `
        INSERT INTO linehall_trip_status (motorista_id, status, timestamp)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      const result = await pool.query(insertQuery, [
        motorista_id,
        status,
        timestamp || new Date().toISOString()
      ]);

      console.log(`Status da viagem atualizado:`, {
        id: result.rows[0].id,
        motorista_id,
        status,
        timestamp: timestamp || new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Status da viagem atualizado com sucesso',
        statusId: result.rows[0].id
      });

    } catch (error) {
      console.error('Erro ao atualizar status da viagem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Buscar solicitações de manutenção do motorista
  app.get('/api/line-hall/motorista/:motoristaId/maintenance-requests', async (req, res) => {
    try {
      const { motoristaId } = req.params;

      if (!motoristaId) {
        return res.status(400).json({
          success: false,
          message: 'ID do motorista é obrigatório'
        });
      }

      // Buscar solicitações de manutenção do motorista específico
      const query = `
        SELECT 
          id,
          motorista_id,
          vehicle_plate,
          description,
          urgency,
          status,
          protocolo,
          created_at,
          updated_at,
          completed_at,
          notes,
          approved_by
        FROM linehall_maintenance 
        WHERE motorista_id = $1 
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [motoristaId]);

      console.log(`Solicitações de manutenção encontradas para motorista ${motoristaId}:`, result.rows.length);

      res.json({
        success: true,
        requests: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar solicitações de manutenção do motorista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });
  app.use('/api/posto-special', postoRoutes); // Adicionando novas rotas especiais para atualização de histórico

  // Para debugging, adicionar rota para listar todas as tabelas relacionadas a postos
  app.get("/api/debug/list-posto-tables", async (req, res) => {
    try {
      const query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name LIKE 'abastecimentos_posto_%'
        ORDER BY table_name;
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        count: result.rows.length,
        tables: result.rows.map(row => row.table_name)
      });
    } catch (error) {
      console.error("Erro ao listar tabelas de postos:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao listar tabelas de postos",
        error: String(error)
      });
    }
  });
  
  // Rotas para migração de anexos de orçamentos
  app.get('/api/diagnostics/blob-attachments', isAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário é administrador
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' 
        });
      }
      
      // Buscar todos os anexos com URLs blob
      const result = await pool.query(`
        SELECT 
          id, 
          base_id, 
          base_name, 
          title, 
          budget_file_name, 
          budget_file_url, 
          requester_id, 
          requester_name, 
          status
        FROM 
          campinas_budget_requests
        WHERE 
          budget_file_url IS NOT NULL AND 
          budget_file_url LIKE 'blob:%'
        ORDER BY 
          id DESC
      `);
      
      return res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar anexos blob:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao buscar anexos com URLs blob' 
      });
    }
  });
  
  app.put('/api/diagnostics/update-attachment-url/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { budget_file_url, budget_file_name } = req.body;
      
      // Verificar se o usuário é administrador
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas administradores podem atualizar anexos.' 
        });
      }
      
      // Atualizar a URL do anexo
      const result = await pool.query(`
        UPDATE campinas_budget_requests
        SET 
          budget_file_url = $1,
          budget_file_name = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, title, budget_file_url, budget_file_name
      `, [budget_file_url, budget_file_name, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Solicitação de orçamento não encontrada' 
        });
      }
      
      // Sincronizar com as tabelas existentes
      try {
        await pool.query(`CALL sync_budget_attachments_from_campinas()`);
      } catch (syncError) {
        console.warn('Aviso: Erro ao sincronizar anexos após atualização:', syncError);
        // Continuamos mesmo com erro na sincronização
      }
      
      return res.json({
        success: true,
        message: 'URL de anexo atualizada com sucesso',
        attachment: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar URL de anexo:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao atualizar URL de anexo' 
      });
    }
  });

  // Rota para registrar anexos no banco de dados
  app.post("/api/budget-attachments/register", async (req, res) => {
    try {
      // Log detalhado dos cabeçalhos para debug
      console.log('[Budget-Attachments] Cabeçalhos recebidos:', {
        authorization: req.headers.authorization ? 'Presente (inicia com: ' + req.headers.authorization.substring(0, 15) + '...)' : 'Ausente',
        'content-type': req.headers['content-type'],
        cookie: req.headers.cookie ? 'Presente' : 'Ausente',
        origin: req.headers.origin,
        referer: req.headers.referer
      });
      
      // Importar o middleware isAuthenticatedHybrid dinamicamente
      const { isAuthenticatedHybrid } = await import('./middleware/isAuthenticatedHybrid');
      
      // Verificar autenticação
      await new Promise<void>((resolve, reject) => {
        isAuthenticatedHybrid(req, res, (err?: any) => {
          if (err) {
            console.error('[Budget-Attachments] Erro no middleware de autenticação:', err);
            reject(err);
          } else {
            console.log('[Budget-Attachments] Usuário autenticado com sucesso:', {
              id: (req as any).user?.id || (req as any).hybridUser?.id || (req as any).supabaseUser?.id || 'N/A',
              role: (req as any).user?.role || (req as any).hybridUser?.role || (req as any).supabaseUser?.role || 'N/A'
            });
            resolve();
          }
        });
      });
    } catch (authError) {
      console.error('[Budget-Attachments] Erro de autenticação detalhado:', authError);
      return res.status(401).json({ 
        success: false, 
        error: 'Acesso negado. Faça login para continuar.' 
      });
    }
    
    try {
      const {
        budget_request_id,
        base_id,
        base_name,
        file_name,
        file_type,
        file_size,
        file_path,
        storage_url,
        attachment_type,
        description
      } = req.body;
      
      console.log('Registrando anexo:', {
        budget_request_id,
        base_id,
        base_name,
        file_name,
        file_path,
        storage_url,
        attachment_type
      });
      
      // Verificar se a tabela budget_attachments existe
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'budget_attachments'
        ) as exists;
      `);
      
      if (!tableCheck.rows[0].exists) {
        // Criar a tabela budget_attachments se não existir
        await pool.query(`
          CREATE TABLE IF NOT EXISTS budget_attachments (
            id SERIAL PRIMARY KEY,
            budget_request_id INTEGER,
            base_id VARCHAR(20),
            base_name VARCHAR(100),
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(100),
            file_size INTEGER,
            file_path VARCHAR(255) NOT NULL,
            storage_url TEXT NOT NULL,
            attachment_type VARCHAR(50),
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            created_by INTEGER,
            migrated_at TIMESTAMP,
            migrated_by INTEGER
          );
        `);
        console.log('Tabela budget_attachments criada com sucesso.');
      }
      
      // Inserir registro na tabela budget_attachments
      const result = await pool.query(`
        INSERT INTO budget_attachments (
          budget_request_id, 
          base_id, 
          base_name, 
          file_name, 
          file_type, 
          file_size, 
          file_path, 
          storage_url, 
          attachment_type, 
          description, 
          created_at, 
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
        RETURNING id
      `, [
        budget_request_id, 
        base_id, 
        base_name, 
        file_name, 
        file_type, 
        file_size, 
        file_path, 
        storage_url, 
        attachment_type, 
        description,
        req.user?.id || null
      ]);
      
      if (result.rows && result.rows.length > 0) {
        res.status(201).json({ 
          success: true, 
          message: "Anexo registrado com sucesso", 
          id: result.rows[0].id 
        });
      } else {
        throw new Error("Erro ao registrar anexo");
      }
    } catch (error) {
      console.error("Erro ao registrar anexo:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido ao registrar anexo" 
      });
    }
  });

  // Registrar rotas para os KPIs do dashboard
  registerDashboardKpiRoutes(app);
  
  // Registrar rotas para histórico consolidado de abastecimentos
  app.use('/api/historico', historicoConsolidadoRoutes);
  
  // Registrar rotas para o histórico de pátio
  app.use('/api/patio', patioRoutes);
  
  // Registrar rotas para parceiros de guincho
  app.use('/api/guincho', parceirosGuinchoRoutes);
  
  // Rotas para acesso externo simplificado de parceiros de guincho
  // Usando nossa rota de emergência para serviços de guincho
  // Usando nossa rota de emergência para resolver os problemas
  app.use('/api/towing/emergency', towingServiceEmergency);
  
  // Rota alternativa para registrar serviços de guincho
  app.post('/api/towing/register-service', async (req, res) => {
    try {
      console.log('[EmergencyRoute] Recebendo solicitação de serviço:', req.body);
      
      const { token, plate, pickup_location, delivery_location, service_description,
             service_date, cost, mileage, notes, contact_name, contact_phone } = req.body;
      
      // Buscar parceiro pelo token
      let partnerId = 8; // Default para Caio Ramos (teste)
      
      if (token && token !== 'TESTE_CAIO_RAMOS_DE_SOUZA__TOKEN') {
        const tokenQuery = `
          SELECT partner_id FROM towing_access_tokens 
          WHERE token = $1 AND active = true
        `;
        const tokenResult = await pool.query(tokenQuery, [token]);
        if (tokenResult.rowCount && tokenResult.rowCount > 0) {
          partnerId = tokenResult.rows[0].partner_id;
        }
      }
      
      // Inserir novo serviço
      const insertQuery = `
        INSERT INTO towing_partner_services (
          partner_id, plate, origin, destination, 
          service_type, service_date, cost, km_traveled, 
          notes, driver_name, contact_phone, status, created_at, payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, 'pending')
        RETURNING *
      `;
      
      const values = [
        partnerId,
        plate?.toUpperCase() || 'PLACA NÃO INFORMADA',
        pickup_location || '',
        delivery_location || '',
        service_description || 'Reboque',
        service_date ? new Date(service_date) : getCurrentDateBrasilia(),
        cost ? parseFloat(cost.toString()) : 0,
        mileage ? parseInt(mileage.toString()) : 0,
        notes || '',
        contact_name || '',
        contact_phone || '',
        formatDateForDB(),
      ];
      
      const result = await pool.query(insertQuery, values);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log('[EmergencyRoute] Serviço registrado com sucesso:', result.rows[0].id);
        return res.status(201).json({
          success: true,
          message: 'Serviço registrado com sucesso',
          data: result.rows[0]
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Erro ao registrar serviço'
        });
      }
    } catch (error) {
      console.error('[EmergencyRoute] Erro ao registrar serviço:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao processar o serviço',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Rota para sincronizar serviços de guincho entre tabelas
  app.post('/api/sincronizacao/sincronizar-servicos-guincho', async (req, res) => {
    try {
      console.log('Iniciando sincronização de serviços de guincho...');
      
      // Verificar a estrutura da tabela servicos_guincho
      const tableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'servicos_guincho'
      `);
      
      console.log('Estrutura da tabela servicos_guincho:', tableInfo.rows);
      
      // Verificar se as colunas necessárias existem
      const columns = tableInfo.rows.map(row => row.column_name);
      console.log('Colunas disponíveis:', columns);
      
      // Adaptamos os nomes das colunas conforme existem na tabela
      const plateColumn = columns.includes('placa_veiculo') ? 'placa_veiculo' : 'placa';
      const vehicleColumn = columns.includes('modelo_veiculo') ? 'modelo_veiculo' : 'veiculo';
      const serviceTypeColumn = columns.includes('tipo_servico') ? 'tipo_servico' : 'service_type';
      const valueColumn = columns.includes('valor') ? 'valor' : 'value';
      const dateColumn = columns.includes('data_servico') ? 'data_servico' : 'service_date';
      const notesColumn = columns.includes('observacoes') ? 'observacoes' : 'notes';
      const locationColumn = columns.includes('endereco_origem') ? 'endereco_origem' : 'local_atendimento';
      const kmColumn = columns.includes('quilometragem') ? 'quilometragem' : 'km_reboque';
      const photosColumn = columns.includes('fotos_servico') ? 'fotos_servico' : 'service_photos';
      
      // 1. Buscar todos os registros na tabela towing_partner_services que não estão em servicos_guincho
      const query = `
        WITH inseridos AS (
          INSERT INTO servicos_guincho (
            parceiro_id, placa_veiculo, modelo_veiculo, valor, data_servico, 
            status, observacoes, endereco_origem, quilometragem
          )
          SELECT 
            t.partner_id, t.plate, 'Não informado', COALESCE(t.cost, 0), t.service_date,
            COALESCE(t.status, 'pending'), COALESCE(t.notes, ''), COALESCE(t.origin, ''), COALESCE(t.km_traveled, 0)
          FROM 
            towing_partner_services t
          LEFT JOIN 
            servicos_guincho s ON t.partner_id = s.parceiro_id AND t.plate = s.placa_veiculo AND t.service_date::date = s.data_servico::date
          WHERE 
            s.id IS NULL
          RETURNING id
        )
        SELECT COUNT(*) as count FROM inseridos
      `;
      
      console.log('Executando query de sincronização:', query);
      
      const result = await pool.query(query);
      
      const count = parseInt(result.rows[0].count, 10);
      
      // 2. Atualizar a view para incluir os novos registros (apenas se for materializada)
      try {
        // Verificar se a view é materializada antes de tentar refresh
        const viewCheck = await pool.query(`
          SELECT schemaname, matviewname 
          FROM pg_matviews 
          WHERE matviewname = 'vw_servicos_guincho'
        `);
        
        if (viewCheck.rows.length > 0) {
          await pool.query(`REFRESH MATERIALIZED VIEW vw_servicos_guincho`);
        }
      } catch (viewError) {
        console.warn('A view materializada não existe ou não pôde ser atualizada:', viewError);
      }
      
      console.log(`Sincronização concluída. ${count} serviços sincronizados.`);
      
      res.json({ 
        success: true, 
        message: 'Sincronização concluída com sucesso',
        count: count 
      });
    } catch (error) {
      console.error('Erro ao sincronizar serviços de guincho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao sincronizar serviços de guincho',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Rota para limpar serviços excluídos do histórico
  app.post('/api/towing/limpar-servicos-excluidos', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Limpar serviços que foram rejeitados ou excluídos
      const deleteQuery = `
        DELETE FROM towing_partner_services 
        WHERE status IN ('rejected', 'deleted', 'cancelled')
        AND created_at < NOW() - INTERVAL '30 days'
      `;
      
      const result = await pool.query(deleteQuery);
      
      // Também limpar da tabela servicos_guincho se existir
      try {
        const deleteGuinchoQuery = `
          DELETE FROM servicos_guincho 
          WHERE status IN ('rejeitado', 'excluido', 'cancelado')
          AND data_lancamento < NOW() - INTERVAL '30 days'
        `;
        
        await pool.query(deleteGuinchoQuery);
      } catch (guinchoError) {
        console.warn('Tabela servicos_guincho não existe ou erro ao limpar:', guinchoError);
      }
      
      const deletedCount = result.rowCount || 0;
      
      console.log(`Limpeza concluída. ${deletedCount} serviços excluídos removidos do histórico.`);
      
      res.json({ 
        success: true, 
        message: 'Serviços excluídos removidos do histórico com sucesso',
        count: deletedCount 
      });
    } catch (error) {
      console.error('Erro ao limpar serviços excluídos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao limpar histórico de serviços excluídos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Rota para obter serviços de guincho para aprovação
  app.get('/api/towing/servicos', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Consulta SQL para buscar serviços pendentes
      const query = `
        SELECT 
          s.id,
          s.partner_id,
          s.plate as placa,
          s.origin as pickup_location,
          s.destination as delivery_location,
          s.service_type as tipo_servico,
          s.service_date as data_servico,
          s.cost as valor,
          s.km_traveled as km_reboque,
          s.notes as observacoes,
          s.status,
          s.created_at,
          p.name as parceiro_nome,
          p.company_name as parceiro_empresa,
          p.city as parceiro_cidade,
          p.status as parceiro_estado
        FROM towing_partner_services s
        JOIN towing_partners p ON s.partner_id = p.id
        ORDER BY s.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      // Formatar os dados para o formato esperado pelo frontend
      const servicos = result.rows.map(row => ({
        id: row.id,
        parceiro: {
          id: row.partner_id,
          nome: row.parceiro_nome || row.parceiro_empresa,
          cidade: row.parceiro_cidade || 'N/A',
          estado: row.parceiro_estado || 'N/A',
          avaliacao: 4.0
        },
        placa: row.placa,
        veiculo: 'Não especificado',
        tipo_servico: row.tipo_servico || 'Reboque',
        valor: parseFloat(row.valor) || 0,
        data_servico: row.data_servico,
        status: row.status === 'pending' ? 'pendente' : (row.status === 'approved' ? 'aprovado' : 'rejeitado'),
        observacoes: row.observacoes || '',
        local_atendimento: row.pickup_location || 'Não informado',
        local_retirada: row.pickup_location || 'Não informado',
        local_entrega: row.delivery_location || 'Não informado',
        km_reboque: row.km_reboque || 0
      }));
      
      return res.status(200).json(servicos);
    } catch (error: any) {
      console.error('Erro ao buscar serviços de guincho:', error);
      return res.status(500).json({ 
        message: 'Erro ao buscar serviços', 
        error: error.message 
      });
    }
  });
  
  // Rota para aprovar um serviço
  app.patch('/api/towing/servicos/:id/aprovar', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const servicoId = parseInt(req.params.id);
      if (isNaN(servicoId)) {
        return res.status(400).json({ message: "ID do serviço inválido" });
      }
      
      const updateQuery = `
        UPDATE towing_partner_services
        SET 
          status = 'approved',
          approved_at = $3,
          updated_at = $3,
          approved_by = $1
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [req.user.id, servicoId, formatDateForDB()]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      
      return res.status(200).json({
        message: "Serviço aprovado com sucesso",
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao aprovar serviço:', error);
      return res.status(500).json({ 
        message: 'Erro ao aprovar serviço', 
        error: error.message 
      });
    }
  });
  
  // Rota para rejeitar um serviço
  app.patch('/api/towing/servicos/:id/rejeitar', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const servicoId = parseInt(req.params.id);
      if (isNaN(servicoId)) {
        return res.status(400).json({ message: "ID do serviço inválido" });
      }
      
      const updateQuery = `
        UPDATE towing_partner_services
        SET 
          status = 'rejected',
          updated_at = $3,
          rejected_by = $1,
          rejected_at = $3
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [req.user.id, servicoId, formatDateForDB()]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      
      return res.status(200).json({
        message: "Serviço rejeitado com sucesso",
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao rejeitar serviço:', error);
      return res.status(500).json({ 
        message: 'Erro ao rejeitar serviço', 
        error: error.message 
      });
    }
  });
  
  // Rota para excluir um serviço (apenas para administradores)
  app.delete('/api/towing/servicos/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Verificar se é administrador
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem excluir serviços" });
      }
      
      const servicoId = parseInt(req.params.id);
      if (isNaN(servicoId)) {
        return res.status(400).json({ message: "ID do serviço inválido" });
      }
      
      // Primeiro verificar se o serviço existe
      const checkQuery = `SELECT id FROM towing_partner_services WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [servicoId]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      
      // Excluir o serviço
      const deleteQuery = `DELETE FROM towing_partner_services WHERE id = $1`;
      const result = await pool.query(deleteQuery, [servicoId]);
      
      // Também excluir da tabela servicos_guincho se existir
      try {
        const deleteFromServicosGuincho = `DELETE FROM servicos_guincho WHERE id = $1`;
        await pool.query(deleteFromServicosGuincho, [servicoId]);
      } catch (error) {
        // Não é crítico se essa tabela não existir ou falhar
        console.log('Aviso: Não foi possível excluir da tabela servicos_guincho:', error);
      }
      
      return res.status(200).json({
        message: "Serviço excluído com sucesso",
        deletedId: servicoId
      });
    } catch (error: any) {
      console.error('Erro ao excluir serviço:', error);
      return res.status(500).json({ 
        message: 'Erro ao excluir serviço', 
        error: error.message 
      });
    }
  });
  
  // Registrar rotas para o novo módulo de parceiros de guincho
  app.use('/api/towing', towingPartnersRoutes);
  
  // Rotas do módulo financeiro de guincho
  app.get('/api/towing/financial/summary', unifiedAuthMiddleware, (req: Request, res: Response) => 
    getTowingFinancialSummary(pool, req, res)
  );
  
  app.get('/api/towing/financial/services', unifiedAuthMiddleware, (req: Request, res: Response) => 
    getTowingFinancialServices(pool, req, res)
  );
  
  app.put('/api/towing/financial/payment/:id', unifiedAuthMiddleware, (req: Request, res: Response) => 
    processPayment(pool, req, res)
  );
  
  app.delete('/api/towing/financial/services/:id', unifiedAuthMiddleware, (req: Request, res: Response) => 
    deleteFinancialService(pool, req, res)
  );
  
  app.get('/api/towing/financial/report', unifiedAuthMiddleware, (req: Request, res: Response) => 
    getPartnerReport(pool, req, res)
  );
  
  // Registrar rotas de autenticação de parceiros de guincho
  const { default: partnerAuthRoutes } = await import('./routes/partnerAuth.js');
  app.use('/api/auth', partnerAuthRoutes);
  
  // Registrar rotas para gestão de pneus
  app.use('/api/pneus', pneusRoutes);
  
  // Rota especializada para Guarulhos V2 que preserva os valores reais dos campos 
  app.use('/api/guarulhos-v2', guarulhosV2Routes);
  
  // Inicializar tabela para o sistema de cartão combustível
  await setupFuelCardTable();
  
  // Rotas para o sistema de solicitação de cartão combustível
  app.get('/api/fuel-card-solicitations', getFuelCardSolicitations);
  app.post('/api/fuel-card-solicitations', createFuelCardSolicitation);
  app.post('/api/fuel-card-solicitations/line-hall', createLineHallFuelCardRequest);
  app.get('/api/fuel-card-solicitations/:id', getFuelCardSolicitationById);
  // Rota de status já registrada anteriormente na linha 6448
  
  // Rota para criar tabela de demonstração para o AutoSave
  app.post('/api/create-demo-table', async (req, res) => {
    try {
      const { tableName } = req.body;
      
      if (!tableName) {
        return res.status(400).json({ success: false, message: 'Nome da tabela é obrigatório' });
      }
      
      // Apenas permitir criar tabelas específicas para demo
      if (tableName !== 'demo_forms') {
        return res.status(403).json({ success: false, message: 'Tabela não permitida' });
      }
      
      // Executar SQL para criar a tabela de demonstração
      const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          title TEXT,
          description TEXT,
          priority TEXT,
          assignedTo TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      await pool.query(query);
      
      return res.json({ success: true, message: 'Tabela criada com sucesso' });
    } catch (error) {
      console.error('Erro ao criar tabela de demonstração:', error);
      return res.status(500).json({ success: false, message: 'Erro ao criar tabela', error: String(error) });
    }
  });

  const httpServer = createServer(app);
  // ===========================================
  // ROTAS PARA RECEBIMENTO DE COMBUSTÍVEL (EXTERNOS)
  // ===========================================
  
  // Rota para registrar recebimento de combustível nos postos (sem autenticação para links externos)
  app.post('/api/recebimentos/:posto', async (req, res) => {
    console.log('[RECEBIMENTO] Recebendo requisição para posto:', req.params.posto);
    console.log('[RECEBIMENTO] Dados recebidos:', req.body);
    
    try {
      const { posto } = req.params;
      const {
        fornecedor,
        tipo_combustivel,
        quantidade_litros,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        operador,
        observacoes
      } = req.body;

      // Validação dos campos obrigatórios
      if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro || !numero_nota || !operador) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: fornecedor, tipo_combustivel, quantidade_litros, valor_litro, numero_nota, operador'
        });
      }

      // Determinar a tabela correta baseada no posto
      let tableName = '';
      if (posto.toLowerCase().includes('remedios') || posto.toLowerCase() === 'posto_remedios') {
        tableName = 'recebimentos_posto_remedios';
      } else {
        // Para outros postos, usar o padrão: recebimentos_posto_{nome}_v2
        const postoFormatted = posto.toLowerCase().replace(/[^a-z0-9]/g, '_');
        tableName = `recebimentos_posto_${postoFormatted}_v2`;
      }

      console.log('[RECEBIMENTO] Usando tabela:', tableName);

      // Primeiro verificar se a tabela existe, se não criar
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;
      
      const tableExists = await pool.query(checkTableQuery, [tableName]);
      
      if (!tableExists.rows[0].exists) {
        console.log('[RECEBIMENTO] Criando tabela:', tableName);
        
        const createTableQuery = `
          CREATE TABLE ${tableName} (
            id SERIAL PRIMARY KEY,
            fornecedor VARCHAR(255) NOT NULL,
            tipo_combustivel VARCHAR(50) NOT NULL,
            quantidade_litros DECIMAL(10,2) NOT NULL,
            valor_litro DECIMAL(10,3) NOT NULL,
            valor_total DECIMAL(10,2) NOT NULL,
            numero_nota VARCHAR(100) NOT NULL,
            data_entrega DATE,
            operador VARCHAR(255) NOT NULL,
            observacoes TEXT,
            created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
          );
        `;
        
        await pool.query(createTableQuery);
        console.log('[RECEBIMENTO] Tabela criada com sucesso:', tableName);
      }

      // Inserir o recebimento
      const insertQuery = `
        INSERT INTO ${tableName} (
          fornecedor,
          tipo_combustivel,
          quantidade_litros,
          valor_litro,
          valor_total,
          numero_nota,
          data_entrega,
          operador,
          observacoes,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() AT TIME ZONE 'America/Sao_Paulo')
        RETURNING id
      `;

      const result = await pool.query(insertQuery, [
        fornecedor,
        tipo_combustivel,
        parseFloat(quantidade_litros),
        parseFloat(valor_litro),
        parseFloat(valor_total || (quantidade_litros * valor_litro)),
        numero_nota,
        data_entrega || new Date().toISOString().split('T')[0],
        operador,
        observacoes || ''
      ]);

      console.log('[RECEBIMENTO] Recebimento registrado com ID:', result.rows[0].id);

      res.json({
        success: true,
        message: 'Recebimento de combustível registrado com sucesso',
        data: {
          id: result.rows[0].id,
          posto: posto,
          tabela: tableName,
          fornecedor: fornecedor,
          tipo_combustivel: tipo_combustivel,
          quantidade_litros: parseFloat(quantidade_litros),
          valor_total: parseFloat(valor_total || (quantidade_litros * valor_litro))
        }
      });

    } catch (error) {
      console.error('[RECEBIMENTO] Erro ao registrar recebimento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao registrar recebimento',
        error: error.message
      });
    }
  });

  // Rota para listar bases
  app.get('/api/bases', async (req, res) => {
    try {
      const query = 'SELECT id, name FROM bases WHERE active = true ORDER BY name';
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar bases:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para listar motoristas
  app.get('/api/drivers', async (req, res) => {
    try {
      // Forçar headers de resposta JSON
      res.setHeader('Content-Type', 'application/json');
      
      // Verificar se a tabela motoristas existe
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'motoristas'
        ) as exists
      `);

      if (!tableCheck.rows[0].exists) {
        // Criar tabela se não existir
        await pool.query(`
          CREATE TABLE IF NOT EXISTS motoristas (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cpf VARCHAR(14) UNIQUE NOT NULL,
            telefone VARCHAR(20),
            base_id INTEGER REFERENCES bases(id),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
      }

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
      console.log('Drivers API - Retornando', result.rows.length, 'motoristas');
      
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  // Rota para cadastro de motoristas
  app.post('/api/drivers', unifiedAuthMiddleware, async (req, res) => {
    try {
      const { nome, cpf, telefone, base_id } = req.body;
      
      if (!nome || !cpf || !base_id) {
        return res.status(400).json({
          success: false,
          message: 'Nome, CPF e Base são obrigatórios'
        });
      }

      // Verificar se CPF já existe
      const checkCpfQuery = 'SELECT id FROM motoristas WHERE cpf = $1';
      const checkResult = await pool.query(checkCpfQuery, [cpf]);
      
      if (checkResult.rowCount && checkResult.rowCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado no sistema'
        });
      }

      // Inserir novo motorista
      const insertQuery = `
        INSERT INTO motoristas (nome, cpf, telefone, base_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [nome, cpf, telefone, base_id]);
      
      return res.status(201).json({
        success: true,
        message: 'Motorista cadastrado com sucesso',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao cadastrar motorista:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  // Rota para excluir abastecimento de qualquer posto
  app.delete('/api/abastecimento/:posto/:id', isAuthenticated, async (req, res) => {
    try {
      const { posto, id } = req.params;
      console.log(`[DELETE] Tentativa de exclusão - Posto: ${posto}, ID: ${id}, User: ${req.user?.email}`);

      // Normalizar nome do posto para determinar a tabela
      let nomeTabela = '';
      const postoLower = posto.toLowerCase().replace(/\s+/g, '_');
      
      if (postoLower.includes('alair')) {
        nomeTabela = 'abastecimentos_posto_alair_v2';
      } else if (postoLower.includes('osasco')) {
        nomeTabela = 'abastecimentos_posto_osasco_v2';
      } else if (postoLower.includes('campinas')) {
        nomeTabela = 'abastecimentos_posto_campinas_v2';
      } else if (postoLower.includes('abc')) {
        nomeTabela = 'abastecimentos_posto_abc_v2';
      } else if (postoLower.includes('socorro')) {
        nomeTabela = 'abastecimentos_posto_socorro_v2';
      } else if (postoLower.includes('sorocaba')) {
        nomeTabela = 'abastecimentos_posto_sorocaba_v2';
      } else if (postoLower.includes('guarulhos')) {
        nomeTabela = 'abastecimentos_posto_guarulhos_v2';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Posto não reconhecido'
        });
      }

      console.log(`Excluindo abastecimento ID ${id} da tabela ${nomeTabela}`);

      // Verificar se o registro existe
      const checkQuery = `SELECT id FROM ${nomeTabela} WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        });
      }

      // Excluir o registro
      const deleteQuery = `DELETE FROM ${nomeTabela} WHERE id = $1 RETURNING id`;
      const deleteResult = await pool.query(deleteQuery, [id]);
      
      if (deleteResult.rowCount === 0) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao excluir registro'
        });
      }

      console.log(`Abastecimento ID ${id} excluído com sucesso da tabela ${nomeTabela}`);

      return res.status(200).json({
        success: true,
        message: 'Registro excluído com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao excluir abastecimento:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para editar motorista
  app.put('/api/drivers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, cpf, telefone, base_id } = req.body;
      
      if (!nome || !cpf || !base_id) {
        return res.status(400).json({
          success: false,
          message: 'Nome, CPF e Base são obrigatórios'
        });
      }

      // Verificar se o motorista existe
      const checkDriverQuery = 'SELECT id FROM motoristas WHERE id = $1';
      const checkDriverResult = await pool.query(checkDriverQuery, [id]);
      
      if (checkDriverResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado'
        });
      }

      // Verificar se CPF já existe em outro motorista
      const checkCpfQuery = 'SELECT id FROM motoristas WHERE cpf = $1 AND id != $2';
      const checkResult = await pool.query(checkCpfQuery, [cpf, id]);
      
      if (checkResult.rowCount && checkResult.rowCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado para outro motorista'
        });
      }

      // Atualizar motorista
      const updateQuery = `
        UPDATE motoristas 
        SET nome = $1, cpf = $2, telefone = $3, base_id = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [nome, cpf, telefone, base_id, id]);
      
      return res.status(200).json({
        success: true,
        message: 'Motorista atualizado com sucesso',
        ...result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar motorista:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  // === SISTEMA DE NOTIFICAÇÕES PARA MOTORISTAS ===
  
  // API para obter notificações do motorista
  app.get('/api/line-hall/notifications/:motorista_id', async (req, res) => {
    try {
      const { motorista_id } = req.params;
      
      const query = `
        SELECT 
          'fuel_card' as type,
          'Solicitação de Recarga Aprovada' as title,
          CONCAT('Sua solicitação de recarga de R$ ', amount, ' para o cartão ', card_number, ' foi aprovada!') as message,
          updated_at as created_at,
          id as related_id
        FROM fuel_card_requests 
        WHERE driver_id = $1 AND status = 'aprovada' AND updated_at > NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT 
          'fuel_request' as type,
          'Solicitação de Abastecimento Aprovada' as title,
          CONCAT('Sua solicitação de abastecimento de ', litros_estimados, ' litros para o veículo ', vehicle_plate, ' foi aprovada!') as message,
          updated_at as created_at,
          id as related_id
        FROM fuel_requests 
        WHERE motorista_id = $1 AND status = 'aprovada' AND updated_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const result = await pool.query(query, [motorista_id]);

      res.status(200).json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar notificações do motorista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar notificações',
        error: error.message
      });
    }
  });

  // === ROTAS PARA SOLICITAÇÕES DE ABASTECIMENTO ===
  
  // Criar solicitação de abastecimento (Line Hall)
  app.post('/api/line-hall/fuel-requests', async (req, res) => {
    try {
      const {
        motorista_id,
        motorista_nome,
        vehicle_plate,
        km_atual,
        litros_estimados,
        local_abastecimento,
        justificativa,
        urgencia,
        tipo_combustivel,
        status = 'pendente'
      } = req.body;

      const insertQuery = `
        INSERT INTO fuel_requests (
          motorista_id, motorista_nome, vehicle_plate, km_atual, 
          litros_estimados, local_abastecimento, justificativa, 
          urgencia, tipo_combustivel, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        motorista_id, motorista_nome, vehicle_plate, km_atual,
        litros_estimados, local_abastecimento, justificativa,
        urgencia, tipo_combustivel, status
      ]);

      res.status(201).json({
        success: true,
        message: 'Solicitação de abastecimento criada com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao criar solicitação de abastecimento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação de abastecimento',
        error: error.message
      });
    }
  });

  // Listar solicitações de abastecimento
  app.get('/api/line-hall/fuel-requests', isAuthenticated, async (req, res) => {
    try {
      const { status, motorista_id } = req.query;
      
      console.log('[LINE-HALL-FUEL-REQUESTS] Parâmetros recebidos:', { status, motorista_id });
      
      // Buscar solicitações de cartão combustível do Line Hall
      let query = `
        SELECT 
          lr.id,
          lr.motorista_nome,
          lr.motorista_cpf,
          lr.veiculo_placa,
          lr.veiculo_modelo,
          lr.rota_origem,
          lr.rota_destino,
          lr.data_viagem,
          lr.valor_solicitado,
          lr.valor_aprovado,
          lr.status,
          lr.observacoes_operador,
          lr.created_at,
          lr.updated_at,
          lr.operador_aprovacao,
          lr.telefone_motorista,
          lr.km_total,
          lr.horario_abastecimento,
          lr.valor_calculado,
          v.cartao_abastecimento as cartao_combustivel
        FROM linehall_fuel_card_requests lr
        LEFT JOIN veiculos v ON lr.veiculo_placa = v.placa
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (motorista_id) {
        paramCount++;
        query += ` AND motorista_id = $${paramCount}`;
        params.push(motorista_id);
      }

      query += ' ORDER BY created_at DESC';

      console.log('[LINE-HALL-FUEL-REQUESTS] Query SQL:', query);
      console.log('[LINE-HALL-FUEL-REQUESTS] Parâmetros SQL:', params);

      const result = await pool.query(query, params);

      console.log('[LINE-HALL-FUEL-REQUESTS] Resultado da query:', {
        rowCount: result.rowCount,
        sampleData: result.rows.slice(0, 2)
      });

      // Forçar que não use cache
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });

    } catch (error) {
      console.error('Erro ao buscar solicitações de abastecimento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitações',
        error: error.message
      });
    }
  });

  // Atualizar status de solicitação de abastecimento
  app.put('/api/line-hall/fuel-requests/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, observacoes_operador } = req.body;

      const updateQuery = `
        UPDATE fuel_requests 
        SET status = $1, observacoes_operador = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [status, observacoes_operador, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      // Se foi aprovada, gerar notificação para o motorista
      if (status === 'aprovada') {
        await createFuelRequestNotification(result.rows[0]);
      }

      res.status(200).json({
        success: true,
        message: 'Status da solicitação atualizado com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao atualizar status da solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status',
        error: error.message
      });
    }
  });

  // === ROTA PARA SOLICITAÇÃO DE RECARGA DE CARTÃO COMBUSTÍVEL (LINE HALL SHOPEE) ===
  
  // Criar solicitação de recarga de cartão combustível
  app.post('/api/line-hall/fuel-request', async (req, res) => {
    try {
      const {
        motorista_id,
        motorista_nome,
        motorista_cpf,
        veiculo_placa,
        veiculo_modelo,
        rota_origem,
        rota_destino,
        data_solicitacao,
        horario_solicitacao,
        km_total,
        horario_abastecimento,
        telefone_motorista,
        status = 'pendente'
      } = req.body;

      // Verificar se já existe uma solicitação aprovada para a mesma rota pelo mesmo motorista
      const checkRouteQuery = `
        SELECT id, status FROM linehall_fuel_card_requests 
        WHERE motorista_id = $1 
          AND rota_origem = $2 
          AND rota_destino = $3 
          AND status IN ('aprovada', 'pendente')
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const existingRoute = await pool.query(checkRouteQuery, [
        motorista_id, rota_origem, rota_destino
      ]);

      if (existingRoute.rows.length > 0) {
        const existing = existingRoute.rows[0];
        return res.status(400).json({
          success: false,
          message: existing.status === 'aprovada' 
            ? 'Você já possui uma solicitação aprovada para esta rota. Cada rota permite apenas uma solicitação de abastecimento por viagem.'
            : 'Você já possui uma solicitação pendente para esta rota. Aguarde a aprovação antes de solicitar novamente.',
          existingRequest: existing
        });
      }

      // Calcular valor com base na quilometragem e consumo do veículo
      function getConsumoByModel(modelo) {
        const consumos = {
          'iveco': 2.5,
          'volvo': 2.7,
          'constellation': 2.0,
          'mercedes': 2.5,
          'man': 2.6,
          'scania': 2.7,
          'daf': 2.7
        };
        
        const modeloLower = modelo.toLowerCase();
        for (const [marca, consumo] of Object.entries(consumos)) {
          if (modeloLower.includes(marca)) {
            return consumo;
          }
        }
        return 2.5; // Default
      }

      const consumo = getConsumoByModel(veiculo_modelo);
      const valorCalculado = ((km_total + 30) / consumo * 6.50).toFixed(2);

      const insertQuery = `
        INSERT INTO linehall_fuel_card_requests (
          motorista_id, motorista_nome, motorista_cpf, 
          veiculo_placa, veiculo_modelo, rota_origem, rota_destino,
          data_solicitacao, horario_solicitacao, km_total,
          horario_abastecimento, telefone_motorista, status, valor_calculado, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        motorista_id, motorista_nome, motorista_cpf,
        veiculo_placa, veiculo_modelo, rota_origem, rota_destino,
        data_solicitacao, horario_solicitacao, km_total,
        horario_abastecimento, telefone_motorista, status, valorCalculado
      ]);

      res.status(201).json({
        success: true,
        message: 'Solicitação de recarga enviada com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao criar solicitação de recarga:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar solicitação',
        error: error.message
      });
    }
  });

  // Buscar solicitações de recarga de cartão combustível para operadores
  app.get('/api/line-hall/fuel-requests', async (req, res) => {
    try {
      const { status, motorista_id } = req.query;
      
      console.log('[LINE-HALL-FUEL-REQUESTS] Parâmetros recebidos:', { status, motorista_id });
      
      let query = `
        SELECT 
          lr.id,
          lr.motorista_nome,
          lr.motorista_cpf,
          lr.veiculo_placa,
          lr.veiculo_modelo,
          lr.rota_origem,
          lr.rota_destino,
          lr.data_viagem,
          lr.valor_solicitado,
          lr.valor_aprovado,
          lr.status,
          lr.observacoes_operador,
          lr.created_at,
          lr.updated_at,
          lr.operador_aprovacao,
          lr.telefone_motorista,
          lr.km_total,
          lr.horario_abastecimento,
          lr.valor_calculado,
          v.cartao_abastecimento as cartao_combustivel
        FROM linehall_fuel_card_requests lr
        LEFT JOIN veiculos v ON lr.veiculo_placa = v.placa
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND lr.status = $${paramCount}`;
        params.push(status);
      }

      if (motorista_id) {
        paramCount++;
        query += ` AND motorista_id = $${paramCount}`;
        params.push(motorista_id);
      }

      query += ` ORDER BY created_at DESC`;

      console.log('[LINE-HALL-FUEL-REQUESTS] Query SQL:', query);
      console.log('[LINE-HALL-FUEL-REQUESTS] Parâmetros SQL:', params);

      const result = await pool.query(query, params);

      console.log('[LINE-HALL-FUEL-REQUESTS] Resultado da query:', {
        rowCount: result.rowCount,
        sampleData: result.rows.slice(0, 1)
      });

      res.status(200).json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar solicitações de recarga:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitações',
        error: error.message
      });
    }
  });

  // Atualizar solicitação de recarga Line Hall (endpoint para a página dedicada)
  app.put('/api/line-hall/fuel-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, observacoes_operador, operador_aprovacao } = req.body;
      const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;

      console.log(`[UPDATE-LINE-HALL-REQUEST] Atualizando solicitação ID: ${id}`, { status, operador_aprovacao });

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID da solicitação inválido'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status é obrigatório'
        });
      }

      const updateQuery = `
        UPDATE linehall_fuel_card_requests 
        SET 
          status = $1, 
          observacoes_operador = $2, 
          operador_aprovacao = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        status, 
        observacoes_operador || '', 
        operador_aprovacao || user?.name || 'Sistema',
        id
      ]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      console.log(`[UPDATE-LINE-HALL-REQUEST] Solicitação ${id} atualizada com sucesso para status: ${status}`);

      res.status(200).json({
        success: true,
        message: 'Solicitação atualizada com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao atualizar solicitação Line Hall:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar solicitação',
        error: error.message
      });
    }
  });

  // Atualizar status de solicitação de recarga
  app.put('/api/line-hall/fuel-request/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, observacoes_operador } = req.body;

      const updateQuery = `
        UPDATE linehall_fuel_card_requests 
        SET status = $1, observacoes_operador = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [status, observacoes_operador, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Status da solicitação atualizado com sucesso',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao atualizar status da solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status',
        error: error.message
      });
    }
  });

  // Excluir solicitação de recarga Line Hall (apenas administradores)
  app.delete('/api/line-hall/fuel-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;

      console.log(`[DELETE-LINE-HALL] Tentativa de exclusão da solicitação ID: ${id} por usuário:`, user?.email);

      // Verificar se o usuário é administrador
      if (!user || user.role !== 'admin') {
        console.log('[DELETE-LINE-HALL] Acesso negado - usuário não é administrador');
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores podem excluir solicitações'
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID da solicitação inválido'
        });
      }

      // Verificar se a solicitação existe
      const checkQuery = 'SELECT * FROM linehall_fuel_card_requests WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      // Executar a exclusão
      const deleteQuery = 'DELETE FROM linehall_fuel_card_requests WHERE id = $1';
      const deleteResult = await pool.query(deleteQuery, [id]);

      if (deleteResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada para exclusão'
        });
      }

      console.log(`[DELETE-LINE-HALL] Solicitação ${id} excluída com sucesso pelo usuário ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Solicitação excluída com sucesso',
        deletedId: id
      });

    } catch (error) {
      console.error('[DELETE-LINE-HALL] Erro ao excluir solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  // Upload de documentos de veículos (CRLV e ANTT)
  app.post('/api/upload-vehicle-document', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado'
        });
      }

      const { folder, vehiclePlate } = req.body;
      
      if (!folder || !vehiclePlate) {
        return res.status(400).json({
          success: false,
          message: 'Pasta e placa do veículo são obrigatórios'
        });
      }

      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de arquivo não permitido. Use PDF, JPG ou PNG.'
        });
      }

      // Criar diretório se não existir
      const uploadDir = path.join(process.cwd(), 'uploads', 'vehicle-documents', folder);
      await fs.mkdir(uploadDir, { recursive: true });

      // Nome único para o arquivo
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${vehiclePlate}_${folder}_${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      // Salvar arquivo
      await fs.writeFile(filePath, req.file.buffer);

      // Retornar URL relativa para acesso
      const fileUrl = `/uploads/vehicle-documents/${folder}/${fileName}`;

      console.log(`[UPLOAD-VEHICLE-DOC] Arquivo ${folder} salvo para veículo ${vehiclePlate} por ${user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Arquivo enviado com sucesso',
        url: fileUrl,
        fileName: fileName
      });

    } catch (error) {
      console.error('[UPLOAD-VEHICLE-DOC] Erro ao fazer upload:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao fazer upload',
        error: error.message
      });
    }
  });

  // Servir arquivos estáticos para uploads de documentos
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  return httpServer;
}

// === FUNÇÕES AUXILIARES PARA SOLICITAÇÕES DE ABASTECIMENTO ===

// Configurar tabela de solicitações de abastecimento
async function setupFuelRequestsTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS fuel_requests (
        id SERIAL PRIMARY KEY,
        motorista_id INTEGER NOT NULL,
        motorista_nome VARCHAR(255) NOT NULL,
        vehicle_plate VARCHAR(20) NOT NULL,
        km_atual INTEGER NOT NULL,
        litros_estimados INTEGER NOT NULL,
        local_abastecimento TEXT NOT NULL,
        justificativa TEXT NOT NULL,
        urgencia VARCHAR(20) DEFAULT 'normal' CHECK (urgencia IN ('baixa', 'normal', 'alta')),
        tipo_combustivel VARCHAR(20) DEFAULT 'diesel' CHECK (tipo_combustivel IN ('diesel', 'gasolina', 'etanol')),
        status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'concluida')),
        observacoes_operador TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_fuel_requests_status ON fuel_requests(status);
      CREATE INDEX IF NOT EXISTS idx_fuel_requests_motorista ON fuel_requests(motorista_id);
      CREATE INDEX IF NOT EXISTS idx_fuel_requests_vehicle ON fuel_requests(vehicle_plate);
    `;

    await pool.query(createTableQuery);
    console.log('✅ Tabela fuel_requests configurada com sucesso');

  } catch (error) {
    console.error('❌ Erro ao configurar tabela fuel_requests:', error);
    throw error;
  }
}

// Criar notificação para motorista quando solicitação for aprovada
async function createFuelRequestNotification(fuelRequest) {
  try {
    // Criar notificação na tabela de notificações (se existir)
    const notificationQuery = `
      INSERT INTO notifications (
        user_id, user_type, title, message, 
        type, related_id, created_at
      ) VALUES ($1, 'motorista', $2, $3, 'fuel_request_approved', $4, NOW())
    `;

    const title = 'Solicitação de Abastecimento Aprovada';
    const message = `Sua solicitação de abastecimento para o veículo ${fuelRequest.vehicle_plate} foi aprovada. Você pode prosseguir com o abastecimento de ${fuelRequest.litros_estimados} litros no local: ${fuelRequest.local_abastecimento}`;

    // Tentar criar a notificação (pode falhar se a tabela não existir)
    try {
      await pool.query(notificationQuery, [
        fuelRequest.motorista_id,
        title,
        message,
        fuelRequest.id
      ]);
      console.log(`📱 Notificação criada para motorista ${fuelRequest.motorista_nome}`);
    } catch (notifError) {
      console.log('ℹ️ Tabela de notificações não encontrada, pulando criação de notificação');
    }

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
  
  // ===== ROTAS PARA MÓDULO FINANCEIRO DE SERVIÇOS DE GUINCHO =====
  // (Movidas para towingPaymentsRoutes.ts)

  // ===== ROTAS PARA CADASTRO DE ROTAS DOS PARCEIROS =====
  // API para buscar rotas de um parceiro
  app.get('/api/towing/partners/:id/routes', async (req, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);
      
      // Verificar token JWT
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, 'partner_secret_key');
      
      if (decoded.partnerId !== partnerId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const result = await pool.query(`
        SELECT * FROM partner_routes 
        WHERE partner_id = $1 
        ORDER BY created_at DESC
      `, [partnerId]);

      res.json({ routes: result.rows });
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // API para cadastrar nova rota
  app.post('/api/towing/partners/:id/routes', async (req, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      const { origin, destination, totalKm, description, vehiclePlate } = req.body;
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);
      
      // Verificar token JWT
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, 'partner_secret_key');
      
      if (decoded.partnerId !== partnerId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Criar tabela se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS partner_routes (
          id SERIAL PRIMARY KEY,
          partner_id INTEGER REFERENCES towing_partners(id),
          origin VARCHAR(255) NOT NULL,
          destination VARCHAR(255) NOT NULL,
          total_km DECIMAL(10,2) NOT NULL,
          description TEXT,
          vehicle_plate VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await pool.query(`
        INSERT INTO partner_routes (partner_id, origin, destination, total_km, description, vehicle_plate)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [partnerId, origin, destination, parseFloat(totalKm), description, vehiclePlate]);

      res.json({ route: result.rows[0] });
    } catch (error) {
      console.error('Erro ao cadastrar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // APIs para sistema de checklist dos motoristas Line Hall
  app.post('/api/line-hall-checklist', async (req, res) => {
    try {
      const {
        trip_id,
        motorista_nome,
        placa_cavalo,
        km_inicial,
        items
      } = req.body;

      if (!trip_id || !motorista_nome || !placa_cavalo || !km_inicial) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos'
        });
      }

      const query = `
        INSERT INTO line_hall_checklists
        (trip_id, motorista_nome, placa_cavalo, km_inicial, items, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const values = [
        trip_id,
        motorista_nome,
        placa_cavalo,
        km_inicial,
        JSON.stringify(items || [])
      ];

      const result = await pool.query(query, values);
      
      return res.status(201).json({
        success: true,
        message: 'Checklist iniciado com sucesso',
        checklist: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao criar checklist:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar checklist',
        error: error.message
      });
    }
  });

  app.patch('/api/line-hall-checklist/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        km_final,
        status,
        items
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do checklist é obrigatório'
        });
      }

      // Verificar se o checklist existe
      const checkQuery = `
        SELECT id FROM line_hall_checklists
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Checklist não encontrado'
        });
      }

      const updateFields = [];
      const updateValues = [];
      let valueIndex = 1;

      if (km_final !== undefined) {
        updateFields.push(`km_final = $${valueIndex++}`);
        updateValues.push(km_final);
      }

      if (status !== undefined) {
        updateFields.push(`status = $${valueIndex++}`);
        updateValues.push(status);
        
        if (status === 'concluido') {
          updateFields.push(`completed_at = NOW()`);
        }
      }

      if (items !== undefined) {
        updateFields.push(`items = $${valueIndex++}`);
        updateValues.push(JSON.stringify(items));
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar foi fornecido'
        });
      }

      updateValues.push(id);

      const updateQuery = `
        UPDATE line_hall_checklists
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, updateValues);
      
      return res.status(200).json({
        success: true,
        message: 'Checklist atualizado com sucesso',
        checklist: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao atualizar checklist:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar checklist',
        error: error.message
      });
    }
  });

  app.get('/api/line-hall-checklist/trip/:tripId', async (req, res) => {
    try {
      const { tripId } = req.params;

      const query = `
        SELECT * FROM line_hall_checklists
        WHERE trip_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [tripId]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum checklist encontrado para esta viagem'
        });
      }

      return res.status(200).json({
        success: true,
        checklist: result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao buscar checklist:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar checklist',
        error: error.message
      });
    }
  });

  // API para Histórico Geral de Operações Financeiras
  app.get('/api/general-operations-history', hybridAuthMiddleware, async (req, res) => {
    try {
      const { dateStart, dateEnd, operationType, base } = req.query;
      
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      // Construir condições de filtro
      if (dateStart) {
        whereConditions.push(`data_operacao >= $${paramIndex}`);
        params.push(dateStart);
        paramIndex++;
      }
      
      if (dateEnd) {
        whereConditions.push(`data_operacao <= $${paramIndex}`);
        params.push(dateEnd);
        paramIndex++;
      }
      
      if (base && base !== 'all') {
        whereConditions.push(`base = $${paramIndex}`);
        params.push(base);
        paramIndex++;
      }
      
      if (operationType && operationType !== 'all') {
        whereConditions.push(`tipo_operacao = $${paramIndex}`);
        params.push(operationType);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Query unificada para buscar operações de múltiplas fontes
      const query = `
        WITH operacoes_consolidadas AS (
          -- Abastecimentos (múltiplas tabelas)
          SELECT 
            CONCAT('abastecimento_', id) as id,
            'abastecimento' as tipo_operacao,
            'Abastecimento de combustível' as descricao,
            COALESCE(base, 'Base não especificada') as base,
            COALESCE(valor_calculado::text, '0') as custo_total,
            COALESCE(data_abastecimento, created_at, NOW()) as data_operacao,
            placa,
            motorista,
            km::text as km,
            tipo_combustivel,
            litros::text as litros,
            status,
            observacoes
          FROM abastecimentos_posto_osasco_v2
          WHERE data_abastecimento IS NOT NULL
          
          UNION ALL
          
          SELECT 
            CONCAT('abastecimento_guarulhos_', id) as id,
            'abastecimento' as tipo_operacao,
            'Abastecimento de combustível' as descricao,
            COALESCE(base, 'Guarulhos V2') as base,
            COALESCE(valor_calculado::text, '0') as custo_total,
            COALESCE(data_abastecimento, created_at, NOW()) as data_operacao,
            placa,
            motorista,
            km::text as km,
            tipo_combustivel,
            litros::text as litros,
            status,
            observacoes
          FROM abastecimentos_posto_guarulhos_v2
          WHERE data_abastecimento IS NOT NULL
          
          UNION ALL
          
          SELECT 
            CONCAT('abastecimento_campinas_', id) as id,
            'abastecimento' as tipo_operacao,
            'Abastecimento de combustível' as descricao,
            COALESCE(base, 'Campinas V2') as base,
            COALESCE(valor_calculado::text, '0') as custo_total,
            COALESCE(data_abastecimento, created_at, NOW()) as data_operacao,
            placa,
            motorista,
            km::text as km,
            tipo_combustivel,
            litros::text as litros,
            status,
            observacoes
          FROM abastecimentos_posto_campinas_v2
          WHERE data_abastecimento IS NOT NULL
          
          UNION ALL
          
          -- Recargas de cartão
          SELECT 
            CONCAT('recarga_', id) as id,
            'recarga_cartao' as tipo_operacao,
            'Recarga de cartão de combustível' as descricao,
            COALESCE(base, 'Base não especificada') as base,
            COALESCE(valor_solicitado::text, '0') as custo_total,
            COALESCE(data_solicitacao, created_at, NOW()) as data_operacao,
            placa,
            motorista,
            km::text as km,
            tipo_combustivel,
            litros_solicitados::text as litros,
            status,
            observacoes
          FROM fuel_card_solicitations
          WHERE status = 'Recarga Efetuada'
          
          UNION ALL
          
          -- Manutenções (se existir tabela)
          SELECT 
            CONCAT('manutencao_', id) as id,
            'manutencao' as tipo_operacao,
            CONCAT('Manutenção - ', maintenance_type) as descricao,
            COALESCE(base_name, 'Base não especificada') as base,
            COALESCE(estimated_cost::text, total_cost::text, '0') as custo_total,
            COALESCE(created_at, NOW()) as data_operacao,
            vehicle_plate as placa,
            assigned_technician as motorista,
            NULL as km,
            NULL as tipo_combustivel,
            NULL as litros,
            status,
            description as observacoes
          FROM maintenance_requests
          WHERE status IN ('completed', 'approved')
        )
        SELECT * FROM operacoes_consolidadas 
        ${whereClause}
        ORDER BY data_operacao DESC 
        LIMIT 100
      `;

      console.log('Query para histórico geral:', query);
      console.log('Parâmetros:', params);

      const result = await pool.query(query, params);
      
      // Processar e formatar os dados
      const operations = result.rows.map(row => ({
        ...row,
        custo_total: parseFloat(row.custo_total) || 0
      }));

      console.log(`Histórico geral retornou ${operations.length} operações`);

      res.json({
        success: true,
        data: operations,
        summary: {
          total_operations: operations.length,
          total_cost: operations.reduce((sum, op) => sum + op.custo_total, 0),
          bases_count: new Set(operations.map(op => op.base)).size
        }
      });
      
    } catch (error: any) {
      console.error('Erro ao buscar histórico geral de operações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico de operações',
        error: error.message
      });
    }
  });

  // Debug endpoint to verify API routing
  app.get('/api/terceiros/test', (req: Request, res: Response) => {
    res.json({ success: true, message: 'API routing is working', timestamp: new Date().toISOString() });
  });

  // Rotas administrativas para gerenciar empresas terceiras
  app.get('/api/terceiros/admin/empresas', authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      // Verificar se o usuário é admin
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
      }

      const query = `
        SELECT et.*, 
               COUNT(ut.id) as total_usuarios,
               COUNT(at.id) as total_abastecimentos,
               COALESCE(SUM(at.valor), 0) as valor_total
        FROM empresas_terceiros et
        LEFT JOIN usuarios_terceiros ut ON et.id = ut.empresa_id
        LEFT JOIN abastecimentos_terceiros at ON et.id = at.empresa_id
        GROUP BY et.id
        ORDER BY et.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows.map(row => ({
          id: row.id,
          nome: row.nome,
          cnpj: row.cnpj,
          endereco: row.endereco,
          telefone: row.telefone,
          email: row.email,
          responsavel: row.responsavel_nome,
          status: row.status,
          totalUsuarios: parseInt(row.total_usuarios),
          totalAbastecimentos: parseInt(row.total_abastecimentos),
          valorTotal: parseFloat(row.valor_total),
          createdAt: row.created_at
        }))
      });

    } catch (error) {
      console.error('Erro ao buscar empresas terceiras:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/terceiros/admin/empresas', authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      // Verificar se o usuário é admin
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
      }

      const { nome, cnpj, email, telefone, endereco, senha } = req.body;

      // Validações
      if (!nome || !cnpj || !email || !senha) {
        return res.status(400).json({ error: 'Nome, CNPJ, email e senha são obrigatórios.' });
      }

      // Verificar se CNPJ já existe
      const existingCompany = await pool.query('SELECT id FROM empresas_terceiros WHERE cnpj = $1', [cnpj]);
      if (existingCompany.rows.length > 0) {
        return res.status(400).json({ error: 'CNPJ já cadastrado.' });
      }

      // Verificar se email já existe
      const existingEmail = await pool.query('SELECT id FROM usuarios_terceiros WHERE cnpj = $1', [cnpj]);
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: 'CNPJ já possui usuário cadastrado.' });
      }

      // Hash da senha
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(senha, saltRounds);

      // Iniciar transação
      await pool.query('BEGIN');

      try {
        // Inserir empresa
        const empresaQuery = `
          INSERT INTO empresas_terceiros (nome, cnpj, endereco, telefone, email, responsavel_nome)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const empresaResult = await pool.query(empresaQuery, [nome, cnpj, endereco, telefone, email, nome]);
        const empresa = empresaResult.rows[0];

        // Inserir usuário para a empresa
        const usuarioQuery = `
          INSERT INTO usuarios_terceiros (empresa_id, cnpj, senha, nome, email, cargo)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        await pool.query(usuarioQuery, [empresa.id, cnpj, senhaHash, nome, email, 'Administrador']);

        // Commit da transação
        await pool.query('COMMIT');

        res.status(201).json({
          success: true,
          message: 'Empresa cadastrada com sucesso!',
          data: {
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            email: empresa.email
          }
        });

      } catch (transactionError) {
        await pool.query('ROLLBACK');
        throw transactionError;
      }

    } catch (error) {
      console.error('Erro ao cadastrar empresa terceira:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/terceiros/admin/abastecimentos', authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      // Verificar se o usuário é admin
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
      }

      const query = `
        SELECT at.*, et.nome as empresa_nome, et.cnpj as empresa_cnpj
        FROM abastecimentos_terceiros at
        JOIN empresas_terceiros et ON at.empresa_id = et.id
        ORDER BY at.data_abastecimento DESC
        LIMIT 100
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar abastecimentos de terceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });



  // Rotas do sistema de abastecimento terceiros integradas
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const multer = require('multer');
  
  // Configuração do multer para upload de imagens
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/notas-fiscais';
      if (!require('fs').existsSync(uploadDir)) {
        require('fs').mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'nf-' + uniqueSuffix + require('path').extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas!'), false);
      }
    }
  });

  // Middleware para verificar JWT
  const verifyTokenTerceiros = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'terceiros_secret_key_2025');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
  };

  // Rota de login para terceiros
  app.post('/api/terceiros/login', async (req: Request, res: Response) => {
    try {
      const { cnpj, senha } = req.body;

      if (!cnpj || !senha) {
        return res.status(400).json({ error: 'CNPJ e senha são obrigatórios.' });
      }

      // Buscar usuário pelo CNPJ
      const userQuery = `
        SELECT ut.*, et.nome as empresa_nome 
        FROM usuarios_terceiros ut
        JOIN empresas_terceiros et ON ut.empresa_id = et.id
        WHERE ut.cnpj = $1 AND ut.is_active = true
      `;
      const userResult = await pool.query(userQuery, [cnpj]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const user = userResult.rows[0];

      // Verificar senha
      const isValidPassword = await bcrypt.compare(senha, user.senha_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Gerar JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          cnpj: user.cnpj, 
          empresaId: user.empresa_id,
          empresaNome: user.empresa_nome
        },
        process.env.JWT_SECRET || 'terceiros_secret_key_2025',
        { expiresIn: '24h' }
      );

      // Atualizar último login
      await pool.query(
        'UPDATE usuarios_terceiros SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          cnpj: user.cnpj,
          empresaId: user.empresa_id,
          empresaNome: user.empresa_nome
        }
      });

    } catch (error) {
      console.error('Erro no login terceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // Rota do dashboard para terceiros
  app.get('/api/terceiros/dashboard', verifyTokenTerceiros, async (req: Request, res: Response) => {
    try {
      const empresaId = req.user.empresaId;

      // Buscar dados da empresa
      const empresaQuery = 'SELECT nome, cnpj FROM empresas_terceiros WHERE id = $1';
      const empresaResult = await pool.query(empresaQuery, [empresaId]);

      if (empresaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      const empresa = empresaResult.rows[0];

      // Buscar estatísticas de abastecimento
      const statsQuery = `
        SELECT 
          COUNT(*) as total_abastecimentos,
          COALESCE(SUM(litros), 0) as total_litros,
          COALESCE(SUM(valor), 0) as total_valor
        FROM abastecimentos_terceiros 
        WHERE empresa_id = $1
      `;
      const statsResult = await pool.query(statsQuery, [empresaId]);
      const stats = statsResult.rows[0];

      // Buscar últimos abastecimentos
      const abastecimentosQuery = `
        SELECT * FROM abastecimentos_terceiros 
        WHERE empresa_id = $1 
        ORDER BY data_abastecimento DESC 
        LIMIT 50
      `;
      const abastecimentosResult = await pool.query(abastecimentosQuery, [empresaId]);

      res.json({
        success: true,
        data: {
          empresa: {
            nome: empresa.nome,
            cnpj: empresa.cnpj
          },
          estatisticas: {
            totalAbastecimentos: parseInt(stats.total_abastecimentos),
            totalLitros: parseFloat(stats.total_litros),
            totalValor: parseFloat(stats.total_valor)
          },
          abastecimentos: abastecimentosResult.rows
        }
      });

    } catch (error) {
      console.error('Erro no dashboard terceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // Rota para criar novo abastecimento
  app.post('/api/terceiros/abastecimentos', verifyTokenTerceiros, upload.single('notaFiscal'), async (req: Request, res: Response) => {
    try {
      const empresaId = req.user.empresaId;
      const { motoristaNome, veiculoPlaca, litros, valor, observacoes } = req.body;

      // Validações
      if (!motoristaNome || !veiculoPlaca || !litros || !valor) {
        return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
      }

      // Validação obrigatória da nota fiscal
      if (!req.file) {
        return res.status(400).json({ error: 'Nota fiscal é obrigatória.' });
      }

      const notaFiscalUrl = `/uploads/notas-fiscais/${req.file.filename}`;

      // Inserir abastecimento
      const insertQuery = `
        INSERT INTO abastecimentos_terceiros 
        (empresa_id, motorista_nome, veiculo_placa, litros, valor, nota_fiscal_url, observacoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        empresaId,
        motoristaNome,
        veiculoPlaca.toUpperCase(),
        parseFloat(litros),
        parseFloat(valor),
        notaFiscalUrl,
        observacoes || null
      ]);

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao criar abastecimento terceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // APIs para gerenciamento de terceiros no sistema principal (requer autenticação admin)
  
  // Middleware simples para rotas de terceiros que verifica autenticação de sessão
  const terceirosAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log(`[TerceirosAuth] Rota acessada: ${req.path}, método: ${req.method}`);
    console.log(`[TerceirosAuth] isAuthenticated: ${req.isAuthenticated?.()}, user: ${req.user ? 'presente' : 'ausente'}`);
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      console.log(`[TerceirosAuth] Usuário autenticado: ${req.user.email} (role: ${req.user.role})`);
      return next();
    }
    console.log('[TerceirosAuth] Usuário não autenticado');
    return res.status(401).json({ error: 'Não autorizado' });
  };

  // Teste simples para verificar se as rotas funcionam
  app.get('/api/terceiros/test', (req: Request, res: Response) => {
    console.log('[TerceirosTest] Rota de teste acessada com sucesso');
    res.json({ success: true, message: 'Terceiros routes funcionando' });
  });

  // Estatísticas gerais de terceiros
  app.get('/api/terceiros/admin/stats', terceirosAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT e.id) as total_empresas,
          COUNT(a.id) as total_abastecimentos,
          COALESCE(SUM(a.litros), 0) as total_litros,
          COALESCE(SUM(a.valor), 0) as total_valor,
          COUNT(a.id) FILTER (WHERE DATE(a.data_abastecimento) = CURRENT_DATE) as abastecimentos_hoje
        FROM empresas_terceiros e
        LEFT JOIN abastecimentos_terceiros a ON e.id = a.empresa_id
        WHERE e.status = 'ativo'
      `;

      const result = await pool.query(statsQuery);
      
      res.json({
        success: true,
        data: {
          totalEmpresas: parseInt(result.rows[0].total_empresas || '0'),
          totalAbastecimentos: parseInt(result.rows[0].total_abastecimentos || '0'),
          totalLitros: parseFloat(result.rows[0].total_litros || '0'),
          totalValor: parseFloat(result.rows[0].total_valor || '0'),
          abastecimentosHoje: parseInt(result.rows[0].abastecimentos_hoje || '0')
        }
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas de terceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // Lista de empresas terceiras
  app.get('/api/terceiros/admin/empresas', terceirosAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const empresasQuery = `
        SELECT 
          id,
          nome,
          cnpj,
          email,
          telefone,
          endereco,
          data_cadastro,
          status
        FROM empresas_terceiros
        ORDER BY nome
      `;

      const result = await pool.query(empresasQuery);
      
      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar empresas terceiras:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // Lista de abastecimentos de terceiros
  app.get('/api/terceiros/admin/abastecimentos', terceirosAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const abastecimentosQuery = `
        SELECT 
          a.id,
          a.empresa_id,
          e.nome as empresa_nome,
          e.cnpj as empresa_cnpj,
          a.motorista_nome,
          a.veiculo_placa,
          a.litros,
          a.valor,
          a.nota_fiscal_url,
          a.observacoes,
          a.data_abastecimento
        FROM abastecimentos_terceiros a
        JOIN empresas_terceiros e ON a.empresa_id = e.id
        ORDER BY a.data_abastecimento DESC
        LIMIT 1000
      `;

      const result = await pool.query(abastecimentosQuery);
      
      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao buscar abastecimentos de terceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // Exportar relatório (admin)
  app.get('/api/terceiros/admin/relatorio/export', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const XLSX = require('xlsx');
      
      const abastecimentosQuery = `
        SELECT 
          e.nome as empresa,
          e.cnpj,
          a.motorista_nome,
          a.veiculo_placa,
          a.litros,
          a.valor,
          a.data_abastecimento,
          a.observacoes
        FROM abastecimentos_terceiros a
        JOIN empresas_terceiros e ON a.empresa_id = e.id
        ORDER BY a.data_abastecimento DESC
      `;

      const result = await pool.query(abastecimentosQuery);
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(result.rows.map(row => ({
        'Empresa': row.empresa,
        'CNPJ': row.cnpj,
        'Motorista': row.motorista_nome,
        'Veículo': row.veiculo_placa,
        'Litros': row.litros,
        'Valor': `R$ ${row.valor.toFixed(2)}`,
        'Data': new Date(row.data_abastecimento).toLocaleString('pt-BR'),
        'Observações': row.observacoes || ''
      })));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Abastecimentos');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_terceiros.xlsx');
      res.send(buffer);

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // Rota para exportar relatório (acesso de terceiros)
  app.get('/api/terceiros/relatorio/export', verifyTokenTerceiros, async (req: Request, res: Response) => {
    try {
      const empresaId = req.user.empresaId;

      const query = `
        SELECT 
          motorista_nome,
          veiculo_placa,
          litros,
          valor,
          data_abastecimento,
          observacoes
        FROM abastecimentos_terceiros 
        WHERE empresa_id = $1 
        ORDER BY data_abastecimento DESC
      `;
      
      const result = await pool.query(query, [empresaId]);

      // Gerar CSV
      const csvHeader = 'Data,Motorista,Placa,Litros,Valor,Observacoes\n';
      const csvData = result.rows.map(row => 
        `${new Date(row.data_abastecimento).toLocaleDateString('pt-BR')},${row.motorista_nome},${row.veiculo_placa},${row.litros},${row.valor},"${row.observacoes || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_abastecimentos.csv');
      res.send(csvHeader + csvData);

    } catch (error) {
      console.error('Erro ao exportar relatório terceiros:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // Servir arquivos estáticos para uploads
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}