-- Script COMPLETO para resolver TODAS as colunas obrigatórias
-- Execute no Supabase SQL Editor

-- 1. Adicionar TODAS as colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar title se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'title') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN title VARCHAR(200);
        RAISE NOTICE 'Coluna title adicionada';
    END IF;

    -- Adicionar priority se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'priority') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN priority VARCHAR(50) DEFAULT 'medio';
        RAISE NOTICE 'Coluna priority adicionada';
    END IF;

    -- Adicionar category se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'category') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN category VARCHAR(100) DEFAULT 'manutencao';
        RAISE NOTICE 'Coluna category adicionada';
    END IF;

    -- Adicionar due_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'due_date') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN due_date TIMESTAMP;
        RAISE NOTICE 'Coluna due_date adicionada';
    END IF;

    -- Adicionar notes se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'notes') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN notes TEXT;
        RAISE NOTICE 'Coluna notes adicionada';
    END IF;

    RAISE NOTICE 'Todas as colunas obrigatórias foram verificadas e adicionadas!';
END
$$;

-- 2. Limpar dados existentes
DELETE FROM campinas_budget_requests WHERE id > 0;

-- 3. Inserir dados com TODOS os campos obrigatórios preenchidos
INSERT INTO campinas_budget_requests (
    title,
    description,
    vehicle_plate,
    vehicle_model,
    workshop_id,
    workshop_name,
    base_id,
    requested_by,
    requester_name,
    status,
    estimated_value,
    priority,
    category,
    due_date
) VALUES
(
    'Manutenção Mercedes Actros - ABC1234',
    'Revisão completa do sistema de freios e troca de óleo',
    'ABC1234',
    'Mercedes Actros',
    3,
    'Oficina Mestre Auto',
    46,
    1,
    'Administrador Sistema',
    'pendente',
    2500.00,
    'alto',
    'manutencao_preventiva',
    NOW() + INTERVAL '7 days'
),
(
    'Reparo Elétrico Volvo FH - DEF5678',
    'Reparo no sistema elétrico e troca de lâmpadas H7',
    'DEF5678',
    'Volvo FH',
    4,
    'Auto Socorro Premium',
    47,
    1,
    'Administrador Sistema',
    'aprovado',
    1800.00,
    'medio',
    'reparo_eletrico',
    NOW() + INTERVAL '5 days'
),
(
    'Manutenção Preventiva Scania - GHI9012',
    'Manutenção preventiva - troca de filtros e fluidos',
    'GHI9012',
    'Scania R450',
    5,
    'Oficina Especializada ABC',
    46,
    1,
    'Administrador Sistema',
    'em_analise',
    3200.00,
    'medio',
    'manutencao_preventiva',
    NOW() + INTERVAL '10 days'
),
(
    'Reparo Suspensão Mercedes Atego - JKL3456',
    'Reparo no sistema de suspensão dianteira',
    'JKL3456',
    'Mercedes Atego',
    6,
    'Oficina Murici',
    47,
    1,
    'Administrador Sistema',
    'pendente',
    4500.00,
    'alto',
    'reparo_mecanico',
    NOW() + INTERVAL '3 days'
),
(
    'Troca Embreagem Iveco Daily - MNO7890',
    'Troca de embreagem e reparo na caixa de câmbio',
    'MNO7890',
    'Iveco Daily',
    11,
    'AUTO MECÂNICA PASSOS LTDA',
    46,
    1,
    'Administrador Sistema',
    'aprovado',
    5200.00,
    'alto',
    'reparo_mecanico',
    NOW() + INTERVAL '2 days'
),
(
    'Revisão 20.000km Ford Cargo - PQR1234',
    'Revisão de 20.000 km - completa com filtros e óleo',
    'PQR1234',
    'Ford Cargo',
    2,
    'Alair Manutenção e Serviços Automotivos Ltda',
    47,
    1,
    'Administrador Sistema',
    'pendente',
    2800.00,
    'medio',
    'manutencao_preventiva',
    NOW() + INTERVAL '14 days'
),
(
    'Direção Hidráulica VW Delivery - STU5678',
    'Reparo no sistema de direção hidráulica',
    'STU5678',
    'Volkswagen Delivery',
    12,
    'AUTOFREI',
    46,
    1,
    'Administrador Sistema',
    'em_analise',
    1950.00,
    'baixo',
    'reparo_mecanico',
    NOW() + INTERVAL '21 days'
),
(
    'Sistema Arrefecimento Man TGX - VWX9012',
    'Manutenção do sistema de arrefecimento',
    'VWX9012',
    'Man TGX',
    3,
    'Oficina Mestre Auto',
    47,
    1,
    'Administrador Sistema',
    'aprovado',
    3400.00,
    'medio',
    'manutencao_preventiva',
    NOW() + INTERVAL '7 days'
);

-- 4. Atualizar valores aprovados para os status 'aprovado'
UPDATE campinas_budget_requests 
SET approved_value = ROUND(estimated_value * (0.85 + RANDOM() * 0.15), 2),
    approved_by = 1,
    approver_name = 'Administrador Sistema',
    approved_at = NOW() - (RANDOM() * INTERVAL '5 days')
WHERE status = 'aprovado';

-- 5. Verificar estrutura final
SELECT 'ESTRUTURA FINAL DA TABELA:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar dados inseridos
SELECT 'RESUMO DOS DADOS:' as info;
SELECT 
    COUNT(*) as total_inserido,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    COUNT(CASE WHEN priority = 'alto' THEN 1 END) as prioridade_alta,
    COUNT(CASE WHEN priority = 'medio' THEN 1 END) as prioridade_media
FROM campinas_budget_requests;

-- 7. Mostrar exemplos dos dados com todos os campos
SELECT 
    title,
    vehicle_plate as placa,
    workshop_name as oficina,
    status,
    priority as prioridade,
    category as categoria,
    estimated_value as valor_estimado,
    approved_value as valor_aprovado
FROM campinas_budget_requests 
ORDER BY 
    CASE priority 
        WHEN 'alto' THEN 1 
        WHEN 'medio' THEN 2 
        WHEN 'baixo' THEN 3 
    END,
    id
LIMIT 8;

SELECT 'DADOS INSERIDOS COM SUCESSO - TODAS AS COLUNAS OBRIGATÓRIAS PREENCHIDAS!' as resultado;