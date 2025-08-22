-- Script FINAL para resolver problema da coluna department obrigatória
-- Execute no Supabase SQL Editor

-- 1. Adicionar coluna department se não existir, com valor padrão
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campinas_budget_requests' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN department VARCHAR(100) NOT NULL DEFAULT 'manutencao';
        RAISE NOTICE 'Coluna department adicionada com valor padrão';
    ELSE
        RAISE NOTICE 'Coluna department já existe';
    END IF;
END
$$;

-- 2. Limpar dados existentes
DELETE FROM campinas_budget_requests WHERE id > 0;

-- 3. Inserir dados com TODAS as colunas obrigatórias preenchidas
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
    estimated_value,
    department
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
    2500.00,
    'manutencao'
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
    1800.00,
    'manutencao'
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
    3200.00,
    'manutencao'
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
    4500.00,
    'manutencao'
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
    5200.00,
    'manutencao'
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
    2800.00,
    'manutencao'
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
    1950.00,
    'manutencao'
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
    3400.00,
    'manutencao'
);

-- 4. Atualizar registros aprovados com valores de aprovação
UPDATE campinas_budget_requests 
SET 
    approved_value = ROUND(estimated_value * (0.85 + RANDOM() * 0.15), 2),
    approved_by = 1,
    approver_name = 'Administrador Sistema',
    approved_at = NOW() - (RANDOM() * INTERVAL '7 days'),
    updated_at = NOW()
WHERE status = 'aprovado';

-- 5. Verificar resultado final
SELECT 
    'RESULTADO FINAL:' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    SUM(estimated_value) as valor_total_estimado,
    SUM(CASE WHEN status = 'aprovado' THEN approved_value ELSE 0 END) as valor_total_aprovado
FROM campinas_budget_requests;

-- 6. Mostrar amostra dos dados inseridos
SELECT 
    'AMOSTRA DOS DADOS:' as tipo,
    vehicle_plate as placa,
    workshop_name as oficina,
    status,
    department as departamento,
    estimated_value as valor_estimado,
    approved_value as valor_aprovado
FROM campinas_budget_requests 
ORDER BY id
LIMIT 8;

SELECT '🎉 DADOS INSERIDOS COM SUCESSO! A página deve funcionar agora!' as resultado;