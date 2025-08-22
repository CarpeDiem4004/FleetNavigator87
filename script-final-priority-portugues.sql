-- SCRIPT FINAL com valores de priority em PORTUGUÊS
-- Execute no Supabase SQL Editor

-- 1. Limpar dados existentes
DELETE FROM campinas_budget_requests WHERE id > 0;

-- 2. Inserir dados com valores de priority em português (mais provável)
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
    estimated_value,
    department,
    category,
    comments
) VALUES
-- Registro 1 - ALTA
(
    'Manutenção Preventiva - Mercedes ABC1234',
    'Revisão completa do sistema de freios e troca de óleo do motor',
    'alta',
    1,
    1,
    'Administrador Sistema',
    'ABC1234',
    'Mercedes Actros',
    3,
    'Oficina Mestre Auto',
    46,
    'pendente',
    2500.00,
    'manutencao',
    'preventiva',
    'Manutenção urgente necessária'
),
-- Registro 2 - MEDIA
(
    'Reparo Sistema Elétrico - Volvo DEF5678',
    'Reparo no sistema elétrico e troca de lâmpadas H7',
    'media',
    1,
    1,
    'Administrador Sistema',
    'DEF5678',
    'Volvo FH',
    4,
    'Auto Socorro Premium',
    47,
    'aprovado',
    1800.00,
    'manutencao',
    'reparo',
    'Sistema elétrico com falhas'
),
-- Registro 3 - MEDIA
(
    'Manutenção Programada - Scania GHI9012',
    'Manutenção preventiva - troca de filtros e fluidos',
    'media',
    1,
    1,
    'Administrador Sistema',
    'GHI9012',
    'Scania R450',
    5,
    'Oficina Especializada ABC',
    46,
    'em_analise',
    3200.00,
    'manutencao',
    'preventiva',
    'Revisão de 30.000 km'
),
-- Registro 4 - ALTA
(
    'Reparo Suspensão - Mercedes JKL3456',
    'Reparo no sistema de suspensão dianteira',
    'alta',
    1,
    1,
    'Administrador Sistema',
    'JKL3456',
    'Mercedes Atego',
    6,
    'Oficina Murici',
    47,
    'pendente',
    4500.00,
    'manutencao',
    'reparo',
    'Suspensão com ruídos'
),
-- Registro 5 - ALTA
(
    'Troca Embreagem - Iveco MNO7890',
    'Troca de embreagem e reparo na caixa de câmbio',
    'alta',
    1,
    1,
    'Administrador Sistema',
    'MNO7890',
    'Iveco Daily',
    11,
    'AUTO MECÂNICA PASSOS LTDA',
    46,
    'aprovado',
    5200.00,
    'manutencao',
    'reparo',
    'Embreagem patinando'
),
-- Registro 6 - BAIXA
(
    'Revisão 20.000km - Ford PQR1234',
    'Revisão de 20.000 km - completa com filtros e óleo',
    'baixa',
    1,
    1,
    'Administrador Sistema',
    'PQR1234',
    'Ford Cargo',
    2,
    'Alair Manutenção e Serviços Automotivos Ltda',
    47,
    'pendente',
    2800.00,
    'manutencao',
    'preventiva',
    'Revisão programada'
),
-- Registro 7 - BAIXA
(
    'Direção Hidráulica - VW STU5678',
    'Reparo no sistema de direção hidráulica',
    'baixa',
    1,
    1,
    'Administrador Sistema',
    'STU5678',
    'Volkswagen Delivery',
    12,
    'AUTOFREI',
    46,
    'em_analise',
    1950.00,
    'manutencao',
    'reparo',
    'Direção com folga'
),
-- Registro 8 - MEDIA
(
    'Sistema Arrefecimento - Man VWX9012',
    'Manutenção do sistema de arrefecimento',
    'media',
    1,
    1,
    'Administrador Sistema',
    'VWX9012',
    'Man TGX',
    3,
    'Oficina Mestre Auto',
    47,
    'aprovado',
    3400.00,
    'manutencao',
    'preventiva',
    'Superaquecimento intermitente'
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

-- 4. RESULTADO FINAL
SELECT 
    'RESULTADO FINAL:' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    COUNT(CASE WHEN priority = 'alta' THEN 1 END) as alta_prioridade,
    COUNT(CASE WHEN priority = 'media' THEN 1 END) as media_prioridade,
    COUNT(CASE WHEN priority = 'baixa' THEN 1 END) as baixa_prioridade,
    SUM(estimated_value) as valor_total_estimado,
    SUM(CASE WHEN status = 'aprovado' THEN approved_value ELSE 0 END) as valor_total_aprovado
FROM campinas_budget_requests;

-- 5. Amostra dos dados
SELECT 
    title,
    priority,
    status,
    estimated_value
FROM campinas_budget_requests 
ORDER BY 
    CASE priority WHEN 'alta' THEN 1 WHEN 'media' THEN 2 WHEN 'baixa' THEN 3 END,
    id;

SELECT '🎉 DADOS INSERIDOS com priority em PORTUGUÊS!' as resultado;