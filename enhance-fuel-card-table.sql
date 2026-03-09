-- Script para melhorar a tabela fuel_card_requests com as novas funcionalidades
-- Adiciona campos que podem estar faltando para as funcionalidades do sistema Enhanced

-- Verificar se a coluna fuel_time existe e adicionar se necessário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_card_requests' 
                   AND column_name = 'fuel_time') THEN
        ALTER TABLE fuel_card_requests ADD COLUMN fuel_time VARCHAR(50);
        RAISE NOTICE 'Coluna fuel_time adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna fuel_time já existe';
    END IF;
END
$$;

-- Verificar se a coluna specific_card_data existe e adicionar se necessário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_card_requests' 
                   AND column_name = 'specific_card_data') THEN
        ALTER TABLE fuel_card_requests ADD COLUMN specific_card_data TEXT;
        RAISE NOTICE 'Coluna specific_card_data adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna specific_card_data já existe';
    END IF;
END
$$;

-- Verificar se a coluna processed_by existe e adicionar se necessário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_card_requests' 
                   AND column_name = 'processed_by') THEN
        ALTER TABLE fuel_card_requests ADD COLUMN processed_by VARCHAR(255);
        RAISE NOTICE 'Coluna processed_by adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna processed_by já existe';
    END IF;
END
$$;

-- Verificar se a coluna processed_at existe e adicionar se necessário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_card_requests' 
                   AND column_name = 'processed_at') THEN
        ALTER TABLE fuel_card_requests ADD COLUMN processed_at TIMESTAMP;
        RAISE NOTICE 'Coluna processed_at adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna processed_at já existe';
    END IF;
END
$$;

-- Atualizar constraint do campo status para incluir 'processado'
DO $$
BEGIN
    -- Primeiro remover constraint existente se houver
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'fuel_card_requests' 
               AND constraint_name = 'fuel_card_requests_status_check') THEN
        ALTER TABLE fuel_card_requests DROP CONSTRAINT fuel_card_requests_status_check;
        RAISE NOTICE 'Constraint de status removida';
    END IF;
    
    -- Adicionar nova constraint com 'processado'
    ALTER TABLE fuel_card_requests ADD CONSTRAINT fuel_card_requests_status_check 
        CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'processado'));
    RAISE NOTICE 'Constraint de status atualizada com processado';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint já existe com os valores corretos';
END
$$;

-- Verificar se a coluna base_id tem relacionamento com tabela bases
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'fuel_card_requests' 
                   AND constraint_name = 'fk_fuel_card_requests_base') THEN
        ALTER TABLE fuel_card_requests 
        ADD CONSTRAINT fk_fuel_card_requests_base 
        FOREIGN KEY (base_id) REFERENCES bases(id);
        RAISE NOTICE 'Foreign key para bases adicionada';
    ELSE
        RAISE NOTICE 'Foreign key para bases já existe';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key para bases já existe';
END
$$;

-- Verificar se a coluna project_id tem relacionamento com tabela projects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'fuel_card_requests' 
                   AND constraint_name = 'fk_fuel_card_requests_project') THEN
        ALTER TABLE fuel_card_requests 
        ADD CONSTRAINT fk_fuel_card_requests_project 
        FOREIGN KEY (project_id) REFERENCES projects(id);
        RAISE NOTICE 'Foreign key para projects adicionada';
    ELSE
        RAISE NOTICE 'Foreign key para projects já existe';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key para projects já existe';
END
$$;

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_fuel_card_requests_base_id ON fuel_card_requests(base_id);
CREATE INDEX IF NOT EXISTS idx_fuel_card_requests_project_id ON fuel_card_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_fuel_card_requests_status ON fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_fuel_card_requests_requested_at ON fuel_card_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_fuel_card_requests_provider ON fuel_card_requests(provider);

-- Verificar se a tabela project_bases tem a coluna base_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_bases' 
                   AND column_name = 'base_id') THEN
        ALTER TABLE project_bases ADD COLUMN base_id INTEGER;
        RAISE NOTICE 'Coluna base_id adicionada à tabela project_bases';
    ELSE
        RAISE NOTICE 'Coluna base_id já existe na tabela project_bases';
    END IF;
END
$$;

-- Criar tabela para armazenar configurações de provedores de cartão se não existir
CREATE TABLE IF NOT EXISTS fuel_card_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir provedores padrão se não existirem
INSERT INTO fuel_card_providers (name, code, is_active) VALUES 
('Ticket', 'TICKET', true),
('Alelo', 'ALELO', true)
ON CONFLICT (code) DO NOTHING;

-- Criar tabela para armazenar tipos de combustível se não existir
CREATE TABLE IF NOT EXISTS fuel_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir tipos de combustível padrão se não existirem
INSERT INTO fuel_types (name, code, is_active) VALUES 
('Gasolina', 'GAS', true),
('Etanol', 'ETA', true),
('Diesel', 'DIE', true),
('Diesel S10', 'DS10', true)
ON CONFLICT (code) DO NOTHING;

-- Criar tabela para armazenar horários de abastecimento se não existir
CREATE TABLE IF NOT EXISTS fuel_timing_options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir horários padrão se não existirem
INSERT INTO fuel_timing_options (name, code, is_active) VALUES 
('Antes das 17h', 'BEFORE_17', true),
('Após as 18h', 'AFTER_18', true)
ON CONFLICT (code) DO NOTHING;

-- Relatório final
SELECT 
    'fuel_card_requests' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN fuel_type IS NOT NULL THEN 1 END) as with_fuel_type,
    COUNT(CASE WHEN provider IS NOT NULL THEN 1 END) as with_provider,
    COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) as with_project,
    COUNT(CASE WHEN card_type IS NOT NULL THEN 1 END) as with_card_type,
    COUNT(CASE WHEN odometer IS NOT NULL THEN 1 END) as with_odometer,
    COUNT(CASE WHEN driver_name IS NOT NULL THEN 1 END) as with_driver_name,
    COUNT(CASE WHEN driver_phone IS NOT NULL THEN 1 END) as with_driver_phone
FROM fuel_card_requests

UNION ALL

SELECT 
    'fuel_card_providers' as table_name,
    COUNT(*) as total_records,
    0,0,0,0,0,0,0
FROM fuel_card_providers

UNION ALL

SELECT 
    'fuel_types' as table_name,
    COUNT(*) as total_records,
    0,0,0,0,0,0,0
FROM fuel_types

UNION ALL

SELECT 
    'fuel_timing_options' as table_name,
    COUNT(*) as total_records,
    0,0,0,0,0,0,0
FROM fuel_timing_options;

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '=== SCRIPT DE MELHORIA CONCLUÍDO ===';
    RAISE NOTICE 'Tabela fuel_card_requests atualizada com sucesso';
    RAISE NOTICE 'Tabelas auxiliares criadas: fuel_card_providers, fuel_types, fuel_timing_options';
    RAISE NOTICE 'Relacionamentos e índices criados';
    RAISE NOTICE 'Sistema pronto para as funcionalidades Enhanced!';
END
$$;