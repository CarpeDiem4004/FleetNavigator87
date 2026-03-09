-- Script de ANÁLISE COMPLETA da tabela campinas_budget_requests
-- Execute no Supabase SQL Editor para descobrir TODOS os problemas

-- 1. ANÁLISE COMPLETA DA ESTRUTURA
SELECT 'ESTRUTURA COMPLETA DA TABELA campinas_budget_requests:' as info;

SELECT 
    column_name as coluna,
    data_type as tipo,
    CASE 
        WHEN is_nullable = 'NO' THEN '❌ OBRIGATÓRIA (NOT NULL)'
        ELSE '✅ Opcional'
    END as obrigatoria,
    COALESCE(column_default, '(sem padrão)') as valor_padrao,
    character_maximum_length as tamanho_max
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY 
    CASE WHEN is_nullable = 'NO' THEN 1 ELSE 2 END,
    ordinal_position;

-- 2. LISTAR APENAS AS COLUNAS OBRIGATÓRIAS (NOT NULL)
SELECT 'COLUNAS OBRIGATÓRIAS QUE DEVEM SER PREENCHIDAS:' as info;

SELECT 
    '- ' || column_name || ' (' || data_type || ')' as colunas_obrigatorias
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
AND is_nullable = 'NO'
AND column_default IS NULL  -- Sem valor padrão
ORDER BY ordinal_position;

-- 3. CONTAR TOTAL DE COLUNAS
SELECT 
    'TOTAL DE COLUNAS: ' || COUNT(*) as total,
    'OBRIGATÓRIAS: ' || COUNT(CASE WHEN is_nullable = 'NO' THEN 1 END) as obrigatorias,
    'OPCIONAIS: ' || COUNT(CASE WHEN is_nullable = 'YES' THEN 1 END) as opcionais
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public';

-- 4. VERIFICAR SE A TABELA TEM DADOS
SELECT 'DADOS ATUAIS NA TABELA:' as info;
SELECT COUNT(*) as total_registros FROM campinas_budget_requests;

-- 5. MOSTRAR CONSTRAINTS (RESTRIÇÕES)
SELECT 'CONSTRAINTS DA TABELA:' as info;
SELECT 
    constraint_name as nome_constraint,
    constraint_type as tipo
FROM information_schema.table_constraints
WHERE table_name = 'campinas_budget_requests'
AND table_schema = 'public';

-- 6. GERAR TEMPLATE DE INSERT BASEADO NAS COLUNAS OBRIGATÓRIAS
SELECT 'TEMPLATE DE INSERT NECESSÁRIO:' as info;

SELECT 'INSERT INTO campinas_budget_requests (' || 
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) || 
    ') VALUES (...);' as template_insert
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
AND is_nullable = 'NO'
AND column_name != 'id'  -- Excluir ID auto-incremento
AND column_default IS NULL;  -- Excluir colunas com valor padrão

-- 7. MOSTRAR SAMPLE DE DADOS SE EXISTIR
SELECT 'DADOS EXISTENTES (SAMPLE):' as info;
SELECT * FROM campinas_budget_requests LIMIT 3;

SELECT '🔍 ANÁLISE CONCLUÍDA! Verifique as colunas obrigatórias acima.' as resultado;