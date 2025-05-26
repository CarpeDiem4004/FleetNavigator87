-- Script para recriar a view de histórico consolidado incluindo Osasco V2
-- Este script garante que todos os postos sejam incluídos no histórico geral

DROP VIEW IF EXISTS historico_consolidado_abastecimentos;

CREATE VIEW historico_consolidado_abastecimentos AS

-- Posto Osasco V2
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
    COALESCE(projeto, 'Não definido') AS project,
    to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'Osasco_v2' AS nome_posto
FROM abastecimentos_posto_osasco_v2

UNION ALL

-- Posto ABC V2
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
    COALESCE(projeto, 'Não definido') AS project,
    to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'ABC_v2' AS nome_posto
FROM abastecimentos_posto_abc_v2

UNION ALL

-- Posto Socorro V2
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
    COALESCE(projeto, 'Não definido') AS project,
    to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'Socorro_v2' AS nome_posto
FROM abastecimentos_posto_socorro_v2

UNION ALL

-- Posto Sorocaba V2
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
    COALESCE(projeto, 'Não definido') AS project,
    to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'Sorocaba_v2' AS nome_posto
FROM abastecimentos_posto_sorocaba_v2

UNION ALL

-- Posto Campinas V2
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
    COALESCE(projeto, 'Não definido') AS project,
    to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'Campinas_v2' AS nome_posto
FROM abastecimentos_posto_campinas_v2

UNION ALL

-- Posto Alair V2
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
    COALESCE(projeto, 'Não definido') AS project,
    to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'Alair_v2' AS nome_posto
FROM abastecimentos_posto_alair_v2

ORDER BY created_at DESC;