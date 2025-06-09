-- Script para corrigir registros sem projeto_id e base_id nos postos externos
-- Este script irá popular os campos projeto_id e base_id baseado nos nomes dos projetos

-- 1. Criar tabela temporária para mapeamento projeto -> projeto_id
CREATE TEMP TABLE projeto_mapping AS
SELECT 
    'SHOPEE' as projeto_nome, 1 as projeto_id, 'FULL MELI (FMELI01)' as base_name, 1 as base_id
UNION ALL SELECT 'MERCADO LIVRE', 2, 'FULL MELI (FMELI01)', 1
UNION ALL SELECT 'COCA COLA', 3, 'BASE COCA COLA ABC', 2
UNION ALL SELECT 'MANUTENÇÃO', 4, 'OFICINA PRINCIPAL', 3
UNION ALL SELECT 'LOGÍSTICA', 5, 'CENTRO DISTRIBUIÇÃO', 4
UNION ALL SELECT 'TERCEIROS', 6, 'BASE EXTERNA', 5;

-- 2. Atualizar ABC V2
UPDATE abastecimentos_posto_abc_v2 
SET 
    projeto_id = pm.projeto_id,
    base_id = pm.base_id,
    base_name = pm.base_name
FROM projeto_mapping pm 
WHERE abastecimentos_posto_abc_v2.projeto = pm.projeto_nome 
AND abastecimentos_posto_abc_v2.projeto_id IS NULL;

-- 3. Atualizar Alair V2
UPDATE abastecimentos_posto_alair_v2 
SET 
    projeto_id = pm.projeto_id,
    base_id = pm.base_id,
    base_name = pm.base_name
FROM projeto_mapping pm 
WHERE abastecimentos_posto_alair_v2.projeto = pm.projeto_nome 
AND abastecimentos_posto_alair_v2.projeto_id IS NULL;

-- 4. Atualizar Campinas V2
UPDATE abastecimentos_posto_campinas_v2 
SET 
    projeto_id = pm.projeto_id,
    base_id = pm.base_id,
    base_name = pm.base_name
FROM projeto_mapping pm 
WHERE abastecimentos_posto_campinas_v2.projeto = pm.projeto_nome 
AND abastecimentos_posto_campinas_v2.projeto_id IS NULL;

-- 5. Atualizar Guarulhos V2
UPDATE abastecimentos_posto_guarulhos_v2 
SET 
    projeto_id = pm.projeto_id,
    base_id = pm.base_id,
    base_name = pm.base_name
FROM projeto_mapping pm 
WHERE abastecimentos_posto_guarulhos_v2.projeto = pm.projeto_nome 
AND abastecimentos_posto_guarulhos_v2.projeto_id IS NULL;

-- 6. Atualizar Osasco V2
UPDATE abastecimentos_posto_osasco_v2 
SET 
    projeto_id = pm.projeto_id,
    base_id = pm.base_id,
    base_name = pm.base_name
FROM projeto_mapping pm 
WHERE abastecimentos_posto_osasco_v2.projeto = pm.projeto_nome 
AND abastecimentos_posto_osasco_v2.projeto_id IS NULL;

-- 7. Atualizar Socorro V2
UPDATE abastecimentos_posto_socorro_v2 
SET 
    projeto_id = pm.projeto_id,
    base_id = pm.base_id,
    base_name = pm.base_name
FROM projeto_mapping pm 
WHERE abastecimentos_posto_socorro_v2.projeto = pm.projeto_nome 
AND abastecimentos_posto_socorro_v2.projeto_id IS NULL;

-- 8. Atualizar Sorocaba V2
UPDATE abastecimentos_posto_sorocaba_v2 
SET 
    projeto_id = pm.projeto_id,
    base_id = pm.base_id,
    base_name = pm.base_name
FROM projeto_mapping pm 
WHERE abastecimentos_posto_sorocaba_v2.projeto = pm.projeto_nome 
AND abastecimentos_posto_sorocaba_v2.projeto_id IS NULL;

-- Relatório de verificação pós-migração
SELECT 
    'abc_v2' as posto,
    COUNT(*) as total_registros,
    COUNT(projeto_id) as com_projeto_id,
    COUNT(base_id) as com_base_id,
    ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as percentual_projeto_id,
    ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as percentual_base_id
FROM abastecimentos_posto_abc_v2
UNION ALL
SELECT 
    'alair_v2' as posto,
    COUNT(*) as total_registros,
    COUNT(projeto_id) as com_projeto_id,
    COUNT(base_id) as com_base_id,
    ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as percentual_projeto_id,
    ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as percentual_base_id
FROM abastecimentos_posto_alair_v2
UNION ALL
SELECT 
    'campinas_v2' as posto,
    COUNT(*) as total_registros,
    COUNT(projeto_id) as com_projeto_id,
    COUNT(base_id) as com_base_id,
    ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as percentual_projeto_id,
    ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as percentual_base_id
FROM abastecimentos_posto_campinas_v2
UNION ALL
SELECT 
    'guarulhos_v2' as posto,
    COUNT(*) as total_registros,
    COUNT(projeto_id) as com_projeto_id,
    COUNT(base_id) as com_base_id,
    ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as percentual_projeto_id,
    ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as percentual_base_id
FROM abastecimentos_posto_guarulhos_v2
UNION ALL
SELECT 
    'osasco_v2' as posto,
    COUNT(*) as total_registros,
    COUNT(projeto_id) as com_projeto_id,
    COUNT(base_id) as com_base_id,
    ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as percentual_projeto_id,
    ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as percentual_base_id
FROM abastecimentos_posto_osasco_v2
UNION ALL
SELECT 
    'socorro_v2' as posto,
    COUNT(*) as total_registros,
    COUNT(projeto_id) as com_projeto_id,
    COUNT(base_id) as com_base_id,
    ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as percentual_projeto_id,
    ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as percentual_base_id
FROM abastecimentos_posto_socorro_v2
UNION ALL
SELECT 
    'sorocaba_v2' as posto,
    COUNT(*) as total_registros,
    COUNT(projeto_id) as com_projeto_id,
    COUNT(base_id) as com_base_id,
    ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as percentual_projeto_id,
    ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as percentual_base_id
FROM abastecimentos_posto_sorocaba_v2
ORDER BY posto;