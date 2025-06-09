-- Script para criar a tabela towing_partner_services
-- Esta tabela armazena os serviços de guincho registrados pelos parceiros

CREATE TABLE IF NOT EXISTS towing_partner_services (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL,
    plate VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    service_type VARCHAR(255) NOT NULL DEFAULT 'guincho',
    cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    km_traveled INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    driver_name VARCHAR(255),
    contact_phone VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pickup_location VARCHAR(255),
    delivery_location VARCHAR(255),
    mileage INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    payment_status VARCHAR(50) DEFAULT 'pending'
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_partner_id ON towing_partner_services(partner_id);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_service_date ON towing_partner_services(service_date);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_status ON towing_partner_services(status);

-- Comentários da tabela
COMMENT ON TABLE towing_partner_services IS 'Tabela que armazena os serviços de guincho registrados pelos parceiros';
COMMENT ON COLUMN towing_partner_services.partner_id IS 'ID do parceiro que prestou o serviço';
COMMENT ON COLUMN towing_partner_services.plate IS 'Placa do veículo atendido';
COMMENT ON COLUMN towing_partner_services.origin IS 'Local de origem/retirada do veículo';
COMMENT ON COLUMN towing_partner_services.destination IS 'Local de destino/entrega do veículo';
COMMENT ON COLUMN towing_partner_services.service_date IS 'Data do serviço realizado';
COMMENT ON COLUMN towing_partner_services.cost IS 'Custo do serviço em reais';
COMMENT ON COLUMN towing_partner_services.km_traveled IS 'Quilometragem percorrida no serviço';
COMMENT ON COLUMN towing_partner_services.status IS 'Status do serviço: pending, approved, denied';
COMMENT ON COLUMN towing_partner_services.payment_status IS 'Status do pagamento: pending, paid, cancelled';