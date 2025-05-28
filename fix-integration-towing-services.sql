-- Script para corrigir completamente a integração entre módulos de parceiros e financeiro
-- Este script alinha as estruturas das tabelas e migra todos os dados corretamente

-- 1. Adicionar colunas faltantes na tabela towing_partners
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- 2. Atualizar campos da tabela towing_partners se estiverem vazios
UPDATE towing_partners 
SET 
  phone = COALESCE(phone, contact_phone),
  email = COALESCE(email, contact_email)
WHERE phone IS NULL OR email IS NULL;

-- 3. Limpar tabela unificada para recriar com dados corretos
TRUNCATE TABLE towing_services_approved;

-- 4. Migrar TODOS os serviços aprovados da tabela servicos_guincho
INSERT INTO towing_services_approved 
(partner_id, vehicle_plate, vehicle_model, pickup_location, delivery_location, total_km, service_value, observations, status, service_date, created_at, approved_by, approved_at)
SELECT 
    sg.parceiro_id,
    COALESCE(sg.placa_veiculo, 'N/A'),
    COALESCE(sg.modelo_veiculo, 'Não especificado'),
    COALESCE(sg.endereco_origem, 'Local não especificado'),
    COALESCE(sg.endereco_destino, 'Destino não especificado'),
    COALESCE(sg.quilometragem, 1),
    COALESCE(sg.valor, 0.00),
    COALESCE(sg.observacoes, ''),
    'aprovado',
    COALESCE(sg.data_servico::date, CURRENT_DATE),
    COALESCE(sg.data_lancamento, CURRENT_TIMESTAMP),
    sg.usuario_aprovacao,
    sg.data_aprovacao
FROM servicos_guincho sg
WHERE sg.status = 'aprovado' 
AND sg.parceiro_id IS NOT NULL;

-- 5. Migrar serviços aprovados da tabela towing_requests também
INSERT INTO towing_services_approved 
(partner_id, vehicle_plate, vehicle_model, pickup_location, delivery_location, total_km, service_value, observations, status, service_date, created_at, approved_by, approved_at)
SELECT 
    tr.partner_id,
    'N/A',
    'Não especificado',
    COALESCE(tr.pickup_location, 'Local não especificado'),
    COALESCE(tr.destination, 'Destino não especificado'),
    1,
    COALESCE(tr.actual_cost, tr.estimated_cost, 0),
    COALESCE(tr.reason, ''),
    'aprovado',
    COALESCE(tr.completion_date::date, CURRENT_DATE),
    COALESCE(tr.created_at, CURRENT_TIMESTAMP),
    tr.approval_user_id,
    tr.approval_date
FROM towing_requests tr
WHERE tr.status = 'aprovado' 
AND tr.partner_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM towing_services_approved tsa 
    WHERE tsa.partner_id = tr.partner_id 
    AND ABS(tsa.service_value - COALESCE(tr.actual_cost, tr.estimated_cost, 0)) < 0.01
    AND tsa.service_date = COALESCE(tr.completion_date::date, CURRENT_DATE)
);

-- 6. Verificar resultado da migração
SELECT 
    'Total de serviços migrados' as descricao,
    COUNT(*) as quantidade,
    SUM(service_value) as valor_total
FROM towing_services_approved
WHERE status = 'aprovado';

-- 7. Verificar serviços por parceiro
SELECT 
    tp.name as parceiro,
    COUNT(tsa.id) as total_servicos,
    SUM(tsa.service_value) as valor_total
FROM towing_partners tp
LEFT JOIN towing_services_approved tsa ON tp.id = tsa.partner_id
WHERE tp.status = 'ativo' AND (tsa.status = 'aprovado' OR tsa.status IS NULL)
GROUP BY tp.id, tp.name
ORDER BY valor_total DESC;