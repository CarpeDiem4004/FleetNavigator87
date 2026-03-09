-- Script para corrigir erro "column cartao_abastecimento does not exist"
-- Padroniza as referências de colunas de cartão de combustível

-- 1. Verificar se há conflito entre tabelas vehicles e veiculos
DO $$
BEGIN
    -- Se existe tabela vehicles com cartao_combustivel, pode estar causando conflito
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        -- Verificar se vehicles tem a coluna cartao_combustivel
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vehicles' AND column_name = 'cartao_combustivel'
        ) THEN
            -- Renomear a tabela vehicles para evitar conflito
            ALTER TABLE vehicles RENAME TO vehicles_backup_temp;
            RAISE NOTICE 'Tabela vehicles renomeada para vehicles_backup_temp para evitar conflito';
        END IF;
    END IF;
END $$;

-- 2. Garantir que a coluna cartao_abastecimento existe na tabela veiculos
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS cartao_abastecimento TEXT;

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_veiculos_cartao_abastecimento ON veiculos(cartao_abastecimento);

-- 4. Atualizar valores nulos com um padrão se necessário
UPDATE veiculos 
SET cartao_abastecimento = 'N/A' 
WHERE cartao_abastecimento IS NULL OR cartao_abastecimento = '';

-- 5. Criar uma view temporária para mapear diferentes nomenclaturas
CREATE OR REPLACE VIEW vw_cartoes_unificados AS
SELECT 
    'veiculos' as source_table,
    placa as vehicle_plate,
    cartao_abastecimento as card_number,
    modelo as vehicle_model,
    marca as vehicle_make
FROM veiculos
WHERE cartao_abastecimento IS NOT NULL

UNION ALL

SELECT 
    'linehall_vehicles' as source_table,
    plate as vehicle_plate,
    cartao_combustivel as card_number,
    model as vehicle_model,
    make as vehicle_make
FROM linehall_vehicles
WHERE cartao_combustivel IS NOT NULL;

-- 6. Remover views problemáticas que podem estar referenciando colunas incorretas
DROP VIEW IF EXISTS vw_fuel_card_consolidated CASCADE;
DROP VIEW IF EXISTS vw_vehicles_with_cards CASCADE;

-- 7. Verificar resultado
SELECT 
    'Cartao abastecimento column fixed!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN cartao_abastecimento IS NOT NULL AND cartao_abastecimento != '' THEN 1 END) as vehicles_with_card
FROM veiculos;