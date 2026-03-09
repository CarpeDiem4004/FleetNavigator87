-- PARTE 3: CRIAR TABELAS DE ABASTECIMENTOS QUE AINDA NÃO EXISTEM
-- Script para criar tabelas de abastecimentos para postos ABC_v2, Alair_v2 e Guarulhos_v2

-- Abastecimentos para ABC_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_abc_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2),
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT false,
  tipo_lavagem VARCHAR(50),
  data_registro TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Abastecimentos para Alair_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_alair_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2),
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT false,
  tipo_lavagem VARCHAR(50),
  data_registro TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Abastecimentos para Guarulhos_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_guarulhos_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2),
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT false,
  tipo_lavagem VARCHAR(50),
  data_registro TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);