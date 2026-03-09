-- Script para adicionar coluna tipo_produto APENAS se ela não existir
-- Execute este script no Supabase SQL Editor

-- Função para adicionar coluna apenas se não existir
DO $$ 
BEGIN
    -- Verificar e adicionar para tabela osasco_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='recebimentos_posto_osasco_v2' 
        AND column_name='tipo_produto'
    ) THEN
        ALTER TABLE recebimentos_posto_osasco_v2 
        ADD COLUMN tipo_produto VARCHAR(50) NOT NULL DEFAULT 'diesel';
        RAISE NOTICE 'Coluna tipo_produto adicionada na tabela recebimentos_posto_osasco_v2';
    ELSE
        RAISE NOTICE 'Coluna tipo_produto já existe na tabela recebimentos_posto_osasco_v2';
    END IF;

    -- Verificar e adicionar para tabela abc_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='recebimentos_posto_abc_v2' 
        AND column_name='tipo_produto'
    ) THEN
        ALTER TABLE recebimentos_posto_abc_v2 
        ADD COLUMN tipo_produto VARCHAR(50) NOT NULL DEFAULT 'diesel';
        RAISE NOTICE 'Coluna tipo_produto adicionada na tabela recebimentos_posto_abc_v2';
    ELSE
        RAISE NOTICE 'Coluna tipo_produto já existe na tabela recebimentos_posto_abc_v2';
    END IF;

    -- Verificar e adicionar para tabela alair_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='recebimentos_posto_alair_v2' 
        AND column_name='tipo_produto'
    ) THEN
        ALTER TABLE recebimentos_posto_alair_v2 
        ADD COLUMN tipo_produto VARCHAR(50) NOT NULL DEFAULT 'diesel';
        RAISE NOTICE 'Coluna tipo_produto adicionada na tabela recebimentos_posto_alair_v2';
    ELSE
        RAISE NOTICE 'Coluna tipo_produto já existe na tabela recebimentos_posto_alair_v2';
    END IF;

    -- Verificar e adicionar para tabela campinas_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='recebimentos_posto_campinas_v2' 
        AND column_name='tipo_produto'
    ) THEN
        ALTER TABLE recebimentos_posto_campinas_v2 
        ADD COLUMN tipo_produto VARCHAR(50) NOT NULL DEFAULT 'diesel';
        RAISE NOTICE 'Coluna tipo_produto adicionada na tabela recebimentos_posto_campinas_v2';
    ELSE
        RAISE NOTICE 'Coluna tipo_produto já existe na tabela recebimentos_posto_campinas_v2';
    END IF;

    -- Verificar e adicionar para tabela socorro_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='recebimentos_posto_socorro_v2' 
        AND column_name='tipo_produto'
    ) THEN
        ALTER TABLE recebimentos_posto_socorro_v2 
        ADD COLUMN tipo_produto VARCHAR(50) NOT NULL DEFAULT 'diesel';
        RAISE NOTICE 'Coluna tipo_produto adicionada na tabela recebimentos_posto_socorro_v2';
    ELSE
        RAISE NOTICE 'Coluna tipo_produto já existe na tabela recebimentos_posto_socorro_v2';
    END IF;

    -- Verificar e adicionar para tabela sorocaba_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='recebimentos_posto_sorocaba_v2' 
        AND column_name='tipo_produto'
    ) THEN
        ALTER TABLE recebimentos_posto_sorocaba_v2 
        ADD COLUMN tipo_produto VARCHAR(50) NOT NULL DEFAULT 'diesel';
        RAISE NOTICE 'Coluna tipo_produto adicionada na tabela recebimentos_posto_sorocaba_v2';
    ELSE
        RAISE NOTICE 'Coluna tipo_produto já existe na tabela recebimentos_posto_sorocaba_v2';
    END IF;

END $$;

-- Verificação final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name LIKE 'recebimentos_posto_%_v2' 
AND column_name = 'tipo_produto'
ORDER BY table_name;