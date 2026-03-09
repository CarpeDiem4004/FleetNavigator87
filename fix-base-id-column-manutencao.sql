-- ============================================================================
-- SCRIPT PARA CORRIGIR COLUNA base_id NA TABELA MANUTENCAO
-- Este script garante que a coluna base_id existe e está configurada corretamente
-- ============================================================================

-- Verificar se a coluna base_id existe na tabela manutencao
DO $$
DECLARE
    column_exists INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM information_schema.columns 
    WHERE table_name = 'manutencao' 
    AND column_name = 'base_id';
    
    IF column_exists = 0 THEN
        -- Adicionar coluna base_id se não existir
        ALTER TABLE manutencao ADD COLUMN base_id INTEGER;
        RAISE NOTICE 'Coluna base_id adicionada à tabela manutencao';
    ELSE
        RAISE NOTICE 'Coluna base_id já existe na tabela manutencao';
    END IF;
    
    -- Verificar se existe chave estrangeira para bases
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'manutencao' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%base_id%'
    ) THEN
        -- Adicionar chave estrangeira se não existir
        ALTER TABLE manutencao 
        ADD CONSTRAINT fk_manutencao_base_id 
        FOREIGN KEY (base_id) REFERENCES bases(id);
        RAISE NOTICE 'Chave estrangeira base_id adicionada';
    ELSE
        RAISE NOTICE 'Chave estrangeira base_id já existe';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT 
    'ESTRUTURA FINAL DA TABELA MANUTENCAO' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'manutencao' 
ORDER BY ordinal_position;

-- Atualizar registros existentes que não têm base_id
-- Assumindo que existe uma base padrão com ID 1
UPDATE manutencao 
SET base_id = 1 
WHERE base_id IS NULL 
AND EXISTS (SELECT 1 FROM bases WHERE id = 1);

-- Verificar se há bases disponíveis
SELECT 'BASES DISPONÍVEIS' as info, id, name FROM bases ORDER BY id;

-- Teste da consulta que estava falhando
SELECT 
    'TESTE DA CONSULTA CORRIGIDA' as teste,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.base_id,
    b.name as base_nome
FROM manutencao m
LEFT JOIN bases b ON m.base_id = b.id
LIMIT 3;

-- ============================================================================
-- SCRIPT ALTERNATIVO CASO A QUERY AINDA FALHE
-- ============================================================================

-- Se a query ainda estiver falhando, use esta versão simplificada:
SELECT 
    'CONSULTA SIMPLIFICADA SEM JOIN DE BASES' as alternativa,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.prioridade,
    m.responsavel,
    m.custo,
    o.razao_social as oficina_nome
FROM manutencao m
LEFT JOIN oficinas o ON m.oficina_id = o.id
ORDER BY m.data_solicitacao DESC;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 
    'VERIFICAÇÃO FINAL' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'manutencao' AND column_name = 'base_id'
        ) THEN 'COLUNA base_id EXISTE'
        ELSE 'COLUNA base_id NÃO EXISTE'
    END as coluna_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM bases) THEN 'TABELA bases EXISTE COM DADOS'
        ELSE 'TABELA bases VAZIA OU NÃO EXISTE'
    END as tabela_bases_status;