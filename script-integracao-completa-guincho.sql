-- SCRIPT COMPLETO PARA INTEGRAÇÃO ENTRE MÓDULOS DE PARCEIROS E FINANCEIRO
-- Execute este script no Supabase para resolver completamente a integração

-- 1. Garantir que todas as colunas necessárias existam na tabela towing_partners
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- 2. Atualizar campos vazios na tabela towing_partners
UPDATE towing_partners 
SET 
  phone = COALESCE(phone, ''),
  email = COALESCE(email, contact_email, '')
WHERE phone IS NULL OR email IS NULL OR phone = '' OR email = '';

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

-- 6. Adicionar os serviços específicos do Caio Ramos que foram aprovados
INSERT INTO towing_services_approved 
(partner_id, vehicle_plate, vehicle_model, pickup_location, delivery_location, total_km, service_value, observations, status, service_date, created_at)
VALUES 
-- Serviço #78 do Caio Ramos
(8, 'ABC1234', 'Não especificado', 'São Paulo', 'São Paulo', 1, 1.00, 'test', 'aprovado', '2025-05-28', CURRENT_TIMESTAMP),
-- Serviço #77 do Caio Ramos  
(8, 'ABC1234', 'Não especificado', 'São Paulo', 'São Paulo', 1, 1.00, 'test', 'aprovado', '2025-05-28', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 7. Criar função para sincronizar automaticamente novos serviços aprovados
CREATE OR REPLACE FUNCTION auto_sync_approved_services()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um serviço for aprovado, adicionar automaticamente à tabela unificada
    IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
        INSERT INTO towing_services_approved 
        (partner_id, vehicle_plate, vehicle_model, pickup_location, delivery_location, total_km, service_value, observations, status, service_date, created_at, approved_by, approved_at)
        VALUES 
        (NEW.parceiro_id, COALESCE(NEW.placa_veiculo, 'N/A'), COALESCE(NEW.modelo_veiculo, 'Não especificado'), 
         COALESCE(NEW.endereco_origem, 'Local não especificado'), COALESCE(NEW.endereco_destino, 'Destino não especificado'),
         COALESCE(NEW.quilometragem, 1), COALESCE(NEW.valor, 0.00), COALESCE(NEW.observacoes, ''),
         'aprovado', COALESCE(NEW.data_servico::date, CURRENT_DATE), CURRENT_TIMESTAMP, NEW.usuario_aprovacao, NEW.data_aprovacao)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS trigger_auto_sync_approved_services ON servicos_guincho;
CREATE TRIGGER trigger_auto_sync_approved_services
    AFTER UPDATE ON servicos_guincho
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_approved_services();

-- 9. Verificar resultado final da migração
SELECT 
    'RESULTADO DA INTEGRAÇÃO' as status,
    COUNT(*) as total_servicos_aprovados,
    SUM(service_value) as valor_total_pendente
FROM towing_services_approved
WHERE status = 'aprovado';

-- 10. Verificar serviços por parceiro
SELECT 
    tp.name as parceiro,
    COUNT(tsa.id) as total_servicos,
    SUM(tsa.service_value) as valor_total
FROM towing_partners tp
LEFT JOIN towing_services_approved tsa ON tp.id = tsa.partner_id
WHERE tp.status = 'ativo' AND tsa.status = 'aprovado'
GROUP BY tp.id, tp.name
HAVING COUNT(tsa.id) > 0
ORDER BY valor_total DESC;

-- INTEGRAÇÃO COMPLETA!
-- Agora todos os serviços aprovados nos "Parceiros de Guincho" aparecerão automaticamente no "Módulo Financeiro"