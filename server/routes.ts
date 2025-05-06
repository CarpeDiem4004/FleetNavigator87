import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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
import { getDashboardKPIs, getPainelPrincipal } from "./dashboardApi";
import { getExecutiveDashboard } from "./executiveDashboard";
import { getPostosResumo, getPostoDetalhes, registrarEntradaCombustivel, excluirPostoSaoPaulo } from "./postosApi";
import { 
  getFuelCardSolicitations, 
  getFuelCardSolicitation, 
  createFuelCardSolicitation, 
  updateFuelCardSolicitation, 
  deleteFuelCardSolicitation 
} from "./fuelCardSolicitationsApi";
import { runSupabaseDiagnostic } from "./supabaseDiagnostic";
import { registerPneusRoutes } from "./pneusApi";
import { registerTireMoveRoutes } from "./tireMoveApi";
import { compareSchemas } from "./compareSchemas";
import { synchronizeSupabaseTables } from "./supabaseSchemaSync";
// Removida importação redundante, pois está sendo importada via supabaseInsertRoute
import precosCombustivelRoutes from "./routes/precosCombustivelRoutes";
import { registerPostosMapeamentoRoutes } from "./routes/postosMapeamentoRoutes";
import { registerUsuariosSupabaseRoutes } from "./routes/usuariosSupabaseRoutes";
import { supabaseInsertHandler } from "./routes/supabaseInsertRoute";
import postoSupabaseRoutes from "./routes/postoSupabaseRoutes";
import frotaEstoqueRoutes from "./routes/frotaEstoqueRoutes";
import usuariosRoutes from "./routes/usuariosRoutes";
import { db, pool } from "./db";
import authHybridRoutes from "./routes/authHybridRoutes";
import * as userHandler from "./handlers/userHandler";
import { atualizarTabelaPneus } from "./updatePneus";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { setupTireActivityRoutes, setupTireActivityTable } from "./tireActivityApi";
import { consultarUsuarios, consultarUsuarioPorId } from "./handlers/userHandler";
// Importação das rotas de teste de autenticação híbrida
import authTestRoutes from './routes/authTest';
// Importação da rota de ressincronização de sessão
import { resyncSession } from './routes/sessionResyncRoute';
// Importação dos middlewares antigos para compatibilidade com código existente
import { 
  isAuthenticated as authMiddleware, 
  isAdmin as adminMiddleware, 
  hasMaintenanceAccess as maintenanceAccessMiddleware, 
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

// Função para criar tabela de abastecimentos_postos_supabase
async function criarTabelaAbastecimentosPostosSupabase() {
  try {
    console.log("Verificando se a tabela abastecimentos_postos_supabase existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'abastecimentos_postos_supabase'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela abastecimentos_postos_supabase já existe, pulando criação.");
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
    
    console.log("Criando tabela abastecimentos_postos_supabase...");
    
    // Criar tabela sem a restrição de chave estrangeira para evitar problemas
    const createTableQuery = `
      CREATE TABLE abastecimentos_postos_supabase (
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
        ALTER TABLE abastecimentos_postos_supabase
        ADD CONSTRAINT fk_abastecimento
        FOREIGN KEY (abastecimento_id) REFERENCES abastecimentos(id);
      `;
      
      await pool.query(addForeignKeyQuery);
      console.log("Restrição de chave estrangeira adicionada com sucesso!");
    } catch (fkError) {
      console.warn("Aviso: Não foi possível adicionar a restrição de chave estrangeira:", fkError);
      console.log("A tabela foi criada sem a restrição de chave estrangeira.");
    }
    
    console.log("Tabela abastecimentos_postos_supabase criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela abastecimentos_postos_supabase:", error);
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

// Importar funções de recebimentos de combustível
import { getRecebimentosCombustivel, registrarRecebimentoCombustivel } from './recebimentosApi';

export async function registerRoutes(app: Express): Promise<Server> {
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
  await criarTabelaAbastecimentosPostosSupabase();
  await criarTabelaSolicitacoesFuelCard();
  await criarTabelaPostoRemediosAbastecimentos();
  await criarTabelaMovimentacaoPneu();
  await atualizarTabelaPneus();
  await setupTireActivityTable();
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
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
  
  // Rota para recuperar todas as movimentações de pátio
  app.get('/api/movimentacoes-patio', async (req, res) => {
    try {
      console.log('Buscando todas as movimentações de pátio');
      
      // Consulta SQL para buscar registros
      const query = `
        SELECT * FROM movimentacoes_patio 
        ORDER BY created_at DESC
        LIMIT 500
      `;
      
      const result = await pool.query(query);
      
      console.log(`Total de movimentações encontradas: ${result.rowCount || 0}`);
      
      return res.status(200).json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao buscar todas as movimentações de pátio:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar todas as movimentações de pátio',
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10)
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
      
      // Verifica se o usuário tem permissão (apenas admin ou gestor)
      if (user.role !== 'admin' && user.role !== 'gestor') {
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
      
      // Verifica se o usuário tem permissão para aprovar (admin ou gestor)
      if (user.role !== 'admin' && user.role !== 'gestor') {
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
      
      // Verifica se o usuário tem permissão para rejeitar (admin ou gestor)
      if (user.role !== 'admin' && user.role !== 'gestor') {
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
  
  // Estatísticas de manutenções solicitadas por motoristas do Line Hall
  app.get('/api/line-hall/maintenance-stats', isAuthenticated, async (req, res) => {
    try {
      // Consultar estatísticas de manutenções
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
          COUNT(*) FILTER (WHERE status = 'em_andamento') as "emAndamento",
          COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
          COUNT(*) as total
        FROM maintenance
        WHERE source = 'line_hall' OR requested_by_driver = true
      `;
      
      const result = await pool.query(query);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(200).json({
          success: true,
          pendentes: 0,
          emAndamento: 0,
          concluidas: 0,
          total: 0
        });
      }
      
      return res.status(200).json({
        success: true,
        ...result.rows[0]
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de manutenções:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas de manutenções',
        error: error.message
      });
    }
  });

  // API para solicitação de recarga de cartão de combustível por motorista do Line Hall
  app.post('/api/fuel-card/request', async (req, res) => {
    try {
      const { 
        plate, 
        card_number, 
        amount, 
        reason, 
        requested_by, 
        receipt_url,
        driver_id,
        source
      } = req.body;
      
      // Validação básica
      if (!plate || !card_number || !amount || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos para solicitação. Informe placa, número do cartão, valor e motivo.'
        });
      }
      
      const query = `
        INSERT INTO fuel_card_requests
          (plate, card_number, amount, reason, requested_by, receipt_url, driver_id, source, status, requested_at, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente', NOW(), NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        plate.toUpperCase(),
        card_number,
        parseFloat(amount),
        reason,
        requested_by || 'Motorista Line Hall',
        receipt_url,
        driver_id,
        source || 'line_hall'
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
        rentalCompany: req.body.rentalCompany || null // Empresa de locação, nullable
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
      
      // Check if filtering by base and status
      const baseId = req.query.baseId ? parseInt(req.query.baseId as string) : null;
      const status = req.query.status as string | null;
      
      // Para usuários não-admin, forçar filtragem pela base do próprio usuário
      if (req.user.role !== 'admin' && req.user.baseId) {
        console.log(`Usuário não-admin id=${req.user.id}. Forçando filtro por baseId=${req.user.baseId}`);
        
        // Se pediu filtragem por base, verificar se coincide com a do usuário
        if (baseId && baseId !== req.user.baseId) {
          return res.status(403).json({ 
            message: "Acesso negado. Você só pode ver manutenções da sua própria base." 
          });
        }
        
        // Buscar manutenções com filtro por status (se existir) e pela base do usuário
        let maintenanceRecords;
        if (status) {
          maintenanceRecords = await storage.getMaintenanceByBaseAndStatus(req.user.baseId, status);
        } else {
          // Buscar todas e filtrar manualmente para a base do usuário
          const allRecords = await storage.getAllMaintenance();
          maintenanceRecords = allRecords.filter(m => m.requestBaseId === req.user!.baseId);
        }
        
        return res.status(200).json(maintenanceRecords);
      }
      
      // Administradores podem filtrar como quiserem
      if (req.user.role === 'admin') {
        // Se baseId e status fornecidos, filtrar por ambos
        if (baseId && status) {
          const maintenance = await storage.getMaintenanceByBaseAndStatus(baseId, status);
          return res.status(200).json(maintenance);
        } 
        // Se só baseId fornecido
        else if (baseId) {
          const allRecords = await storage.getAllMaintenance();
          const filtered = allRecords.filter(m => m.requestBaseId === baseId);
          return res.status(200).json(filtered);
        }
        // Se só status fornecido
        else if (status) {
          const allRecords = await storage.getAllMaintenance();
          const filtered = allRecords.filter(m => m.status === status);
          return res.status(200).json(filtered);
        }
        // Sem filtros, retornar todos
        else {
          const maintenance = await storage.getAllMaintenance();
          return res.status(200).json(maintenance);
        }
      }
      
      // Se chegou até aqui, é um usuário sem baseId definida - retornar lista vazia
      console.log(`Usuário ${req.user.id} sem baseId definida - retornando lista vazia`);
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching maintenance:", error);
      return res.status(500).json({ message: "Server error" });
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
  
  app.get("/api/maintenance/:id", hasMaintenanceAccess, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const maintenanceRecord = await storage.getMaintenance(maintenanceId);
      
      if (!maintenanceRecord) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      return res.status(200).json(maintenanceRecord);
    } catch (error) {
      console.error("Error fetching maintenance record:", error);
      return res.status(500).json({ message: "Server error" });
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
      const vehicle = await storage.getVehicleByPlate(result.data.vehiclePlate);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
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
      
      // Create maintenance record
      const newMaintenance = await storage.createMaintenance(result.data);
      return res.status(201).json(newMaintenance);
    } catch (error) {
      console.error("Error creating maintenance:", error);
      return res.status(500).json({ message: "Server error" });
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

  // Dashboard API
  app.get("/api/dashboard/kpis", isAuthenticated, getDashboardKPIs);

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

  // Endpoint para obter dados do painel principal
  // Temporariamente sem autenticação para testes
  app.get("/api/painel-principal", getPainelPrincipal);
  
  // Endpoint legado para KPIs do dashboard - manter por compatibilidade
  app.get("/api/dashboard/kpis", isAuthenticated, getDashboardKPIs);
  
  // Novo endpoint para o dashboard executivo
  app.get("/api/dashboard", isAuthenticated, getExecutiveDashboard);
  
  // Rotas para solicitações de cartão de combustível
  app.get('/api/fuel-card-solicitations', isAuthenticated, getFuelCardSolicitations);
  app.get('/api/fuel-card-solicitations/:id', isAuthenticated, getFuelCardSolicitation);
  app.post('/api/fuel-card-solicitations', isAuthenticated, createFuelCardSolicitation);
  app.patch('/api/fuel-card-solicitations/:id', isAuthenticated, updateFuelCardSolicitation);
  app.delete('/api/fuel-card-solicitations/:id', isAuthenticated, deleteFuelCardSolicitation);
  
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
        tipo_veiculo || 'frota' // Usar 'frota' como valor padrão se não for especificado
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
            requestBaseId: vehicle.base_id || 1, // Usar a base do veículo ou uma padrão
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
  
  // Rotas para recebimentos de combustível
  app.get("/api/recebimentos/:posto", isAuthenticated, getRecebimentosCombustivel);
  app.post("/api/recebimentos/:posto", isAuthenticated, registrarRecebimentoCombustivel);
  
  // Registrar rotas para preços de combustível
  app.use("/api/precos-combustivel", precosCombustivelRoutes);
  
  // Rotas para postos de abastecimento - acessíveis para usuários autenticados
  // Não é necessário middleware adicional pois a verificação de admin já está implementada no hook useBasePermission
  app.get("/api/postos", isAuthenticated, getPostosResumo);
  app.get("/api/postos/:id", isAuthenticated, getPostoDetalhes);
  app.post("/api/postos/:id/entrada-combustivel", isAuthenticated, registrarEntradaCombustivel);
  app.post("/api/postos/excluir-saopaulo", isAuthenticated, excluirPostoSaoPaulo);
  
  // Endpoint para buscar abastecimentos por posto usando o modelo de duas tabelas
  // Endpoint para buscar todos os abastecimentos (histórico geral)
  app.get('/api/abastecimentos/todos', async (req, res) => {
    try {
      console.log(`Buscando todos os abastecimentos para histórico geral`);
      
      // Definir cabeçalhos para evitar cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Consulta para obter os últimos 1000 abastecimentos de todos os postos
      const query = `
        SELECT * FROM abastecimentos_postos
        ORDER BY created_at DESC
        LIMIT 1000
      `;
      
      console.log(`[Histórico Geral] Executando consulta SQL para obter todos os abastecimentos`);
      
      // Executar a consulta
      const result = await pool.query(query);
      
      // Informações adicionais para debug
      console.log(`[Histórico Geral] Total de abastecimentos encontrados: ${result.rows.length}`);
      
      // Verificar se a tabela possui registros recentes (últimas 24 horas)
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentRecords = result.rows.filter(row => {
        const createdAt = new Date(row.created_at);
        return createdAt > oneDayAgo;
      });
      
      console.log(`[Histórico Geral] Registros nas últimas 24 horas: ${recentRecords.length}`);
      
      return res.json({
        success: true,
        data: result.rows,
        count: result.rowCount,
        recentCount: recentRecords.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Histórico Geral] Erro ao consultar abastecimentos de todos os postos:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Erro ao consultar histórico de abastecimentos: ${error.message}` 
      });
    }
  });
  
  app.get('/api/abastecimentos/:posto', async (req, res) => {
    try {
      const { posto } = req.params;
      const timestamp = req.query.t; // Capturar o timestamp da requisição
      console.log(`Buscando abastecimentos para o posto: ${posto}, timestamp: ${timestamp}`);
      
      // Definir cabeçalhos para evitar cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Consulta diretamente na tabela abastecimentos_postos que tem todos os campos necessários
      // Sem limite de registros para mostrar todo o histórico
      // Melhorar a correspondência com flexibilidade de capitalização
      const query = `
        SELECT * FROM abastecimentos_postos
        WHERE 
          posto ILIKE $1 OR 
          LOWER(posto) = LOWER($1) OR
          REPLACE(LOWER(posto), ' ', '') = REPLACE(LOWER($1), ' ', '')
        ORDER BY created_at DESC
      `;
      
      console.log(`Executando consulta SQL: ${query.replace(/\s+/g, ' ')} com parâmetro: ${posto}`);
      
      // Executar a consulta
      const result = await pool.query(query, [posto]);
      
      // Informações adicionais para debug
      console.log(`Abastecimentos encontrados: ${result.rows.length}`);
      if (result.rows.length > 0) {
        const ultimoRegistro = result.rows[0];
        console.log(`Último abastecimento: ID=${ultimoRegistro.id}, Placa=${ultimoRegistro.placa}, Data=${ultimoRegistro.created_at}`);
      }
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows,
        requestTimestamp: timestamp
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

  // Rota para registrar abastecimento usando o modelo de duas tabelas do Supabase
  // Não exige autenticação para facilitar o registro de abastecimentos em postos externos
  app.post('/api/abastecimentos', async (req, res) => {
    try {
      console.log('Recebendo requisição para abastecimento (modelo Supabase):', JSON.stringify(req.body));
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      
      // Adicionar um log para verificar o objeto req e detectar inconsistências
      console.log('Método da requisição:', req.method);
      console.log('URL da requisição:', req.url);
      console.log('Query params:', req.query);
      console.log('Tipo de combustível:', req.body.tipo_combustivel);
      
      // Extrair os dados necessários
      // Mapeamento para permitir flexibilidade nos nomes dos campos
      const quantidade_litros = req.body.quantidade_litros || req.body.quantidade || req.body.litros;
      const placa = req.body.placa;
      const km_atual = req.body.km_atual || req.body.km;
      const posto_id = req.body.posto_id || req.body.posto;
      const preco_litro = req.body.preco_litro || req.body.valor_litro;
      const valor_total = req.body.valor_total;
      const tipo_combustivel = req.body.tipo_combustivel || req.body.tipo;
      const nome_motorista = req.body.nome_motorista || req.body.motorista;
      const nome_operador = req.body.nome_operador || req.body.operador;
      const rg_motorista = req.body.rg_motorista || req.body.motorista_rg;
      const project = req.body.project || req.body.projeto;
      
      console.log('Dados mapeados:',
        {quantidade_litros, placa, km_atual, posto_id, tipo_combustivel, nome_motorista, rg_motorista});
      
      // Validar os campos obrigatórios
      if (!quantidade_litros || !placa || !posto_id) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos para registro de abastecimento (modelo Supabase)'
        });
      }
      
      // Garantir que posto_id seja tratado como string
      const postoIdFormatado = typeof posto_id === 'string' 
        ? posto_id.charAt(0).toUpperCase() + posto_id.slice(1).toLowerCase()
        : String(posto_id);
      
      console.log(`Posto formatado para registro: ${postoIdFormatado}`);
      
      // 1. Criar registro na tabela abastecimentos
      const insertAbastecimentoQuery = `
        INSERT INTO abastecimentos (
          data, 
          valor
        ) VALUES (
          NOW(), 
          $1
        ) RETURNING id, data, valor
      `;
      
      const calculatedValor = valor_total || (quantidade_litros * (preco_litro || 0));
      
      const abastecimentoResult = await pool.query(insertAbastecimentoQuery, [
        calculatedValor
      ]);
      
      if (!abastecimentoResult.rows || !abastecimentoResult.rows.length) {
        throw new Error('Falha ao criar registro de abastecimento');
      }
      
      const abastecimentoId = abastecimentoResult.rows[0].id;
      
      // 2. Criar registro na tabela abastecimentos_postos_supabase
      const insertAbastecimentoPostoQuery = `
        INSERT INTO abastecimentos_postos_supabase (
          abastecimento_id,
          posto_id,
          quantidade_litros
        ) VALUES (
          $1, 
          $2, 
          $3
        ) RETURNING id
      `;
      
      const abastecimentoPostoResult = await pool.query(insertAbastecimentoPostoQuery, [
        abastecimentoId,
        postoIdFormatado, // Usar posto formatado
        quantidade_litros
      ]);
      
      // 3. Também inserir no formato antigo para manter a compatibilidade
      try {
        const insertLegacyQuery = `
          INSERT INTO abastecimentos_postos (
            placa, 
            km_atual, 
            tipo_combustivel, 
            litros, 
            quantity_litros,
            nome_motorista, 
            nome_operador, 
            posto, 
            project,
            preco_litro,
            valor_total,
            created_at,
            rg_motorista
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12
          )
        `;
        
        await pool.query(insertLegacyQuery, [
          placa.toUpperCase(),
          km_atual || 0,
          tipo_combustivel || 'Diesel',
          quantidade_litros,
          quantidade_litros,
          nome_motorista || 'Não informado',
          nome_operador || 'Não informado',
          postoIdFormatado, // Usar posto formatado
          project || 'Não informado',
          preco_litro || 0,
          calculatedValor || 0,
          rg_motorista || 'Não informado'
        ]);
      } catch (legacyError) {
        console.warn('Aviso: Falha ao inserir registro no formato legado:', legacyError);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          abastecimento: abastecimentoResult.rows[0],
          abastecimento_posto_id: abastecimentoPostoResult.rows[0].id,
          placa,
          posto_id,
          quantidade_litros
        },
        message: 'Abastecimento registrado com sucesso (modelo Supabase)'
      });
    } catch (error) {
      console.error('Erro ao registrar abastecimento (modelo Supabase):', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar abastecimento (modelo Supabase)',
        error: String(error)
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
  
  // Rota para inserir dados no Supabase usando a chave de serviço do servidor
  app.post("/api/supabase-insert", supabaseInsertHandler);

  // Rota para ressincronização de sessão (resolver problema de 401 após reinicialização do servidor)
  app.post("/api/resync-session", resyncSession);

  // Registrar rotas de autenticação híbrida
  app.use('/api/auth', authHybridRoutes);
  
  // Registrar rotas para gerenciamento de usuários
  app.use('/api', (req, res, next) => {
    // Log para debug
    console.log(`[routes.ts] Requisição para ${req.path}, método ${req.method}`);
    next();
  }, usuariosRoutes);
  
  // Registrar rotas para gerenciar preços de combustível
  app.use("/api/precos-combustivel", precosCombustivelRoutes);
  
  // Registra as rotas para o mapeamento de postos
  registerPostosMapeamentoRoutes(app);
  
  // Registra as rotas para gerenciar usuários no Supabase
  registerUsuariosSupabaseRoutes(app);
  
  // Registra as rotas para o sistema de estoque de peças
  app.use('/api/frota', frotaEstoqueRoutes);
  
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

  // Rota pública para diagnóstico da conexão com o banco (sem autenticação)
  app.get("/api/debug/users-connection", async (req, res) => {
    try {
      console.log('[routes.ts] Testando conexão com o banco de dados (rota pública)');
      
      // Teste de conexão básico
      const testResult = await pool.query('SELECT NOW() as current_time');
      
      // Testar consulta simples para contar usuários
      const countResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
      
      return res.status(200).json({
        success: true,
        connection: "OK",
        timestamp: testResult.rows[0].current_time,
        user_count: parseInt(countResult.rows[0].user_count),
        database_info: {
          pool_total_count: pool.totalCount,
          pool_idle_count: pool.idleCount,
          pool_waiting_count: pool.waitingCount
        }
      });
    } catch (error: any) {
      console.error('[routes.ts] Erro no diagnóstico de conexão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro na conexão com o banco: ' + error.message
      });
    }
  });

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

  const httpServer = createServer(app);
  
  // Verificar e criar tabela de preços de combustível diretamente
  try {
    // Acessar a função diretamente sem fazer requisição HTTP
    const verificarTabela = async () => {
      try {
        // Verificar se a tabela preco_combustivel existe
        const checkTableQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'preco_combustivel'
          );
        `;
        const tableExists = await pool.query(checkTableQuery);
        
        if (!tableExists.rows[0].exists) {
          // Se a tabela não existir, vamos criá-la
          const createTableQuery = `
            CREATE TABLE preco_combustivel (
              id SERIAL PRIMARY KEY,
              tipo VARCHAR(50) NOT NULL,
              preco NUMERIC NOT NULL,
              ativo BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Inserir valores padrão
            INSERT INTO preco_combustivel (tipo, preco) VALUES 
            ('Diesel', 5.99),
            ('Gasolina', 6.29),
            ('Etanol', 4.89),
            ('Arla 32', 7.50);
          `;
          await pool.query(createTableQuery);
          
          console.log('Tabela preco_combustivel criada com sucesso!');
        } else {
          console.log('Tabela preco_combustivel já existe.');
        }
      } catch (error) {
        console.error('Erro ao verificar ou criar tabela preco_combustivel:', error);
      }
    };
    
    // Executar a verificação
    verificarTabela();
  } catch (error) {
    console.error('Erro ao iniciar verificação da tabela de preços:', error);
  }
  
  return httpServer;
}