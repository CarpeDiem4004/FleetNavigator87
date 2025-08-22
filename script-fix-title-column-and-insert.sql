-- Script para adicionar coluna title (se necessário) e inserir dados
-- Execute no Supabase SQL Editor

-- 1. Primeiro, adicionar a coluna title se não existir
DO $$
BEGIN
    -- Adicionar coluna title se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN title VARCHAR(200);
        RAISE NOTICE 'Coluna title adicionada';
    ELSE
        RAISE NOTICE 'Coluna title já existe';
    END IF;
END
$$;

-- 2. Limpar dados existentes
DELETE FROM campinas_budget_requests WHERE id > 0;

-- 3. Inserir dados incluindo o campo title
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
    estimated_value
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
    2500.00
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
    1800.00
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
    3200.00
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
    4500.00
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
    5200.00
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
    2800.00
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
    1950.00
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
    3400.00
);

-- 4. Atualizar valores aprovados para os status 'aprovado'
UPDATE campinas_budget_requests 
SET approved_value = ROUND(estimated_value * (0.85 + RANDOM() * 0.15), 2),
    approved_by = 1,
    approver_name = 'Administrador Sistema'
WHERE status = 'aprovado';

-- 5. Verificar estrutura final da tabela
SELECT 'ESTRUTURA DA TABELA:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar resultado dos dados inseridos
SELECT 'DADOS INSERIDOS:' as info;
SELECT 
    COUNT(*) as total_inserido,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise
FROM campinas_budget_requests;

-- 7. Mostrar exemplos dos dados
SELECT 
    title,
    vehicle_plate as placa,
    workshop_name as oficina,
    status,
    estimated_value as valor_estimado,
    approved_value as valor_aprovado
FROM campinas_budget_requests 
ORDER BY id
LIMIT 8;

SELECT 'SCRIPT EXECUTADO COM SUCESSO!' as resultado;