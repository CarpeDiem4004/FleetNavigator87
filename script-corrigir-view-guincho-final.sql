-- =========================================
-- SCRIPT PARA CORRIGIR VIEW DO SISTEMA DE GUINCHO
-- Versão: 3.1 - Correção de Colunas Faltantes
-- Data: 09/06/2025
-- =========================================

BEGIN;

-- 1. VERIFICAR E ADICIONAR COLUNAS FALTANTES (GARANTIA)
-- =====================================================

-- Garantir que todas as colunas necessárias existam
DO $$
BEGIN
    -- Adicionar rejected_by se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'towing_partner_services' 
        AND column_name = 'rejected_by'
    ) THEN
        ALTER TABLE towing_partner_services 
        ADD COLUMN rejected_by INTEGER REFERENCES users(id);
    END IF;
    
    -- Adicionar rejected_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'towing_partner_services' 
        AND column_name = 'rejected_at'
    ) THEN
        ALTER TABLE towing_partner_services 
        ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar rejection_reason se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'towing_partner_services' 
        AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE towing_partner_services 
        ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'towing_partner_services' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE towing_partner_services 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. FORÇAR RECRIAÇÃO DA VIEW CONSOLIDADA
-- =======================================

-- Remover view existente completamente
DROP VIEW IF EXISTS vw_servicos_guincho_consolidado CASCADE;

-- Recriar view com estrutura correta e atualizada
CREATE VIEW vw_servicos_guincho_consolidado AS
SELECT 
    tps.id,
    tps.partner_id,
    tp.name as parceiro_nome,
    COALESCE(tp.company_name, tp.name) as parceiro_empresa,
    tp.city as parceiro_cidade,
    tp.phone as parceiro_telefone,
    tp.status as parceiro_status,
    tps.plate as placa_veiculo,
    tps.origin as endereco_origem,
    tps.destination as endereco_destino,
    tps.service_type as tipo_servico,
    tps.service_date as data_servico,
    tps.cost as valor,
    tps.km_traveled as quilometragem,
    tps.status,
    tps.payment_status as status_pagamento,
    tps.notes as observacoes,
    tps.driver_name as nome_motorista,
    tps.contact_phone as telefone_contato,
    tps.created_at as data_criacao,
    tps.updated_at as data_atualizacao,
    tps.approved_by as aprovado_por,
    tps.approved_at as data_aprovacao,
    tps.rejected_by as rejeitado_por,
    tps.rejected_at as data_rejeicao,
    tps.rejection_reason as motivo_rejeicao,
    u_aprovador.name as nome_aprovador,
    u_rejeitador.name as nome_rejeitador,
    -- Campos calculados
    CASE 
        WHEN tps.status = 'pending' THEN 'Pendente'
        WHEN tps.status = 'approved' THEN 'Aprovado'
        WHEN tps.status = 'rejected' THEN 'Rejeitado'
        WHEN tps.status = 'completed' THEN 'Concluído'
        ELSE 'Desconhecido'
    END as status_formatado,
    -- Idade do serviço em dias
    EXTRACT(DAY FROM NOW() - tps.created_at) as dias_desde_criacao,
    -- Indicador de urgência
    CASE 
        WHEN tps.status = 'pending' AND EXTRACT(DAY FROM NOW() - tps.created_at) > 3 THEN 'URGENTE'
        WHEN tps.status = 'pending' AND EXTRACT(DAY FROM NOW() - tps.created_at) > 1 THEN 'ATENÇÃO'
        ELSE 'NORMAL'
    END as prioridade
FROM towing_partner_services tps
LEFT JOIN towing_partners tp ON tps.partner_id = tp.id
LEFT JOIN users u_aprovador ON tps.approved_by = u_aprovador.id
LEFT JOIN users u_rejeitador ON tps.rejected_by = u_rejeitador.id
ORDER BY tps.created_at DESC;

