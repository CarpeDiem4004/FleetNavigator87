-- Script SQL para criar tabelas de recebimentos para todos os postos
-- Execute este script diretamente no console SQL do Supabase ou DB

-- Tabela de recebimentos para posto Osasco V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
  id SERIAL PRIMARY KEY,
  tipo_produto VARCHAR(50) NOT NULL,
  litros_recebidos NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  nome_fornecedor VARCHAR(100) NOT NULL,
  nome_operador VARCHAR(100) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recebimentos para posto Alair V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_alair_v2 (
  id SERIAL PRIMARY KEY,
  tipo_produto VARCHAR(50) NOT NULL,
  litros_recebidos NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  nome_fornecedor VARCHAR(100) NOT NULL,
  nome_operador VARCHAR(100) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recebimentos para posto Campinas V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_campinas_v2 (
  id SERIAL PRIMARY KEY,
  tipo_produto VARCHAR(50) NOT NULL,
  litros_recebidos NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  nome_fornecedor VARCHAR(100) NOT NULL,
  nome_operador VARCHAR(100) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recebimentos para posto ABC V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_abc_v2 (
  id SERIAL PRIMARY KEY,
  tipo_produto VARCHAR(50) NOT NULL,
  litros_recebidos NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  nome_fornecedor VARCHAR(100) NOT NULL,
  nome_operador VARCHAR(100) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recebimentos para posto Socorro V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_socorro_v2 (
  id SERIAL PRIMARY KEY,
  tipo_produto VARCHAR(50) NOT NULL,
  litros_recebidos NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  nome_fornecedor VARCHAR(100) NOT NULL,
  nome_operador VARCHAR(100) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recebimentos para posto Sorocaba V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_sorocaba_v2 (
  id SERIAL PRIMARY KEY,
  tipo_produto VARCHAR(50) NOT NULL,
  litros_recebidos NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  nome_fornecedor VARCHAR(100) NOT NULL,
  nome_operador VARCHAR(100) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de exemplo para teste no Posto Osasco V2
INSERT INTO recebimentos_posto_osasco_v2 (
  tipo_produto, 
  litros_recebidos, 
  valor_total, 
  nome_fornecedor, 
  nome_operador, 
  observacoes
) VALUES 
('Diesel', 5000, 25000, 'Petrobras', 'Carlos Silva', 'Recebimento normal'),
('ARLA', 1000, 3000, 'Shell', 'Ana Santos', 'Recebimento programado');

-- Inserir dados de exemplo para teste no Posto Alair V2
INSERT INTO recebimentos_posto_alair_v2 (
  tipo_produto, 
  litros_recebidos, 
  valor_total, 
  nome_fornecedor, 
  nome_operador, 
  observacoes
) VALUES 
('Diesel', 4500, 22500, 'Shell', 'João Oliveira', 'Entrega semanal'),
('ARLA', 800, 2400, 'Ipiranga', 'Maria Silva', 'Recebimento urgente');