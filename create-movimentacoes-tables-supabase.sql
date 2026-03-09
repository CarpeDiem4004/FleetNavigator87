-- PARTE 2: CRIAR TABELAS DE MOVIMENTAÇÕES DE PÁTIO
-- Script para criar tabelas de movimentações para todos os postos

-- Movimentações para Osasco_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_osasco_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimentações para Socorro_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_socorro_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimentações para Sorocaba_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_sorocaba_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimentações para ABC_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_abc_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimentações para Alair_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_alair_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimentações para Guarulhos_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_guarulhos_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);