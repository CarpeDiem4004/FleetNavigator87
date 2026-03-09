-- SCRIPT SIMPLES PARA CORRIGIR COLUNAS FALTANTES
-- Dividido em comandos pequenos para evitar erros de sintaxe

-- ==============================================
-- 1. VERIFICAR E ADICIONAR COLUNAS EM WORKSHOPS
-- ==============================================

-- Adicionar coluna 'nome' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'nome'
    ) THEN
        ALTER TABLE workshops ADD COLUMN nome VARCHAR(255) NOT NULL DEFAULT '';
        RAISE NOTICE 'Coluna nome adicionada';
    ELSE
        RAISE NOTICE 'Coluna nome já existe';
    END IF;
END
$$;

-- Adicionar coluna 'name' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'name'
    ) THEN
        ALTER TABLE workshops ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Coluna name adicionada';
    ELSE
        RAISE NOTICE 'Coluna name já existe';
    END IF;
END
$$;

-- Adicionar coluna 'razao_social' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'razao_social'
    ) THEN
        ALTER TABLE workshops ADD COLUMN razao_social VARCHAR(255);
        RAISE NOTICE 'Coluna razao_social adicionada';
    ELSE
        RAISE NOTICE 'Coluna razao_social já existe';
    END IF;
END
$$;

-- Adicionar coluna 'nome_fantasia' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'nome_fantasia'
    ) THEN
        ALTER TABLE workshops ADD COLUMN nome_fantasia VARCHAR(255);
        RAISE NOTICE 'Coluna nome_fantasia adicionada';
    ELSE
        RAISE NOTICE 'Coluna nome_fantasia já existe';
    END IF;
END
$$;

-- Adicionar coluna 'cnpj' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'cnpj'
    ) THEN
        ALTER TABLE workshops ADD COLUMN cnpj VARCHAR(20);
        RAISE NOTICE 'Coluna cnpj adicionada';
    ELSE
        RAISE NOTICE 'Coluna cnpj já existe';
    END IF;
END
$$;

-- ==============================================
-- 2. VERIFICAR E ADICIONAR COLUNAS EM CAMPINAS_BUDGET_REQUESTS
-- ==============================================

-- Adicionar coluna 'chassis' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'chassis'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN chassis VARCHAR(255);
        RAISE NOTICE 'Coluna chassis adicionada';
    ELSE
        RAISE NOTICE 'Coluna chassis já existe';
    END IF;
END
$$;

-- Adicionar coluna 'km' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'km'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN km INTEGER;
        RAISE NOTICE 'Coluna km adicionada';
    ELSE
        RAISE NOTICE 'Coluna km já existe';
    END IF;
END
$$;

-- Adicionar coluna 'vehicle_model' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_model'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_model VARCHAR(100);
        RAISE NOTICE 'Coluna vehicle_model adicionada';
    ELSE
        RAISE NOTICE 'Coluna vehicle_model já existe';
    END IF;
END
$$;

-- Adicionar coluna 'projeto' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'projeto'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN projeto VARCHAR(255);
        RAISE NOTICE 'Coluna projeto adicionada';
    ELSE
        RAISE NOTICE 'Coluna projeto já existe';
    END IF;
END
$$;

-- Adicionar coluna 'vehicle_plate' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_plate'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_plate VARCHAR(20);
        RAISE NOTICE 'Coluna vehicle_plate adicionada';
    ELSE
        RAISE NOTICE 'Coluna vehicle_plate já existe';
    END IF;
END
$$;

-- Adicionar coluna 'workshop_name' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'workshop_name'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN workshop_name VARCHAR(255);
        RAISE NOTICE 'Coluna workshop_name adicionada';
    ELSE
        RAISE NOTICE 'Coluna workshop_name já existe';
    END IF;
END
$$;

-- ==============================================
-- 3. SINCRONIZAR DADOS
-- ==============================================

-- Atualizar campo name usando nome como referência
UPDATE workshops 
SET name = COALESCE(workshops.nome, workshops.razao_social, workshops.nome_fantasia, 'Oficina ' || workshops.id::text)
WHERE workshops.name IS NULL OR workshops.name = '';

-- Atualizar campo nome usando name como referência se nome estiver vazio
UPDATE workshops 
SET nome = COALESCE(workshops.name, workshops.razao_social, workshops.nome_fantasia, 'Oficina ' || workshops.id::text)
WHERE workshops.nome IS NULL OR workshops.nome = '';

-- ==============================================
-- 4. VERIFICAÇÃO SIMPLES
-- ==============================================

-- Contar colunas em workshops
SELECT COUNT(*) as workshops_colunas FROM information_schema.columns WHERE table_name = 'workshops';

-- Contar colunas em campinas_budget_requests
SELECT COUNT(*) as campinas_budget_requests_colunas FROM information_schema.columns WHERE table_name = 'campinas_budget_requests';