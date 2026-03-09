-- Script de atualização do banco de dados
-- Executar na ordem para corrigir inconsistências e adicionar novas funcionalidades

-- 1. Corrigir problema da tabela workshops - adicionar coluna 'name' como alias de 'nome'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshops' AND column_name = 'name') THEN
        ALTER TABLE workshops ADD COLUMN name VARCHAR(255);
        -- Copiar dados de 'nome' para 'name'
        UPDATE workshops SET name = nome WHERE nome IS NOT NULL;
        RAISE NOTICE 'Coluna "name" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "name" já existe na tabela workshops';
    END IF;
END
$$;

-- 2. Verificar e garantir que a coluna 'chassis' existe em campinas_budget_requests
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'chassis') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN chassis VARCHAR(255);
        RAISE NOTICE 'Coluna "chassis" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "chassis" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- 3. Verificar se a tabela campinas_budget_requests tem todas as colunas necessárias
DO $$
BEGIN
    -- Verificar coluna 'km'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'km') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN km INTEGER;
        RAISE NOTICE 'Coluna "km" adicionada à tabela campinas_budget_requests';
    END IF;
    
    -- Verificar coluna 'projeto'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'projeto') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN projeto VARCHAR(255);
        RAISE NOTICE 'Coluna "projeto" adicionada à tabela campinas_budget_requests';
    END IF;
    
    -- Verificar coluna 'vehicle_model'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_model') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_model VARCHAR(255);
        RAISE NOTICE 'Coluna "vehicle_model" adicionada à tabela campinas_budget_requests';
    END IF;
END
$$;

-- 4. Criar índices para melhorar performance se não existirem
DO $$
BEGIN
    -- Índice na coluna chassis
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campinas_budget_requests_chassis') THEN
        CREATE INDEX idx_campinas_budget_requests_chassis ON campinas_budget_requests(chassis);
        RAISE NOTICE 'Índice criado para chassis';
    END IF;
    
    -- Índice na coluna vehicle_plate
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campinas_budget_requests_vehicle_plate') THEN
        CREATE INDEX idx_campinas_budget_requests_vehicle_plate ON campinas_budget_requests(vehicle_plate);
        RAISE NOTICE 'Índice criado para vehicle_plate';
    END IF;
    
    -- Índice na coluna workshop_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campinas_budget_requests_workshop_id') THEN
        CREATE INDEX idx_campinas_budget_requests_workshop_id ON campinas_budget_requests(workshop_id);
        RAISE NOTICE 'Índice criado para workshop_id';
    END IF;
    
    -- Índice na coluna status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campinas_budget_requests_status') THEN
        CREATE INDEX idx_campinas_budget_requests_status ON campinas_budget_requests(status);
        RAISE NOTICE 'Índice criado para status';
    END IF;
END
$$;

-- 5. Atualizar trigger para manter sincronização entre 'nome' e 'name' em workshops
DO $$
BEGIN
    -- Criar função para manter sincronização
    CREATE OR REPLACE FUNCTION sync_workshop_name()
    RETURNS TRIGGER AS $func$
    BEGIN
        -- Se 'nome' foi alterado, atualizar 'name'
        IF OLD.nome IS DISTINCT FROM NEW.nome THEN
            NEW.name = NEW.nome;
        END IF;
        
        -- Se 'name' foi alterado, atualizar 'nome'
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            NEW.nome = NEW.name;
        END IF;
        
        RETURN NEW;
    END
    $func$ LANGUAGE plpgsql;
    
    -- Remover trigger se já existir
    DROP TRIGGER IF EXISTS sync_workshop_name_trigger ON workshops;
    
    -- Criar trigger
    CREATE TRIGGER sync_workshop_name_trigger
        BEFORE UPDATE ON workshops
        FOR EACH ROW
        EXECUTE FUNCTION sync_workshop_name();
        
    RAISE NOTICE 'Trigger de sincronização criado para workshops.nome/name';
END
$$;

-- 6. Verificar e corrigir dados existentes
UPDATE workshops SET name = nome WHERE name IS NULL AND nome IS NOT NULL;
UPDATE workshops SET nome = name WHERE nome IS NULL AND name IS NOT NULL;

-- 7. Verificar estrutura final
SELECT 'Verificação da estrutura das tabelas atualizadas:' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('workshops', 'campinas_budget_requests')
ORDER BY table_name, ordinal_position;