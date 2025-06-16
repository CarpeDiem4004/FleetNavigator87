-- ============================================================================
-- SOLUÇÃO SIMPLES PARA O PROBLEMA DE base_id
-- Este script resolve o problema sem criar foreign keys problemáticas
-- ============================================================================

-- 1. Verificar se a consulta funciona sem foreign key constraint
SELECT 
    'TESTE SEM CONSTRAINT' as teste,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.base_id,
    b.name as base_nome
FROM manutencao m
LEFT JOIN bases b ON m.base_id = b.id
LIMIT 3;

-- 2. Se o JOIN não funcionar, atualizar base_id para valores válidos
-- Primeiro, verificar quais IDs de bases existem
SELECT 'BASES DISPONÍVEIS' as info, id, name FROM bases ORDER BY id;

-- 3. Atualizar todos os registros de manutenção com base_id válido
UPDATE manutencao 
SET base_id = (
    SELECT id FROM bases 
    WHERE bases.id IS NOT NULL 
    ORDER BY id 
    LIMIT 1
)
WHERE base_id IS NULL OR base_id NOT IN (SELECT id FROM bases);

-- 4. Verificar quantos registros foram atualizados
SELECT 
    'REGISTROS ATUALIZADOS' as status,
    COUNT(*) as total_manutencoes,
    COUNT(CASE WHEN base_id IS NOT NULL THEN 1 END) as com_base_id,
    COUNT(CASE WHEN base_id IS NULL THEN 1 END) as sem_base_id
FROM manutencao;

-- 5. Teste final da consulta completa
SELECT 
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.prioridade,
    m.responsavel,
    m.custo,
    o.razao_social as oficina_nome,
    b.name as base_nome
FROM manutencao m
LEFT JOIN oficinas o ON m.oficina_id = o.id
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.data_solicitacao DESC;