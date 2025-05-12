-- Script SQL para complementar o sistema de gestão de oficinas
-- Criando tabelas adicionais necessárias para o funcionamento completo do módulo

-- 1. Tabela de orçamentos de oficinas
CREATE TABLE IF NOT EXISTS workshop_budgets (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(10) NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('preventiva', 'corretiva', 'emergencial', 'revisao')),
    description TEXT NOT NULL,
    total_value DECIMAL(10, 2) NOT NULL,
    parts_value DECIMAL(10, 2),
    labor_value DECIMAL(10, 2),
    estimated_time INTEGER, -- Tempo estimado em horas
    status VARCHAR(50) NOT NULL CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'finalizado')),
    priority VARCHAR(20) CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_workshop_budgets_workshop_id ON workshop_budgets(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_budgets_status ON workshop_budgets(status);
CREATE INDEX IF NOT EXISTS idx_workshop_budgets_vehicle_plate ON workshop_budgets(vehicle_plate);

-- 2. Tabela de documentos de oficinas
CREATE TABLE IF NOT EXISTS workshop_documents (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('cnpj', 'alvara', 'contrato', 'certificacao', 'outros')),
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    observations TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_documents_workshop_id ON workshop_documents(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_documents_status ON workshop_documents(status);

-- 3. Tabela de partes/peças do orçamento
CREATE TABLE IF NOT EXISTS workshop_budget_parts (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES workshop_budgets(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    is_original BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_workshop_budget_parts_budget_id ON workshop_budget_parts(budget_id);

-- 4. Tabela de serviços do orçamento
CREATE TABLE IF NOT EXISTS workshop_budget_services (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES workshop_budgets(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,
    hours_estimated DECIMAL(5, 2) NOT NULL,
    hour_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workshop_budget_services_budget_id ON workshop_budget_services(budget_id);

-- 5. Tabela de histórico de status de orçamentos
CREATE TABLE IF NOT EXISTS workshop_budget_history (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES workshop_budgets(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    observations TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workshop_budget_history_budget_id ON workshop_budget_history(budget_id);

-- 6. Tabela para informações de perfil adicionais de oficinas
CREATE TABLE IF NOT EXISTS workshop_profiles (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    cnpj VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    website VARCHAR(255),
    opening_hours VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    rating DECIMAL(3, 2),
    banking_info TEXT,
    payment_terms TEXT,
    warranty_terms TEXT,
    logo_url TEXT,
    service_area TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_profiles_workshop_id ON workshop_profiles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_profiles_cnpj ON workshop_profiles(cnpj);

-- 7. Tabela para veículos em manutenção nas oficinas
CREATE TABLE IF NOT EXISTS workshop_vehicles_in_maintenance (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    vehicle_plate VARCHAR(10) NOT NULL,
    vehicle_model VARCHAR(100),
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_exit_date TIMESTAMP,
    actual_exit_date TIMESTAMP,
    initial_diagnosis TEXT,
    current_status VARCHAR(50) CHECK (current_status IN ('aguardando_diagnostico', 'em_manutencao', 'aguardando_pecas', 'aguardando_aprovacao', 'finalizado', 'entregue')),
    budget_id INTEGER REFERENCES workshop_budgets(id),
    observations TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_in_maintenance_workshop_id ON workshop_vehicles_in_maintenance(workshop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_in_maintenance_vehicle_plate ON workshop_vehicles_in_maintenance(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_in_maintenance_status ON workshop_vehicles_in_maintenance(current_status);

-- Trigger para atualizar o timestamp de updated_at automaticamente nas tabelas que o possuem
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger nas tabelas que possuem a coluna updated_at
CREATE TRIGGER update_workshop_budgets_modtime
    BEFORE UPDATE ON workshop_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_workshop_profiles_modtime
    BEFORE UPDATE ON workshop_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_vehicles_in_maintenance_modtime
    BEFORE UPDATE ON workshop_vehicles_in_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger para registrar mudanças de status de orçamentos
CREATE OR REPLACE FUNCTION log_budget_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO workshop_budget_history (
            budget_id, 
            previous_status, 
            new_status,
            user_id,
            observations
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.approved_by, 1), -- Usando o ID 1 (admin) como padrão se approved_by for NULL
            'Alteração automática via sistema'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_workshop_budget_status_change
    AFTER UPDATE ON workshop_budgets
    FOR EACH ROW
    EXECUTE FUNCTION log_budget_status_changes();

-- View para facilitar consultas de orçamentos completos com partes e serviços
CREATE OR REPLACE VIEW vw_workshop_budgets_complete AS
SELECT 
    b.id,
    b.workshop_id,
    w.name AS workshop_name,
    b.vehicle_plate,
    b.maintenance_type,
    b.description,
    b.total_value,
    b.parts_value,
    b.labor_value,
    b.estimated_time,
    b.status,
    b.priority,
    b.approved_by,
    u.name AS approved_by_name,
    b.approved_at,
    b.created_at,
    b.updated_at,
    COALESCE(
        (SELECT COUNT(*) FROM workshop_budget_parts WHERE budget_id = b.id), 
        0
    ) AS parts_count,
    COALESCE(
        (SELECT COUNT(*) FROM workshop_budget_services WHERE budget_id = b.id), 
        0
    ) AS services_count
FROM 
    workshop_budgets b
    LEFT JOIN workshops w ON b.workshop_id = w.id
    LEFT JOIN users u ON b.approved_by = u.id;

-- View para veículos em manutenção com informações da oficina
CREATE OR REPLACE VIEW vw_vehicles_in_maintenance AS
SELECT 
    v.id,
    v.workshop_id,
    w.name AS workshop_name,
    v.vehicle_plate,
    v.vehicle_model,
    v.entry_date,
    v.expected_exit_date,
    v.actual_exit_date,
    v.initial_diagnosis,
    v.current_status,
    v.budget_id,
    b.total_value AS budget_value,
    b.status AS budget_status,
    CASE 
        WHEN v.expected_exit_date IS NOT NULL AND v.actual_exit_date IS NULL AND v.expected_exit_date < CURRENT_TIMESTAMP THEN TRUE
        ELSE FALSE
    END AS is_delayed,
    CASE 
        WHEN v.actual_exit_date IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (v.actual_exit_date - v.entry_date))/86400
        ELSE
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v.entry_date))/86400
    END AS days_in_maintenance,
    v.observations,
    v.updated_at
FROM 
    workshop_vehicles_in_maintenance v
    LEFT JOIN workshops w ON v.workshop_id = w.id
    LEFT JOIN workshop_budgets b ON v.budget_id = b.id;