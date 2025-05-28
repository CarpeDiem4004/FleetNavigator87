-- Tabelas complementares para sistema completo de guinchos

-- 1. Tabela para cotações/orçamentos de serviços
CREATE TABLE IF NOT EXISTS towing_service_quotes (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES towing_service_requests(id),
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    base_cost DECIMAL(10, 2) NOT NULL,
    distance_cost DECIMAL(10, 2) DEFAULT 0,
    additional_costs JSONB, -- {night_fee: 50, holiday_fee: 100, etc}
    total_cost DECIMAL(10, 2) NOT NULL,
    estimated_arrival_time INTEGER, -- minutos
    validity_hours INTEGER DEFAULT 24,
    status VARCHAR(30) DEFAULT 'pending', -- pending, accepted, rejected, expired
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. Tabela para rastreamento em tempo real
CREATE TABLE IF NOT EXISTS towing_service_tracking (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES towing_service_requests(id),
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    status VARCHAR(50) NOT NULL, -- dispatched, en_route, arrived, loading, transporting, completed
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    completion_time TIMESTAMP WITH TIME ZONE,
    distance_traveled DECIMAL(8, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela para documentos dos serviços (fotos, relatórios)
CREATE TABLE IF NOT EXISTS towing_service_documents (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES towing_service_requests(id),
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    document_type VARCHAR(50) NOT NULL, -- photo_before, photo_after, damage_report, receipt
    file_name VARCHAR(200) NOT NULL,
    file_path TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela para equipamentos dos parceiros
CREATE TABLE IF NOT EXISTS partner_equipment (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    equipment_type VARCHAR(50) NOT NULL, -- truck, crane, flatbed, hook
    model VARCHAR(100),
    capacity_kg INTEGER,
    license_plate VARCHAR(20),
    year_manufacture INTEGER,
    insurance_expires TIMESTAMP WITH TIME ZONE,
    last_inspection TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'active', -- active, maintenance, inactive
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela para áreas de cobertura dos parceiros
CREATE TABLE IF NOT EXISTS partner_coverage_areas (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    area_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_codes TEXT[], -- Array de CEPs cobertos
    coordinates JSONB, -- Polígono da área de cobertura
    max_distance_km INTEGER DEFAULT 50,
    priority_level INTEGER DEFAULT 1, -- 1=alta, 2=média, 3=baixa
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela para disponibilidade dos parceiros
CREATE TABLE IF NOT EXISTS partner_availability (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    date_available DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    max_services INTEGER DEFAULT 5,
    current_services INTEGER DEFAULT 0,
    emergency_only BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_id, date_available, time_start)
);

-- 7. Tabela para processos de pagamento
CREATE TABLE IF NOT EXISTS towing_payment_processes (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES towing_service_requests(id),
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    invoice_number VARCHAR(50),
    gross_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(30), -- pix, bank_transfer, credit_card
    payment_status VARCHAR(30) DEFAULT 'pending', -- pending, processing, paid, failed
    payment_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela para emergências 24h
CREATE TABLE IF NOT EXISTS emergency_services (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES towing_service_requests(id),
    emergency_level VARCHAR(20) NOT NULL, -- low, medium, high, critical
    police_involved BOOLEAN DEFAULT false,
    fire_department_involved BOOLEAN DEFAULT false,
    ambulance_involved BOOLEAN DEFAULT false,
    insurance_company VARCHAR(100),
    claim_number VARCHAR(50),
    accident_report_number VARCHAR(50),
    weather_conditions VARCHAR(50),
    road_conditions VARCHAR(50),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela para comunicação em tempo real
CREATE TABLE IF NOT EXISTS service_communications (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES towing_service_requests(id),
    sender_type VARCHAR(20) NOT NULL, -- operator, partner, driver
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'update', -- update, question, alert, completion
    is_urgent BOOLEAN DEFAULT false,
    read_by_operator BOOLEAN DEFAULT false,
    read_by_partner BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela para métricas e KPIs
CREATE TABLE IF NOT EXISTS towing_service_metrics (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
    date_recorded DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    completed_requests INTEGER DEFAULT 0,
    cancelled_requests INTEGER DEFAULT 0,
    average_response_time INTEGER, -- minutos
    average_completion_time INTEGER, -- minutos
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    customer_satisfaction DECIMAL(3, 2), -- 0.00 a 5.00
    equipment_utilization DECIMAL(5, 2), -- porcentagem
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_id, date_recorded)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_towing_service_quotes_request_id ON towing_service_quotes(service_request_id);
CREATE INDEX IF NOT EXISTS idx_towing_service_quotes_partner_id ON towing_service_quotes(partner_id);
CREATE INDEX IF NOT EXISTS idx_towing_service_quotes_status ON towing_service_quotes(status);

CREATE INDEX IF NOT EXISTS idx_towing_service_tracking_request_id ON towing_service_tracking(service_request_id);
CREATE INDEX IF NOT EXISTS idx_towing_service_tracking_status ON towing_service_tracking(status);

CREATE INDEX IF NOT EXISTS idx_partner_equipment_partner_id ON partner_equipment(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_equipment_status ON partner_equipment(status);

CREATE INDEX IF NOT EXISTS idx_partner_coverage_areas_partner_id ON partner_coverage_areas(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_coverage_areas_city ON partner_coverage_areas(city);

CREATE INDEX IF NOT EXISTS idx_partner_availability_partner_id ON partner_availability(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_availability_date ON partner_availability(date_available);

CREATE INDEX IF NOT EXISTS idx_towing_payment_processes_request_id ON towing_payment_processes(service_request_id);
CREATE INDEX IF NOT EXISTS idx_towing_payment_processes_status ON towing_payment_processes(payment_status);

CREATE INDEX IF NOT EXISTS idx_emergency_services_request_id ON emergency_services(service_request_id);
CREATE INDEX IF NOT EXISTS idx_emergency_services_level ON emergency_services(emergency_level);

CREATE INDEX IF NOT EXISTS idx_service_communications_request_id ON service_communications(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_communications_urgent ON service_communications(is_urgent);

-- Views para dashboards
CREATE OR REPLACE VIEW partner_performance_summary AS
SELECT 
    p.id,
    p.name,
    COUNT(sr.id) as total_services,
    COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) as completed_services,
    AVG(EXTRACT(EPOCH FROM (sr.completed_at - sr.created_at))/60) as avg_completion_time_minutes,
    AVG(psr.rating) as average_rating,
    SUM(pp.net_amount) as total_revenue
FROM towing_partners p
LEFT JOIN towing_service_requests sr ON p.id = sr.partner_id
LEFT JOIN partner_service_ratings psr ON p.id = psr.partner_id
LEFT JOIN towing_payment_processes pp ON sr.id = pp.service_request_id AND pp.payment_status = 'paid'
GROUP BY p.id, p.name;

CREATE OR REPLACE VIEW active_services_dashboard AS
SELECT 
    sr.id,
    sr.vehicle_plate,
    sr.location,
    sr.urgency,
    sr.status,
    p.name as partner_name,
    p.phone as partner_phone,
    st.status as tracking_status,
    st.estimated_arrival,
    sr.created_at
FROM towing_service_requests sr
LEFT JOIN towing_partners p ON sr.partner_id = p.id
LEFT JOIN towing_service_tracking st ON sr.id = st.service_request_id
WHERE sr.status NOT IN ('completed', 'cancelled')
ORDER BY sr.created_at DESC;

COMMENT ON TABLE towing_service_quotes IS 'Cotações e orçamentos de serviços de guincho';
COMMENT ON TABLE towing_service_tracking IS 'Rastreamento em tempo real dos serviços';
COMMENT ON TABLE towing_service_documents IS 'Documentos e fotos dos serviços';
COMMENT ON TABLE partner_equipment IS 'Equipamentos e veículos dos parceiros';
COMMENT ON TABLE partner_coverage_areas IS 'Áreas de cobertura geográfica';
COMMENT ON TABLE partner_availability IS 'Disponibilidade dos parceiros por data/hora';
COMMENT ON TABLE towing_payment_processes IS 'Processamento de pagamentos';
COMMENT ON TABLE emergency_services IS 'Serviços de emergência 24h';
COMMENT ON TABLE service_communications IS 'Comunicação em tempo real';
COMMENT ON TABLE towing_service_metrics IS 'Métricas e KPIs dos parceiros';