-- Script final e simples para configurar o módulo financeiro
-- Execute este script no seu banco de dados Supabase

-- 1. Adicionar colunas que faltam na tabela towing_partners
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS external_access_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Criar a tabela towing_services
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
    status VARCHAR(50) DEFAULT 'pendente',
    description TEXT,
    payment_date TIMESTAMP,
    payment_reference VARCHAR(255),
    payment_processed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserir parceiros básicos (sem a coluna isActive que não existe)
INSERT INTO towing_partners (name, phone, company_name, email, external_access_token) VALUES
('Claudio Silva', '(11) 99999-0001', 'Guincho Express', 'claudio@teste.com', 'TOKEN_001'),
('Maria Santos', '(11) 99999-0002', 'Reboque Rápido', 'maria@teste.com', 'TOKEN_002'),
('João Silva', '(11) 99999-0003', 'Guincho 24h', 'joao@teste.com', 'TOKEN_003')
ON CONFLICT DO NOTHING;

-- 4. Inserir serviços aprovados para o módulo financeiro
INSERT INTO towing_services (partner_id, vehicle_plate, service_type, pickup_location, destination, estimated_cost, actual_cost, status, description) VALUES
(1, 'ABC-1234', 'Guincho', 'Av. Paulista, 1000', 'Oficina Central', 200.00, 180.00, 'aprovado', 'Serviço teste 1'),
(2, 'XYZ-5678', 'Reboque', 'Rua Augusta, 500', 'Oficina Norte', 150.00, 150.00, 'aprovado', 'Serviço teste 2'),
(3, 'DEF-9012', 'Guincho', 'Marginal Tietê', 'Oficina Sul', 250.00, 220.00, 'aprovado', 'Serviço teste 3'),
(1, 'GHI-3456', 'Reboque', 'Shopping Center', 'Base Central', 120.00, 120.00, 'aprovado', 'Serviço teste 4')
ON CONFLICT DO NOTHING;

-- 5. Verificar resultado
SELECT 'CONFIGURAÇÃO CONCLUÍDA!' as status;

SELECT 'Parceiros:' as tipo, COUNT(*) as total FROM towing_partners
UNION ALL
SELECT 'Serviços:' as tipo, COUNT(*) as total FROM towing_services
UNION ALL
SELECT 'Aprovados:' as tipo, COUNT(*) as total FROM towing_services WHERE status = 'aprovado';

-- 6. Resumo financeiro
SELECT 
    'MÓDULO FINANCEIRO PRONTO!' as info,
    COUNT(*) as servicos_aprovados,
    COALESCE(SUM(actual_cost), 0) as valor_total_pendente
FROM towing_services 
WHERE status = 'aprovado' AND payment_date IS NULL;