-- =====================================================
-- SCRIPT DE CORREÇÃO COMPLETA DO SISTEMA MURICI ON FLEET 2.0
-- Data: 08 de Agosto de 2025
-- Autor: Sistema de Análise Automatizada
-- Objetivo: Corrigir problemas identificados no sistema
-- =====================================================

-- 1. CORREÇÃO DO ENUM USER_ROLE
-- Verificar se os novos valores já existem
DO $$
BEGIN
    -- Adicionar novos roles se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'gestor_equipamentos' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'gestor_equipamentos';
        RAISE NOTICE 'Role gestor_equipamentos adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Role gestor_equipamentos já existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'posto' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'posto';
        RAISE NOTICE 'Role posto adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Role posto já existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'line_hall' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'line_hall';
        RAISE NOTICE 'Role line_hall adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Role line_hall já existe';
    END IF;
END $$;

-- 2. VERIFICAÇÃO E CORREÇÃO DA TABELA USERS
-- Adicionar campos faltantes se necessário
DO $$
BEGIN
    -- Verificar se a coluna created_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela users';
    END IF;

    -- Verificar se a coluna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela users';
    END IF;
END $$;

-- 3. CORREÇÃO DA TABELA CAR_RECEPTIONS
-- Verificar campos obrigatórios
DO $$
BEGIN
    -- Verificar se a coluna request_base_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'car_receptions' AND column_name = 'request_base_id'
    ) THEN
        ALTER TABLE car_receptions ADD COLUMN request_base_id INTEGER REFERENCES bases(id);
        RAISE NOTICE 'Coluna request_base_id adicionada à tabela car_receptions';
    END IF;

    -- Verificar se a coluna responsible_person existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'car_receptions' AND column_name = 'responsible_person'
    ) THEN
        ALTER TABLE car_receptions ADD COLUMN responsible_person TEXT;
        RAISE NOTICE 'Coluna responsible_person adicionada à tabela car_receptions';
    END IF;

    -- Verificar se a coluna description existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'car_receptions' AND column_name = 'description'
    ) THEN
        ALTER TABLE car_receptions ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada à tabela car_receptions';
    END IF;
END $$;

-- 4. CORREÇÃO DA TABELA MAINTENANCE (MANUTENCAO)
-- Adicionar campos para compatibilidade
DO $$
BEGIN
    -- Verificar se a coluna replaced_parts existe na tabela maintenance
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'replaced_parts'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN replaced_parts TEXT;
        RAISE NOTICE 'Coluna replaced_parts adicionada à tabela manutencao';
    END IF;

    -- Verificar se a coluna workshop_id existe na tabela maintenance
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'workshop_id'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN workshop_id INTEGER REFERENCES oficinas(id);
        RAISE NOTICE 'Coluna workshop_id adicionada à tabela manutencao';
    END IF;

    -- Verificar se a coluna request_base_id existe na tabela maintenance
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'request_base_id'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN request_base_id INTEGER REFERENCES bases(id);
        RAISE NOTICE 'Coluna request_base_id adicionada à tabela manutencao';
    END IF;
END $$;

-- 5. CORREÇÃO DA TABELA WORKSHOPS (OFICINAS)
-- Adicionar campo name se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'oficinas' AND column_name = 'name'
    ) THEN
        ALTER TABLE oficinas ADD COLUMN name TEXT;
        -- Copiar dados da razao_social para name se existir
        UPDATE oficinas SET name = razao_social WHERE name IS NULL;
        RAISE NOTICE 'Coluna name adicionada à tabela oficinas';
    END IF;
END $$;

-- 6. VERIFICAÇÃO E CRIAÇÃO DE TABELAS FALTANTES
-- Tabela base_requests (se não existir)
CREATE TABLE IF NOT EXISTS base_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id),
    request_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    priority TEXT DEFAULT 'normal',
    requester_user_id INTEGER NOT NULL REFERENCES users(id),
    assigned_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    vehicle_plate TEXT REFERENCES vehicles(plate)
);

-- Tabela base_request_updates (se não existir)
CREATE TABLE IF NOT EXISTS base_request_updates (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES base_requests(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    message TEXT NOT NULL,
    new_status TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    attachment_url TEXT
);

-- 7. ÍNDICES PARA PERFORMANCE
-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_base_id ON users(base_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_base_id ON vehicles(base_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_placa ON manutencao(placa);
CREATE INDEX IF NOT EXISTS idx_manutencao_status ON manutencao(status);
CREATE INDEX IF NOT EXISTS idx_car_receptions_status ON car_receptions(status);
CREATE INDEX IF NOT EXISTS idx_conferencia_rotas_dados_data ON conferencia_rotas_dados(data);

-- 8. VERIFICAÇÃO DE INTEGRIDADE DOS DADOS
-- Verificar se há registros órfãos e corrigir
UPDATE users SET role = 'admin' WHERE role NOT IN (
    'admin', 'gestor', 'operador', 'oficina', 'pneus', 
    'gestor_frota', 'posto', 'line_hall', 'gestor_equipamentos'
);

-- 9. CONFIGURAÇÃO DE PERMISSIONS
-- Garantir que o usuário admin tenha acesso total
UPDATE users SET is_active = true WHERE role = 'admin';

-- 10. LIMPEZA E OTIMIZAÇÃO
-- Remover registros duplicados se existirem
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) as rn
    FROM users
)
DELETE FROM users WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se todas as tabelas principais existem
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Lista de tabelas essenciais
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        missing_tables := array_append(missing_tables, 'users');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        missing_tables := array_append(missing_tables, 'vehicles');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bases') THEN
        missing_tables := array_append(missing_tables, 'bases');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oficinas') THEN
        missing_tables := array_append(missing_tables, 'oficinas');
    END IF;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Tabelas faltantes: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'Todas as tabelas essenciais estão presentes';
    END IF;
END $$;

-- Mostrar estatísticas do sistema
SELECT 
    'users' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT role) as roles_distintos
FROM users

UNION ALL

SELECT 
    'vehicles' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT base_id) as bases_com_veiculos
FROM vehicles

UNION ALL

SELECT 
    'bases' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN active = true THEN 1 END) as bases_ativas
FROM bases

UNION ALL

SELECT 
    'oficinas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'ativo' THEN 1 END) as oficinas_ativas
FROM oficinas;

-- =====================================================
-- FIM DO SCRIPT - SISTEMA CORRIGIDO
-- =====================================================

RAISE NOTICE '=== CORREÇÃO DO SISTEMA CONCLUÍDA COM SUCESSO ===';
RAISE NOTICE 'Data/Hora: %', NOW();
RAISE NOTICE 'Sistema Murici On Fleet 2.0 atualizado e corrigido';