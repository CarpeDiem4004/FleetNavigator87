-- DESCOBRIR valores permitidos para PRIORITY
-- Execute no Supabase SQL Editor

-- 1. Ver a definição da constraint de priority
SELECT 'CONSTRAINT DE PRIORITY:' as info;

SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%priority%'
AND constraint_schema = 'public';

-- 2. Ver TODAS as constraints da tabela
SELECT 'TODAS AS CONSTRAINTS DA TABELA:' as info;

SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc 
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'campinas_budget_requests'
AND tc.table_schema = 'public';

-- 3. Ver registros existentes para descobrir valores válidos de priority
SELECT 'VALORES DE PRIORITY JÁ EXISTENTES:' as info;

SELECT DISTINCT 
    priority,
    COUNT(*) as quantidade
FROM campinas_budget_requests 
WHERE priority IS NOT NULL
GROUP BY priority
ORDER BY quantidade DESC;

-- 4. Tentar inserir com valores comuns para descobrir os aceitos
SELECT 'TESTANDO VALORES COMUNS PARA PRIORITY:' as info;

-- Criar uma tabela temporária para teste
CREATE TEMP TABLE test_priority (
    id SERIAL,
    test_priority_value TEXT
);

-- Tentar inserir valores comuns (vai dar erro mas mostra quais são aceitos)
SELECT 'Valores que vamos testar: baixa, media, alta, low, medium, high, urgente, normal' as teste;

-- 5. Ver estrutura completa da coluna priority
SELECT 'DETALHES DA COLUNA PRIORITY:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND column_name = 'priority';

SELECT '🔍 Execute este script para descobrir os valores corretos de priority!' as resultado;