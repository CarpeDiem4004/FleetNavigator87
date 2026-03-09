-- PARTE 1: CRIAR TABELAS DE RECEBIMENTOS
-- Script para criar tabelas de recebimentos para todos os postos

-- Recebimentos para Osasco_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recebimentos para Socorro_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_socorro_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recebimentos para Sorocaba_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_sorocaba_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recebimentos para ABC_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_abc_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recebimentos para Alair_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_alair_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recebimentos para Guarulhos_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_guarulhos_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);