-- =========================================
-- SCRIPT COMPLETO DE ATUALIZAÇÃO DO SISTEMA DE GUINCHO
-- Versão: 2.0 - Migração e Otimização Completa
-- Data: 09/06/2025
-- =========================================

BEGIN;

-- 1. VERIFICAR E ATUALIZAR ESTRUTURA DA TABELA PRINCIPAL
-- ========================================================

-- Garantir que towing_partner_services tenha todas as colunas necessárias
DO $$
BEGIN
    -- Adicionar colunas que podem estar faltando
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towing_partner_services' AND column_name = 'updated_at') THEN
        ALTER TABLE towing_partner_services ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towing_partner_services' AND column_name = 'rejected_by') THEN
        ALTER TABLE towing_partner_services ADD COLUMN rejected_by INTEGER REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towing_partner_services' AND column_name = 'rejected_at') THEN
        ALTER TABLE towing_partner_services ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towing_partner_services' AND column_name = 'rejection_reason') THEN
        ALTER TABLE towing_partner_services ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Garantir que as colunas tenham valores padrão adequados
    ALTER TABLE towing_partner_services ALTER COLUMN service_type SET DEFAULT 'guincho';
    ALTER TABLE towing_partner_services ALTER COLUMN status SET DEFAULT 'pending';
    ALTER TABLE towing_partner_services ALTER COLUMN payment_status SET DEFAULT 'pending';
    ALTER TABLE towing_partner_services ALTER COLUMN created_at SET DEFAULT NOW();
    ALTER TABLE towing_partner_services ALTER COLUMN updated_at SET DEFAULT NOW();
END $$;

-- 2. MIGRAR DADOS DA TABELA ANTIGA (SE EXISTIR)
-- ============================================

-- Migrar dados de towing_service_notes para towing_partner_services (se houver dados)
INSERT INTO towing_partner_services (
    partner_id, plate, origin, destination, service_date, service_type, cost, 
    km_traveled, status, notes, driver_name, contact_phone, created_at, 
    approved_by, approved_at, payment_status, pickup_location, delivery_location, mileage,
    rejected_by, rejected_at, rejection_reason, updated_at
)
SELECT 
    tsn.partner_id, 
    tsn.plate, 
    tsn.pickup_location, 
    tsn.delivery_location, 
    tsn.service_date::date, 
    COALESCE(tsn.service_description, 'guincho'), 
    tsn.cost, 
    tsn.mileage, 
    COALESCE(tsn.status, 'pending'), 
    tsn.notes, 
    tsn.contact_name, 
    tsn.contact_phone, 
    tsn.created_at,
    CASE 
        WHEN tsn.approved_by IS NOT NULL THEN 
            (SELECT id FROM users WHERE name = tsn.approved_by LIMIT 1)
        ELSE NULL
    END,
    tsn.approved_at, 
    COALESCE(tsn.payment_status, 'pending'),
    tsn.pickup_location, 
    tsn.delivery_location, 
    tsn.mileage,
    CASE 
        WHEN tsn.rejected_by IS NOT NULL THEN 
            (SELECT id FROM users WHERE name = tsn.rejected_by LIMIT 1)
        ELSE NULL
    END,
    tsn.rejected_at,
    tsn.rejection_reason,
    tsn.updated_at
FROM towing_service_notes tsn
WHERE NOT EXISTS (
    SELECT 1 FROM towing_partner_services tps 
    WHERE tps.partner_id = tsn.partner_id 
    AND tps.plate = tsn.plate 
    AND tps.service_date = tsn.service_date::date
)
ON CONFLICT DO NOTHING;

-- 3. ATUALIZAR TRIGGERS DE SINCRONIZAÇÃO
-- ======================================

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS towing_services_sync_trigger ON towing_service_notes;
DROP TRIGGER IF EXISTS towing_partner_services_sync_trigger ON towing_partner_services;

-- Criar função de sincronização atualizada
CREATE OR REPLACE FUNCTION sync_towing_services()
RETURNS TRIGGER AS $$
BEGIN
    -- Sincronizar com a tabela servicos_guincho
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        INSERT INTO servicos_guincho (
            parceiro_id, placa_veiculo, endereco_origem, endereco_destino, 
            tipo_servico, data_servico, valor, quilometragem, observacoes, 
            nome_motorista, telefone_contato, status, data_lancamento,
            usuario_aprovacao, data_aprovacao
        ) 
        VALUES (
            NEW.partner_id, NEW.plate, NEW.origin, NEW.destination, 
            NEW.service_type, NEW.service_date, NEW.cost, NEW.km_traveled, 
            NEW.notes, NEW.driver_name, NEW.contact_phone, NEW.status, NEW.created_at,
            NEW.approved_by, NEW.approved_at
        )
        ON CONFLICT (parceiro_id, placa_veiculo, data_servico) 
        DO UPDATE SET
            endereco_origem = NEW.origin,
            endereco_destino = NEW.destination,
            tipo_servico = NEW.service_type,
            valor = NEW.cost,
            quilometragem = NEW.km_traveled,
            observacoes = NEW.notes,
            nome_motorista = NEW.driver_name,
            telefone_contato = NEW.contact_phone,
            status = NEW.status,
            usuario_aprovacao = NEW.approved_by,
            data_aprovacao = NEW.approved_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar novo trigger na tabela correta
