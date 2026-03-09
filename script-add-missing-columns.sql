-- Script para adicionar colunas faltantes na tabela campinas_budget_requests
-- Execute no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT 'Verificando tabela campinas_budget_requests...' as status;

-- Adicionar colunas se não existirem
DO $$
BEGIN
    -- Adicionar vehicle_plate se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'vehicle_plate'
    ) THEN
        ALTER TABLE campinas_budget_requests 
        ADD COLUMN vehicle_plate VARCHAR(20);
    END IF;

    -- Adicionar vehicle_model se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'vehicle_model'
    ) THEN
        ALTER TABLE campinas_budget_requests 
        ADD COLUMN vehicle_model VARCHAR(100);
    END IF;

    -- Adicionar requester_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'requester_name'
    ) THEN
        ALTER TABLE campinas_budget_requests 
        ADD COLUMN requester_name VARCHAR(100);
    END IF;

    -- Adicionar workshop_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'workshop_name'
    ) THEN
        ALTER TABLE campinas_budget_requests 
        ADD COLUMN workshop_name VARCHAR(200);
    END IF;

    -- Adicionar approver_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'approver_name'
    ) THEN
        ALTER TABLE campinas_budget_requests 
        ADD COLUMN approver_name VARCHAR(100);
    END IF;

    -- Adicionar attachment_url se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE campinas_budget_requests 
        ADD COLUMN attachment_url TEXT;
    END IF;

    RAISE NOTICE 'Colunas adicionadas com sucesso!';
END
$$;

-- Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
ORDER BY ordinal_position;

-- Se a tabela não existir completamente, criar ela do zero
CREATE TABLE IF NOT EXISTS campinas_budget_requests (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER,
    vehicle_plate VARCHAR(20),
    vehicle_model VARCHAR(100),
    description TEXT NOT NULL,
    requested_by INTEGER,
    requester_name VARCHAR(100),
    base_id INTEGER,
    workshop_id INTEGER,
    workshop_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'pendente',
    estimated_value DECIMAL(10,2),
    approved_value DECIMAL(10,2),
    approved_by INTEGER,
    approver_name VARCHAR(100),
    approved_at TIMESTAMP,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

SELECT 'Script executado com sucesso!' as resultado;