-- Script completo para criar todas as tabelas e views do posto Socorro_V2
-- Baseado na estrutura do posto Osasco_V2
-- Autor: Sistema Murici Fleet
-- Data: Maio, 2025

-- 1. Criação da tabela principal de abastecimentos
CREATE TABLE IF NOT EXISTS abastecimentos_posto_socorro_v2 (
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

-- 2. Criação da tabela de movimentações de pátio
CREATE TABLE IF NOT EXISTS movimentacoes_patio_socorro_v2 (
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

-- 3. Criação da tabela de recebimentos
CREATE TABLE IF NOT EXISTS recebimentos_posto_socorro_v2 (
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

-- 4. Criação da tabela de configuração de tanques
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

-- 5. Inserção de dados iniciais na tabela de configuração de tanques
INSERT INTO configuracao_tanques_socorro_v2 (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel, diesel_valor_litro, arla_valor_litro, diesel_consumo_total, diesel_valor_total, arla_consumo_total, arla_valor_total, created_at, updated_at)
VALUES ('Socorro_v2', '20000', '10000', '1000', '500', '6.39', '3.50', '0', '0', '0', '0', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 6. Verificar e inserir na tabela principal de configurações
INSERT INTO configuracao_tanques (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel, diesel_valor_litro, arla_valor_litro, diesel_consumo_total, diesel_valor_total, arla_consumo_total, arla_valor_total, created_at, updated_at)
SELECT 'Socorro_v2', '20000', '10000', '1000', '500', '6.39', '3.50', '0', '0', '0', '0', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM configuracao_tanques WHERE posto = 'Socorro_v2');

-- 7. Criação das views

-- 7.1 View para status dos tanques
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

-- 7.2 View para os últimos abastecimentos
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

-- 7.3 View para os últimos abastecimentos (alternativa usando aliases diferentes)
CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_ultimos_abastecimentos AS
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

-- 7.4 View para estatísticas mensais
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

-- 7.5 View para consumo por veículo
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

-- 7.6 View consolidada
CREATE OR REPLACE VIEW abastecimentos_posto_socorro_v2_consolidado AS
SELECT 
  'socorro_v2' AS posto,
  COUNT(*) AS total_abastecimentos,
  SUM(litros) AS total_litros,
  SUM(valor_total) AS valor_total,
  COUNT(DISTINCT placa) AS total_veiculos,
  MAX(created_at) AS ultimo_abastecimento
FROM abastecimentos_posto_socorro_v2;

-- 7.7 View para comparativo de combustíveis
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

-- 8. Criação de Índices para melhorar performance

-- 8.1 Índices para tabela de abastecimentos
CREATE INDEX IF NOT EXISTS idx_abast_socorro_v2_placa ON abastecimentos_posto_socorro_v2(placa);
CREATE INDEX IF NOT EXISTS idx_abast_socorro_v2_created_at ON abastecimentos_posto_socorro_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_abast_socorro_v2_tipo_combustivel ON abastecimentos_posto_socorro_v2(tipo_combustivel);

-- 8.2 Índices para tabela de movimentações
CREATE INDEX IF NOT EXISTS idx_mov_socorro_v2_placa ON movimentacoes_patio_socorro_v2(placa);
CREATE INDEX IF NOT EXISTS idx_mov_socorro_v2_data_hora ON movimentacoes_patio_socorro_v2(data_hora);
CREATE INDEX IF NOT EXISTS idx_mov_socorro_v2_tipo_movimentacao ON movimentacoes_patio_socorro_v2(tipo_movimentacao);

-- 8.3 Índices para tabela de recebimentos
CREATE INDEX IF NOT EXISTS idx_receb_socorro_v2_data ON recebimentos_posto_socorro_v2(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_receb_socorro_v2_tipo_combustivel ON recebimentos_posto_socorro_v2(tipo_combustivel);

-- 9. Comentários nas tabelas para documentação
COMMENT ON TABLE abastecimentos_posto_socorro_v2 IS 'Tabela de abastecimentos realizados no posto Socorro V2';
COMMENT ON TABLE movimentacoes_patio_socorro_v2 IS 'Tabela de movimentações de veículos no pátio do posto Socorro V2';
COMMENT ON TABLE recebimentos_posto_socorro_v2 IS 'Tabela de recebimentos de combustível no posto Socorro V2';
COMMENT ON TABLE configuracao_tanques_socorro_v2 IS 'Tabela de configuração dos tanques do posto Socorro V2';

-- 10. Configuração das permissões RLS (Row Level Security) do Supabase
-- Nota: Isto é apenas um exemplo, as regras podem precisar ser adaptadas conforme as necessidades específicas

-- 10.1 Habilitar RLS nas tabelas
ALTER TABLE abastecimentos_posto_socorro_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_patio_socorro_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE recebimentos_posto_socorro_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_tanques_socorro_v2 ENABLE ROW LEVEL SECURITY;

-- 10.2 Criar políticas (estas são apenas sugestões, adaptar conforme necessário)
-- Para tabela de abastecimentos
CREATE POLICY "Permissão geral para abastecimentos Socorro_v2" ON abastecimentos_posto_socorro_v2
  USING (true) WITH CHECK (true);

-- Para tabela de movimentações
CREATE POLICY "Permissão geral para movimentações Socorro_v2" ON movimentacoes_patio_socorro_v2
  USING (true) WITH CHECK (true);

-- Para tabela de recebimentos
CREATE POLICY "Permissão geral para recebimentos Socorro_v2" ON recebimentos_posto_socorro_v2
  USING (true) WITH CHECK (true);

-- Para tabela de configurações
CREATE POLICY "Permissão geral para configurações Socorro_v2" ON configuracao_tanques_socorro_v2
  USING (true) WITH CHECK (true);

-- Fim do script