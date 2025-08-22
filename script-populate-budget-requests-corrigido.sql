-- Script SQL Corrigido para Popular Orçamentos
-- Execute no Supabase SQL Editor

-- Primeiro, verificar se as tabelas existem
SELECT 'Verificando tabelas...' as status;

-- 1. Inserir dados simples em campinas_budget_requests
INSERT INTO campinas_budget_requests (
    vehicle_plate, 
    vehicle_model, 
    description, 
    requested_by, 
    requester_name, 
    base_id, 
    workshop_id, 
    workshop_name, 
    status, 
    estimated_value, 
    created_at
) VALUES
('ABC1234', 'Mercedes Actros', 'Revisão completa do sistema de freios e troca de óleo', 1, 'Administrador Sistema', 46, 3, 'Oficina Mestre Auto', 'pendente', 2500.00, NOW()),
('DEF5678', 'Volvo FH', 'Reparo no sistema elétrico e troca de lâmpadas', 1, 'Administrador Sistema', 47, 4, 'Auto Socorro Premium', 'aprovado', 1800.00, NOW()),
('GHI9012', 'Scania R450', 'Manutenção preventiva - troca de filtros e fluidos', 1, 'Administrador Sistema', 46, 5, 'Oficina Especializada ABC', 'em_analise', 3200.00, NOW()),
('JKL3456', 'Mercedes Atego', 'Reparo no sistema de suspensão dianteira', 1, 'Administrador Sistema', 47, 6, 'Oficina Murici', 'pendente', 4500.00, NOW()),
('MNO7890', 'Iveco Daily', 'Troca de embreagem e reparo na caixa de câmbio', 1, 'Administrador Sistema', 46, 11, 'AUTO MECÂNICA PASSOS LTDA', 'aprovado', 5200.00, NOW()),
('PQR1234', 'Ford Cargo', 'Revisão de 20.000 km - completa', 1, 'Administrador Sistema', 47, 2, 'Alair Manutenção e Serviços Automotivos Ltda', 'pendente', 2800.00, NOW()),
('STU5678', 'Volkswagen Delivery', 'Reparo no sistema de direção hidráulica', 1, 'Administrador Sistema', 46, 12, 'AUTOFREI', 'em_analise', 1950.00, NOW()),
('VWX9012', 'Man TGX', 'Manutenção do sistema de arrefecimento', 1, 'Administrador Sistema', 47, 3, 'Oficina Mestre Auto', 'aprovado', 3400.00, NOW());

-- 2. Atualizar valores aprovados para os aprovados
UPDATE campinas_budget_requests 
SET approved_value = estimated_value * (0.9 + RANDOM() * 0.2),
    approved_at = NOW() - (RANDOM() * INTERVAL '10 days'),
    approved_by = 1,
    approver_name = 'Administrador Sistema'
WHERE status = 'aprovado';

-- 3. Adicionar mais dados em workshop_budgets conectados aos car_receptions existentes
-- Primeiro, limpar dados antigos sem conexão
DELETE FROM workshop_budgets WHERE car_reception_id IS NULL;

-- Inserir novos orçamentos baseados em car_receptions
INSERT INTO workshop_budgets (
    car_reception_id,
    service_number,
    budget_number,
    workshop_id,
    workshop_cnpj,
    labor_description,
    labor_cost,
    parts_description,
    parts_cost,
    total_cost,
    status,
    created_at,
    is_billed,
    installments
)
SELECT 
    cr.id,
    'SRV-' || LPAD(cr.id::text, 4, '0'),
    'ORC-2025-' || LPAD(cr.id::text, 4, '0'),
    cr.workshop_id,
    COALESCE(w.cnpj, '00.000.000/0001-00'),
    cr.service_description,
    ROUND((500 + RANDOM() * 1500)::numeric, 2),
    'Peças conforme orçamento',
    ROUND((300 + RANDOM() * 2000)::numeric, 2),
    ROUND((800 + RANDOM() * 3500)::numeric, 2),
    CASE 
        WHEN cr.id % 3 = 0 THEN 'aprovado'
        WHEN cr.id % 3 = 1 THEN 'pendente'
        ELSE 'em_analise'
    END,
    NOW() - (RANDOM() * INTERVAL '20 days'),
    CASE WHEN cr.id % 5 = 0 THEN true ELSE false END,
    CASE WHEN cr.id % 5 = 0 THEN (1 + RANDOM() * 5)::integer ELSE 1 END
FROM car_receptions cr
LEFT JOIN workshops w ON cr.workshop_id = w.id
WHERE NOT EXISTS (
    SELECT 1 FROM workshop_budgets wb WHERE wb.car_reception_id = cr.id
)
LIMIT 15;

-- 4. Atualizar datas de aprovação para orçamentos aprovados
UPDATE workshop_budgets 
SET approved_date = created_at + (RANDOM() * INTERVAL '7 days')
WHERE status = 'aprovado' AND approved_date IS NULL;

-- 5. Criar configurações de faturamento para oficinas com orçamentos aprovados
INSERT INTO workshop_billing_config (
    workshop_id,
    workshop_name,
    total_value,
    installments,
    due_dates,
    budget_ids,
    created_at
)
SELECT 
    w.id,
    w.nome,
    3500.00 + RANDOM() * 5000,
    3,
    '["' || (CURRENT_DATE + INTERVAL '30 days') || '","' || (CURRENT_DATE + INTERVAL '60 days') || '","' || (CURRENT_DATE + INTERVAL '90 days') || '"]',
    '[1,2,3]',
    NOW()
FROM workshops w
WHERE w.id IN (3, 4, 5, 6) 
AND w.id NOT IN (SELECT workshop_id FROM workshop_billing_config)
LIMIT 4;

-- 6. Verificar os resultados finais
SELECT 
    'RESULTADO - campinas_budget_requests' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes
FROM campinas_budget_requests;

SELECT 
    'RESULTADO - workshop_budgets' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN is_billed = true THEN 1 END) as faturados
FROM workshop_budgets;

SELECT 
    'RESULTADO - workshop_billing_config' as tabela,
    COUNT(*) as total,
    0 as aprovados,
    0 as pendentes
FROM workshop_billing_config;

-- 7. Mostrar exemplos dos dados criados
SELECT 'EXEMPLO - Solicitações' as tipo, vehicle_plate, workshop_name, status, estimated_value
FROM campinas_budget_requests 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'EXEMPLO - Orçamentos' as tipo, service_number, 
       (SELECT nome FROM workshops WHERE id = workshop_id LIMIT 1) as oficina,
       total_cost, status, is_billed
FROM workshop_budgets 
ORDER BY created_at DESC 
LIMIT 5;