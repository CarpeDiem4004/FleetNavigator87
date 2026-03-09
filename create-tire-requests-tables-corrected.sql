-- Script completo para criar todas as tabelas do sistema de solicitações de pneus
-- Este script cria a tabela principal e as tabelas específicas para cada base

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

-- 3. Criação da tabela específica para outras bases (caso necessário)
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

-- 4. Adicionar colunas que possam estar faltando
-- Adicionar as colunas à tabela campinas_tire_requests
ALTER TABLE campinas_tire_requests ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(10);
ALTER TABLE campinas_tire_requests ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;
ALTER TABLE campinas_tire_requests ADD COLUMN IF NOT EXISTS data_previsao DATE;
ALTER TABLE campinas_tire_requests ADD COLUMN IF NOT EXISTS observacoes_aprovacao TEXT;

-- Adicionar as colunas à tabela socorro_tire_requests
ALTER TABLE socorro_tire_requests ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(10);
ALTER TABLE socorro_tire_requests ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;
ALTER TABLE socorro_tire_requests ADD COLUMN IF NOT EXISTS data_previsao DATE;
ALTER TABLE socorro_tire_requests ADD COLUMN IF NOT EXISTS observacoes_aprovacao TEXT;

-- Adicionar as colunas à tabela osasco_tire_requests
ALTER TABLE osasco_tire_requests ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(10);
ALTER TABLE osasco_tire_requests ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;
ALTER TABLE osasco_tire_requests ADD COLUMN IF NOT EXISTS data_previsao DATE;
ALTER TABLE osasco_tire_requests ADD COLUMN IF NOT EXISTS observacoes_aprovacao TEXT;

-- Adicionar as colunas à tabela abc_tire_requests
ALTER TABLE abc_tire_requests ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(10);
ALTER TABLE abc_tire_requests ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;
ALTER TABLE abc_tire_requests ADD COLUMN IF NOT EXISTS data_previsao DATE;
ALTER TABLE abc_tire_requests ADD COLUMN IF NOT EXISTS observacoes_aprovacao TEXT;

-- Adicionar as colunas à tabela solicitacoes_pneus
ALTER TABLE solicitacoes_pneus ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(10);
ALTER TABLE solicitacoes_pneus ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;
ALTER TABLE solicitacoes_pneus ADD COLUMN IF NOT EXISTS data_previsao DATE;
ALTER TABLE solicitacoes_pneus ADD COLUMN IF NOT EXISTS observacoes_aprovacao TEXT;