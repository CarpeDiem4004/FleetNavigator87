-- Script para criar tabelas e views necessárias para o posto Alair_v2
-- Baseado na estrutura do posto Osasco_v2

-- 1. Configuração de Tanques (se não existir)
CREATE TABLE IF NOT EXISTS configuracao_tanques_alair_v2 (
  id SERIAL PRIMARY KEY,
  posto VARCHAR(50) NOT NULL DEFAULT 'Alair_v2',
  diesel_capacidade VARCHAR(20) NOT NULL DEFAULT '20000',
  diesel_nivel VARCHAR(20) NOT NULL DEFAULT '10000',
  arla_capacidade VARCHAR(20) NOT NULL DEFAULT '1000',
  arla_nivel VARCHAR(20) NOT NULL DEFAULT '500',
  diesel_valor_litro VARCHAR(20) NOT NULL DEFAULT '5.00',
  arla_valor_litro VARCHAR(20) NOT NULL DEFAULT '3.00',
  diesel_consumo_total VARCHAR(20) NOT NULL DEFAULT '0.00',
  diesel_valor_total VARCHAR(20) NOT NULL DEFAULT '0.00',
  arla_consumo_total VARCHAR(20) NOT NULL DEFAULT '0.00',
  arla_valor_total VARCHAR(20) NOT NULL DEFAULT '0.00',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. View para últimos abastecimentos
CREATE OR REPLACE VIEW abastecimentos_posto_alair_v2_ultimos AS
SELECT * FROM abastecimentos_posto_alair_v2
ORDER BY created_at DESC
LIMIT 10;

-- 3. View Consolidada
CREATE OR REPLACE VIEW abastecimentos_posto_alair_v2_consolidado AS
SELECT
  id,
  placa,
  km_atual AS km,
  hodometro_atual,
  tipo_combustivel,
  litros AS quantidade_litros,
  motorista AS nome_motorista,
  motorista_rg AS rg_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  tipo_veiculo,
  observacoes,
  lavagem,
  tipo_lavagem,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
  created_at
FROM abastecimentos_posto_alair_v2
ORDER BY created_at DESC;

-- 4. View de Estatísticas Mensais
CREATE OR REPLACE VIEW abastecimentos_posto_alair_v2_estatisticas_mensais AS
SELECT
  EXTRACT(YEAR FROM created_at) AS ano,
  EXTRACT(MONTH FROM created_at) AS mes,
  TO_CHAR(DATE_TRUNC('month', created_at), 'TMMonth/YYYY') AS periodo,
  COALESCE(SUM(CASE WHEN tipo_combustivel = 'Diesel' THEN litros ELSE 0 END), 0) AS volume_diesel,
  COALESCE(SUM(CASE WHEN tipo_combustivel = 'ARLA' THEN litros ELSE 0 END), 0) AS volume_arla,
  COALESCE(SUM(CASE WHEN tipo_combustivel = 'Diesel' THEN valor_total ELSE 0 END), 0) AS valor_diesel,
  COALESCE(SUM(CASE WHEN tipo_combustivel = 'ARLA' THEN valor_total ELSE 0 END), 0) AS valor_arla,
  COUNT(DISTINCT placa) AS qtd_veiculos,
  COUNT(*) AS qtd_abastecimentos
FROM abastecimentos_posto_alair_v2
GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), TO_CHAR(DATE_TRUNC('month', created_at), 'TMMonth/YYYY')
ORDER BY ano DESC, mes DESC;

-- 5. View de Consumo por Veículo
CREATE OR REPLACE VIEW abastecimentos_posto_alair_v2_consumo_por_veiculo AS
SELECT
  placa,
  COUNT(*) AS qtd_abastecimentos,
  SUM(CASE WHEN tipo_combustivel = 'Diesel' THEN litros ELSE 0 END) AS total_litros,
  SUM(CASE WHEN tipo_combustivel = 'Diesel' THEN valor_total ELSE 0 END) AS total_valor,
  MAX(created_at) AS ultimo_abastecimento
FROM abastecimentos_posto_alair_v2
GROUP BY placa
ORDER BY total_litros DESC;

-- 6. View de Comparativo de Combustíveis
CREATE OR REPLACE VIEW abastecimentos_posto_alair_v2_comparativo_combustiveis AS
SELECT
  tipo_combustivel,
  COUNT(*) AS qtd_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  ROUND(AVG(valor_litro), 2) AS media_valor_litro,
  COUNT(DISTINCT placa) AS qtd_veiculos
FROM abastecimentos_posto_alair_v2
GROUP BY tipo_combustivel
ORDER BY total_litros DESC;

-- 7. Inserir configuração de tanques se ainda não existir
INSERT INTO configuracao_tanques_alair_v2 (
  posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel,
  diesel_valor_litro, arla_valor_litro, diesel_consumo_total, diesel_valor_total,
  arla_consumo_total, arla_valor_total, created_at, updated_at
)
SELECT
  'Alair_v2', '20000', '10000', '1000', '500',
  '5.00', '3.00', '0.00', '0.00',
  '0.00', '0.00', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM configuracao_tanques_alair_v2 WHERE posto = 'Alair_v2'
);