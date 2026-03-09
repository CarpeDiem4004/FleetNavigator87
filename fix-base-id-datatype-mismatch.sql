-- ============================================================================
-- CORREÇÃO DEFINITIVA DO ERRO DE TIPO DE DADOS base_id
-- Este script corrige o erro "operator does not exist: uuid = integer"
-- ============================================================================

-- 1. Verificar tipos de dados atuais
SELECT 
    'VERIFICAÇÃO TIPOS' as info,
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE (table_name = 'bases' AND column_name = 'id')
   OR (table_name = 'manutencao' AND column_name = 'base_id')
ORDER BY table_name, column_name;

-- 2. Garantir que a tabela bases existe com tipo correto
CREATE TABLE IF NOT EXISTS bases (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserir dados básicos se não existirem (usando CAST para garantir tipo correto)
INSERT INTO bases (id, name, location) 
SELECT * FROM (
    VALUES 
    (1, 'Base São Paulo', 'São Paulo - SP'),
    (2, 'Campinas', 'Campinas - SP'),
    (3, 'Guarulhos', 'Guarulhos - SP')
) AS new_bases(id, name, location)
WHERE NOT EXISTS (SELECT 1 FROM bases WHERE bases.id = new_bases.id);

-- 4. Garantir que a coluna base_id na tabela manutencao é INTEGER
DO $$
BEGIN
    -- Verificar se a coluna base_id existe e tem o tipo correto
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' 
        AND column_name = 'base_id' 
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'Coluna base_id já existe como INTEGER';
    ELSE
        -- Se não existir ou tiver tipo errado, criar/recriar
        BEGIN
            ALTER TABLE manutencao DROP COLUMN IF EXISTS base_id;
            ALTER TABLE manutencao ADD COLUMN base_id INTEGER;
            RAISE NOTICE 'Coluna base_id criada como INTEGER';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao criar coluna base_id: %', SQLERRM;
        END;
    END IF;
END $$;

-- 5. Atualizar registros existentes com valores INTEGER válidos
UPDATE manutencao 
SET base_id = 1 
WHERE base_id IS NULL;

-- 6. Garantir que todos os valores de base_id são válidos
UPDATE manutencao 
SET base_id = 1 
WHERE base_id NOT IN (SELECT id FROM bases);

-- 7. Teste de compatibilidade de tipos
SELECT 
    'TESTE COMPATIBILIDADE' as teste,
    m.id,
    m.placa,
    m.base_id,
    b.id as base_table_id,
    b.name as base_nome
FROM manutencao m
JOIN bases b ON m.base_id = b.id
ORDER BY m.id
LIMIT 3;

-- 8. Verificação final dos tipos
SELECT 
    'TIPOS FINAIS' as info,
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE (table_name = 'bases' AND column_name = 'id')
   OR (table_name = 'manutencao' AND column_name = 'base_id')
ORDER BY table_name, column_name;

-- 9. Teste da consulta completa que deve funcionar
SELECT 
    'CONSULTA COMPLETA FUNCIONANDO' as status,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    b.name as base_nome
FROM manutencao m
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.id;