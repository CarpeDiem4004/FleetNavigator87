-- ============================================================================
-- CORREÇÃO DEFINITIVA DA COLUNA base_id NA TABELA MANUTENCAO
-- Este script garante que a coluna base_id existe e está acessível
-- ============================================================================

-- 1. Verificar se a tabela manutencao existe
SELECT 'TABELA MANUTENCAO EXISTE' as status
FROM information_schema.tables 
WHERE table_name = 'manutencao';

-- 2. Verificar todas as colunas da tabela manutencao
SELECT 
    'COLUNAS ATUAIS' as info,
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'manutencao' 
ORDER BY ordinal_position;

-- 3. Forçar a criação da coluna base_id se não existir
DO $$
BEGIN
    -- Tentar adicionar a coluna base_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'base_id'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN base_id INTEGER;
        RAISE NOTICE 'Coluna base_id adicionada à tabela manutencao';
    ELSE
        RAISE NOTICE 'Coluna base_id já existe na tabela manutencao';
    END IF;
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'Coluna base_id já existe (erro capturado)';
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao adicionar coluna base_id: %', SQLERRM;
END $$;

-- 4. Verificar se a tabela bases existe e criar se necessário
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bases'
    ) THEN
        CREATE TABLE bases (
            id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Inserir dados básicos
        INSERT INTO bases (id, name) VALUES 
        (1, 'Base São Paulo'),
        (2, 'Campinas'),
        (3, 'Guarulhos');
        
        RAISE NOTICE 'Tabela bases criada com dados iniciais';
    ELSE
        RAISE NOTICE 'Tabela bases já existe';
    END IF;
END $$;

-- 5. Atualizar registros existentes com base_id válido
UPDATE manutencao 
SET base_id = 1 
WHERE base_id IS NULL 
AND EXISTS (SELECT 1 FROM bases WHERE id = 1);

-- 6. Verificar a estrutura final
SELECT 
    'ESTRUTURA FINAL' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'manutencao' AND column_name = 'base_id';

-- 7. Testar a consulta com base_id
SELECT 
    'TESTE CONSULTA' as teste,
    id,
    placa,
    base_id
FROM manutencao 
ORDER BY id 
LIMIT 3;

-- 8. Teste do JOIN completo
SELECT 
    'TESTE JOIN COMPLETO' as teste,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    b.name as base_nome
FROM manutencao m
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.id
LIMIT 3;