-- SQL para criar as tabelas necessárias para o sistema de armazenamento
-- Por: IA Replit
-- Data: 08/05/2025

-- 1. Tabela de manutenção (referenciada nos logs)
CREATE TABLE IF NOT EXISTS manutencao (
    id SERIAL PRIMARY KEY,
    vehicle_plate VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    priority VARCHAR(20) NOT NULL DEFAULT 'media',
    maintenance_type VARCHAR(30) NOT NULL,
    workshop_id INTEGER,
    request_base_id INTEGER,
    estimated_completion DATE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE,
    cost NUMERIC(10, 2),
    responsible_person VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de notas fiscais
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    cnpj_emitente VARCHAR(20) NOT NULL,
    razao_social_emitente VARCHAR(200) NOT NULL,
    data_emissao DATE NOT NULL,
    valor_total NUMERIC(12, 2) NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    file_path TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    budget_request_id INTEGER,
    base_id INTEGER,
    base_name TEXT,
    uploader_id INTEGER,
    uploader_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela genérica de documentos
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo_documento VARCHAR(50) NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    file_path TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    tags TEXT[],
    entidade_relacionada VARCHAR(50),
    entidade_id INTEGER,
    uploader_id INTEGER,
    uploader_name TEXT,
    data_documento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de configuração dos buckets de armazenamento
CREATE TABLE IF NOT EXISTS storage_buckets (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    tipo_armazenamento VARCHAR(50) NOT NULL DEFAULT 'supabase',
    caminho_padrao TEXT,
    publica BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Modificar a tabela budget_attachments para adicionar o campo de descrição caso não exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'budget_attachments'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE budget_attachments ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'budget_attachments'
        AND column_name = 'migrated_at'
    ) THEN
        ALTER TABLE budget_attachments ADD COLUMN migrated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'budget_attachments'
        AND column_name = 'migrated_by'
    ) THEN
        ALTER TABLE budget_attachments ADD COLUMN migrated_by INTEGER;
    END IF;
END $$;

-- 6. Inserir buckets padrão no sistema
INSERT INTO storage_buckets (nome, descricao, tipo_armazenamento, publica)
VALUES 
    ('budget-attachments', 'Anexos de solicitações de orçamento', 'supabase', FALSE),
    ('notas-fiscais', 'Armazenamento de notas fiscais', 'supabase', FALSE),
    ('documentos-veiculos', 'Documentos relacionados a veículos', 'supabase', FALSE),
    ('documentos-motoristas', 'Documentos de motoristas', 'supabase', FALSE)
ON CONFLICT (nome) DO NOTHING;

-- Adicionar triggers para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para cada tabela
DO $$
DECLARE
    tables TEXT[] := ARRAY['budget_attachments', 'notas_fiscais', 'documentos', 'storage_buckets', 'manutencao'];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- Verificar se o trigger já existe
            IF NOT EXISTS (
                SELECT FROM information_schema.triggers 
                WHERE trigger_name = 'update_' || t || '_modtime' 
                AND event_object_table = t
            ) THEN
                EXECUTE format('
                    CREATE TRIGGER update_%I_modtime
                    BEFORE UPDATE ON %I
                    FOR EACH ROW
                    EXECUTE FUNCTION update_modified_column();
                ', t, t);
            END IF;
        END IF;
    END LOOP;
END $$;