-- Script completo para criar todas as tabelas do sistema de solicitações de pneus no Supabase
-- Este script é otimizado para o Supabase SQL Editor

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

-- 5. Criar um script JavaScript para ser usado com a API do Supabase
COMMENT ON TABLE solicitacoes_pneus IS 'Tabela principal de solicitações de pneus do sistema';
COMMENT ON TABLE campinas_tire_requests IS 'Solicitações de pneus específicas da base Campinas';
COMMENT ON TABLE socorro_tire_requests IS 'Solicitações de pneus específicas da base Socorro';
COMMENT ON TABLE osasco_tire_requests IS 'Solicitações de pneus específicas da base Osasco';
COMMENT ON TABLE abc_tire_requests IS 'Solicitações de pneus específicas da base ABC';

-- 6. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_base_id ON solicitacoes_pneus(base_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_status ON solicitacoes_pneus(status);
CREATE INDEX IF NOT EXISTS idx_campinas_tire_requests_status ON campinas_tire_requests(status);
CREATE INDEX IF NOT EXISTS idx_socorro_tire_requests_status ON socorro_tire_requests(status);
CREATE INDEX IF NOT EXISTS idx_osasco_tire_requests_status ON osasco_tire_requests(status);
CREATE INDEX IF NOT EXISTS idx_abc_tire_requests_status ON abc_tire_requests(status);