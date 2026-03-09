-- SCRIPT DEFINITIVO PARA CORRIGIR TODAS AS COLUNAS FALTANTES
-- Este script verifica e cria todas as colunas necessárias de forma segura

-- ==============================================
-- 1. VERIFICAR E CORRIGIR TABELA WORKSHOPS
-- ==============================================

-- Adicionar coluna 'nome' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'nome'
    ) THEN
        ALTER TABLE workshops ADD COLUMN nome VARCHAR(255) NOT NULL DEFAULT '';
        RAISE NOTICE 'Coluna "nome" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "nome" já existe na tabela workshops';
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
        RAISE NOTICE 'Coluna "name" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "name" já existe na tabela workshops';
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
        RAISE NOTICE 'Coluna "razao_social" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "razao_social" já existe na tabela workshops';
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
        RAISE NOTICE 'Coluna "nome_fantasia" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "nome_fantasia" já existe na tabela workshops';
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
        RAISE NOTICE 'Coluna "cnpj" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "cnpj" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'telefone' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'telefone'
    ) THEN
        ALTER TABLE workshops ADD COLUMN telefone VARCHAR(20);
        RAISE NOTICE 'Coluna "telefone" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "telefone" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'email' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'email'
    ) THEN
        ALTER TABLE workshops ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Coluna "email" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "email" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'endereco' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'endereco'
    ) THEN
        ALTER TABLE workshops ADD COLUMN endereco TEXT;
        RAISE NOTICE 'Coluna "endereco" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "endereco" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'responsavel' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'responsavel'
    ) THEN
        ALTER TABLE workshops ADD COLUMN responsavel VARCHAR(255);
        RAISE NOTICE 'Coluna "responsavel" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "responsavel" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'tipo' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'tipo'
    ) THEN
        ALTER TABLE workshops ADD COLUMN tipo VARCHAR(50) DEFAULT 'oficina';
        RAISE NOTICE 'Coluna "tipo" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "tipo" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'status' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'status'
    ) THEN
        ALTER TABLE workshops ADD COLUMN status VARCHAR(50) DEFAULT 'ativo';
        RAISE NOTICE 'Coluna "status" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "status" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'password' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'password'
    ) THEN
        ALTER TABLE workshops ADD COLUMN password VARCHAR(255);
        RAISE NOTICE 'Coluna "password" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "password" já existe na tabela workshops';
    END IF;
END
$$;

-- Adicionar coluna 'token' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workshops' AND column_name = 'token'
    ) THEN
        ALTER TABLE workshops ADD COLUMN token VARCHAR(255);
        RAISE NOTICE 'Coluna "token" adicionada à tabela workshops';
    ELSE
        RAISE NOTICE 'Coluna "token" já existe na tabela workshops';
    END IF;
END
$$;

-- ==============================================
-- 2. VERIFICAR E CORRIGIR TABELA CAMPINAS_BUDGET_REQUESTS
-- ==============================================

-- Adicionar coluna 'vehicle_plate' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'vehicle_plate'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN vehicle_plate VARCHAR(20);
        RAISE NOTICE 'Coluna "vehicle_plate" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "vehicle_plate" já existe na tabela campinas_budget_requests';
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
        RAISE NOTICE 'Coluna "km" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "km" já existe na tabela campinas_budget_requests';
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
        RAISE NOTICE 'Coluna "vehicle_model" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "vehicle_model" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'chassis' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'chassis'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN chassis VARCHAR(255);
        RAISE NOTICE 'Coluna "chassis" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "chassis" já existe na tabela campinas_budget_requests';
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
        RAISE NOTICE 'Coluna "projeto" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "projeto" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'base_id' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'base_id'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN base_id INTEGER;
        RAISE NOTICE 'Coluna "base_id" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "base_id" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'workshop_id' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'workshop_id'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN workshop_id INTEGER;
        RAISE NOTICE 'Coluna "workshop_id" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "workshop_id" já existe na tabela campinas_budget_requests';
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
        RAISE NOTICE 'Coluna "workshop_name" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "workshop_name" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'description' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'description'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN description TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Coluna "description" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "description" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'requested_by' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'requested_by'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN requested_by INTEGER;
        RAISE NOTICE 'Coluna "requested_by" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "requested_by" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'requester_name' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'requester_name'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN requester_name VARCHAR(255);
        RAISE NOTICE 'Coluna "requester_name" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "requester_name" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'status' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'status'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN status VARCHAR(50) DEFAULT 'pendente';
        RAISE NOTICE 'Coluna "status" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "status" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'created_at' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna "created_at" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "created_at" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- Adicionar coluna 'updated_at' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna "updated_at" adicionada à tabela campinas_budget_requests';
    ELSE
        RAISE NOTICE 'Coluna "updated_at" já existe na tabela campinas_budget_requests';
    END IF;
END
$$;

-- ==============================================
-- 3. SINCRONIZAR DADOS DE FORMA SEGURA
-- ==============================================

-- Sincronizar name e nome na tabela workshops de forma segura
UPDATE workshops 
SET name = COALESCE(
    workshops.nome, 
    workshops.razao_social, 
    workshops.nome_fantasia, 
    'Oficina ' || workshops.id::text
)
WHERE workshops.name IS NULL OR workshops.name = '';

UPDATE workshops 
SET nome = COALESCE(
    workshops.name, 
    workshops.razao_social, 
    workshops.nome_fantasia, 
    'Oficina ' || workshops.id::text
)
WHERE workshops.nome IS NULL OR workshops.nome = '';

-- Garantir que status não é NULL
UPDATE workshops 
SET status = 'ativo' 
WHERE status IS NULL;

UPDATE campinas_budget_requests 
SET status = 'pendente' 
WHERE status IS NULL;

-- ==============================================
-- 4. VERIFICAÇÃO FINAL
-- ==============================================

-- Mostrar estrutura final das tabelas
SELECT 
    'workshops' as tabela,
    column_name,
    data_type,
    'OK' as status
FROM information_schema.columns 
WHERE table_name = 'workshops'
ORDER BY ordinal_position

UNION ALL

SELECT 
    'campinas_budget_requests' as tabela,
    column_name,
    data_type,
    'OK' as status
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests'
ORDER BY ordinal_position;