-- 3. CRIAR TRIGGER DE ATUALIZAÇÃO AUTOMÁTICA
-- ==========================================

CREATE OR REPLACE FUNCTION update_towing_service_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_towing_service_timestamp_trigger ON towing_partner_services;

-- Criar novo trigger
CREATE TRIGGER update_towing_service_timestamp_trigger
    BEFORE UPDATE ON towing_partner_services
    FOR EACH ROW
    EXECUTE FUNCTION update_towing_service_timestamp();

-- 4. ATUALIZAR ÍNDICES PARA NOVAS COLUNAS
-- =======================================

-- Índices para colunas de rejeição
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_rejected_by 
ON towing_partner_services(rejected_by);

CREATE INDEX IF NOT EXISTS idx_towing_partner_services_rejected_at 
ON towing_partner_services(rejected_at);

-- Índice composto para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_audit 
ON towing_partner_services(status, approved_by, rejected_by, updated_at);

-- 5. FUNÇÃO DE VERIFICAÇÃO DE INTEGRIDADE
-- =======================================

CREATE OR REPLACE FUNCTION verify_towing_system_integrity()
RETURNS TABLE (
    componente TEXT,
    status TEXT,
    detalhes TEXT
) AS $$
BEGIN
    -- Verificar tabela principal
    RETURN QUERY
    SELECT 
        'Tabela Principal'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM towing_partner_services LIMIT 1) 
             THEN 'OK' ELSE 'VAZIA' END::TEXT,
        (SELECT COUNT(*)::TEXT FROM towing_partner_services) || ' registros'::TEXT;
    
    -- Verificar view
    RETURN QUERY
    SELECT 
        'View Consolidada'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM vw_servicos_guincho_consolidado LIMIT 1) 
             THEN 'OK' ELSE 'ERRO' END::TEXT,
        'View funcional'::TEXT;
    
    -- Verificar colunas essenciais
    RETURN QUERY
    SELECT 
        'Colunas Essenciais'::TEXT,
        CASE WHEN (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = 'towing_partner_services' 
            AND column_name IN ('rejected_by', 'rejected_at', 'rejection_reason', 'updated_at')
        ) = 4 THEN 'OK' ELSE 'FALTANDO' END::TEXT,
        'Todas as colunas necessárias'::TEXT;
    
    -- Verificar índices
    RETURN QUERY
    SELECT 
        'Índices'::TEXT,
        CASE WHEN (
            SELECT COUNT(*) FROM pg_indexes 
            WHERE tablename = 'towing_partner_services'
        ) >= 7 THEN 'OK' ELSE 'INSUFICIENTES' END::TEXT,
        (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE tablename = 'towing_partner_services') || ' índices'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. EXECUTAR VERIFICAÇÃO FINAL
-- =============================

-- Testar a view criada
DO $$
DECLARE
    test_count INTEGER;
    view_count INTEGER;
BEGIN
    -- Contar registros na tabela principal
    SELECT COUNT(*) INTO test_count FROM towing_partner_services;
    
    -- Contar registros na view
    SELECT COUNT(*) INTO view_count FROM vw_servicos_guincho_consolidado;
    
    RAISE NOTICE '=======================================';
    RAISE NOTICE 'VERIFICAÇÃO DO SISTEMA DE GUINCHO';
    RAISE NOTICE '=======================================';
    RAISE NOTICE 'Registros na tabela principal: %', test_count;
    RAISE NOTICE 'Registros na view consolidada: %', view_count;
    
    IF test_count = view_count THEN
        RAISE NOTICE 'STATUS: ✓ VIEW FUNCIONANDO CORRETAMENTE';
    ELSE
        RAISE NOTICE 'STATUS: ⚠ DISCREPÂNCIA DETECTADA';
    END IF;
    
    RAISE NOTICE '=======================================';
END $$;

COMMIT;

-- =========================================
-- FIM DO SCRIPT DE CORREÇÃO
-- =========================================