CREATE TRIGGER towing_partner_services_sync_trigger
    AFTER INSERT OR UPDATE ON towing_partner_services
    FOR EACH ROW
    EXECUTE FUNCTION sync_towing_services();

-- 4. OTIMIZAR ÍNDICES
-- ==================

-- Criar índices essenciais para performance
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_partner_id ON towing_partner_services(partner_id);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_plate ON towing_partner_services(plate);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_status ON towing_partner_services(status);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_service_date ON towing_partner_services(service_date);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_created_at ON towing_partner_services(created_at);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_payment_status ON towing_partner_services(payment_status);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_partner_status ON towing_partner_services(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_towing_partner_services_plate_date ON towing_partner_services(plate, service_date);

-- 5. ATUALIZAR VIEW CONSOLIDADA
-- =============================

-- Recriar view atualizada que une todas as informações
DROP VIEW IF EXISTS vw_servicos_guincho_consolidado;
CREATE VIEW vw_servicos_guincho_consolidado AS
SELECT 
    tps.id,
    tps.partner_id,
    tp.name as parceiro_nome,
    tp.company_name as parceiro_empresa,
    tp.city as parceiro_cidade,
    tp.phone as parceiro_telefone,
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
    u_rejeitador.name as nome_rejeitador
FROM towing_partner_services tps
LEFT JOIN towing_partners tp ON tps.partner_id = tp.id
LEFT JOIN users u_aprovador ON tps.approved_by = u_aprovador.id
LEFT JOIN users u_rejeitador ON tps.rejected_by = u_rejeitador.id;

-- 6. CRIAR TABELA DE AUDITORIA (SE NÃO EXISTIR)
-- =============================================

CREATE TABLE IF NOT EXISTS towing_service_audit (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para auditoria
CREATE INDEX IF NOT EXISTS idx_towing_service_audit_service_id ON towing_service_audit(service_id);
CREATE INDEX IF NOT EXISTS idx_towing_service_audit_changed_at ON towing_service_audit(changed_at);

-- 7. FUNÇÃO PARA LIMPEZA AUTOMÁTICA DE DADOS ANTIGOS
-- ==================================================

CREATE OR REPLACE FUNCTION cleanup_old_towing_services()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Limpar serviços rejeitados/cancelados há mais de 90 dias
    DELETE FROM towing_partner_services 
    WHERE status IN ('rejected', 'cancelled', 'deleted')
    AND created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar logs de auditoria antigos (mais de 1 ano)
    DELETE FROM towing_service_audit 
    WHERE changed_at < NOW() - INTERVAL '1 year';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. VERIFICAÇÕES DE INTEGRIDADE
-- ==============================

-- Verificar se todos os partner_id existem na tabela towing_partners
UPDATE towing_partner_services 
SET status = 'error' 
WHERE partner_id NOT IN (SELECT id FROM towing_partners);

-- Verificar e corrigir valores NULL essenciais
UPDATE towing_partner_services 
SET service_type = 'guincho' 
WHERE service_type IS NULL;

UPDATE towing_partner_services 
SET status = 'pending' 
WHERE status IS NULL;

UPDATE towing_partner_services 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- 9. ESTATÍSTICAS FINAIS
-- ======================

DO $$
DECLARE
    total_services INTEGER;
    pending_services INTEGER;
    approved_services INTEGER;
    partners_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_services FROM towing_partner_services;
    SELECT COUNT(*) INTO pending_services FROM towing_partner_services WHERE status = 'pending';
    SELECT COUNT(*) INTO approved_services FROM towing_partner_services WHERE status = 'approved';
    SELECT COUNT(*) INTO partners_count FROM towing_partners WHERE status = 'ativo';
    
    RAISE NOTICE 'ATUALIZAÇÃO CONCLUÍDA:';
    RAISE NOTICE '- Total de serviços: %', total_services;
    RAISE NOTICE '- Serviços pendentes: %', pending_services;
    RAISE NOTICE '- Serviços aprovados: %', approved_services;
    RAISE NOTICE '- Parceiros ativos: %', partners_count;
END $$;

COMMIT;

-- =========================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO
-- =========================================