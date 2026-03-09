-- PARTE 4: CRIAR VIEW HISTÓRICO CONSOLIDADO POSTOS
-- Script para criar a view de histórico consolidado para todos os postos

-- View para consolidar históricos de abastecimentos de todos os postos
CREATE OR REPLACE VIEW historico_consolidado_postos AS
-- Abastecimentos do posto Campinas_v2
SELECT 
  id,
  placa,
  COALESCE(km_atual, 0) AS km,
  tipo_combustivel,
  COALESCE(litros, 0) AS quantidade_litros,
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
FROM abastecimentos_posto_campinas_v2

UNION ALL

-- Abastecimentos do posto Osasco_v2
SELECT 
  id,
  placa,
  COALESCE(km_atual, 0) AS km,
  tipo_combustivel,
  COALESCE(litros, 0) AS quantidade_litros,
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
  'osasco_v2' AS posto
FROM abastecimentos_posto_osasco_v2

UNION ALL

-- Abastecimentos do posto Socorro_v2
SELECT 
  id,
  placa,
  COALESCE(km_atual, 0) AS km,
  tipo_combustivel,
  COALESCE(litros, 0) AS quantidade_litros,
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
  'socorro_v2' AS posto
FROM abastecimentos_posto_socorro_v2

UNION ALL

-- Abastecimentos do posto Sorocaba_v2
SELECT 
  id,
  placa,
  COALESCE(km_atual, 0) AS km,
  tipo_combustivel,
  COALESCE(litros, 0) AS quantidade_litros,
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
  'sorocaba_v2' AS posto
FROM abastecimentos_posto_sorocaba_v2

UNION ALL

-- Abastecimentos do posto ABC_v2
SELECT 
  id,
  placa,
  COALESCE(km_atual, 0) AS km,
  tipo_combustivel,
  COALESCE(litros, 0) AS quantidade_litros,
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
  'abc_v2' AS posto
FROM abastecimentos_posto_abc_v2

UNION ALL

-- Abastecimentos do posto Alair_v2
SELECT 
  id,
  placa,
  COALESCE(km_atual, 0) AS km,
  tipo_combustivel,
  COALESCE(litros, 0) AS quantidade_litros,
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
  'alair_v2' AS posto
FROM abastecimentos_posto_alair_v2

UNION ALL

-- Abastecimentos do posto Guarulhos_v2
SELECT 
  id,
  placa,
  COALESCE(km_atual, 0) AS km,
  tipo_combustivel,
  COALESCE(litros, 0) AS quantidade_litros,
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
  'guarulhos_v2' AS posto
FROM abastecimentos_posto_guarulhos_v2;