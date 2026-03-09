-- Script para adicionar campos necessários para o módulo financeiro
-- Execute este script no seu banco de dados Supabase

-- Adicionar campos de rastreamento de pagamento à tabela towing_services
ALTER TABLE towing_services 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_processed_by INTEGER;

-- Adicionar campo de token de acesso externo à tabela towing_partners
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS external_access_token VARCHAR(255);

-- Adicionar comentários para documentação
COMMENT ON COLUMN towing_services.payment_date IS 'Data em que o pagamento foi processado';
COMMENT ON COLUMN towing_services.payment_reference IS 'Referência do pagamento (número do documento, etc.)';
COMMENT ON COLUMN towing_services.payment_processed_by IS 'ID do usuário que processou o pagamento';
COMMENT ON COLUMN towing_partners.external_access_token IS 'Token para acesso externo do parceiro';

-- Criar índices para melhorar performance das consultas financeiras
CREATE INDEX IF NOT EXISTS idx_towing_services_payment_date ON towing_services(payment_date);
CREATE INDEX IF NOT EXISTS idx_towing_services_status_payment ON towing_services(status, payment_date);
CREATE INDEX IF NOT EXISTS idx_towing_partners_active ON towing_partners("isActive");

-- Verificar se as colunas foram criadas corretamente
SELECT 'towing_services columns' as table_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'towing_services' 
AND column_name IN ('payment_date', 'payment_reference', 'payment_processed_by')
ORDER BY column_name;

SELECT 'towing_partners columns' as table_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'towing_partners' 
AND column_name = 'external_access_token';

-- Mostrar estatísticas atuais
SELECT 'Current data statistics' as info;
SELECT 
    COUNT(*) as total_services,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as approved_services,
    COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NOT NULL THEN 1 END) as paid_services,
    COUNT(CASE WHEN status = 'aprovado' AND payment_date IS NULL THEN 1 END) as pending_payment_services
FROM towing_services;

SELECT 
    COUNT(*) as total_partners,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_partners
FROM towing_partners;