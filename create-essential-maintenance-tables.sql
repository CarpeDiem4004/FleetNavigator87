-- ============================================================================
-- CRIAÇÃO DAS TABELAS ESSENCIAIS FALTANTES DO SISTEMA DE MANUTENÇÃO
-- Este script cria as tabelas críticas para completar o sistema
-- ============================================================================

-- 1. HISTÓRICO DE STATUS E WORKFLOW
CREATE TABLE IF NOT EXISTS maintenance_status_history (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    duration_in_status INTEGER -- tempo em minutos no status anterior
);

-- 2. SISTEMA DE APROVAÇÕES
CREATE TABLE IF NOT EXISTS maintenance_approvals (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    approver_id INTEGER REFERENCES users(id),
    approval_type VARCHAR(50), -- 'budget', 'execution', 'completion'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMP,
    budget_limit DECIMAL(10,2),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CUSTOS DETALHADOS
CREATE TABLE IF NOT EXISTS maintenance_costs (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    cost_type VARCHAR(50), -- 'labor', 'parts', 'materials', 'external'
    description TEXT NOT NULL,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    approved_cost DECIMAL(10,2),
    supplier_name VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PEÇAS E MATERIAIS
CREATE TABLE IF NOT EXISTS maintenance_parts (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    part_code VARCHAR(50),
    part_name VARCHAR(255) NOT NULL,
    part_category VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    supplier VARCHAR(255),
    warranty_months INTEGER,
    installation_date DATE,
    notes TEXT
);

-- 5. MÃO DE OBRA DETALHADA
CREATE TABLE IF NOT EXISTS maintenance_labor (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    technician_name VARCHAR(255),
    technician_id INTEGER REFERENCES users(id),
    service_description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    hours_worked DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    work_date DATE
);

-- 6. CRONOGRAMAS DE MANUTENÇÃO PREVENTIVA
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    service_type VARCHAR(100) NOT NULL,
    service_category VARCHAR(50), -- 'preventiva', 'corretiva', 'preditiva'
    interval_km INTEGER,
    interval_months INTEGER,
    last_service_km INTEGER,
    last_service_date DATE,
    next_service_km INTEGER,
    next_service_date DATE,
    priority_level INTEGER DEFAULT 2, -- 1=baixa, 2=média, 3=alta, 4=crítica
    estimated_cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. TEMPLATES DE SERVIÇOS
CREATE TABLE IF NOT EXISTS maintenance_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    vehicle_type VARCHAR(50), -- para filtrar por tipo de veículo
    description TEXT,
    estimated_duration_hours INTEGER,
    estimated_cost DECIMAL(10,2),
    required_parts JSONB, -- lista de peças necessárias
    checklist_items JSONB, -- itens de verificação
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. CATEGORIAS DE MANUTENÇÃO
CREATE TABLE IF NOT EXISTS maintenance_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    priority_level INTEGER DEFAULT 2, -- 1=baixa, 2=média, 3=alta, 4=crítica
    max_response_time_hours INTEGER,
    requires_approval BOOLEAN DEFAULT false,
    color_code VARCHAR(7) -- código de cor hexadecimal para UI
);

-- 9. ESPECIALIDADES DAS OFICINAS
CREATE TABLE IF NOT EXISTS workshop_specialties (
    id SERIAL PRIMARY KEY,
    workshop_id INTEGER REFERENCES oficinas(id),
    specialty_type VARCHAR(100), -- 'motor', 'transmissao', 'freios', 'eletrica'
    certification_level VARCHAR(50),
    certified_until DATE,
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true
);

-- 10. AVALIAÇÕES DE SERVIÇO
CREATE TABLE IF NOT EXISTS workshop_service_ratings (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER REFERENCES manutencao(id),
    workshop_id INTEGER REFERENCES oficinas(id),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    cost_rating INTEGER CHECK (cost_rating >= 1 AND cost_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    overall_rating DECIMAL(3,2),
    comments TEXT,
    would_recommend BOOLEAN,
    rated_by INTEGER REFERENCES users(id),
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. HISTÓRICO COMPLETO POR VEÍCULO
CREATE TABLE IF NOT EXISTS vehicle_maintenance_history (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    maintenance_id INTEGER REFERENCES manutencao(id),
    service_date DATE,
    mileage_at_service INTEGER,
    service_type VARCHAR(100),
    service_category VARCHAR(50),
    total_cost DECIMAL(10,2),
    workshop_id INTEGER REFERENCES oficinas(id),
    next_service_due_km INTEGER,
    next_service_due_date DATE,
    warranty_until DATE
);

-- 12. LOG DE AUDITORIA
CREATE TABLE IF NOT EXISTS maintenance_audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id INTEGER,
    action VARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INSERIR DADOS BÁSICOS
-- ============================================================================

-- Categorias de manutenção padrão
INSERT INTO maintenance_categories (category_name, description, priority_level, max_response_time_hours, requires_approval, color_code) VALUES
('Preventiva', 'Manutenção preventiva programada', 2, 168, false, '#22c55e'),
('Corretiva', 'Reparo de falhas e defeitos', 3, 24, true, '#f59e0b'),
('Emergencial', 'Reparos urgentes e críticos', 4, 4, true, '#ef4444'),
('Preditiva', 'Manutenção baseada em condição', 2, 72, false, '#3b82f6'),
('Motor', 'Serviços relacionados ao motor', 3, 48, true, '#8b5cf6'),
('Freios', 'Sistema de freios e segurança', 4, 12, true, '#dc2626'),
('Transmissão', 'Caixa de câmbio e transmissão', 3, 48, true, '#f97316'),
('Elétrica', 'Sistema elétrico e eletrônico', 2, 72, false, '#06b6d4')
ON CONFLICT (category_name) DO NOTHING;

-- Templates básicos de serviços
INSERT INTO maintenance_templates (template_name, service_category, description, estimated_duration_hours, estimated_cost, created_by) VALUES
('Troca de Óleo e Filtros', 'Preventiva', 'Troca de óleo do motor, filtro de óleo e ar', 2, 250.00, 1),
('Revisão de Freios', 'Preventiva', 'Verificação completa do sistema de freios', 4, 800.00, 1),
('Alinhamento e Balanceamento', 'Preventiva', 'Alinhamento das rodas e balanceamento', 3, 150.00, 1),
('Revisão dos 10.000 km', 'Preventiva', 'Revisão programada aos 10.000 km', 6, 600.00, 1),
('Revisão dos 20.000 km', 'Preventiva', 'Revisão programada aos 20.000 km', 8, 1200.00, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_maintenance_status_history_maintenance_id ON maintenance_status_history(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status_history_changed_at ON maintenance_status_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_approvals_maintenance_id ON maintenance_approvals(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_approvals_status ON maintenance_approvals(status);

CREATE INDEX IF NOT EXISTS idx_maintenance_costs_maintenance_id ON maintenance_costs(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_costs_cost_type ON maintenance_costs(cost_type);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle_id ON maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_service_date ON maintenance_schedules(next_service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_service_km ON maintenance_schedules(next_service_km);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_history_vehicle_id ON vehicle_maintenance_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_history_service_date ON vehicle_maintenance_history(service_date);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 
    'TABELAS CRIADAS COM SUCESSO' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'maintenance_status_history',
    'maintenance_approvals', 
    'maintenance_costs',
    'maintenance_parts',
    'maintenance_labor',
    'maintenance_schedules',
    'maintenance_templates',
    'maintenance_categories',
    'workshop_specialties',
    'workshop_service_ratings',
    'vehicle_maintenance_history',
    'maintenance_audit_log'
);