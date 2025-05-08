-- Script corrigido para criar as views do posto ABC_v2 no Supabase
-- Corrigido para evitar o erro 'column r.operador does not exist'

-- Criação da view status_tanques_abc_v2
CREATE OR REPLACE VIEW status_tanques_abc_v2 AS
SELECT
  ct.id,
  ct.tipo_combustivel,
  ct.capacidade_total,
  ct.nivel_atual,
  ct.valor_litro,
  ROUND((ct.nivel_atual / ct.capacidade_total) * 100) AS percentual,
  (
    SELECT COALESCE(SUM(litros), 0)
    FROM abastecimentos_posto_abc_v2
    WHERE tipo_combustivel = ct.tipo_combustivel
    AND created_at > (CURRENT_DATE - INTERVAL '30 days')
  ) AS consumo_mensal
FROM configuracao_tanques_abc_v2 ct;

-- Criação da view historico_consolidado_abc_v2
CREATE OR REPLACE VIEW historico_consolidado_abc_v2 AS
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
FROM abastecimentos_posto_abc_v2 a
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
  'Sistema' AS responsavel, -- Usando valor fixo em vez de r.operador
  r.nota_fiscal,
  r.fornecedor,
  r.observacoes
FROM recebimentos_posto_abc_v2 r
ORDER BY data_operacao DESC;

-- Criação da view ultimos_abastecimentos_abc_v2
CREATE OR REPLACE VIEW ultimos_abastecimentos_abc_v2 AS
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
FROM abastecimentos_posto_abc_v2 a
ORDER BY a.created_at DESC
LIMIT 10;

-- Criação da view estatisticas_mensais_abc_v2
CREATE OR REPLACE VIEW estatisticas_mensais_abc_v2 AS
SELECT
  DATE_TRUNC('month', created_at) AS mes,
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  AVG(valor_litro) AS media_valor_litro
FROM abastecimentos_posto_abc_v2
GROUP BY DATE_TRUNC('month', created_at), tipo_combustivel
ORDER BY mes DESC, tipo_combustivel;

-- Criação da view consumo_por_veiculo_abc_v2
CREATE OR REPLACE VIEW consumo_por_veiculo_abc_v2 AS
SELECT
  placa,
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  MAX(created_at) AS ultimo_abastecimento
FROM abastecimentos_posto_abc_v2
GROUP BY placa, tipo_combustivel
ORDER BY total_litros DESC;

-- Criação da view comparativo_combustiveis_abc_v2
CREATE OR REPLACE VIEW comparativo_combustiveis_abc_v2 AS
SELECT
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  AVG(valor_litro) AS valor_medio_litro
FROM abastecimentos_posto_abc_v2
WHERE created_at > (CURRENT_DATE - INTERVAL '90 days')
GROUP BY tipo_combustivel;