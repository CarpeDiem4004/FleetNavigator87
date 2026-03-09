-- Script para criar as tabelas e views necessárias para o posto Socorro_V2
-- Baseado na estrutura do posto Osasco_V2
-- Autor: Sistema Murici Fleet
-- Data: Maio, 2025

-- 1. Criação da tabela de configuração de tanques
CREATE TABLE IF NOT EXISTS configuracao_tanques_socorro_v2 (
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
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 2. Criação da view para status dos tanques
CREATE OR REPLACE VIEW view_socorro_v2_status_tanques AS
SELECT 
  id,
  posto,
  diesel_capacidade,
  diesel_nivel,
  diesel_nivel / diesel_capacidade * 100 AS diesel_percentual,
  arla_capacidade,
  arla_nivel,
  arla_nivel / arla_capacidade * 100 AS arla_percentual,
  diesel_valor_litro,
  arla_valor_litro,
  diesel_consumo_total,
  diesel_valor_total,
  arla_consumo_total,
  arla_valor_total,
  created_at,
  updated_at
FROM configuracao_tanques_socorro_v2;

-- 3. Verificar e criar tabela de configuração principal se não existir
-- Esta é a tabela geral usada para todos os postos
INSERT INTO configuracao_tanques (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel, diesel_valor_litro, arla_valor_litro, diesel_consumo_total, diesel_valor_total, arla_consumo_total, arla_valor_total)
SELECT 'Socorro_v2', '20000', '10000', '1000', '500', '6.39', '3.50', '0', '0', '0', '0'
WHERE NOT EXISTS (
  SELECT 1 FROM configuracao_tanques WHERE posto = 'Socorro_v2'
);

-- 4. Verificação da tabela de abastecimentos do posto Socorro_v2
-- Essa tabela já existe, então apenas verificamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'abastecimentos_posto_socorro_v2'
  ) THEN
    CREATE TABLE abastecimentos_posto_socorro_v2 (
      id SERIAL PRIMARY KEY,
      placa CHARACTER VARYING,
      km_atual INTEGER,
      tipo_combustivel CHARACTER VARYING,
      litros NUMERIC,
      motorista CHARACTER VARYING,
      motorista_rg CHARACTER VARYING,
      operador CHARACTER VARYING,
      valor_litro NUMERIC,
      valor_total NUMERIC,
      tipo_veiculo CHARACTER VARYING,
      observacoes TEXT,
      lavagem BOOLEAN,
      tipo_lavagem CHARACTER VARYING,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      hodometro_atual INTEGER
    );
  END IF;
END
$$;

-- 5. Verificação da tabela de movimentações do pátio do posto Socorro_v2
-- Essa tabela já existe, então apenas verificamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'movimentacoes_patio_socorro_v2'
  ) THEN
    CREATE TABLE movimentacoes_patio_socorro_v2 (
      id SERIAL PRIMARY KEY,
      placa CHARACTER VARYING NOT NULL,
      tipo_veiculo CHARACTER VARYING,
      tipo_movimentacao CHARACTER VARYING NOT NULL,
      data_hora TIMESTAMP NOT NULL,
      km NUMERIC,
      motorista CHARACTER VARYING,
      origem CHARACTER VARYING,
      destino CHARACTER VARYING,
      carga CHARACTER VARYING,
      observacoes TEXT,
      usuario_operador CHARACTER VARYING,
      tempo_patio INTERVAL,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  END IF;
END
$$;

-- 6. Verificação da tabela de recebimentos do posto Socorro_v2
-- Essa tabela já existe, então apenas verificamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recebimentos_posto_socorro_v2'
  ) THEN
    CREATE TABLE recebimentos_posto_socorro_v2 (
      id SERIAL PRIMARY KEY,
      tipo_combustivel CHARACTER VARYING,
      quantidade_litros NUMERIC,
      valor_litro NUMERIC,
      valor_total NUMERIC,
      nota_fiscal CHARACTER VARYING,
      fornecedor CHARACTER VARYING,
      data_recebimento TIMESTAMP,
      usuario_operador CHARACTER VARYING,
      observacoes TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  END IF;
END
$$;

-- 7. Criação ou atualização das views consolidadas para abastecimentos
-- View para os últimos abastecimentos
CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_ultimos AS
SELECT 
  id,
  placa,
  km_atual,
  hodometro_atual,
  tipo_combustivel,
  litros as quantidade_litros,
  motorista as nome_motorista,
  motorista_rg as rg_motorista,
  operador as nome_operador,
  valor_litro::text,
  valor_total::text,
  tipo_veiculo,
  observacoes,
  lavagem,
  tipo_lavagem,
  to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
  created_at
FROM abastecimentos_posto_socorro_v2
ORDER BY created_at DESC
LIMIT 100;

-- View para estatísticas mensais
CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_estatisticas_mensais AS
SELECT 
  date_trunc('month', created_at) AS mes,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS valor_total,
  COUNT(DISTINCT placa) AS total_veiculos
FROM abastecimentos_posto_socorro_v2
GROUP BY date_trunc('month', created_at)
ORDER BY date_trunc('month', created_at) DESC;

-- View para consumo por veículo
CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_consumo_por_veiculo AS
SELECT 
  placa,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS valor_total,
  MAX(created_at) AS ultimo_abastecimento
FROM abastecimentos_posto_socorro_v2
GROUP BY placa
ORDER BY total_litros DESC;

-- View consolidada
CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_consolidado AS
SELECT 
  'socorro_v2' AS posto,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS valor_total,
  COUNT(DISTINCT placa) AS total_veiculos,
  MAX(created_at) AS ultimo_abastecimento
FROM abastecimentos_posto_socorro_v2;

-- View para comparativo de combustíveis
CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_comparativo_combustiveis AS
SELECT 
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS valor_total,
  AVG(valor_litro) AS preco_medio
FROM abastecimentos_posto_socorro_v2
GROUP BY tipo_combustivel
ORDER BY total_litros DESC;

-- 8. Conceder permissões (caso necessário)
-- Para ambiente Supabase, permissões são gerenciadas pelo sistema RLS (Row Level Security)
-- As permissões necessárias já são configuradas automaticamente pelos serviços