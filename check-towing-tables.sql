-- Script para verificar a estrutura das tabelas de guincho
-- e identificar se faltam campos necessários para o módulo financeiro

-- Verificar estrutura da tabela towing_services
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'towing_services'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela towing_partners
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'towing_partners'
ORDER BY ordinal_position;

-- Verificar se existem serviços aprovados
SELECT COUNT(*) as total_services, 
       COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as approved_services
FROM towing_services;

-- Verificar parceiros ativos
SELECT COUNT(*) as total_partners,
       COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_partners
FROM towing_partners;
