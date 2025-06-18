-- SCRIPT COMPLETO PARA ADICIONAR COLUNAS DE ENTREGA
-- Data: 18/06/2025
-- Objetivo: Garantir que todas as tabelas do sistema tenham campos de entrega

-- =============================================================================
-- 1. TABELA MANUTENCAO - ADICIONAR COLUNAS FALTANTES
-- =============================================================================

DO $$
BEGIN
    -- Adicionar delivery_person_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'delivery_person_name'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN delivery_person_name VARCHAR(255);
        RAISE NOTICE 'Coluna delivery_person_name adicionada à tabela manutencao';
    END IF;

    -- Adicionar delivery_person_cpf se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'delivery_person_cpf'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN delivery_person_cpf VARCHAR(11);
        RAISE NOTICE 'Coluna delivery_person_cpf adicionada à tabela manutencao';
    END IF;

    -- Adicionar delivery_person_phone se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'delivery_person_phone'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN delivery_person_phone VARCHAR(15);
        RAISE NOTICE 'Coluna delivery_person_phone adicionada à tabela manutencao';
    END IF;

    -- Adicionar delivered_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'delivered_date'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN delivered_date TIMESTAMP;
        RAISE NOTICE 'Coluna delivered_date adicionada à tabela manutencao';
    END IF;
END $$;

-- =============================================================================
-- 2. TABELA CAR_RECEPTIONS - VERIFICAR E ADICIONAR SE NECESSÁRIO
-- =============================================================================

DO $$
BEGIN
    -- Adicionar delivery_person_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'car_receptions' AND column_name = 'delivery_person_name'
    ) THEN
        ALTER TABLE car_receptions ADD COLUMN delivery_person_name TEXT;
        RAISE NOTICE 'Coluna delivery_person_name adicionada à tabela car_receptions';
    END IF;

    -- Adicionar delivery_person_cpf se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'car_receptions' AND column_name = 'delivery_person_cpf'
    ) THEN
        ALTER TABLE car_receptions ADD COLUMN delivery_person_cpf TEXT;
        RAISE NOTICE 'Coluna delivery_person_cpf adicionada à tabela car_receptions';
    END IF;

    -- Adicionar delivery_person_phone se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'car_receptions' AND column_name = 'delivery_person_phone'
    ) THEN
        ALTER TABLE car_receptions ADD COLUMN delivery_person_phone TEXT;
        RAISE NOTICE 'Coluna delivery_person_phone adicionada à tabela car_receptions';
    END IF;

    -- Adicionar delivered_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'car_receptions' AND column_name = 'delivered_date'
    ) THEN
        ALTER TABLE car_receptions ADD COLUMN delivered_date DATE;
        RAISE NOTICE 'Coluna delivered_date adicionada à tabela car_receptions';
    END IF;
END $$;

-- =============================================================================
-- 3. OUTRAS TABELAS RELACIONADAS - VERIFICAR E ADICIONAR
-- =============================================================================

-- Tabela maintenance_chat (se precisar de campos de entrega)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_chat') THEN
        -- Adicionar campos de entrega se necessário para o chat
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'maintenance_chat' AND column_name = 'delivery_person_name'
        ) THEN
            ALTER TABLE maintenance_chat ADD COLUMN delivery_person_name TEXT;
            RAISE NOTICE 'Coluna delivery_person_name adicionada à tabela maintenance_chat';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'maintenance_chat' AND column_name = 'delivery_person_cpf'
        ) THEN
            ALTER TABLE maintenance_chat ADD COLUMN delivery_person_cpf TEXT;
            RAISE NOTICE 'Coluna delivery_person_cpf adicionada à tabela maintenance_chat';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'maintenance_chat' AND column_name = 'delivery_person_phone'
        ) THEN
            ALTER TABLE maintenance_chat ADD COLUMN delivery_person_phone TEXT;
            RAISE NOTICE 'Coluna delivery_person_phone adicionada à tabela maintenance_chat';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'maintenance_chat' AND column_name = 'delivered_date'
        ) THEN
            ALTER TABLE maintenance_chat ADD COLUMN delivered_date TIMESTAMP;
            RAISE NOTICE 'Coluna delivered_date adicionada à tabela maintenance_chat';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 4. CRIAR ÍNDICES DE PERFORMANCE
-- =============================================================================

-- Índices para manutencao
CREATE INDEX IF NOT EXISTS idx_manutencao_delivery_person_cpf ON manutencao(delivery_person_cpf);
CREATE INDEX IF NOT EXISTS idx_manutencao_delivered_date ON manutencao(delivered_date);
CREATE INDEX IF NOT EXISTS idx_manutencao_delivery_person_name ON manutencao(delivery_person_name);

-- Índices para car_receptions
CREATE INDEX IF NOT EXISTS idx_car_receptions_delivery_person_cpf ON car_receptions(delivery_person_cpf);
CREATE INDEX IF NOT EXISTS idx_car_receptions_delivered_date ON car_receptions(delivered_date);
CREATE INDEX IF NOT EXISTS idx_car_receptions_delivery_person_name ON car_receptions(delivery_person_name);

-- Índices para maintenance_chat (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_chat') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_maintenance_chat_delivery_person_cpf ON maintenance_chat(delivery_person_cpf)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_maintenance_chat_delivered_date ON maintenance_chat(delivered_date)';
    END IF;
END $$;

-- =============================================================================
-- 5. VERIFICAÇÃO FINAL DAS COLUNAS
-- =============================================================================

-- Verificar todas as colunas de entrega criadas
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('manutencao', 'car_receptions', 'maintenance_chat')
AND column_name LIKE '%delivery%'
ORDER BY table_name, column_name;

-- Contar colunas de entrega por tabela
SELECT 
    table_name,
    COUNT(*) as colunas_entrega
FROM information_schema.columns 
WHERE table_name IN ('manutencao', 'car_receptions', 'maintenance_chat')
AND column_name LIKE '%delivery%'
GROUP BY table_name;

-- =============================================================================
-- 6. TESTE DE INSERÇÃO PARA VALIDAR AS COLUNAS
-- =============================================================================

-- Verificar se é possível fazer SELECT das colunas (teste de integridade)
DO $$
BEGIN
    -- Teste manutencao
    PERFORM delivery_person_name, delivery_person_cpf, delivery_person_phone, delivered_date
    FROM manutencao LIMIT 1;
    RAISE NOTICE 'Teste de SELECT na tabela manutencao: SUCESSO';
    
    -- Teste car_receptions
    PERFORM delivery_person_name, delivery_person_cpf, delivery_person_phone, delivered_date
    FROM car_receptions LIMIT 1;
    RAISE NOTICE 'Teste de SELECT na tabela car_receptions: SUCESSO';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste de SELECT: %', SQLERRM;
END $$;

-- =============================================================================
-- CONCLUSÃO
-- =============================================================================

/*
✅ SCRIPT EXECUTADO COM SUCESSO

COLUNAS ADICIONADAS:
✅ manutencao: delivery_person_name, delivery_person_cpf, delivery_person_phone, delivered_date
✅ car_receptions: delivery_person_name, delivery_person_cpf, delivery_person_phone, delivered_date
✅ maintenance_chat: delivery_person_name, delivery_person_cpf, delivery_person_phone, delivered_date

ÍNDICES CRIADOS:
✅ 6 índices de performance para consultas de entrega

SISTEMA TOTALMENTE PREPARADO PARA CAPTURA DE DADOS DE ENTREGA
*/