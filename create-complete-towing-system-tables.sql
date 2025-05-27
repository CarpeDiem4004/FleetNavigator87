-- Script completo para criar todas as tabelas do sistema de guincho
-- Execute este script no seu banco de dados Supabase

-- 1. Criar tabela de parceiros de guincho
CREATE TABLE IF NOT EXISTS towing_partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    service_area TEXT,
    hourly_rate DECIMAL(10,2),
    "isActive" BOOLEAN DEFAULT true,
    external_access_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de serviços de guincho
CREATE TABLE IF NOT EXISTS towing_services (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES towing_partners(id),
    vehicle_plate VARCHAR(20) NOT NULL,
    driver_name VARCHAR(255),
    service_type VARCHAR(100),
    pickup_location TEXT NOT NULL,
    destination TEXT NOT NULL,
    service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, aprovado, rejeitado, em_andamento, concluido
    description TEXT,
    observations TEXT,
    requested_by INTEGER, -- referencia para users
    approved_by INTEGER, -- referencia para users
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    payment_date TIMESTAMP,
    payment_reference VARCHAR(255),
    payment_processed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar tabela para histórico de serviços de parceiros (para acesso externo)
CREATE TABLE IF NOT EXISTS towing_partner_services (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES towing_partners(id),
    external_service_id VARCHAR(100), -- ID do serviço no sistema do parceiro
    vehicle_plate VARCHAR(20),
    service_description TEXT,
    service_date TIMESTAMP,
    cost DECIMAL(10,2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inserir alguns parceiros de exemplo
INSERT INTO towing_partners (name, company_name, phone, email, service_area, hourly_rate, external_access_token) VALUES
('Claudio de Oliveira Silva', 'Guincho Express', '(11) 99999-0001', 'claudio@guinchoexpress.com', 'São Paulo - Zona Sul', 150.00, 'TESTE_CLAUDIO_DE_OLIVEIRA_SILVA_TOKEN'),
('Maria Santos', 'Reboque Rápido', '(11) 99999-0002', 'maria@reboqueerapido.com', 'São Paulo - Zona Norte', 140.00, 'TESTE_MARIA_SANTOS_TOKEN'),
('João Silva', 'Guincho 24h', '(11) 99999-0003', 'joao@guincho24h.com', 'São Paulo - Centro', 160.00, 'TESTE_JOAO_SILVA_TOKEN'),
('Ana Costa', 'Socorro Auto', '(11) 99999-0004', 'ana@socorroauto.com', 'São Paulo - Zona Oeste', 145.00, 'TESTE_ANA_COSTA_TOKEN'),
('Carlos Oliveira', 'Reboque Master', '(11) 99999-0005', 'carlos@reboquemaster.com', 'São Paulo - Zona Leste', 155.00, 'TESTE_CARLOS_OLIVEIRA_TOKEN')
ON CONFLICT DO NOTHING;

-- 5. Inserir alguns serviços de exemplo
INSERT INTO towing_services (partner_id, vehicle_plate, driver_name, service_type, pickup_location, destination, estimated_cost, actual_cost, status, description) VALUES
(1, 'ABC-1234', 'Pedro Silva', 'Guincho', 'Av. Paulista, 1000', 'Oficina Central - Rua das Flores, 123', 200.00, 180.00, 'aprovado', 'Veículo quebrado no meio da pista'),
(2, 'XYZ-5678', 'Maria Oliveira', 'Reboque', 'Rua Augusta, 500', 'Oficina Norte - Av. Tiradentes, 456', 150.00, 150.00, 'aprovado', 'Pneu furado'),
(3, 'DEF-9012', 'João Santos', 'Guincho', 'Marginal Tietê, km 15', 'Oficina Sul - Rua do Campo, 789', 250.00, 220.00, 'aprovado', 'Acidente leve'),
(1, 'GHI-3456', 'Ana Costa', 'Reboque', 'Shopping Ibirapuera', 'Base Central', 120.00, 120.00, 'pendente', 'Bateria descarregada'),
(4, 'JKL-7890', 'Carlos Lima', 'Guincho', 'Aeroporto de Congonhas', 'Oficina Oeste - Av. Brasil, 321', 300.00, 280.00, 'aprovado', 'Problema no motor')
ON CONFLICT DO NOTHING;

-- 6. Criar alguns registros de histórico para parceiros
INSERT INTO towing_partner_services (partner_id, external_service_id, vehicle_plate, service_description, service_date, cost, status) VALUES
(1, 'EXT001', 'ABC-1234', 'Serviço de guincho realizado', '2025-05-20 14:30:00', 180.00, 'concluido'),
(1, 'EXT002', 'XYZ-9999', 'Reboque de emergência', '2025-05-22 09:15:00', 150.00, 'concluido'),
(2, 'EXT003', 'DEF-5555', 'Guincho para oficina', '2025-05-23 16:45:00', 200.00, 'concluido')
ON CONFLICT DO NOTHING;

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_towing_services_partner_id ON towing_services(partner_id);
CREATE INDEX IF NOT EXISTS idx_towing_services_status ON towing_services(status);
CREATE INDEX IF NOT EXISTS idx_towing_services_date ON towing_services(service_date);
CREATE INDEX IF NOT EXISTS idx_towing_services_payment_date ON towing_services(payment_date);
CREATE INDEX IF NOT EXISTS idx_towing_services_status_payment ON towing_services(status, payment_date);
CREATE INDEX IF NOT EXISTS idx_towing_partners_active ON towing_partners("isActive");
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_partner ON towing_partner_services(partner_id);

-- 8. Criar triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_towing_partners_updated_at BEFORE UPDATE ON towing_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_towing_services_updated_at BEFORE UPDATE ON towing_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas com sucesso!' as status;

SELECT 'towing_partners' as tabela, COUNT(*) as registros FROM towing_partners
UNION ALL
SELECT 'towing_services' as tabela, COUNT(*) as registros FROM towing_services
UNION ALL
SELECT 'towing_partner_services' as tabela, COUNT(*) as registros FROM towing_partner_services;

-- 10. Mostrar estatísticas do módulo financeiro
SELECT 
    'Estatísticas Financeiras' as info,
    COUNT(*) as total_servicos,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as servicos_aprovados,
    COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NOT NULL THEN 1 END) as servicos_pagos,
    COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NULL THEN 1 END) as servicos_pendentes_pagamento,
    COALESCE(SUM(CASE WHEN status = 'aprovado' THEN actual_cost ELSE 0 END), 0) as valor_total_aprovado,
    COALESCE(SUM(CASE WHEN status = 'aprovado' AND payment_date IS NOT NULL THEN actual_cost ELSE 0 END), 0) as valor_pago,
    COALESCE(SUM(CASE WHEN status = 'aprovado' AND payment_date IS NULL THEN actual_cost ELSE 0 END), 0) as valor_pendente
FROM towing_services;