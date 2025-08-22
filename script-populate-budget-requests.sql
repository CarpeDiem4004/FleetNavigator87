-- Script SQL para popular as tabelas de orçamentos e solicitações
-- Execute este script no seu banco PostgreSQL/Supabase

-- 1. Primeiro, popular campinas_budget_requests com dados baseados em car_receptions existentes
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
    approved_value,
    created_at, 
    updated_at
)
SELECT 
    cr.vehicle_plate,
    cr.vehicle_model,
    cr.service_description,
    1, -- ID do admin como solicitante
    'Administrador Sistema',
    cr.base_id,
    cr.workshop_id,
    w.nome,
    CASE 
        WHEN cr.id % 3 = 0 THEN 'aprovado'
        WHEN cr.id % 3 = 1 THEN 'pendente'
        ELSE 'em_analise'
    END as status,
    -- Valores estimados realistas baseados na descrição
    CASE 
        WHEN LENGTH(cr.service_description) > 200 THEN ROUND((RANDOM() * 3000 + 1500)::numeric, 2)
        WHEN LENGTH(cr.service_description) > 100 THEN ROUND((RANDOM() * 2000 + 800)::numeric, 2)
        ELSE ROUND((RANDOM() * 1000 + 300)::numeric, 2)
    END as estimated_value,
    -- Valor aprovado apenas para os aprovados
    CASE 
        WHEN cr.id % 3 = 0 THEN ROUND((RANDOM() * 2800 + 1200)::numeric, 2)
        ELSE NULL
    END as approved_value,
    NOW() - (RANDOM() * INTERVAL '30 days') as created_at,
    NOW() as updated_at
FROM car_receptions cr
LEFT JOIN workshops w ON cr.workshop_id = w.id
WHERE cr.id NOT IN (SELECT COALESCE(vehicle_id, 0) FROM campinas_budget_requests WHERE vehicle_id IS NOT NULL);

-- 2. Atualizar workshop_budgets para ter mais dados realistas e conectar com car_receptions
-- Primeiro limpar e recriar com dados mais realistas
DELETE FROM workshop_budgets WHERE car_reception_id IS NULL;

-- Inserir orçamentos baseados em car_receptions
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
    updated_at,
    approved_date,
    is_billed,
    installments
)
SELECT 
    cr.id as car_reception_id,
    'SRV-' || LPAD(cr.id::text, 4, '0') as service_number,
    'ORC-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(cr.id::text, 4, '0') as budget_number,
    cr.workshop_id,
    w.cnpj as workshop_cnpj,
    cr.service_description as labor_description,
    -- Custo de mão de obra baseado na complexidade
    CASE 
        WHEN LENGTH(cr.service_description) > 200 THEN ROUND((RANDOM() * 1500 + 800)::numeric, 2)
        WHEN LENGTH(cr.service_description) > 100 THEN ROUND((RANDOM() * 1000 + 400)::numeric, 2)
        ELSE ROUND((RANDOM() * 600 + 200)::numeric, 2)
    END as labor_cost,
    -- Descrição de peças
    CASE 
        WHEN cr.service_description ILIKE '%lâmpada%' THEN 'Lâmpadas H7, conectores'
        WHEN cr.service_description ILIKE '%freio%' THEN 'Pastilhas de freio, discos, fluido'
        WHEN cr.service_description ILIKE '%revisão%' THEN 'Filtros, óleo, velas'
        ELSE 'Peças diversas conforme necessário'
    END as parts_description,
    -- Custo de peças
    CASE 
        WHEN LENGTH(cr.service_description) > 200 THEN ROUND((RANDOM() * 2000 + 1000)::numeric, 2)
        WHEN LENGTH(cr.service_description) > 100 THEN ROUND((RANDOM() * 1200 + 600)::numeric, 2)
        ELSE ROUND((RANDOM() * 800 + 300)::numeric, 2)
    END as parts_cost,
    -- Total cost (será atualizado abaixo)
    0,
    -- Status
    CASE 
        WHEN cr.id % 4 = 0 THEN 'aprovado'
        WHEN cr.id % 4 = 1 THEN 'pendente'
        WHEN cr.id % 4 = 2 THEN 'em_analise'
        ELSE 'rejeitado'
    END as status,
    NOW() - (RANDOM() * INTERVAL '25 days') as created_at,
    NOW() as updated_at,
    -- Data de aprovação apenas para aprovados
    CASE 
        WHEN cr.id % 4 = 0 THEN NOW() - (RANDOM() * INTERVAL '15 days')
        ELSE NULL
    END as approved_date,
    -- Faturamento
    CASE 
        WHEN cr.id % 6 = 0 THEN true
        ELSE false
    END as is_billed,
    -- Parcelas
    CASE 
        WHEN cr.id % 6 = 0 THEN (RANDOM() * 6 + 1)::integer
        ELSE 1
    END as installments
FROM car_receptions cr
LEFT JOIN workshops w ON cr.workshop_id = w.id
WHERE cr.id NOT IN (SELECT COALESCE(car_reception_id, 0) FROM workshop_budgets WHERE car_reception_id IS NOT NULL);

-- 3. Atualizar o total_cost em workshop_budgets
UPDATE workshop_budgets 
SET total_cost = labor_cost + COALESCE(parts_cost, 0);

-- 4. Criar alguns registros de configuração de faturamento
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
    wb.workshop_id,
    w.nome as workshop_name,
    SUM(wb.total_cost) as total_value,
    3 as installments,
    jsonb_build_array(
        (NOW() + INTERVAL '30 days')::date,
        (NOW() + INTERVAL '60 days')::date,
        (NOW() + INTERVAL '90 days')::date
    )::text as due_dates,
    jsonb_agg(wb.id)::text as budget_ids,
    NOW() as created_at
FROM workshop_budgets wb
LEFT JOIN workshops w ON wb.workshop_id = w.id
WHERE wb.status = 'aprovado' 
    AND wb.is_billed = true
    AND wb.workshop_id NOT IN (SELECT workshop_id FROM workshop_billing_config)
GROUP BY wb.workshop_id, w.nome
HAVING COUNT(*) > 0;

-- 5. Verificar os resultados
SELECT 
    'campinas_budget_requests' as tabela, 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes
FROM campinas_budget_requests

UNION ALL

SELECT 
    'workshop_budgets' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN is_billed = true THEN 1 END) as faturados
FROM workshop_budgets

UNION ALL

SELECT 
    'workshop_billing_config' as tabela,
    COUNT(*) as total_registros,
    0 as aprovados,
    0 as pendentes
FROM workshop_billing_config;

-- 6. Mostrar alguns dados de exemplo
SELECT 
    'EXEMPLO - Solicitações de Orçamento' as tipo,
    vehicle_plate as placa,
    workshop_name as oficina,
    status,
    estimated_value as valor_estimado
FROM campinas_budget_requests
LIMIT 5;

SELECT 
    'EXEMPLO - Orçamentos de Oficinas' as tipo,
    service_number as num_servico,
    (SELECT nome FROM workshops WHERE id = workshop_id) as oficina,
    total_cost as valor_total,
    status,
    is_billed as faturado
FROM workshop_budgets
LIMIT 5;