-- Script corrigido para criar as views do posto Socorro_v2 no Supabase
-- Baseado na estrutura real da tabela configuracao_tanques_socorro_v2

-- Remover views existentes para evitar conflitos
DROP VIEW IF EXISTS historico_consolidado_socorro_v2;
DROP VIEW IF EXISTS status_tanques_socorro_v2;
DROP VIEW IF EXISTS ultimos_abastecimentos_socorro_v2;
DROP VIEW IF EXISTS estatisticas_mensais_socorro_v2;
DROP VIEW IF EXISTS consumo_por_veiculo_socorro_v2;
DROP VIEW IF EXISTS comparativo_combustiveis_socorro_v2;

-- Criar view status_tanques_socorro_v2 baseada na estrutura real da tabela
CREATE VIEW status_tanques_socorro_v2 AS
SELECT
  id,
  'Diesel' AS tipo_combustivel,
  diesel_capacidade::NUMERIC AS capacidade_total,
  diesel_nivel::NUMERIC AS nivel_atual,
  diesel_valor_litro::NUMERIC AS valor_litro,
  ROUND((diesel_nivel::NUMERIC / diesel_capacidade::NUMERIC) * 100) AS percentual,
  (
    SELECT COALESCE(SUM(litros), 0)
    FROM abastecimentos_posto_socorro_v2
    WHERE tipo_combustivel = 'Diesel'
    AND created_at > (CURRENT_DATE - INTERVAL '30 days')
  ) AS consumo_mensal
FROM configuracao_tanques_socorro_v2
UNION ALL
SELECT
  id,
  'ARLA' AS tipo_combustivel,
  arla_capacidade::NUMERIC AS capacidade_total,
  arla_nivel::NUMERIC AS nivel_atual,
  arla_valor_litro::NUMERIC AS valor_litro,
  ROUND((arla_nivel::NUMERIC / arla_capacidade::NUMERIC) * 100) AS percentual,
  (
    SELECT COALESCE(SUM(litros), 0)
    FROM abastecimentos_posto_socorro_v2
    WHERE tipo_combustivel = 'ARLA'
    AND created_at > (CURRENT_DATE - INTERVAL '30 days')
  ) AS consumo_mensal
FROM configuracao_tanques_socorro_v2;

-- Criar view historico_consolidado_socorro_v2
CREATE VIEW historico_consolidado_socorro_v2 AS
SELECT
  'abastecimento' AS tipo_operacao,
  a.id,
  a.created_at AS data_operacao,
  a.placa,
  a.tipo_combustivel,
  a.litros AS quantidade,
  a.valor_litro,
  a.valor_total,
  a.motorista AS responsavel,
  NULL AS nota_fiscal,
  NULL AS fornecedor,
  a.observacoes
FROM abastecimentos_posto_socorro_v2 a
UNION ALL
SELECT
  'recebimento' AS tipo_operacao,
  r.id,
  r.created_at AS data_operacao,
  NULL AS placa,
  r.tipo_combustivel,
  r.quantidade_litros AS quantidade,
  r.valor_litro,
  r.valor_total,
  CAST('Sistema' AS VARCHAR(100)) AS responsavel,
  r.nota_fiscal,
  r.fornecedor,
  r.observacoes
FROM recebimentos_posto_socorro_v2 r
ORDER BY data_operacao DESC;

-- Criar view ultimos_abastecimentos_socorro_v2
CREATE VIEW ultimos_abastecimentos_socorro_v2 AS
SELECT 
  a.id,
  a.placa,
  a.created_at,
  a.tipo_combustivel,
  a.litros,
  a.km_atual,
  a.motorista,
  a.operador,
  a.valor_litro,
  a.valor_total
FROM abastecimentos_posto_socorro_v2 a
ORDER BY a.created_at DESC
LIMIT 10;

-- Criar view estatisticas_mensais_socorro_v2
CREATE VIEW estatisticas_mensais_socorro_v2 AS
SELECT
  DATE_TRUNC('month', created_at) AS mes,
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  AVG(valor_litro) AS media_valor_litro
FROM abastecimentos_posto_socorro_v2
GROUP BY DATE_TRUNC('month', created_at), tipo_combustivel
ORDER BY mes DESC, tipo_combustivel;

-- Criar view consumo_por_veiculo_socorro_v2
CREATE VIEW consumo_por_veiculo_socorro_v2 AS
SELECT
  placa,
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  MAX(created_at) AS ultimo_abastecimento
FROM abastecimentos_posto_socorro_v2
GROUP BY placa, tipo_combustivel
ORDER BY total_litros DESC;

-- Criar view comparativo_combustiveis_socorro_v2
CREATE VIEW comparativo_combustiveis_socorro_v2 AS
SELECT
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  AVG(valor_litro) AS valor_medio_litro
FROM abastecimentos_posto_socorro_v2
WHERE created_at > (CURRENT_DATE - INTERVAL '90 days')
GROUP BY tipo_combustivel;