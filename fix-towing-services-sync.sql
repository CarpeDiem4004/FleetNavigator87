-- Script para corrigir sincronização das tabelas de serviços de guincho
-- Corrige o erro: column "usuario_aprovacao" is of type integer but expression is of type character varying

-- 1. Primeiro, adicionar colunas faltantes na tabela towing_partner_services
ALTER TABLE towing_partner_services 
ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS mileage INTEGER,
ADD COLUMN IF NOT EXISTS approved_by INTEGER,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- 2. Atualizar colunas existentes com dados corretos
UPDATE towing_partner_services 
SET pickup_location = origin WHERE pickup_location IS NULL;

UPDATE towing_partner_services 
SET delivery_location = destination WHERE delivery_location IS NULL;

UPDATE towing_partner_services 
SET mileage = km_traveled WHERE mileage IS NULL;

-- 3. Criar ou substituir a função de sincronização corrigida
CREATE OR REPLACE FUNCTION sync_towing_services()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir/atualizar na tabela servicos_guincho
    INSERT INTO servicos_guincho (
        id, parceiro_id, placa_veiculo, endereco_origem, endereco_destino, 
        quilometragem, valor, data_servico, data_lancamento, status, 
        observacoes, usuario_aprovacao, data_aprovacao
    ) 
    VALUES (
        NEW.id, 
        NEW.partner_id, 
        NEW.plate, 
        COALESCE(NEW.pickup_location, NEW.origin), 
        COALESCE(NEW.delivery_location, NEW.destination), 
        COALESCE(NEW.mileage, NEW.km_traveled, 0), 
        COALESCE(NEW.cost, 0), 
        NEW.service_date, 
        COALESCE(NEW.created_at, NOW()), 
        COALESCE(NEW.status, 'pending'), 
        NEW.notes, 
        CASE 
            WHEN NEW.approved_by IS NOT NULL AND NEW.approved_by != '' THEN 
                CASE 
                    WHEN NEW.approved_by ~ '^[0-9]+$' THEN NEW.approved_by::INTEGER
                    ELSE NULL
                END
            ELSE NULL 
        END,
        NEW.approved_at
    )
    ON CONFLICT (id) DO UPDATE SET
        parceiro_id = NEW.partner_id,
        placa_veiculo = NEW.plate,
        endereco_origem = COALESCE(NEW.pickup_location, NEW.origin),
        endereco_destino = COALESCE(NEW.delivery_location, NEW.destination),
        quilometragem = COALESCE(NEW.mileage, NEW.km_traveled, 0),
        valor = COALESCE(NEW.cost, 0),
        data_servico = NEW.service_date,
        status = COALESCE(NEW.status, 'pending'),
        observacoes = NEW.notes,
        usuario_aprovacao = CASE 
            WHEN NEW.approved_by IS NOT NULL AND NEW.approved_by != '' THEN 
                CASE 
                    WHEN NEW.approved_by ~ '^[0-9]+$' THEN NEW.approved_by::INTEGER
                    ELSE servicos_guincho.usuario_aprovacao -- Manter valor atual se não for numérico
                END
            ELSE servicos_guincho.usuario_aprovacao 
        END,
        data_aprovacao = COALESCE(NEW.approved_at, servicos_guincho.data_aprovacao);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar o trigger
DROP TRIGGER IF EXISTS sync_towing_services_trigger ON towing_partner_services;
CREATE TRIGGER sync_towing_services_trigger
    AFTER INSERT OR UPDATE ON towing_partner_services
    FOR EACH ROW
    EXECUTE FUNCTION sync_towing_services();

-- 5. Atualizar dados existentes para garantir consistência
UPDATE towing_partner_services 
SET approved_by = NULL 
WHERE approved_by IS NOT NULL AND approved_by !~ '^[0-9]+$';

-- 6. Sincronizar dados existentes
INSERT INTO servicos_guincho (
    id, parceiro_id, placa_veiculo, endereco_origem, endereco_destino, 
    quilometragem, valor, data_servico, data_lancamento, status, 
    observacoes, usuario_aprovacao, data_aprovacao
)
SELECT 
    tps.id,
    tps.partner_id,
    tps.plate,
    COALESCE(tps.pickup_location, tps.origin),
    COALESCE(tps.delivery_location, tps.destination),
    COALESCE(tps.mileage, tps.km_traveled, 0),
    COALESCE(tps.cost, 0),
    tps.service_date,
    COALESCE(tps.created_at, NOW()),
    COALESCE(tps.status, 'pending'),
    tps.notes,
    CASE 
        WHEN tps.approved_by IS NOT NULL AND tps.approved_by ~ '^[0-9]+$' THEN 
            tps.approved_by::INTEGER
        ELSE NULL
    END,
    tps.approved_at
FROM towing_partner_services tps
WHERE NOT EXISTS (
    SELECT 1 FROM servicos_guincho sg WHERE sg.id = tps.id
);

-- 7. Verificar se as tabelas estão sincronizadas
SELECT 
    'towing_partner_services' as tabela,
    COUNT(*) as total_registros
FROM towing_partner_services
UNION ALL
SELECT 
    'servicos_guincho' as tabela,
    COUNT(*) as total_registros
FROM servicos_guincho;

-- 8. Mostrar estrutura atualizada da tabela towing_partner_services
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'towing_partner_services' 
ORDER BY ordinal_position;