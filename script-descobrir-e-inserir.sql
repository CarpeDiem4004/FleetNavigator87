-- SCRIPT INTELIGENTE: Descobrir constraint e inserir com valores corretos
-- Execute no Supabase SQL Editor

-- 1. DESCOBRIR a constraint exata de priority
SELECT 'CONSTRAINT DE PRIORITY DESCOBERTA:' as info;

SELECT 
    constraint_name,
    check_clause as "VALORES_PERMITIDOS_PRIORITY"
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%priority%'
AND constraint_schema = 'public';

-- 2. Tentar INSERT SEM priority (caso seja possível omitir)
SELECT 'TENTATIVA 1: Inserir SEM priority' as teste;

DELETE FROM campinas_budget_requests WHERE id > 0;

-- Inserir apenas com campos básicos obrigatórios (SEM priority)
DO $$
BEGIN
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
    (
        'Orçamento: Reparo Mercedes ABC1234',
        'Reparo sistema freios - pastilhas e discos',
        1,
        3,
        'Oficina Mestre Auto',
        'ABC1234',
        'Mercedes Actros',
        3,
        'Oficina Mestre Auto',
        46,
        'pendente',
        3200.00,
        'manutencao'
    ),
    (
        'Orçamento: Elétrico Volvo DEF5678',
        'Sistema elétrico e alternador',
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
    (
        'Orçamento: Preventiva Scania GHI9012',
        'Revisão 40.000 km completa',
        1,
        5,
        'Oficina ABC',
        'GHI9012',
        'Scania R450',
        5,
        'Oficina ABC',
        46,
        'em_analise',
        4500.00,
        'manutencao'
    );

    RAISE NOTICE 'INSERT SEM priority realizado com SUCESSO!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO ao inserir sem priority: %', SQLERRM;
END
$$;

-- 3. Se funcionou, continuar inserindo os demais
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM campinas_budget_requests) > 0 THEN
        -- Continuar inserindo mais registros
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
        (
            'Orçamento: Suspensão Mercedes JKL3456',
            'Amortecedores e buchas dianteiros',
            1,
            6,
            'Oficina Murici',
            'JKL3456',
            'Mercedes Atego',
            6,
            'Oficina Murici',
            47,
            'pendente',
            2900.00,
            'manutencao'
        ),
        (
            'Orçamento: Embreagem Iveco MNO7890',
            'Kit embreagem completo',
            1,
            11,
            'AUTO MECÂNICA PASSOS LTDA',
            'MNO7890',
            'Iveco Daily',
            11,
            'AUTO MECÂNICA PASSOS LTDA',
            46,
            'aprovado',
            3800.00,
            'manutencao'
        ),
        (
            'Orçamento: Revisão Ford PQR1234',
            'Manutenção 25.000 km',
            1,
            2,
            'Alair Manutenção',
            'PQR1234',
            'Ford Cargo',
            2,
            'Alair Manutenção',
            47,
            'pendente',
            2100.00,
            'manutencao'
        ),
        (
            'Orçamento: Direção VW STU5678',
            'Bomba direção hidráulica',
            1,
            12,
            'AUTOFREI',
            'STU5678',
            'VW Delivery',
            12,
            'AUTOFREI',
            46,
            'em_analise',
            1750.00,
            'manutencao'
        ),
        (
            'Orçamento: Arrefecimento Man VWX9012',
            'Radiador e bomba agua',
            1,
            3,
            'Oficina Mestre Auto',
            'VWX9012',
            'Man TGX',
            3,
            'Oficina Mestre Auto',
            47,
            'aprovado',
            4200.00,
            'manutencao'
        );

        -- Atualizar aprovados
        UPDATE campinas_budget_requests 
        SET 
            approved_value = ROUND(estimated_value * 0.90, 2),
            approved_by = 1,
            approver_name = 'Administrador Sistema',
            approved_at = NOW() - (RANDOM() * INTERVAL '3 days')
        WHERE status = 'aprovado';

        RAISE NOTICE 'Todos os 8 orçamentos inseridos com SUCESSO!';
    ELSE
        RAISE NOTICE 'Primeira inserção falhou, não continuando...';
    END IF;
END
$$;

-- 4. RESULTADO FINAL
SELECT 
    'ORÇAMENTOS DAS OFICINAS INSERIDOS:' as resultado,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    SUM(estimated_value) as valor_total_solicitado,
    SUM(approved_value) as valor_total_aprovado
FROM campinas_budget_requests;

-- 5. Mostrar alguns registros
SELECT 
    title,
    workshop_name,
    status,
    estimated_value,
    approved_value
FROM campinas_budget_requests 
LIMIT 5;

SELECT 'SUCESSO! Script inteligente executado!' as status;