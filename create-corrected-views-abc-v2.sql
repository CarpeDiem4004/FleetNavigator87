-- Script corrigido para criar as views do posto ABC_v2 no Supabase
-- Baseado na mesma lógica do posto Socorro_v2

-- Remover views existentes para evitar conflitos
DROP VIEW IF EXISTS historico_consolidado_abc_v2;
DROP VIEW IF EXISTS status_tanques_abc_v2;
DROP VIEW IF EXISTS ultimos_abastecimentos_abc_v2;
DROP VIEW IF EXISTS estatisticas_mensais_abc_v2;
DROP VIEW IF EXISTS consumo_por_veiculo_abc_v2;
DROP VIEW IF EXISTS comparativo_combustiveis_abc_v2;

-- Verificar se a tabela configuracao_tanques_abc_v2 existe e criar ela caso não exista
-- Comentado para referência ao executar no Supabase SQL Editor
/*
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'configuracao_tanques_abc_v2'
);
*/

-- Se a tabela não existir, crie-a com a mesma estrutura de Socorro_v2
CREATE TABLE IF NOT EXISTS configuracao_tanques_abc_v2 (
  id SERIAL PRIMARY KEY,
  posto VARCHAR(100) DEFAULT 'ABC_v2',
  diesel_capacidade VARCHAR(20) DEFAULT '10000',
  diesel_nivel VARCHAR(20) DEFAULT '5000',
  arla_capacidade VARCHAR(20) DEFAULT '1000',
  arla_nivel VARCHAR(20) DEFAULT '500',
  diesel_valor_litro VARCHAR(20) DEFAULT '4.59',
  arla_valor_litro VARCHAR(20) DEFAULT '3.79',
  diesel_consumo_total VARCHAR(20) DEFAULT '0.00',
  diesel_valor_total VARCHAR(20) DEFAULT '0.00',
  arla_consumo_total VARCHAR(20) DEFAULT '0.00',
  arla_valor_total VARCHAR(20) DEFAULT '0.00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuração inicial se não houver registros
-- Comentado para referência ao executar no Supabase SQL Editor
/*
INSERT INTO configuracao_tanques_abc_v2 (posto)
SELECT 'ABC_v2'
WHERE NOT EXISTS (SELECT 1 FROM configuracao_tanques_abc_v2 LIMIT 1);
*/

-- Criar view status_tanques_abc_v2 baseada na estrutura real da tabela
CREATE VIEW status_tanques_abc_v2 AS
SELECT
  id,
  'Diesel' AS tipo_combustivel,
  diesel_capacidade::NUMERIC AS capacidade_total,
  diesel_nivel::NUMERIC AS nivel_atual,
  diesel_valor_litro::NUMERIC AS valor_litro,
  ROUND((diesel_nivel::NUMERIC / diesel_capacidade::NUMERIC) * 100) AS percentual,
  (
    SELECT COALESCE(SUM(litros), 0)
    FROM abastecimentos_posto_abc_v2
    WHERE tipo_combustivel = 'Diesel'
    AND created_at > (CURRENT_DATE - INTERVAL '30 days')
  ) AS consumo_mensal
FROM configuracao_tanques_abc_v2
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
    FROM abastecimentos_posto_abc_v2
    WHERE tipo_combustivel = 'ARLA'
    AND created_at > (CURRENT_DATE - INTERVAL '30 days')
  ) AS consumo_mensal
FROM configuracao_tanques_abc_v2;

-- Criar view historico_consolidado_abc_v2
CREATE VIEW historico_consolidado_abc_v2 AS
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
  CAST('Sistema' AS VARCHAR(100)) AS responsavel,
  r.nota_fiscal,
  r.fornecedor,
  r.observacoes
FROM recebimentos_posto_abc_v2 r
ORDER BY data_operacao DESC;

-- Criar view ultimos_abastecimentos_abc_v2
CREATE VIEW ultimos_abastecimentos_abc_v2 AS
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

-- Criar view estatisticas_mensais_abc_v2
CREATE VIEW estatisticas_mensais_abc_v2 AS
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

-- Criar view consumo_por_veiculo_abc_v2
CREATE VIEW consumo_por_veiculo_abc_v2 AS
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

-- Criar view comparativo_combustiveis_abc_v2
CREATE VIEW comparativo_combustiveis_abc_v2 AS
SELECT
  tipo_combustivel,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS total_valor,
  AVG(valor_litro) AS valor_medio_litro
FROM abastecimentos_posto_abc_v2
WHERE created_at > (CURRENT_DATE - INTERVAL '90 days')
GROUP BY tipo_combustivel;