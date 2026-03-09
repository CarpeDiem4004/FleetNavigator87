-- SCRIPT para orçamentos enviados pelas OFICINAS para aprovação
-- Execute no Supabase SQL Editor

-- Limpar dados existentes
DELETE FROM campinas_budget_requests WHERE id > 0;

-- Inserir orçamentos enviados pelas oficinas para aprovação
INSERT INTO campinas_budget_requests (
    title,
    description,
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
-- Orçamento 1 - Oficina Mestre Auto
(
    'Orçamento: Reparo Sistema Freios - Mercedes ABC1234',
    'Troca de pastilhas, discos de freio e revisão do sistema hidráulico. Veículo apresentando ruídos e redução na eficiência de frenagem.',
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
-- Orçamento 2 - Auto Socorro Premium 
(
    'Orçamento: Sistema Elétrico - Volvo DEF5678',
    'Diagnóstico e reparo do sistema elétrico, troca de alternador e correção de curto-circuito no chicote principal.',
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
-- Orçamento 3 - Oficina Especializada ABC
(
    'Orçamento: Manutenção Preventiva - Scania GHI9012',
    'Revisão completa de 40.000 km: troca de óleo, filtros, velas, correia dentada e inspeção geral do motor.',
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
-- Orçamento 4 - Oficina Murici
(
    'Orçamento: Suspensão Dianteira - Mercedes JKL3456',
    'Substituição completa dos amortecedores dianteiros, buchas da bandeja e alinhamento/balanceamento.',
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
-- Orçamento 5 - Auto Mecânica Passos
(
    'Orçamento: Sistema Embreagem - Iveco MNO7890',
    'Troca completa do kit embreagem (disco, platô, rolamento), reparo no cilindro escravo e sangria do sistema.',
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
-- Orçamento 6 - Alair Manutenção
(
    'Orçamento: Revisão Programada - Ford PQR1234',
    'Manutenção preventiva de 25.000 km conforme manual do fabricante, incluindo todos os itens obrigatórios.',
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
-- Orçamento 7 - AUTOFREI
(
    'Orçamento: Direção Hidráulica - VW STU5678',
    'Reparo da bomba de direção hidráulica, troca de mangueiras e fluido, eliminação de vazamentos.',
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
-- Orçamento 8 - Oficina Mestre Auto (segundo orçamento)
(
    'Orçamento: Sistema Arrefecimento - Man VWX9012',
    'Substituição do radiador, bomba d\'água, termostato e mangueiras. Limpeza completa do sistema de arrefecimento.',
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

-- Atualizar orçamentos aprovados com valores finais negociados
UPDATE campinas_budget_requests 
SET 
    approved_value = CASE 
        WHEN workshop_name LIKE '%Mestre Auto%' THEN ROUND(estimated_value * 0.92, 2)
        WHEN workshop_name LIKE '%Socorro Premium%' THEN ROUND(estimated_value * 0.88, 2)  
        WHEN workshop_name LIKE '%PASSOS%' THEN ROUND(estimated_value * 0.95, 2)
        ELSE ROUND(estimated_value * 0.90, 2)
    END,
    approved_by = 1,
    approver_name = 'Administrador Sistema',
    approved_at = NOW() - (RANDOM() * INTERVAL '5 days'),
    updated_at = NOW()
WHERE status = 'aprovado';

-- Resultado final - Dashboard de orçamentos recebidos
SELECT 
    '📋 ORÇAMENTOS RECEBIDOS DAS OFICINAS:' as dashboard,
    COUNT(*) as total_orcamentos,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as aguardando_aprovacao,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as orcamentos_aprovados,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    SUM(estimated_value) as valor_total_solicitado,
    SUM(CASE WHEN status = 'aprovado' THEN approved_value ELSE 0 END) as valor_total_aprovado,
    ROUND(
        (SUM(CASE WHEN status = 'aprovado' THEN approved_value ELSE 0 END) * 100.0) / 
        NULLIF(SUM(estimated_value), 0), 1
    ) || '%' as taxa_aprovacao_valor
FROM campinas_budget_requests;

-- Resumo por oficina
SELECT 
    '🔧 ORÇAMENTOS POR OFICINA:' as resumo,
    workshop_name as oficina,
    COUNT(*) as total_orcamentos,
    SUM(estimated_value) as valor_solicitado,
    SUM(CASE WHEN status = 'aprovado' THEN approved_value ELSE 0 END) as valor_aprovado
FROM campinas_budget_requests 
GROUP BY workshop_name
ORDER BY valor_solicitado DESC;

SELECT '✅ ORÇAMENTOS DAS OFICINAS inseridos com sucesso! Dashboard funcionando!' as resultado;