-- SCRIPT FINAL com campo priority obrigatório preenchido
-- Execute no Supabase SQL Editor

-- Limpar dados existentes
DELETE FROM campinas_budget_requests WHERE id > 0;

-- Inserir orçamentos com priority (testando valores comuns)
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
    department
) VALUES
-- Orçamento 1 - URGENTE
(
    'Orçamento: Reparo Sistema Freios - Mercedes ABC1234',
    'Troca de pastilhas, discos de freio e revisão do sistema hidráulico. Veículo apresentando ruídos e redução na eficiência de frenagem.',
    'urgente',
    1,
    3,
    'Oficina Mestre Auto',
    'ABC1234',
    'Mercedes Actros 2544',
    3,
    'Oficina Mestre Auto',
    46,
    'pendente',
    3200.00,
    'manutencao'
),
-- Orçamento 2 - NORMAL
(
    'Orçamento: Sistema Elétrico - Volvo DEF5678',
    'Diagnóstico e reparo do sistema elétrico, troca de alternador e correção de curto-circuito no chicote principal.',
    'normal',
    1,
    4,
    'Auto Socorro Premium',
    'DEF5678',
    'Volvo FH 460',
    4,
    'Auto Socorro Premium',
    47,
    'aprovado',
    2800.00,
    'manutencao'
),
-- Orçamento 3 - NORMAL
(
    'Orçamento: Manutenção Preventiva - Scania GHI9012',
    'Revisão completa de 40.000 km: troca de óleo, filtros, velas, correia dentada e inspeção geral do motor.',
    'normal',
    1,
    5,
    'Oficina Especializada ABC',
    'GHI9012',
    'Scania R450 Highline',
    5,
    'Oficina Especializada ABC',
    46,
    'em_analise',
    4500.00,
    'manutencao'
),
-- Orçamento 4 - URGENTE
(
    'Orçamento: Suspensão Dianteira - Mercedes JKL3456',
    'Substituição completa dos amortecedores dianteiros, buchas da bandeja e alinhamento/balanceamento.',
    'urgente',
    1,
    6,
    'Oficina Murici',
    'JKL3456',
    'Mercedes Atego 1719',
    6,
    'Oficina Murici',
    47,
    'pendente',
    2900.00,
    'manutencao'
),
-- Orçamento 5 - URGENTE
(
    'Orçamento: Sistema Embreagem - Iveco MNO7890',
    'Troca completa do kit embreagem (disco, platô, rolamento), reparo no cilindro escravo e sangria do sistema.',
    'urgente',
    1,
    11,
    'AUTO MECÂNICA PASSOS LTDA',
    'MNO7890',
    'Iveco Daily 35S14',
    11,
    'AUTO MECÂNICA PASSOS LTDA',
    46,
    'aprovado',
    3800.00,
    'manutencao'
),
-- Orçamento 6 - BAIXA
(
    'Orçamento: Revisão Programada - Ford PQR1234',
    'Manutenção preventiva de 25.000 km conforme manual do fabricante, incluindo todos os itens obrigatórios.',
    'baixa',
    1,
    2,
    'Alair Manutenção e Serviços Automotivos Ltda',
    'PQR1234',
    'Ford Cargo 2429',
    2,
    'Alair Manutenção e Serviços Automotivos Ltda',
    47,
    'pendente',
    2100.00,
    'manutencao'
),
-- Orçamento 7 - BAIXA
(
    'Orçamento: Direção Hidráulica - VW STU5678',
    'Reparo da bomba de direção hidráulica, troca de mangueiras e fluido, eliminação de vazamentos.',
    'baixa',
    1,
    12,
    'AUTOFREI',
    'STU5678',
    'Volkswagen Delivery 9.170',
    12,
    'AUTOFREI',
    46,
    'em_analise',
    1750.00,
    'manutencao'
),
-- Orçamento 8 - NORMAL
(
    'Orçamento: Sistema Arrefecimento - Man VWX9012',
    'Substituição do radiador, bomba de agua, termostato e mangueiras. Limpeza completa do sistema de arrefecimento.',
    'normal',
    1,
    3,
    'Oficina Mestre Auto',
    'VWX9012',
    'Man TGX 29.480',
    3,
    'Oficina Mestre Auto',
    47,
    'aprovado',
    4200.00,
    'manutencao'
);

-- Atualizar orçamentos aprovados
UPDATE campinas_budget_requests 
SET 
    approved_value = ROUND(estimated_value * 0.90, 2),
    approved_by = 1,
    approver_name = 'Administrador Sistema',
    approved_at = NOW() - (RANDOM() * INTERVAL '3 days'),
    updated_at = NOW()
WHERE status = 'aprovado';

-- RESULTADO FINAL
SELECT 
    'ORÇAMENTOS RECEBIDOS DAS OFICINAS:' as resultado,
    COUNT(*) as total_orcamentos,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    COUNT(CASE WHEN priority = 'urgente' THEN 1 END) as urgentes,
    COUNT(CASE WHEN priority = 'normal' THEN 1 END) as normais,
    COUNT(CASE WHEN priority = 'baixa' THEN 1 END) as baixa_prioridade,
    SUM(estimated_value) as valor_total,
    SUM(CASE WHEN status = 'aprovado' THEN approved_value ELSE 0 END) as valor_aprovado
FROM campinas_budget_requests;

SELECT 'SUCESSO! 8 orçamentos de oficinas inseridos com priority!' as status;