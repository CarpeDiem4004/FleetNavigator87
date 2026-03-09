-- Script para criar todas as tabelas necessárias para o sistema de postos no Supabase
-- Este script cria as seguintes tabelas:
-- 1. configuracao_tanques
-- 2. abastecimentos_posto_campinas_v2
-- 3. recebimentos_posto_campinas_v2
-- 4. movimentacoes_patio_campinas_v2
-- 5. historico_consolidado_postos (view)

-- 1. Tabela de configuração de tanques
CREATE TABLE IF NOT EXISTS configuracao_tanques (
  id SERIAL PRIMARY KEY,
  posto TEXT NOT NULL,
  diesel_capacidade NUMERIC(10, 2) DEFAULT 0,
  diesel_nivel NUMERIC(10, 2) DEFAULT 0,
  arla_capacidade NUMERIC(10, 2) DEFAULT 0,
  arla_nivel NUMERIC(10, 2) DEFAULT 0,
  diesel_valor_litro NUMERIC(10, 3) DEFAULT 0,
  arla_valor_litro NUMERIC(10, 3) DEFAULT 0,
  diesel_consumo_total NUMERIC(10, 2) DEFAULT 0,
  diesel_valor_total NUMERIC(10, 2) DEFAULT 0,
  arla_consumo_total NUMERIC(10, 2) DEFAULT 0,
  arla_valor_total NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela de abastecimentos para o posto Campinas V2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_campinas_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2),
  quantidade_litros NUMERIC(10, 2),
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

-- 3. Tabela de recebimentos para o posto Campinas V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_campinas_v2 (
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

-- 4. Tabela de movimentações de pátio para o posto Campinas V2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_campinas_v2 (
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

-- 5. View de histórico consolidado para todos os postos
CREATE OR REPLACE VIEW historico_consolidado_postos AS
  -- Abastecimentos do posto Campinas_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'campinas_v2' AS posto
  FROM abastecimentos_posto_campinas_v2;

-- Inserir dados iniciais para configuração do posto Campinas_v2 se não existirem
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Campinas_v2', 
  20000, 
  14819.5, 
  1000, 
  739, 
  5.00, 
  3.00
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Campinas_v2'
  );