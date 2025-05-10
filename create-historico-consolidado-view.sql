-- Criação da view consolidada que une dados de todos os postos
CREATE OR REPLACE VIEW historico_consolidado_abastecimentos AS
SELECT 
    id,
    placa,
    km, 
    tipo_combustivel,
    CAST(quantidade_litros AS text) as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    CAST(valor_litro AS text) as valor_litro,
    CAST(valor_total AS text) as valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Osasco_v2' as nome_posto,
    TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM abastecimentos_posto_osasco_v2

UNION ALL

SELECT 
    id,
    placa,
    km, 
    tipo_combustivel,
    CAST(quantidade_litros AS text) as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    CAST(valor_litro AS text) as valor_litro,
    CAST(valor_total AS text) as valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'ABC_v2' as nome_posto,
    TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM abastecimentos_posto_abc_v2

UNION ALL

SELECT 
    id,
    placa,
    km, 
    tipo_combustivel,
    CAST(quantidade_litros AS text) as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    CAST(valor_litro AS text) as valor_litro,
    CAST(valor_total AS text) as valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Socorro_v2' as nome_posto,
    TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM abastecimentos_posto_socorro_v2

UNION ALL

SELECT 
    id,
    placa,
    km, 
    tipo_combustivel,
    CAST(quantidade_litros AS text) as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    CAST(valor_litro AS text) as valor_litro,
    CAST(valor_total AS text) as valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Sorocaba_v2' as nome_posto,
    TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM abastecimentos_posto_sorocaba_v2

UNION ALL

SELECT 
    id,
    placa,
    km, 
    tipo_combustivel,
    CAST(quantidade_litros AS text) as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    CAST(valor_litro AS text) as valor_litro,
    CAST(valor_total AS text) as valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Alair_v2' as nome_posto,
    TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM abastecimentos_posto_alair_v2

UNION ALL

SELECT 
    id,
    placa,
    km_atual as km, 
    tipo_combustivel,
    CAST(quantidade_litros AS text) as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    CAST(valor_litro AS text) as valor_litro,
    CAST(valor_total AS text) as valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Campinas_v2' as nome_posto,
    TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM abastecimentos_posto_campinas_v2

UNION ALL

SELECT 
    id,
    placa,
    km, 
    tipo_combustivel,
    CAST(quantidade_litros AS text) as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    CAST(valor_litro AS text) as valor_litro,
    CAST(valor_total AS text) as valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    'Remedios' as nome_posto,
    TO_CHAR(data_hora AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM posto_remedios_abastecimentos

ORDER BY created_at DESC;