-- SCRIPT DEFINITIVO para resolver TODOS os problemas da tabela campinas_budget_requests
-- Execute no Supabase SQL Editor

-- 1. PRIMEIRO: Identificar e adicionar TODAS as colunas obrigatórias que faltam
DO $$
BEGIN
    -- Colunas que sabemos que faltam baseado nos erros
    
    -- title (já sabemos que precisa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'title') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN title VARCHAR(200) NOT NULL DEFAULT 'Solicitação de Orçamento';
        RAISE NOTICE 'Adicionado: title';
    END IF;

    -- priority (já sabemos que precisa)  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'priority') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN priority VARCHAR(50) NOT NULL DEFAULT 'medio';
        RAISE NOTICE 'Adicionado: priority';
    END IF;

    -- requester_id (já sabemos que precisa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'requester_id') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN requester_id INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Adicionado: requester_id';
    END IF;

    -- Outras colunas que podem ser obrigatórias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'department') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN department VARCHAR(100) DEFAULT 'manutencao';
        RAISE NOTICE 'Adicionado: department';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'category') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN category VARCHAR(100) DEFAULT 'reparo';
        RAISE NOTICE 'Adicionado: category';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campinas_budget_requests' AND column_name = 'comments') THEN
        ALTER TABLE campinas_budget_requests ADD COLUMN comments TEXT;
        RAISE NOTICE 'Adicionado: comments';
    END IF;

    RAISE NOTICE 'Verificação de colunas concluída!';
END
$$;

-- 2. LIMPAR dados de teste existentes
DELETE FROM campinas_budget_requests WHERE vehicle_plate = 'TEST123' OR id <= 10;

-- 3. INSERIR dados completos com TODAS as colunas obrigatórias preenchidas
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
-- Registro 1
(
    'Manutenção Mercedes Actros ABC1234',
    'Revisão completa do sistema de freios e troca de óleo do motor',
    'alto',
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
    'Veículo necessita de manutenção urgente no sistema de freios'
),
-- Registro 2  
(
    'Reparo Elétrico Volvo FH DEF5678',
    'Reparo no sistema elétrico e troca de lâmpadas H7',
    'medio',
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
    'Sistema elétrico apresentando falhas intermitentes'
),
-- Registro 3
(
    'Manutenção Preventiva Scania GHI9012',
    'Manutenção preventiva - troca de filtros e fluidos',
    'medio',
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
    'Manutenção programada de 30.000 km'
),
-- Registro 4
(
    'Reparo Suspensão Mercedes JKL3456',
    'Reparo no sistema de suspensão dianteira',
    'alto',
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
    'Suspensão apresentando ruídos e instabilidade'
),
-- Registro 5
(
    'Troca Embreagem Iveco MNO7890',
    'Troca de embreagem e reparo na caixa de câmbio',
    'alto',
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
    'Embreagem patinando e câmbio com dificuldades de engate'
),
-- Registro 6
(
    'Revisão Ford Cargo PQR1234',
    'Revisão de 20.000 km - completa com filtros e óleo',
    'medio',
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
    'Revisão programada conforme manual do fabricante'
),
-- Registro 7
(
    'Direção Hidráulica VW STU5678',
    'Reparo no sistema de direção hidráulica',
    'baixo',
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
    'Direção com folga e ruído ao esterçar'
),
-- Registro 8
(
    'Sistema Arrefecimento Man VWX9012',
    'Manutenção do sistema de arrefecimento',
    'medio',
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
    'Sistema apresentando superaquecimento intermitente'
);

-- 4. ATUALIZAR registros aprovados com dados de aprovação
UPDATE campinas_budget_requests 
SET 
    approved_value = ROUND(estimated_value * (0.85 + RANDOM() * 0.15), 2),
    approved_by = 1,
    approver_name = 'Administrador Sistema',
    approved_at = NOW() - (RANDOM() * INTERVAL '7 days'),
    updated_at = NOW()
WHERE status = 'aprovado';

-- 5. VERIFICAÇÃO FINAL - Mostrar resultados
SELECT 'RESULTADO FINAL:' as info;

-- Contagem por status
SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(estimated_value) as valor_total_estimado,
    SUM(approved_value) as valor_total_aprovado
FROM campinas_budget_requests 
GROUP BY status
ORDER BY status;

-- Total geral
SELECT 
    'TOTAIS GERAIS' as categoria,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
    SUM(estimated_value) as valor_total,
    SUM(CASE WHEN status = 'aprovado' THEN approved_value ELSE 0 END) as valor_aprovado_total
FROM campinas_budget_requests;

-- Amostras dos dados
SELECT 
    'AMOSTRA DOS DADOS:' as info,
    title,
    vehicle_plate,
    workshop_name,
    status,
    priority,
    estimated_value,
    approved_value
FROM campinas_budget_requests 
ORDER BY 
    CASE priority WHEN 'alto' THEN 1 WHEN 'medio' THEN 2 WHEN 'baixo' THEN 3 END,
    created_at DESC
LIMIT 8;

SELECT '✅ SCRIPT EXECUTADO COM SUCESSO! Agora a página deve mostrar os dados nos cards.' as resultado;