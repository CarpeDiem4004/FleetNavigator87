-- =========================================
-- SCRIPT DE CORREÇÃO DA MIGRAÇÃO TOWING SERVICE NOTES
-- Corrige o erro da coluna approved_by_user_id inexistente
-- =========================================

BEGIN;

-- Migrar dados da tabela towing_service_notes para towing_partner_services
-- Usando as colunas corretas que existem na tabela
INSERT INTO towing_partner_services (
    partner_id, 
    plate, 
    origin, 
    destination, 
    service_date, 
    service_type, 
    cost, 
    km_traveled, 
    status, 
    notes, 
    driver_name, 
    contact_phone, 
    created_at, 
    approved_by, 
    approved_at, 
    payment_status, 
    pickup_location, 
    delivery_location, 
    mileage,
    rejected_by,
    rejected_at,
    rejection_reason,
    updated_at
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
    AND tps.cost = tsn.cost
)
ON CONFLICT DO NOTHING;

-- Verificar quantos registros foram migrados
DO $$
DECLARE
    total_notes INTEGER;
    total_services INTEGER;
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_notes FROM towing_service_notes;
    SELECT COUNT(*) INTO total_services FROM towing_partner_services;
    
    -- Contar registros que coincidem entre as tabelas
    SELECT COUNT(*) INTO migrated_count 
    FROM towing_service_notes tsn
    INNER JOIN towing_partner_services tps ON (
        tps.partner_id = tsn.partner_id 
        AND tps.plate = tsn.plate 
        AND tps.service_date = tsn.service_date::date
    );
    
    RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA:';
    RAISE NOTICE '- Registros em towing_service_notes: %', total_notes;
    RAISE NOTICE '- Registros em towing_partner_services: %', total_services;
    RAISE NOTICE '- Registros migrados/sincronizados: %', migrated_count;
END $$;

COMMIT;

-- =========================================
-- FIM DO SCRIPT DE CORREÇÃO
-- =========================================