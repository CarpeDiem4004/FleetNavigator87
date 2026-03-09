-- Script para descobrir quais valores de priority são aceitos
-- Execute no Supabase SQL Editor

-- 1. Limpar dados de teste
DELETE FROM campinas_budget_requests WHERE id > 0;

-- 2. Testar inserção com diferentes valores de priority
-- Testando valores comuns em inglês
INSERT INTO campinas_budget_requests (
    title,
    description,
    priority,
    requester_id,
    requested_by,
    requester_name,
    vehicle_plate,
    vehicle_model,
    workshop_id,
    workshop_name,
    base_id,
    status,
    estimated_value
) VALUES (
    'Teste Priority High',
    'Teste para descobrir valor correto de priority',
    'high',
    1,
    1,
    'Administrador Sistema',
    'TEST001',
    'Teste Vehicle',
    3,
    'Oficina Teste',
    46,
    'pendente',
    1000.00
);

-- Se high não funcionar, testar medium
INSERT INTO campinas_budget_requests (
    title,
    description,
    priority,
    requester_id,
    requested_by,
    requester_name,
    vehicle_plate,
    vehicle_model,
    workshop_id,
    workshop_name,
    base_id,
    status,
    estimated_value
) VALUES (
    'Teste Priority Medium',
    'Teste para descobrir valor correto de priority',
    'medium',
    1,
    1,
    'Administrador Sistema',
    'TEST002',
    'Teste Vehicle',
    3,
    'Oficina Teste',
    46,
    'pendente',
    1000.00
);

-- Se medium não funcionar, testar low
INSERT INTO campinas_budget_requests (
    title,
    description,
    priority,
    requester_id,
    requested_by,
    requester_name,
    vehicle_plate,
    vehicle_model,
    workshop_id,
    workshop_name,
    base_id,
    status,
    estimated_value
) VALUES (
    'Teste Priority Low',
    'Teste para descobrir valor correto de priority',
    'low',
    1,
    1,
    'Administrador Sistema',
    'TEST003',
    'Teste Vehicle',
    3,
    'Oficina Teste',
    46,
    'pendente',
    1000.00
);

-- Verificar quais registros foram inseridos com sucesso
SELECT 
    'TESTE DE VALUES DE PRIORITY:' as info,
    id,
    title,
    priority,
    vehicle_plate
FROM campinas_budget_requests
WHERE vehicle_plate LIKE 'TEST%'
ORDER BY id;

SELECT 'Teste concluído. Verifique quais valores de priority funcionaram.' as resultado;