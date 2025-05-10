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
  COALESCE(quantidade_litros, litros) AS litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  COALESCE(projeto, '') AS project, -- Usamos o campo projeto se existir
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
  COALESCE(quantidade_litros, litros) AS litros,
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
  COALESCE(quantidade_litros, litros) AS litros,
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
  COALESCE(quantidade_litros, litros) AS litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  '' AS project,
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
  COALESCE(quantidade_litros, litros) AS litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  '' AS project,
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
  COALESCE(quantidade_litros, litros) AS litros,
  motorista AS nome_motorista,
  operador AS nome_operador,
  valor_litro,
  valor_total,
  '' AS project,
  'sorocaba_v2' AS posto,
  created_at
FROM abastecimentos_posto_sorocaba_v2;

-- Adiciona um índice para melhorar a performance de consultas
-- CREATE INDEX IF NOT EXISTS idx_historico_consolidado_data ON historico_consolidado_abastecimentos(created_at);
-- CREATE INDEX IF NOT EXISTS idx_historico_consolidado_placa ON historico_consolidado_abastecimentos(placa);
-- CREATE INDEX IF NOT EXISTS idx_historico_consolidado_posto ON historico_consolidado_abastecimentos(posto);