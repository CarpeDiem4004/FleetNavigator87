-- SCRIPT COMPLETO PARA MÓDULO FINANCEIRO DE PARCEIROS DE GUINCHO
-- Execute este script no SQL Editor do seu Supabase para ativar todas as funcionalidades

-- 1. CRIAR/ATUALIZAR TABELA DE PARCEIROS
CREATE TABLE IF NOT EXISTS towing_partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    external_access_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar colunas que podem estar faltando
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS external_access_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. CRIAR TABELA DE SERVIÇOS DE GUINCHO
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

-- 3. INSERIR PARCEIROS DE TESTE
INSERT INTO towing_partners (name, phone, company_name, email, external_access_token) VALUES
('Guincho Express São Paulo', '(11) 99999-0001', 'Guincho Express Ltda', 'contato@guinchoexpress.com', 'TOKEN_GUINCHO_EXPRESS'),
('Auto Socorro 24h', '(11) 99999-0002', 'Auto Socorro 24h Ltda', 'admin@autosocorro24h.com', 'TOKEN_AUTO_SOCORRO'),
('Reboque Rápido SP', '(11) 99999-0003', 'Reboque Rápido Serviços', 'operacao@reboqueerapido.com', 'TOKEN_REBOQUE_RAPIDO'),
('Guincho Master', '(11) 99999-0004', 'Master Guincho e Reboque', 'financeiro@guinchomaster.com', 'TOKEN_GUINCHO_MASTER'),
('Socorro Total', '(11) 99999-0005', 'Socorro Total Guincho', 'pagamentos@socorrototal.com', 'TOKEN_SOCORRO_TOTAL')
ON CONFLICT DO NOTHING;

-- 4. INSERIR SERVIÇOS APROVADOS PARA TESTE DO MÓDULO FINANCEIRO
INSERT INTO towing_services (partner_id, vehicle_plate, driver_name, service_type, pickup_location, destination, estimated_cost, actual_cost, status, description) VALUES
(1, 'ABC-1234', 'João Silva', 'Guincho', 'Av. Paulista, 1500 - São Paulo/SP', 'Oficina Central - Rua das Flores, 123', 300.00, 280.00, 'aprovado', 'Veículo com pane elétrica - Guincho pesado'),
(1, 'DEF-5678', 'Maria Santos', 'Reboque', 'Shopping Ibirapuera - São Paulo/SP', 'Oficina Norte - Av. Tiradentes, 456', 180.00, 170.00, 'aprovado', 'Pneu furado - Reboque leve'),
(2, 'GHI-9012', 'Carlos Lima', 'Guincho', 'Aeroporto Congonhas - São Paulo/SP', 'Base Operacional - Zona Sul', 450.00, 420.00, 'aprovado', 'Acidente leve - Guincho médio'),
(2, 'JKL-3456', 'Ana Costa', 'Reboque', 'Marginal Tietê, Km 15 - São Paulo/SP', 'Oficina Especializada - Vila Madalena', 220.00, 200.00, 'aprovado', 'Problema no motor - Reboque'),
(3, 'MNO-7890', 'Pedro Oliveira', 'Guincho', 'Rod. Anhanguera, Km 25', 'Oficina Rodoviária - Osasco/SP', 380.00, 350.00, 'aprovado', 'Quebra na estrada - Guincho pesado'),
(3, 'PQR-2468', 'Lucia Ferreira', 'Reboque', 'Centro de São Paulo - Sé', 'Oficina Centro - República', 150.00, 140.00, 'aprovado', 'Bateria descarregada - Reboque'),
(4, 'STU-1357', 'Roberto Santos', 'Guincho', 'Vila Olímpia - São Paulo/SP', 'Concessionária - Brooklin', 320.00, 300.00, 'aprovado', 'Falha na transmissão - Guincho'),
(4, 'VWX-9753', 'Fernanda Lima', 'Reboque', 'Itaquera - Zona Leste', 'Oficina Leste - Penha', 200.00, 190.00, 'aprovado', 'Superaquecimento - Reboque leve'),
(5, 'YZA-8642', 'Antonio Silva', 'Guincho', 'Santo André - ABC Paulista', 'Oficina ABC - São Bernardo', 280.00, 260.00, 'aprovado', 'Acidente - Guincho médio'),
(5, 'BCD-1975', 'Mariana Costa', 'Reboque', 'Guarulhos - Aeroporto Internacional', 'Oficina Guarulhos - Centro', 250.00, 230.00, 'aprovado', 'Problema elétrico - Reboque')
ON CONFLICT DO NOTHING;

-- 5. INSERIR ALGUNS SERVIÇOS JÁ PAGOS PARA DEMONSTRAÇÃO
UPDATE towing_services 
SET payment_date = '2025-05-20', 
    payment_reference = 'PIX-202505200001', 
    payment_processed_by = 1 
WHERE vehicle_plate IN ('ABC-1234', 'GHI-9012', 'MNO-7890');

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_towing_services_status ON towing_services(status);
CREATE INDEX IF NOT EXISTS idx_towing_services_partner_id ON towing_services(partner_id);
CREATE INDEX IF NOT EXISTS idx_towing_services_payment_date ON towing_services(payment_date);
CREATE INDEX IF NOT EXISTS idx_towing_services_status_payment ON towing_services(status, payment_date);

-- 7. VERIFICAÇÃO FINAL E ESTATÍSTICAS
SELECT '=== MÓDULO FINANCEIRO CONFIGURADO COM SUCESSO ===' as resultado;

SELECT 'PARCEIROS CADASTRADOS' as categoria, COUNT(*) as total FROM towing_partners
UNION ALL
SELECT 'SERVIÇOS TOTAL' as categoria, COUNT(*) as total FROM towing_services
UNION ALL
SELECT 'SERVIÇOS APROVADOS' as categoria, COUNT(*) as total FROM towing_services WHERE status = 'aprovado'
UNION ALL
SELECT 'SERVIÇOS PAGOS' as categoria, COUNT(*) as total FROM towing_services WHERE payment_date IS NOT NULL
UNION ALL
SELECT 'SERVIÇOS PENDENTES PAGAMENTO' as categoria, COUNT(*) as total FROM towing_services WHERE status = 'aprovado' AND payment_date IS NULL;

-- 8. RESUMO FINANCEIRO DETALHADO
SELECT 
    'RESUMO FINANCEIRO COMPLETO' as info,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as servicos_aprovados,
    COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NOT NULL THEN 1 END) as servicos_pagos,
    COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NULL THEN 1 END) as servicos_pendentes,
    COALESCE(SUM(CASE WHEN status = 'aprovado' THEN actual_cost ELSE 0 END), 0) as valor_total_aprovado,
    COALESCE(SUM(CASE WHEN status = 'aprovado' AND payment_date IS NOT NULL THEN actual_cost ELSE 0 END), 0) as valor_ja_pago,
    COALESCE(SUM(CASE WHEN status = 'aprovado' AND payment_date IS NULL THEN actual_cost ELSE 0 END), 0) as valor_pendente_pagamento
FROM towing_services;

-- 9. LISTAGEM DOS SERVIÇOS PENDENTES POR PARCEIRO
SELECT 
    tp.name as parceiro,
    tp.company_name as empresa,
    COUNT(ts.id) as servicos_pendentes,
    COALESCE(SUM(ts.actual_cost), 0) as valor_pendente
FROM towing_partners tp
LEFT JOIN towing_services ts ON tp.id = ts.partner_id 
    AND ts.status = 'aprovado' 
    AND ts.payment_date IS NULL
GROUP BY tp.id, tp.name, tp.company_name
ORDER BY valor_pendente DESC;