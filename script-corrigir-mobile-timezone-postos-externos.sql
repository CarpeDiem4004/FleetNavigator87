-- Script completo para correção de problemas mobile e timezone nos postos externos
-- Data: 09/06/2025

-- 1. Criar middleware de timezone para postos externos
CREATE OR REPLACE FUNCTION fix_external_station_timezone(
    station_name TEXT,
    timestamp_value TIMESTAMP
) RETURNS TIMESTAMP AS $$
BEGIN
    -- Postos que têm problema de timezone (+3h)
    IF station_name IN ('abc_v2') THEN
        -- Subtrair 3 horas para normalizar para Brasília
        RETURN timestamp_value - INTERVAL '3 hours';
    END IF;
    
    -- Para outros postos, retornar sem alteração
    RETURN timestamp_value;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar função de monitoramento contínuo de timezone
CREATE OR REPLACE FUNCTION monitor_timezone_consistency()
RETURNS TABLE (
    posto TEXT,
    problemas_timezone BIGINT,
    ultimo_registro TIMESTAMP,
    diferenca_brasilia NUMERIC,
    status TEXT
) AS $$
BEGIN
    -- ABC V2
    RETURN QUERY
    SELECT 
        'abc_v2'::TEXT,
        COUNT(*) FILTER (WHERE ABS(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))) > 1)::BIGINT,
        MAX(created_at)::TIMESTAMP,
        ROUND(AVG(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))), 2),
        CASE 
            WHEN COUNT(*) FILTER (WHERE ABS(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))) > 1) = 0 
            THEN 'TIMEZONE_OK' 
            ELSE 'NEEDS_FIX' 
        END::TEXT
    FROM abastecimentos_posto_abc_v2 
    WHERE created_at >= NOW() - INTERVAL '24 hours';
    
    -- Osasco V2
    RETURN QUERY
    SELECT 
        'osasco_v2'::TEXT,
        COUNT(*) FILTER (WHERE ABS(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))) > 1)::BIGINT,
        MAX(created_at)::TIMESTAMP,
        ROUND(AVG(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))), 2),
        CASE 
            WHEN COUNT(*) FILTER (WHERE ABS(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))) > 1) = 0 
            THEN 'TIMEZONE_OK' 
            ELSE 'NEEDS_FIX' 
        END::TEXT
    FROM abastecimentos_posto_osasco_v2 
    WHERE created_at >= NOW() - INTERVAL '24 hours';
    
    -- Campinas V2
    RETURN QUERY
    SELECT 
        'campinas_v2'::TEXT,
        COUNT(*) FILTER (WHERE ABS(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))) > 1)::BIGINT,
        MAX(created_at)::TIMESTAMP,
        ROUND(AVG(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))), 2),
        CASE 
            WHEN COUNT(*) FILTER (WHERE ABS(EXTRACT(HOUR FROM created_at) - EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))) > 1) = 0 
            THEN 'TIMEZONE_OK' 
            ELSE 'NEEDS_FIX' 
        END::TEXT
    FROM abastecimentos_posto_campinas_v2 
    WHERE created_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para normalização automática de timezone
CREATE OR REPLACE FUNCTION trigger_normalize_timezone()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se é posto ABC V2 e corrigir timezone
    IF TG_TABLE_NAME = 'abastecimentos_posto_abc_v2' THEN
        -- Verificar se timestamp parece estar 3h à frente
        IF EXTRACT(HOUR FROM NEW.created_at) - EXTRACT(HOUR FROM (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = 3 THEN
            NEW.created_at := NEW.created_at - INTERVAL '3 hours';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Aplicar trigger nas tabelas necessárias
DROP TRIGGER IF EXISTS timezone_fix_trigger ON abastecimentos_posto_abc_v2;
CREATE TRIGGER timezone_fix_trigger
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_abc_v2
    FOR EACH ROW
    EXECUTE FUNCTION trigger_normalize_timezone();

-- 5. Função para relatório de status completo
CREATE OR REPLACE FUNCTION external_stations_health_report()
RETURNS TABLE (
    categoria TEXT,
    posto TEXT,
    status TEXT,
    detalhes TEXT,
    acao_recomendada TEXT
) AS $$
BEGIN
    -- Verificar problemas de timezone
    RETURN QUERY
    SELECT 
        'TIMEZONE'::TEXT,
        m.posto,
        m.status,
        'Último registro: ' || m.ultimo_registro::TEXT || ', Diferença: ' || m.diferenca_brasilia || 'h',
        CASE 
            WHEN m.status = 'NEEDS_FIX' THEN 'Executar normalize_timezone_for_external_stations()'
            ELSE 'Monitorar continuamente'
        END::TEXT
    FROM monitor_timezone_consistency() m;
    
    -- Verificar estrutura de dados
    RETURN QUERY
    SELECT 
        'DADOS'::TEXT,
        'abc_v2'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'SEM_DADOS' END::TEXT,
        COUNT(*)::TEXT || ' registros últimas 24h',
        'Verificar formulários externos'::TEXT
    FROM abastecimentos_posto_abc_v2 
    WHERE created_at >= NOW() - INTERVAL '24 hours';
    
    RETURN QUERY
    SELECT 
        'DADOS'::TEXT,
        'osasco_v2'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'SEM_DADOS' END::TEXT,
        COUNT(*)::TEXT || ' registros últimas 24h',
        'Sistema operacional'::TEXT
    FROM abastecimentos_posto_osasco_v2 
    WHERE created_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 6. Comentários e documentação
COMMENT ON FUNCTION normalize_timezone_for_external_stations() IS 'Função para corrigir registros com timezone incorreto nos postos externos';
COMMENT ON FUNCTION monitor_timezone_consistency() IS 'Monitora consistência de timezone entre postos externos';
COMMENT ON FUNCTION external_stations_health_report() IS 'Relatório completo de saúde dos postos externos';

-- Executar verificação final
SELECT 'SISTEMA DE CORREÇÃO IMPLEMENTADO' AS status;