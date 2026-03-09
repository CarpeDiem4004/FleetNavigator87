-- Criação de VIEW para consolidar histórico de abastecimentos de todos os postos
-- Esta view garante a padronização dos campos entre as diferentes tabelas de postos

DROP VIEW IF EXISTS historico_consolidado_abastecimentos;

CREATE VIEW historico_consolidado_abastecimentos AS

-- Posto Campinas V2
SELECT 
  id,
  placa,
  km_atual,
  tipo_combustivel,
  litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  COALESCE(projeto, '') AS project,
  'campinas_v2' AS posto,
  created_at
FROM abastecimentos_posto_campinas_v2

UNION ALL

-- Posto Osasco V2
SELECT 
  id,
  placa,
  km_atual,
  tipo_combustivel,
  litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  COALESCE(projeto, '') AS project,
  'osasco_v2' AS posto,
  created_at
FROM abastecimentos_posto_osasco_v2

UNION ALL

-- Posto Alair V2
SELECT 
  id,
  placa,
  km_atual,
  tipo_combustivel,
  litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  COALESCE(projeto, '') AS project,
  'alair_v2' AS posto,
  created_at
FROM abastecimentos_posto_alair_v2

UNION ALL

-- Posto ABC V2
SELECT 
  id,
  placa,
  km_atual,
  tipo_combustivel,
  litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  COALESCE(projeto, '') AS project,
  'abc_v2' AS posto,
  created_at
FROM abastecimentos_posto_abc_v2

UNION ALL

-- Posto Socorro V2
SELECT 
  id,
  placa,
  km_atual,
  tipo_combustivel,
  litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  COALESCE(projeto, '') AS project,
  'socorro_v2' AS posto,
  created_at
FROM abastecimentos_posto_socorro_v2

UNION ALL

-- Posto Sorocaba V2
SELECT 
  id,
  placa,
  km_atual,
  tipo_combustivel,
  litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  COALESCE(projeto, '') AS project,
  'sorocaba_v2' AS posto,
  created_at
FROM abastecimentos_posto_sorocaba_v2;