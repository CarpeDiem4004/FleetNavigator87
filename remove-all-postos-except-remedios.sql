-- Script SQL para remover todas as tabelas de postos exceto Posto Remédios
-- Este script deve ser executado com muito cuidado, pois apagará dados permanentemente
-- Recomenda-se fazer um backup completo do banco de dados antes de executar este script

-- Configurando mensagens de confirmação
SET client_min_messages TO NOTICE;

-- Função auxiliar para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION table_exists(table_name text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        AND tablename = table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para verificar se uma visão existe
CREATE OR REPLACE FUNCTION view_exists(view_name text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM pg_catalog.pg_views
        WHERE schemaname = 'public'
        AND viewname = view_name
    );
END;
$$ LANGUAGE plpgsql;

-- Início da transação para garantir consistência
BEGIN;

-- Removendo tabelas de postos - Osasco
DO $$
BEGIN
    IF (SELECT table_exists('abastecimentos_posto_osasco')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_osasco';
        DROP TABLE public.abastecimentos_posto_osasco CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_osasco não existe, pulando';
    END IF;
    
    IF (SELECT table_exists('abastecimentos_posto_osasco_v2')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_osasco_v2';
        DROP TABLE public.abastecimentos_posto_osasco_v2 CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_osasco_v2 não existe, pulando';
    END IF;
END $$;

-- Removendo tabelas de postos - Guarulhos/Alair
DO $$
BEGIN
    IF (SELECT table_exists('abastecimentos_posto_guarulhos')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_guarulhos';
        DROP TABLE public.abastecimentos_posto_guarulhos CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_guarulhos não existe, pulando';
    END IF;
    
    IF (SELECT table_exists('abastecimentos_posto_guarulhos_v2')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_guarulhos_v2';
        DROP TABLE public.abastecimentos_posto_guarulhos_v2 CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_guarulhos_v2 não existe, pulando';
    END IF;
    
    IF (SELECT table_exists('abastecimentos_posto_alair_v2')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_alair_v2';
        DROP TABLE public.abastecimentos_posto_alair_v2 CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_alair_v2 não existe, pulando';
    END IF;
END $$;

-- Removendo tabelas de postos - Campinas
DO $$
BEGIN
    IF (SELECT table_exists('abastecimentos_posto_campinas')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_campinas';
        DROP TABLE public.abastecimentos_posto_campinas CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_campinas não existe, pulando';
    END IF;
    
    IF (SELECT table_exists('abastecimentos_posto_campinas_v2')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_campinas_v2';
        DROP TABLE public.abastecimentos_posto_campinas_v2 CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_campinas_v2 não existe, pulando';
    END IF;
END $$;

-- Removendo tabelas de postos - Socorro
DO $$
BEGIN
    IF (SELECT table_exists('abastecimentos_posto_socorro')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_socorro';
        DROP TABLE public.abastecimentos_posto_socorro CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_socorro não existe, pulando';
    END IF;
    
    IF (SELECT table_exists('abastecimentos_posto_socorro_v2')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_socorro_v2';
        DROP TABLE public.abastecimentos_posto_socorro_v2 CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_socorro_v2 não existe, pulando';
    END IF;
END $$;

-- Removendo tabelas de postos - Sorocaba
DO $$
BEGIN
    IF (SELECT table_exists('abastecimentos_posto_sorocaba')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_sorocaba';
        DROP TABLE public.abastecimentos_posto_sorocaba CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_sorocaba não existe, pulando';
    END IF;
    
    IF (SELECT table_exists('abastecimentos_posto_sorocaba_v2')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_sorocaba_v2';
        DROP TABLE public.abastecimentos_posto_sorocaba_v2 CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_sorocaba_v2 não existe, pulando';
    END IF;
END $$;

-- Removendo tabelas de postos - São Paulo
DO $$
BEGIN
    IF (SELECT table_exists('abastecimentos_posto_saopaulo')) THEN
        RAISE NOTICE 'Removendo tabela abastecimentos_posto_saopaulo';
        DROP TABLE public.abastecimentos_posto_saopaulo CASCADE;
    ELSE
        RAISE NOTICE 'Tabela abastecimentos_posto_saopaulo não existe, pulando';
    END IF;
END $$;

-- Verificando e removendo visões (views) relacionadas aos postos removidos
DO $$
DECLARE
    view_name text;
    view_names text[] := array[
        'view_osasco', 'view_osasco_v2', 
        'view_guarulhos', 'view_guarulhos_v2', 'view_alair_v2',
        'view_campinas', 'view_campinas_v2',
        'view_socorro', 'view_socorro_v2',
        'view_sorocaba', 'view_sorocaba_v2',
        'view_saopaulo'
    ];
BEGIN
    FOREACH view_name IN ARRAY view_names LOOP
        IF (SELECT view_exists(view_name)) THEN
            RAISE NOTICE 'Removendo visão %', view_name;
            EXECUTE 'DROP VIEW IF EXISTS public.' || view_name || ' CASCADE';
        ELSE
            RAISE NOTICE 'Visão % não existe, pulando', view_name;
        END IF;
    END LOOP;
END $$;

-- Remover referências dos postos na tabela de usuários (opcional)
-- Esta operação é opcional e pode ser comentada se você quiser manter os registros
DO $$
BEGIN
    -- Verificando se a coluna basename existe na tabela users
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'basename'
    ) THEN
        -- Atualizando usuários associados a postos removidos para apontar para 'remedios'
        RAISE NOTICE 'Atualizando usuários de postos removidos para apontar para o Posto Remédios';
        UPDATE public.users 
        SET basename = 'remedios' 
        WHERE basename IN ('osasco', 'osasco_v2', 'guarulhos', 'guarulhos_v2', 'alair_v2', 
                          'campinas', 'campinas_v2', 'socorro', 'socorro_v2',
                          'sorocaba', 'sorocaba_v2', 'saopaulo', 'abc', 'abc_v2');
    ELSE
        RAISE NOTICE 'Coluna basename não encontrada na tabela users, pulando atualização';
    END IF;
END $$;

-- Finaliza a transação com sucesso
COMMIT;

-- Remover funções auxiliares
DROP FUNCTION IF EXISTS table_exists(text);
DROP FUNCTION IF EXISTS view_exists(text);

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE 'Remoção de postos concluída com sucesso! Apenas o Posto Remédios permanece no sistema.';
END $$;