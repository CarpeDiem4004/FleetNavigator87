-- ANÁLISE COMPLETA de TODAS as colunas obrigatórias
-- Execute no Supabase SQL Editor

-- 1. ESTRUTURA COMPLETA DA TABELA - mostrar TUDO
SELECT 'ESTRUTURA COMPLETA DA TABELA campinas_budget_requests:' as analise;

SELECT 
    column_name as "COLUNA",
    data_type as "TIPO",
    CASE 
        WHEN is_nullable = 'NO' THEN '🚨 OBRIGATÓRIA (NOT NULL)'
        ELSE '✅ Opcional'
    END as "STATUS",
    COALESCE(column_default, '(sem padrão)') as "VALOR_PADRÃO",
    character_maximum_length as "TAMANHO_MAX"
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
ORDER BY 
    -- Mostrar obrigatórias primeiro
    CASE WHEN is_nullable = 'NO' THEN 1 ELSE 2 END,
    ordinal_position;

-- 2. LISTAR APENAS AS COLUNAS OBRIGATÓRIAS SEM VALOR PADRÃO
SELECT 'COLUNAS QUE DEVEM SER PREENCHIDAS OBRIGATORIAMENTE:' as analise;

SELECT 
    '❌ ' || column_name || ' (' || data_type || 
    CASE 
        WHEN character_maximum_length IS NOT NULL 
        THEN ',' || character_maximum_length || ' chars'
        ELSE ''
    END || ')' as "COLUNAS_OBRIGATORIAS_SEM_PADRAO"
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
AND is_nullable = 'NO'
AND (column_default IS NULL OR column_default NOT LIKE 'nextval%')  -- Excluir IDs auto-incremento
ORDER BY ordinal_position;

-- 3. LISTAR COLUNAS COM VALOR PADRÃO
SELECT 'COLUNAS COM VALOR PADRÃO (podem ser omitidas no INSERT):' as analise;

SELECT 
    '✅ ' || column_name || ' = ' || COALESCE(column_default, 'NULL') as "COLUNAS_COM_PADRAO"
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
AND column_default IS NOT NULL
ORDER BY ordinal_position;

-- 4. CONTAR TOTAIS
SELECT 
    'RESUMO GERAL:' as analise,
    COUNT(*) as "TOTAL_COLUNAS",
    COUNT(CASE WHEN is_nullable = 'NO' THEN 1 END) as "OBRIGATORIAS",
    COUNT(CASE WHEN is_nullable = 'NO' AND column_default IS NULL AND column_name != 'id' THEN 1 END) as "OBRIGATORIAS_SEM_PADRAO",
    COUNT(CASE WHEN is_nullable = 'YES' THEN 1 END) as "OPCIONAIS"
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public';

-- 5. GERAR TEMPLATE DE INSERT COM TODAS AS COLUNAS OBRIGATÓRIAS
SELECT 'TEMPLATE DE INSERT CORRETO:' as analise;

SELECT 'INSERT INTO campinas_budget_requests (' || STRING_AGG(column_name, ', ' ORDER BY ordinal_position) || ') VALUES (...);' as "TEMPLATE_INSERT"
FROM information_schema.columns 
WHERE table_name = 'campinas_budget_requests' 
AND table_schema = 'public'
AND is_nullable = 'NO'
AND column_name != 'id'  -- Excluir ID auto-incremento
AND (column_default IS NULL OR column_default NOT LIKE '%nextval%');

-- 6. VERIFICAR CONSTRAINTS ADICIONAIS
SELECT 'CONSTRAINTS DE VERIFICAÇÃO:' as analise;

SELECT 
    constraint_name as "CONSTRAINT",
    constraint_type as "TIPO"
FROM information_schema.table_constraints
WHERE table_name = 'campinas_budget_requests'
AND table_schema = 'public';

-- 7. MOSTRAR DADOS EXISTENTES PARA REFERÊNCIA
SELECT 'DADOS EXISTENTES NA TABELA (sample):' as analise;
SELECT COUNT(*) as "TOTAL_REGISTROS_ATUAL" FROM campinas_budget_requests;

-- Mostrar estrutura de 1 registro se existir
SELECT * FROM campinas_budget_requests LIMIT 1;

SELECT '🔍 ANÁLISE CONCLUÍDA! Use as informações acima para criar o INSERT correto.' as resultado;