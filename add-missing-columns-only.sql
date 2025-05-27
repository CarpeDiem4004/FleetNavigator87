-- Script simples para adicionar apenas as colunas que estão faltando
-- Execute este script no seu banco de dados Supabase

-- Adicionar colunas que estão faltando na tabela towing_partners
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS external_access_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);

-- Adicionar colunas que estão faltando na tabela towing_services  
ALTER TABLE towing_services 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_processed_by INTEGER;

-- Criar tabela towing_partner_services se não existir
CREATE TABLE IF NOT EXISTS towing_partner_services (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES towing_partners(id),
    external_service_id VARCHAR(100),
    vehicle_plate VARCHAR(20),
    service_description TEXT,
    service_date TIMESTAMP,
    cost DECIMAL(10,2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de exemplo apenas se não existirem
INSERT INTO towing_partners (name, phone) VALUES
('Claudio de Oliveira Silva', '(11) 99999-0001'),
('Maria Santos', '(11) 99999-0002'),
('João Silva', '(11) 99999-0003'),
('Ana Costa', '(11) 99999-0004'),
('Carlos Oliveira', '(11) 99999-0005')
ON CONFLICT DO NOTHING;

-- Atualizar os parceiros com os dados completos
UPDATE towing_partners SET 
    company_name = 'Guincho Express',
    email = 'claudio@guinchoexpress.com',
    external_access_token = 'TESTE_CLAUDIO_DE_OLIVEIRA_SILVA_TOKEN'
WHERE name = 'Claudio de Oliveira Silva';

UPDATE towing_partners SET 
    company_name = 'Reboque Rápido',
    email = 'maria@reboqueerapido.com',
    external_access_token = 'TESTE_MARIA_SANTOS_TOKEN'
WHERE name = 'Maria Santos';

UPDATE towing_partners SET 
    company_name = 'Guincho 24h',
    email = 'joao@guincho24h.com',
    external_access_token = 'TESTE_JOAO_SILVA_TOKEN'
WHERE name = 'João Silva';

UPDATE towing_partners SET 
    company_name = 'Socorro Auto',
    email = 'ana@socorroauto.com',
    external_access_token = 'TESTE_ANA_COSTA_TOKEN'
WHERE name = 'Ana Costa';

UPDATE towing_partners SET 
    company_name = 'Reboque Master',
    email = 'carlos@reboquemaster.com',
    external_access_token = 'TESTE_CARLOS_OLIVEIRA_TOKEN'
WHERE name = 'Carlos Oliveira';

-- Inserir serviços de exemplo
INSERT INTO towing_services (partner_id, vehicle_plate, driver_name, service_type, pickup_location, destination, estimated_cost, actual_cost, status, description) 
SELECT 
    p.id, 
    'ABC-1234', 
    'Pedro Silva', 
    'Guincho', 
    'Av. Paulista, 1000', 
    'Oficina Central - Rua das Flores, 123', 
    200.00, 
    180.00, 
    'aprovado', 
    'Veículo quebrado no meio da pista'
FROM towing_partners p 
WHERE p.name = 'Claudio de Oliveira Silva'
AND NOT EXISTS (SELECT 1 FROM towing_services WHERE vehicle_plate = 'ABC-1234');

INSERT INTO towing_services (partner_id, vehicle_plate, driver_name, service_type, pickup_location, destination, estimated_cost, actual_cost, status, description) 
SELECT 
    p.id, 
    'XYZ-5678', 
    'Maria Oliveira', 
    'Reboque', 
    'Rua Augusta, 500', 
    'Oficina Norte - Av. Tiradentes, 456', 
    150.00, 
    150.00, 
    'aprovado', 
    'Pneu furado'
FROM towing_partners p 
WHERE p.name = 'Maria Santos'
AND NOT EXISTS (SELECT 1 FROM towing_services WHERE vehicle_plate = 'XYZ-5678');

INSERT INTO towing_services (partner_id, vehicle_plate, driver_name, service_type, pickup_location, destination, estimated_cost, actual_cost, status, description) 
SELECT 
    p.id, 
    'DEF-9012', 
    'João Santos', 
    'Guincho', 
    'Marginal Tietê, km 15', 
    'Oficina Sul - Rua do Campo, 789', 
    250.00, 
    220.00, 
    'aprovado', 
    'Acidente leve'
FROM towing_partners p 
WHERE p.name = 'João Silva'
AND NOT EXISTS (SELECT 1 FROM towing_services WHERE vehicle_plate = 'DEF-9012');

INSERT INTO towing_services (partner_id, vehicle_plate, driver_name, service_type, pickup_location, destination, estimated_cost, actual_cost, status, description) 
SELECT 
    p.id, 
    'JKL-7890', 
    'Carlos Lima', 
    'Guincho', 
    'Aeroporto de Congonhas', 
    'Oficina Oeste - Av. Brasil, 321', 
    300.00, 
    280.00, 
    'aprovado', 
    'Problema no motor'
FROM towing_partners p 
WHERE p.name = 'Ana Costa'
AND NOT EXISTS (SELECT 1 FROM towing_services WHERE vehicle_plate = 'JKL-7890');

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_towing_services_status ON towing_services(status);
CREATE INDEX IF NOT EXISTS idx_towing_services_payment_date ON towing_services(payment_date);
CREATE INDEX IF NOT EXISTS idx_towing_services_status_payment ON towing_services(status, payment_date);

-- Verificar resultado
SELECT 'Parceiros cadastrados:' as info, COUNT(*) as total FROM towing_partners;
SELECT 'Serviços cadastrados:' as info, COUNT(*) as total FROM towing_services;
SELECT 'Serviços aprovados:' as info, COUNT(*) as total FROM towing_services WHERE status = 'aprovado';

-- Estatísticas financeiras
SELECT 
    'RESUMO FINANCEIRO' as titulo,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as servicos_aprovados,
    COALESCE(SUM(CASE WHEN status = 'aprovado' THEN actual_cost ELSE 0 END), 0) as valor_total_pendente
FROM towing_services;