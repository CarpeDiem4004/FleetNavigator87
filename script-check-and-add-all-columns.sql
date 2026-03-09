-- Script Completo para Verificar e Adicionar TODAS as Colunas Necessárias
-- Execute no Supabase SQL Editor

-- 1. Primeiro, verificar quais colunas existem atualmente
SELECT 'COLUNAS EXISTENTES:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar TODAS as colunas necessárias (uma por uma)
DO $$
BEGIN
    -- Adicionar requested_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'requested_by'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN requested_by INTEGER;
        RAISE NOTICE 'Coluna requested_by adicionada';
    ELSE
        RAISE NOTICE 'Coluna requested_by já existe';
    END IF;

    -- Adicionar requester_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'requester_name'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN requester_name VARCHAR(100);
        RAISE NOTICE 'Coluna requester_name adicionada';
    ELSE
        RAISE NOTICE 'Coluna requester_name já existe';
    END IF;

    -- Adicionar base_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'base_id'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN base_id INTEGER;
        RAISE NOTICE 'Coluna base_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna base_id já existe';
    END IF;

    -- Adicionar workshop_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'workshop_name'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN workshop_name VARCHAR(200);
        RAISE NOTICE 'Coluna workshop_name adicionada';
    ELSE
        RAISE NOTICE 'Coluna workshop_name já existe';
    END IF;

    -- Adicionar status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN status VARCHAR(50) DEFAULT 'pendente';
        RAISE NOTICE 'Coluna status adicionada';
    ELSE
        RAISE NOTICE 'Coluna status já existe';
    END IF;

    -- Adicionar estimated_value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'estimated_value'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN estimated_value DECIMAL(10,2);
        RAISE NOTICE 'Coluna estimated_value adicionada';
    ELSE
        RAISE NOTICE 'Coluna estimated_value já existe';
    END IF;

    -- Adicionar approved_value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'approved_value'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approved_value DECIMAL(10,2);
        RAISE NOTICE 'Coluna approved_value adicionada';
    ELSE
        RAISE NOTICE 'Coluna approved_value já existe';
    END IF;

    -- Adicionar approved_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approved_by INTEGER;
        RAISE NOTICE 'Coluna approved_by adicionada';
    ELSE
        RAISE NOTICE 'Coluna approved_by já existe';
    END IF;

    -- Adicionar approver_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'approver_name'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approver_name VARCHAR(100);
        RAISE NOTICE 'Coluna approver_name adicionada';
    ELSE
        RAISE NOTICE 'Coluna approver_name já existe';
    END IF;

    -- Adicionar approved_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approved_at TIMESTAMP;
        RAISE NOTICE 'Coluna approved_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna approved_at já existe';
    END IF;

    -- Adicionar attachment_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN attachment_url TEXT;
        RAISE NOTICE 'Coluna attachment_url adicionada';
    ELSE
        RAISE NOTICE 'Coluna attachment_url já existe';
    END IF;

    -- Adicionar created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe';
    END IF;

    -- Adicionar updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;

    RAISE NOTICE 'Script de colunas executado com sucesso!';
END
$$;

-- 3. Verificar estrutura final completa
SELECT 'ESTRUTURA FINAL:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Contar total de colunas
SELECT 'TOTAL DE COLUNAS: ' || COUNT(*) as resultado
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public';