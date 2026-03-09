-- Script para criar view consolidada de abastecimentos de todos os postos
-- Execute este script no Supabase SQL Editor

CREATE OR REPLACE VIEW historico_consolidado_abastecimentos AS
SELECT 
    a.id,
    a.placa,
    COALESCE(a.hodometro_atual, a.km_atual, a.km) AS km,
    COALESCE(a.tipo_combustivel, 'Não especificado') AS tipo_combustivel,
    COALESCE(a.litros, a.quantidade_litros, a.quantity_litros) AS quantidade_litros,
    COALESCE(a.motorista, a.nome_motorista, a.motorista_nome) AS nome_motorista,
    COALESCE(a.rg_motorista, a.motorista_rg) AS rg_motorista,
    COALESCE(a.operador, a.nome_operador) AS nome_operador,
    COALESCE(a.valor_litro, a.preco_litro) AS valor_litro,
    a.valor_total,
    a.tipo_veiculo,
    a.observacoes,
    a.lavagem,
    a.tipo_lavagem,
    COALESCE(a.posto, a.nome_posto, 'Não especificado') AS nome_posto,
    COALESCE(a.data_hora, TO_CHAR(a.created_at, 'DD/MM/YYYY HH24:MI')) AS data_hora,
    a.created_at
FROM (
    -- Abastecimentos Posto Osasco V2
    SELECT *, 'Osasco_v2' AS posto FROM abastecimentos_posto_osasco_v2
    UNION ALL
    -- Abastecimentos Posto ABC V2
    SELECT *, 'ABC_v2' AS posto FROM abastecimentos_posto_abc_v2
    UNION ALL
    -- Abastecimentos Posto Socorro V2
    SELECT *, 'Socorro_v2' AS posto FROM abastecimentos_posto_socorro_v2
    UNION ALL
    -- Abastecimentos Posto Sorocaba V2
    SELECT *, 'Sorocaba_v2' AS posto FROM abastecimentos_posto_sorocaba_v2
    UNION ALL
    -- Abastecimentos Posto Campinas V2
    SELECT *, 'Campinas_v2' AS posto FROM abastecimentos_posto_campinas_v2
    UNION ALL
    -- Abastecimentos Posto Remédios
    SELECT *, 'Remedios' AS posto FROM posto_remedios_abastecimentos
    UNION ALL
    -- Abastecimentos Posto Ipatinga
    SELECT *, 'Ipatinga' AS posto FROM abastecimentos_posto_ipatinga_v2
    UNION ALL
    -- Abastecimentos Posto Guarulhos
    SELECT *, 'Guarulhos' AS posto FROM abastecimentos_posto_guarulhos
    UNION ALL
    -- Abastecimentos Posto VargemGrande
    SELECT *, 'VargemGrande' AS posto FROM abastecimentos_posto_vargemgrande
) a
ORDER BY a.created_at DESC;

-- Adicione índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_historico_consolidado_data ON historico_consolidado_abastecimentos (created_at);
CREATE INDEX IF NOT EXISTS idx_historico_consolidado_placa ON historico_consolidado_abastecimentos (placa);
CREATE INDEX IF NOT EXISTS idx_historico_consolidado_posto ON historico_consolidado_abastecimentos (nome_posto);
CREATE INDEX IF NOT EXISTS idx_historico_consolidado_combustivel ON historico_consolidado_abastecimentos (tipo_combustivel);

-- Nota: Os índices acima são apenas sugestões. Em uma VIEW os índices são aplicados nas tabelas subjacentes,
-- e podem não ser criados diretamente na view. Se necessário, crie-os nas tabelas originais.