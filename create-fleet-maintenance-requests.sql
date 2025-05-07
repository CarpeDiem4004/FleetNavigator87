-- Tabela para solicitações de manutenção de frota
CREATE TABLE IF NOT EXISTS fleet_maintenance_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(50),
    maintenance_type VARCHAR(50) NOT NULL CHECK (
        maintenance_type IN ('preventiva', 'corretiva', 'emergencial', 'revisao')
    ),
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('baixa', 'normal', 'alta', 'urgente')
    ),
    requested_by INTEGER NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Dados de agendamento
    preferred_date DATE,
    estimated_duration INTEGER, -- em horas
    
    -- Dados de status e aprovação
    status VARCHAR(30) DEFAULT 'pendente' CHECK (
        status IN (
            'pendente', 'aprovado', 'em_execucao', 'concluido', 
            'cancelado', 'reprovado', 'aguardando_peca'
        )
    ),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Dados da execução
    assigned_to INTEGER REFERENCES users(id),
    scheduled_date DATE,
    completion_date DATE,
    km_at_service INTEGER,
    service_notes TEXT,
    
    -- Custos
    parts_cost DECIMAL(10, 2) DEFAULT 0,
    labor_cost DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (parts_cost + labor_cost) STORED,
    
    -- Rastreabilidade
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_base_id ON fleet_maintenance_requests(base_id);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_vehicle ON fleet_maintenance_requests(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_status ON fleet_maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_requested_by ON fleet_maintenance_requests(requested_by);

-- View para visualização de solicitações de manutenção da frota
CREATE OR REPLACE VIEW vw_fleet_maintenance_requests AS
SELECT 
    fm.id,
    fm.vehicle_plate,
    fm.vehicle_model,
    fm.maintenance_type,
    fm.description,
    fm.priority,
    fm.status,
    fm.requested_at,
    fm.approved_at,
    fm.scheduled_date,
    fm.completion_date,
    fm.parts_cost,
    fm.labor_cost,
    fm.total_cost,
    b.name AS base_name,
    b.id AS base_id,
    req.name AS requested_by_name,
    req.id AS requested_by_id,
    app.name AS approved_by_name,
    asg.name AS assigned_to_name,
    CASE 
        WHEN fm.status = 'pendente' THEN 
            EXTRACT(DAY FROM (NOW() - fm.requested_at))
        ELSE 0
    END AS days_pending
FROM fleet_maintenance_requests fm
JOIN bases b ON fm.base_id = b.id
JOIN users req ON fm.requested_by = req.id
LEFT JOIN users app ON fm.approved_by = app.id
LEFT JOIN users asg ON fm.assigned_to = asg.id;

-- Tabela para histórico de manutenções
CREATE TABLE IF NOT EXISTS fleet_maintenance_history (
    id SERIAL PRIMARY KEY,
    maintenance_request_id INTEGER NOT NULL REFERENCES fleet_maintenance_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_history_request_id 
    ON fleet_maintenance_history(maintenance_request_id);