-- Script SQL para criar as tabelas necessárias para o posto Osasco V2 no Supabase

-- Criar tabela abastecimentos_posto_osasco_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_osasco_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10),
  km_atual INTEGER,
  tipo_combustivel VARCHAR(20),
  litros NUMERIC(10, 2),
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT FALSE,
  tipo_lavagem VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar views úteis para o posto Osasco_v2
CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_ultimos AS
  SELECT * FROM abastecimentos_posto_osasco_v2
  ORDER BY created_at DESC LIMIT 10;

CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_estatisticas_mensais AS
  SELECT 
    date_part('year', created_at) AS ano,
    date_part('month', created_at) AS mes,
    count(*) as total_abastecimentos,
    sum(litros) as total_litros,
    sum(valor_total) as total_valor,
    avg(valor_litro) as media_valor_litro
  FROM abastecimentos_posto_osasco_v2
  GROUP BY ano, mes
  ORDER BY ano DESC, mes DESC;

CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_consumo_por_veiculo AS
  SELECT 
    placa,
    count(*) as total_abastecimentos,
    sum(litros) as total_litros,
    sum(valor_total) as total_valor,
    max(created_at) as ultimo_abastecimento
  FROM abastecimentos_posto_osasco_v2
  GROUP BY placa
  ORDER BY total_litros DESC;

CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_comparativo_combustiveis AS
  SELECT 
    tipo_combustivel,
    count(*) as total_abastecimentos,
    sum(litros) as total_litros,
    sum(valor_total) as total_valor,
    avg(valor_litro) as media_valor_litro
  FROM abastecimentos_posto_osasco_v2
  GROUP BY tipo_combustivel
  ORDER BY total_litros DESC;

-- Verifica e cria outras views de consolidação
CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_consolidado AS
  SELECT 
    id,
    placa,
    km_atual as km,
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
    to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
  FROM abastecimentos_posto_osasco_v2
  ORDER BY created_at DESC;

CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_ultimos_abastecimentos AS
  SELECT * FROM abastecimentos_posto_osasco_v2
  ORDER BY created_at DESC LIMIT 20;

-- Verificar se a tabela configuracao_tanques existe e criar se necessário
CREATE TABLE IF NOT EXISTS configuracao_tanques (
  id SERIAL PRIMARY KEY,
  posto TEXT NOT NULL,
  diesel_capacidade NUMERIC NOT NULL,
  diesel_nivel NUMERIC NOT NULL,
  arla_capacidade NUMERIC NOT NULL,
  arla_nivel NUMERIC NOT NULL,
  diesel_valor_litro NUMERIC,
  arla_valor_litro NUMERIC,
  diesel_consumo_total NUMERIC,
  diesel_valor_total NUMERIC,
  arla_consumo_total NUMERIC,
  arla_valor_total NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar se a tabela movimentacoes_patio existe e criar se necessário
CREATE TABLE IF NOT EXISTS movimentacoes_patio (
  id SERIAL PRIMARY KEY,
  placa TEXT NOT NULL,
  tipo_veiculo TEXT,
  motorista TEXT NOT NULL,
  data_entrada TIMESTAMP NOT NULL,
  data_saida TIMESTAMP,
  motivo TEXT,
  observacoes TEXT,
  posto TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nome_motorista TEXT,
  nome_operador TEXT,
  tipo_movimento TEXT
);

-- Verificar se a tabela de configuracao_tanques já tem o posto Osasco_V2
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'configuracao_tanques'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM configuracao_tanques
      WHERE posto = 'Osasco_v2'
    ) THEN
      INSERT INTO configuracao_tanques (
        posto, 
        diesel_capacidade, 
        diesel_nivel, 
        arla_capacidade, 
        arla_nivel, 
        diesel_valor_litro, 
        arla_valor_litro,
        diesel_consumo_total,
        diesel_valor_total,
        arla_consumo_total,
        arla_valor_total
      ) VALUES (
        'Osasco_v2', 
        '20000', 
        '14032', 
        '1000', 
        '750', 
        '5.00', 
        '3.00',
        '843.00',
        '4215.00',
        '0.00',
        '0.00'
      );
    END IF;
  END IF;
END $$;