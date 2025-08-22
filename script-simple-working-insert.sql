-- Script SIMPLES usando apenas colunas que existem e funcionam
-- Execute no Supabase SQL Editor

-- 1. Limpar dados existentes
DELETE FROM campinas_budget_requests WHERE id > 0;

-- 2. Inserir dados usando apenas as colunas básicas que sabemos que existem
-- (sem title, sem priority, sem requester_id)
INSERT INTO campinas_budget_requests (
    description,
    vehicle_plate,
    vehicle_model,
    workshop_id,
    workshop_name,
    base_id,
    requested_by,
    requester_name,
    status,
    estimated_value
) VALUES
-- Registro 1
(
    'Revisão completa do sistema de freios e troca de óleo do motor',
    'ABC1234',
    'Mercedes Actros',
    3,
    'Oficina Mestre Auto',
    46,
    1,
    'Administrador Sistema',
    'pendente',
    2500.00
),
-- Registro 2
(
    'Reparo no sistema elétrico e troca de lâmpadas H7',
    'DEF5678',
    'Volvo FH',
    4,
    'Auto Socorro Premium',
    47,
    1,
    'Administrador Sistema',
    'aprovado',
    1800.00
),
-- Registro 3
(
    'Manutenção preventiva - troca de filtros e fluidos',
    'GHI9012',
    'Scania R450',
    5,
    'Oficina Especializada ABC',
    46,
    1,
    'Administrador Sistema',
    'em_analise',
    3200.00
),
-- Registro 4
(
    'Reparo no sistema de suspensão dianteira',
    'JKL3456',
    'Mercedes Atego',
    6,
    'Oficina Murici',
    47,
    1,
    'Administrador Sistema',
    'pendente',
    4500.00
),
-- Registro 5
(
    'Troca de embreagem e reparo na caixa de câmbio',
    'MNO7890',
    'Iveco Daily',
    11,
    'AUTO MECÂNICA PASSOS LTDA',
    46,
    1,
    'Administrador Sistema',
    'aprovado',
    5200.00
),
-- Registro 6
(
    'Revisão de 20.000 km - completa com filtros e óleo',
    'PQR1234',
    'Ford Cargo',
    2,
    'Alair Manutenção e Serviços Automotivos Ltda',
    47,
    1,
    'Administrador Sistema',
    'pendente',
    2800.00
),
-- Registro 7
(
    'Reparo no sistema de direção hidráulica',
    'STU5678',
    'Volkswagen Delivery',
    12,
    'AUTOFREI',
    46,
    1,
    'Administrador Sistema',
    'em_analise',
    1950.00
),
-- Registro 8
(
    'Manutenção do sistema de arrefecimento',
    'VWX9012',
    'Man TGX',
    3,
    'Oficina Mestre Auto',
    47,
    1,
    'Administrador Sistema',
    'aprovado',
    3400.00
);

-- 3. Atualizar registros aprovados
UPDATE campinas_budget_requests 
SET 
    approved_value = ROUND(estimated_value * (0.85 + RANDOM() * 0.15), 2),
    approved_by = 1,
    approver_name = 'Administrador Sistema',
    approved_at = NOW() - (RANDOM() * INTERVAL '7 days'),
    updated_at = NOW()
WHERE status = 'aprovado';

-- 4. Verificar resultado
SELECT 
    'DADOS INSERIDOS:' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    SUM(estimated_value) as valor_total_estimado,
    SUM(approved_value) as valor_total_aprovado
FROM campinas_budget_requests;

-- 5. Mostrar amostra dos dados
SELECT 
    id,
    vehicle_plate,
    workshop_name,
    status,
    estimated_value,
    approved_value
FROM campinas_budget_requests 
ORDER BY id
LIMIT 8;

SELECT '✅ SCRIPT SIMPLES EXECUTADO! Agora deve funcionar na página.' as resultado;