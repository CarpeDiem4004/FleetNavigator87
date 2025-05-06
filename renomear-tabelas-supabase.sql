-- Script SQL para renomear as tabelas no Supabase
-- de "abastecimentos_posto_" para "posto_murici_"
-- Execute este script diretamente no console SQL do Supabase

-- 1. Obter todas as tabelas com o prefixo antigo
DO $$
DECLARE
    tabela_nome text;
    novo_nome text;
BEGIN
    FOR tabela_nome IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'abastecimentos_posto_%'
    LOOP
        -- Definir novo nome
        novo_nome := 'posto_murici_' || substring(tabela_nome FROM 21);
        
        -- Verificar se a tabela com novo nome já existe
        IF EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = novo_nome
        ) THEN
            RAISE NOTICE 'A tabela "%" já existe. Ignorando.', novo_nome;
        ELSE
            -- Renomear a tabela
            EXECUTE format('ALTER TABLE IF EXISTS %I RENAME TO %I', tabela_nome, novo_nome);
            RAISE NOTICE 'Tabela "%" renomeada para "%"', tabela_nome, novo_nome;
        END IF;
    END LOOP;
END $$;

-- 2. Obter todas as views com o prefixo antigo
DO $$
DECLARE
    view_nome text;
    novo_nome text;
BEGIN
    FOR view_nome IN
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name LIKE 'abastecimentos_posto_%'
    LOOP
        -- Definir novo nome
        novo_nome := 'posto_murici_' || substring(view_nome FROM 21);
        
        -- Verificar se a view com novo nome já existe
        IF EXISTS (
            SELECT FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name = novo_nome
        ) THEN
            RAISE NOTICE 'A view "%" já existe. Ignorando.', novo_nome;
        ELSE
            -- Renomear a view
            EXECUTE format('ALTER VIEW IF EXISTS %I RENAME TO %I', view_nome, novo_nome);
            RAISE NOTICE 'View "%" renomeada para "%"', view_nome, novo_nome;
        END IF;
    END LOOP;
END $$;

-- 3. Verificar resultados após a renomeação
SELECT 'Tabelas restantes com prefixo antigo' AS info, count(*) AS total
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'abastecimentos_posto_%'
AND table_type = 'BASE TABLE';

SELECT 'Views restantes com prefixo antigo' AS info, count(*) AS total
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'abastecimentos_posto_%';

SELECT 'Tabelas com novo prefixo' AS info, count(*) AS total
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'posto_murici_%'
AND table_type = 'BASE TABLE';

SELECT 'Views com novo prefixo' AS info, count(*) AS total
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'posto_murici_%';