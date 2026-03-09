-- Script para criar as tabelas e views do posto ABC_v2 no Supabase
-- Baseado no modelo usado para o posto Socorro_v2 e Osasco_v2

-- Criação da tabela abastecimentos_posto_abc_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_abc_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2) NOT NULL,
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 2),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT FALSE,
  tipo_lavagem VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela configuracao_tanques_abc_v2
CREATE TABLE IF NOT EXISTS configuracao_tanques_abc_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20) NOT NULL,
  capacidade_total NUMERIC(10, 2) NOT NULL,
  nivel_atual NUMERIC(10, 2) NOT NULL,
  valor_litro NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuração inicial de tanques
INSERT INTO configuracao_tanques_abc_v2 (tipo_combustivel, capacidade_total, nivel_atual, valor_litro)
VALUES
  ('Diesel', 10000, 5000, 4.59),
  ('Gasolina', 5000, 2500, 5.79)
ON CONFLICT DO NOTHING;

-- Criação da tabela movimentacoes_patio_abc_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_abc_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_saida TIMESTAMP WITH TIME ZONE,
  nome_motorista VARCHAR(100),
  rg_motorista VARCHAR(20),
  nome_operador VARCHAR(100),
  tipo_movimento VARCHAR(50),
  motivo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela recebimentos_posto_abc_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_abc_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20) NOT NULL,
  quantidade_litros NUMERIC(10, 2) NOT NULL,
  valor_litro NUMERIC(10, 2),
  valor_total NUMERIC(10, 2),
  fornecedor VARCHAR(100),
  nota_fiscal VARCHAR(50),
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
  r.operador AS responsavel,
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