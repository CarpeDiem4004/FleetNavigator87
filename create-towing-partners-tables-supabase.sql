-- Criar enum para status de parceiros
CREATE TYPE towing_partner_status AS ENUM ('ativo', 'inativo', 'pendente', 'suspenso');

-- Criar enum para status de solicitações de guincho
CREATE TYPE towing_request_status AS ENUM ('solicitado', 'aprovado', 'em_andamento', 'concluido', 'cancelado');

-- Tabela de parceiros de guincho
CREATE TABLE IF NOT EXISTS towing_partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    cnpj VARCHAR(18),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    rating DECIMAL(3,1) DEFAULT 5.0,
    service_types TEXT[],
    price_range VARCHAR(50),
    payment_methods TEXT[],
    cost_per_km DECIMAL(10,2),
    available_24h BOOLEAN DEFAULT FALSE,
    can_transport_multiple BOOLEAN DEFAULT FALSE,
    notes TEXT,
    status towing_partner_status DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de solicitações de serviço de guincho
CREATE TABLE IF NOT EXISTS towing_requests (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES towing_partners(id),
    vehicle_id INTEGER,  -- Referência ao veículo (tabela existente)
    driver_id INTEGER,   -- Referência ao motorista (tabela existente)
    user_id INTEGER,     -- Usuário que fez a solicitação
    requested_by VARCHAR(255) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    pickup_location TEXT NOT NULL,
    destination TEXT NOT NULL,
    reason TEXT NOT NULL,
    vehicle_condition TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    invoice_number VARCHAR(50),
    invoice_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    status towing_request_status DEFAULT 'solicitado',
    approval_user_id INTEGER,   -- Usuário que aprovou a solicitação
    approval_date TIMESTAMP WITH TIME ZONE,
    photos TEXT[],              -- Array de URLs para fotos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para avaliações de serviço
CREATE TABLE IF NOT EXISTS towing_ratings (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES towing_requests(id),
    partner_id INTEGER REFERENCES towing_partners(id),
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Função de trigger para atualizar campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para parceiros de guincho
CREATE TRIGGER update_towing_partners_updated_at
BEFORE UPDATE ON towing_partners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger para solicitações de guincho
CREATE TRIGGER update_towing_requests_updated_at
BEFORE UPDATE ON towing_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns dados de exemplo para parceiros de guincho
INSERT INTO towing_partners 
(name, company_name, cnpj, phone, email, city, region, address, contact_person, service_types, payment_methods, cost_per_km, available_24h, status)
VALUES
('Guincho Rápido Ltda', 'Guincho Rápido Serviços Automotivos Ltda', '12.345.678/0001-90', '(11) 98765-4321', 'contato@guinchorapido.com.br', 'São Paulo', 'Zona Sul', 'Av. Santo Amaro, 1500', 'João Silva', ARRAY['leve', 'médio'], ARRAY['dinheiro', 'cartão', 'boleto'], 5.50, TRUE, 'ativo'),
('Guincho Seguro S.A.', 'Segurança em Reboques S.A.', '23.456.789/0001-01', '(11) 91234-5678', 'contato@guinchoseguro.com.br', 'São Paulo', 'Zona Norte', 'Av. Braz Leme, 780', 'Maria Oliveira', ARRAY['leve', 'médio', 'pesado'], ARRAY['dinheiro', 'cartão'], 6.25, TRUE, 'ativo'),
('Guincho Estrela', 'Estrela Serviços de Reboque Ltda', '34.567.890/0001-12', '(19) 98877-6655', 'atendimento@guinchestrela.com.br', 'Campinas', 'Centro', 'Rua Dr. Quirino, 450', 'Carlos Santos', ARRAY['leve', 'médio', 'pesado', 'especial'], ARRAY['dinheiro', 'cartão', 'pix'], 7.00, TRUE, 'ativo'),
('Guincho & Reboque ABC', 'ABC Guinchamento e Reboque Ltda', '45.678.901/0001-23', '(11) 97766-5544', 'abc@guinchoabc.com.br', 'Santo André', 'ABC', 'Av. Industrial, 890', 'Roberto Martins', ARRAY['leve', 'médio'], ARRAY['dinheiro', 'cartão'], 4.75, FALSE, 'inativo'),
('Guincho Águia', 'Águia Serviços de Reboque Eireli', '56.789.012/0001-34', '(11) 99988-7766', 'contato@guinchoaguia.com.br', 'Guarulhos', 'Aeroporto', 'Rodovia Hélio Smidt, S/N', 'Ana Ferreira', ARRAY['leve', 'médio', 'pesado', 'moto'], ARRAY['dinheiro', 'cartão', 'pix'], 6.80, TRUE, 'ativo');

-- Criar view para resumo de parceiros
CREATE OR REPLACE VIEW towing_partners_summary AS
SELECT 
    p.id,
    p.name,
    p.city,
    p.region,
    p.phone,
    p.rating,
    p.status,
    COUNT(r.id) AS total_requests,
    SUM(CASE WHEN r.status = 'concluido' THEN 1 ELSE 0 END) AS completed_requests,
    AVG(tr.rating) AS avg_rating
FROM towing_partners p
LEFT JOIN towing_requests r ON p.id = r.partner_id
LEFT JOIN towing_ratings tr ON p.id = tr.partner_id
GROUP BY p.id, p.name, p.city, p.region, p.phone, p.rating, p.status;