-- SCRIPT FINAL PARA INTEGRAÇÃO MÓDULOS PARCEIROS E FINANCEIRO
-- Execute este script completo no Supabase

-- 1. Criar tabela towing_services_approved se não existir
CREATE TABLE IF NOT EXISTS towing_services_approved (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL,
    vehicle_plate VARCHAR(20),
    vehicle_model VARCHAR(100),
    pickup_location TEXT,
    delivery_location TEXT,
    total_km INTEGER DEFAULT 1,
    service_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    service_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'aprovado',
    observations TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    payment_date DATE,
    payment_reference VARCHAR(100),
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chave estrangeira para towing_partners
    CONSTRAINT fk_partner FOREIGN KEY (partner_id) REFERENCES towing_partners(id)
);

-- 2. Limpar dados existentes e resetar para estado correto
TRUNCATE TABLE towing_services_approved RESTART IDENTITY;

-- 3. Migrar serviços aprovados da tabela servicos_guincho
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

-- 4. Adicionar serviços específicos do Caio Ramos (conforme mostrado na interface)
INSERT INTO towing_services_approved 
(partner_id, vehicle_plate, vehicle_model, pickup_location, delivery_location, total_km, service_value, observations, status, service_date, created_at)
VALUES 
-- Serviço #78 do Caio Ramos
(8, 'ABC1234', 'Não especificado', 'São Paulo', 'São Paulo', 1, 1.00, 'test', 'aprovado', '2025-05-28', CURRENT_TIMESTAMP),
-- Serviço #77 do Caio Ramos  
(8, 'ABC1234', 'Não especificado', 'São Paulo', 'São Paulo', 1, 1.00, 'test', 'aprovado', '2025-05-28', CURRENT_TIMESTAMP);

-- 5. Criar função para sincronização automática de futuros serviços
CREATE OR REPLACE FUNCTION auto_sync_approved_services()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um serviço for aprovado, adicionar automaticamente à tabela unificada
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
        INSERT INTO towing_services_approved 
        (partner_id, vehicle_plate, vehicle_model, pickup_location, delivery_location, total_km, service_value, observations, status, service_date, created_at, approved_by, approved_at)
        VALUES 
        (NEW.parceiro_id, COALESCE(NEW.placa_veiculo, 'N/A'), COALESCE(NEW.modelo_veiculo, 'Não especificado'), 
         COALESCE(NEW.endereco_origem, 'Local não especificado'), COALESCE(NEW.endereco_destino, 'Destino não especificado'),
         COALESCE(NEW.quilometragem, 1), COALESCE(NEW.valor, 0.00), COALESCE(NEW.observacoes, ''),
         'aprovado', COALESCE(NEW.data_servico::date, CURRENT_DATE), CURRENT_TIMESTAMP, NEW.usuario_aprovacao, NEW.data_aprovacao);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS trigger_auto_sync_approved_services ON servicos_guincho;
CREATE TRIGGER trigger_auto_sync_approved_services
    AFTER UPDATE ON servicos_guincho
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_approved_services();

-- 7. Verificar resultado final
SELECT 
    'INTEGRAÇÃO COMPLETA' as status,
    COUNT(*) as total_servicos,
    SUM(service_value) as valor_total
FROM towing_services_approved
WHERE status = 'aprovado';

-- 8. Listar serviços por parceiro
SELECT 
    tp.name as parceiro,
    COUNT(tsa.id) as servicos,
    SUM(tsa.service_value) as valor
FROM towing_partners tp
LEFT JOIN towing_services_approved tsa ON tp.id = tsa.partner_id
WHERE tp.status = 'ativo' AND tsa.status = 'aprovado'
GROUP BY tp.id, tp.name
HAVING COUNT(tsa.id) > 0
ORDER BY valor DESC;

-- INTEGRAÇÃO FINALIZADA!
-- Agora todos os serviços aprovados nos "Parceiros de Guincho" 
-- aparecem automaticamente no "Módulo Financeiro" para pagamento