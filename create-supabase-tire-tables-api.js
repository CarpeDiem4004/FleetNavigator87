/**
 * Script para criar as tabelas de solicitações de pneus no Supabase
 * Este script usa a API direta do Supabase para executar o SQL
 * 
 * Para executar: 
 * 1. Ajuste as variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY com seus valores
 * 2. Execute com Node.js: node create-supabase-tire-tables-api.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase - substitua pelos seus valores
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY devem estar definidas');
  process.exit(1);
}

// Inicializar cliente Supabase usando a service_role key para acesso administrativo
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// SQL para criar as tabelas
const createTableSQL = `
-- 1. Criação da tabela principal de solicitações de pneus (caso ainda não exista)
CREATE TABLE IF NOT EXISTS solicitacoes_pneus (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- 2. Criação da tabela específica para a base Campinas
CREATE TABLE IF NOT EXISTS campinas_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- 3. Criação da tabela específica para outras bases
-- Base Socorro
CREATE TABLE IF NOT EXISTS socorro_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- Base Osasco
CREATE TABLE IF NOT EXISTS osasco_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- Base ABC
CREATE TABLE IF NOT EXISTS abc_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);
`;

// SQL para configurar permissões RLS
const configureRlsSQL = `
-- 4. Configurar permissões RLS (Row Level Security) para o Supabase
-- Habilitar RLS para todas as tabelas
ALTER TABLE solicitacoes_pneus ENABLE ROW LEVEL SECURITY;
ALTER TABLE campinas_tire_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE socorro_tire_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE osasco_tire_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE abc_tire_requests ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso autenticado às tabelas
CREATE POLICY "Acesso completo para usuários autenticados" 
ON solicitacoes_pneus 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo para usuários autenticados" 
ON campinas_tire_requests 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo para usuários autenticados" 
ON socorro_tire_requests 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo para usuários autenticados" 
ON osasco_tire_requests 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo para usuários autenticados" 
ON abc_tire_requests 
FOR ALL USING (auth.role() = 'authenticated');
`;

// SQL para criar índices
const createIndexesSQL = `
-- 6. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_base_id ON solicitacoes_pneus(base_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_status ON solicitacoes_pneus(status);
CREATE INDEX IF NOT EXISTS idx_campinas_tire_requests_status ON campinas_tire_requests(status);
CREATE INDEX IF NOT EXISTS idx_socorro_tire_requests_status ON socorro_tire_requests(status);
CREATE INDEX IF NOT EXISTS idx_osasco_tire_requests_status ON osasco_tire_requests(status);
CREATE INDEX IF NOT EXISTS idx_abc_tire_requests_status ON abc_tire_requests(status);
`;

// Função para verificar se as tabelas existem
async function checkTablesExist() {
  try {
    console.log('Verificando se as tabelas existem...');
    
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'solicitacoes_pneus', 
        'campinas_tire_requests', 
        'socorro_tire_requests',
        'osasco_tire_requests',
        'abc_tire_requests'
      ]);
    
    if (error) {
      throw error;
    }
    
    console.log('Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    return tables.map(t => t.table_name);
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
    return [];
  }
}

// Função para executar SQL
async function executeSql(sql, description) {
  try {
    console.log(`Executando: ${description}...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    console.log(`✓ ${description} concluído com sucesso`);
  } catch (error) {
    console.error(`Erro ao executar ${description}:`, error);
  }
}

// Função principal
async function main() {
  try {
    console.log('Iniciando criação das tabelas de solicitações de pneus no Supabase...');
    
    // Verificar tabelas existentes
    const existingTables = await checkTablesExist();
    
    // Criar tabelas
    await executeSql(createTableSQL, 'Criação das tabelas');
    
    // Configurar RLS
    await executeSql(configureRlsSQL, 'Configuração do RLS');
    
    // Criar índices
    await executeSql(createIndexesSQL, 'Criação de índices');
    
    console.log('Processo concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo:', error);
  }
}

// Executar script
main();