-- Script COMPLETO para adicionar TODAS as colunas que faltam
-- Execute no Supabase SQL Editor

-- Verificar estrutura atual
SELECT 'VERIFICANDO ESTRUTURA ATUAL:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Adicionar TODAS as colunas necessárias
DO $$
BEGIN
    -- vehicle_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_id') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_id INTEGER;
        RAISE NOTICE 'Adicionada: vehicle_id';
    END IF;

    -- vehicle_plate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_plate') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_plate VARCHAR(20);
        RAISE NOTICE 'Adicionada: vehicle_plate';
    END IF;

    -- vehicle_model
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_model') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_model VARCHAR(100);
        RAISE NOTICE 'Adicionada: vehicle_model';
    END IF;

    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'description') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN description TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Adicionada: description';
    END IF;

    -- requested_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'requested_by') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN requested_by INTEGER;
        RAISE NOTICE 'Adicionada: requested_by';
    END IF;

    -- requester_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'requester_name') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN requester_name VARCHAR(100);
        RAISE NOTICE 'Adicionada: requester_name';
    END IF;

    -- base_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'base_id') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN base_id INTEGER;
        RAISE NOTICE 'Adicionada: base_id';
    END IF;

    -- workshop_id *** ESTA ESTAVA FALTANDO ***
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'workshop_id') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN workshop_id INTEGER;
        RAISE NOTICE 'Adicionada: workshop_id';
    END IF;

    -- workshop_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'workshop_name') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN workshop_name VARCHAR(200);
        RAISE NOTICE 'Adicionada: workshop_name';
    END IF;

    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'status') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN status VARCHAR(50) DEFAULT 'pendente';
        RAISE NOTICE 'Adicionada: status';
    END IF;

    -- estimated_value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'estimated_value') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN estimated_value DECIMAL(10,2);
        RAISE NOTICE 'Adicionada: estimated_value';
    END IF;

    -- approved_value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'approved_value') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approved_value DECIMAL(10,2);
        RAISE NOTICE 'Adicionada: approved_value';
    END IF;

    -- approved_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'approved_by') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approved_by INTEGER;
        RAISE NOTICE 'Adicionada: approved_by';
    END IF;

    -- approver_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'approver_name') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approver_name VARCHAR(100);
        RAISE NOTICE 'Adicionada: approver_name';
    END IF;

    -- approved_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'approved_at') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN approved_at TIMESTAMP;
        RAISE NOTICE 'Adicionada: approved_at';
    END IF;

    -- attachment_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'attachment_url') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN attachment_url TEXT;
        RAISE NOTICE 'Adicionada: attachment_url';
    END IF;

    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'created_at') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Adicionada: created_at';
    END IF;

    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'updated_at') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Adicionada: updated_at';
    END IF;

    RAISE NOTICE 'TODAS AS COLUNAS FORAM VERIFICADAS E ADICIONADAS!';
END
$$;

-- Verificar resultado final
SELECT 'ESTRUTURA FINAL COMPLETA:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar total
SELECT 'TOTAL: ' || COUNT(*) || ' colunas' as resultado
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests';

SELECT 'PRONTO! Agora pode executar o script de dados!' as status;