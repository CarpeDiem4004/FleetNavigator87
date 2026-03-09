-- SCRIPT COMPLETO DE ATUALIZAÇÃO DO BANCO DE DADOS
-- Versão Final - Corrige todos os problemas identificados

-- ==============================================
-- 1. CORREÇÃO DA TABELA WORKSHOPS
-- ==============================================

-- Garantir que a coluna 'name' existe na tabela workshops
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'name'
    ) THEN
        ALTER TABLE workshops ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Coluna "name" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "name" já existe na tabela workshops';
    END IF;
END
$$;

-- Sincronizar dados entre 'nome' e 'name'
UPDATE workshops 
SET name = COALESCE(nome, razao_social, nome_fantasia, 'Oficina ' || id::text)
WHERE name IS NULL OR name = '';

UPDATE workshops 
SET nome = name 
WHERE nome IS NULL AND name IS NOT NULL;

-- ==============================================
-- 2. VERIFICAÇÃO E CORREÇÃO DA TABELA CAMPINAS_BUDGET_REQUESTS
-- ==============================================

-- Garantir que todas as colunas necessárias existem
DO $$
BEGIN
    -- Coluna chassis
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'chassis'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN chassis VARCHAR(255);
        RAISE NOTICE 'Coluna "chassis" adicionada';
    END IF;

    -- Coluna km
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'km'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN km INTEGER;
        RAISE NOTICE 'Coluna "km" adicionada';
    END IF;

    -- Coluna projeto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'projeto'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN projeto VARCHAR(255);
        RAISE NOTICE 'Coluna "projeto" adicionada';
    END IF;

    -- Coluna vehicle_model
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_model'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_model VARCHAR(255);
        RAISE NOTICE 'Coluna "vehicle_model" adicionada';
    END IF;

    -- Coluna vehicle_plate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_plate'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_plate VARCHAR(255);
        RAISE NOTICE 'Coluna "vehicle_plate" adicionada';
    END IF;

    -- Coluna workshop_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'workshop_name'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN workshop_name VARCHAR(255);
        RAISE NOTICE 'Coluna "workshop_name" adicionada';
    END IF;

    -- Coluna status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'status'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN status VARCHAR(50) DEFAULT 'pendente';
        RAISE NOTICE 'Coluna "status" adicionada';
    END IF;

    -- Coluna created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna "created_at" adicionada';
    END IF;

    -- Coluna updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna "updated_at" adicionada';
    END IF;

    RAISE NOTICE 'Verificação de colunas campinas_budget_requests concluída';
END
$$;

-- ==============================================
-- 3. CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índices para campinas_budget_requests
DO $$
BEGIN
    -- Índice chassis
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_budget_requests_chassis') THEN
        CREATE INDEX idx_budget_requests_chassis ON campinas_budget_requests(chassis);
        RAISE NOTICE 'Índice criado: chassis';
    END IF;

    -- Índice vehicle_plate
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_budget_requests_vehicle_plate') THEN
        CREATE INDEX idx_budget_requests_vehicle_plate ON campinas_budget_requests(vehicle_plate);
        RAISE NOTICE 'Índice criado: vehicle_plate';
    END IF;

    -- Índice workshop_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_budget_requests_workshop_id') THEN
        CREATE INDEX idx_budget_requests_workshop_id ON campinas_budget_requests(workshop_id);
        RAISE NOTICE 'Índice criado: workshop_id';
    END IF;

    -- Índice status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_budget_requests_status') THEN
        CREATE INDEX idx_budget_requests_status ON campinas_budget_requests(status);
        RAISE NOTICE 'Índice criado: status';
    END IF;

    -- Índice created_at
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_budget_requests_created_at') THEN
        CREATE INDEX idx_budget_requests_created_at ON campinas_budget_requests(created_at);
        RAISE NOTICE 'Índice criado: created_at';
    END IF;
END
$$;

-- Índices para workshops
DO $$
BEGIN
    -- Índice name
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workshops_name') THEN
        CREATE INDEX idx_workshops_name ON workshops(name);
        RAISE NOTICE 'Índice criado: workshops.name';
    END IF;

    -- Índice cnpj
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workshops_cnpj') THEN
        CREATE INDEX idx_workshops_cnpj ON workshops(cnpj);
        RAISE NOTICE 'Índice criado: workshops.cnpj';
    END IF;

    -- Índice status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workshops_status') THEN
        CREATE INDEX idx_workshops_status ON workshops(status);
        RAISE NOTICE 'Índice criado: workshops.status';
    END IF;
END
$$;

-- ==============================================
-- 4. TRIGGERS PARA MANTER CONSISTÊNCIA
-- ==============================================

-- Trigger para sincronizar nome/name em workshops
CREATE OR REPLACE FUNCTION sync_workshop_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Se nome foi alterado, atualizar name
    IF OLD.nome IS DISTINCT FROM NEW.nome THEN
        NEW.name = COALESCE(NEW.nome, NEW.razao_social, NEW.nome_fantasia, 'Oficina ' || NEW.id::text);
    END IF;
    
    -- Se name foi alterado, atualizar nome
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        NEW.nome = COALESCE(NEW.name, NEW.razao_social, NEW.nome_fantasia, 'Oficina ' || NEW.id::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover e recriar trigger
DROP TRIGGER IF EXISTS sync_workshop_names_trigger ON workshops;
CREATE TRIGGER sync_workshop_names_trigger
    BEFORE UPDATE ON workshops
    FOR EACH ROW
    EXECUTE FUNCTION sync_workshop_names();

-- Trigger para atualizar updated_at em campinas_budget_requests
CREATE OR REPLACE FUNCTION update_campinas_budget_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover e recriar trigger
DROP TRIGGER IF EXISTS update_campinas_budget_requests_updated_at_trigger ON campinas_budget_requests;
CREATE TRIGGER update_campinas_budget_requests_updated_at_trigger
    BEFORE UPDATE ON campinas_budget_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_campinas_budget_requests_updated_at();

-- ==============================================
-- 5. VALIDAÇÃO E LIMPEZA DE DADOS
-- ==============================================

-- Garantir que não há valores NULL problemáticos
UPDATE workshops 
SET 
    name = COALESCE(name, nome, razao_social, nome_fantasia, 'Oficina ' || id::text),
    nome = COALESCE(nome, name, razao_social, nome_fantasia, 'Oficina ' || id::text),
    status = COALESCE(status, 'ativo')
WHERE name IS NULL OR nome IS NULL OR status IS NULL;

-- Garantir que status em campinas_budget_requests não é NULL
UPDATE campinas_budget_requests 
SET status = 'pendente' 
WHERE status IS NULL;

-- ==============================================
-- 6. VERIFICAÇÃO FINAL
-- ==============================================

-- Mostrar resumo das estruturas
SELECT 
    'workshops' as tabela,
    COUNT(*) as total_colunas,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as colunas
FROM information_schema.columns 
WHERE table_name = 'workshops'
GROUP BY table_name

UNION ALL

SELECT 
    'campinas_budget_requests' as tabela,
    COUNT(*) as total_colunas,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as colunas
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests'
GROUP BY table_name;

-- Verificar índices criados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('workshops', 'campinas_budget_requests')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Mostrar status final
SELECT 'Script de atualização executado com sucesso!' as status;