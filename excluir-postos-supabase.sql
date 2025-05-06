-- Script SQL para excluir todas as tabelas de postos no Supabase,
-- exceto Posto Remédios
-- ATENÇÃO: Este script remove permanentemente dados! Use com cautela.

-- 1. Primeiro, listar todas as tabelas que serão excluídas (para conferência)
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND (
    table_name LIKE 'abastecimentos_posto_%' OR
    table_name LIKE 'posto_murici_%'
)
AND table_name NOT LIKE '%remedios%'
ORDER BY table_name;

-- 2. Listar todas as views que serão excluídas (para conferência)
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND (
    table_name LIKE 'abastecimentos_posto_%' OR
    table_name LIKE 'posto_murici_%'
)
AND table_name NOT LIKE '%remedios%'
ORDER BY table_name;

-- 3. Excluir cada tabela individualmente (com CASCADE para remover dependências)
DO $$
DECLARE
    tabela_nome text;
BEGIN
    FOR tabela_nome IN
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND (
            table_name LIKE 'abastecimentos_posto_%' OR
            table_name LIKE 'posto_murici_%'
        )
        AND table_name NOT LIKE '%remedios%'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', tabela_nome);
        RAISE NOTICE 'Tabela "%" excluída com sucesso', tabela_nome;
    END LOOP;
END $$;

-- 4. Excluir cada view individualmente (caso alguma tenha sobrado)
DO $$
DECLARE
    view_nome text;
BEGIN
    FOR view_nome IN
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND (
            table_name LIKE 'abastecimentos_posto_%' OR
            table_name LIKE 'posto_murici_%'
        )
        AND table_name NOT LIKE '%remedios%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_nome);
        RAISE NOTICE 'View "%" excluída com sucesso', view_nome;
    END LOOP;
END $$;

-- 5. Verificar que não restaram tabelas (exceto Remedios)
SELECT 'Tabelas restantes com prefixo antigo (exceto Remedios)' AS info, count(*) AS total
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'abastecimentos_posto_%'
AND table_name NOT LIKE '%remedios%'
AND table_type = 'BASE TABLE';

SELECT 'Tabelas restantes com novo prefixo (exceto Remedios)' AS info, count(*) AS total
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'posto_murici_%'
AND table_name NOT LIKE '%remedios%'
AND table_type = 'BASE TABLE';

-- 6. Verificar que não restaram views (exceto Remedios)
SELECT 'Views restantes com prefixo antigo (exceto Remedios)' AS info, count(*) AS total
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'abastecimentos_posto_%'
AND table_name NOT LIKE '%remedios%';

SELECT 'Views restantes com novo prefixo (exceto Remedios)' AS info, count(*) AS total
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'posto_murici_%'
AND table_name NOT LIKE '%remedios%';

-- 7. Verificar que a tabela do Posto Remédios ainda existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%remedios%'
    AND table_type = 'BASE TABLE'
) AS posto_remedios_existe;