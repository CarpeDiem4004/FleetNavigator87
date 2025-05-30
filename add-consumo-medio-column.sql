-- Script para adicionar a coluna consumo_medio_km_l na tabela vehicles
-- Este script corrige o erro "column consumo_medio_km_l does not exist"

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    -- Tentar adicionar a coluna
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' 
        AND column_name = 'consumo_medio_km_l'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN consumo_medio_km_l DECIMAL(3,1) DEFAULT 2.5;
        RAISE NOTICE 'Coluna consumo_medio_km_l adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna consumo_medio_km_l já existe na tabela vehicles.';
    END IF;
END $$;

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
AND column_name = 'consumo_medio_km_l'
AND table_schema = 'public';

-- Mostrar a estrutura atual da tabela vehicles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
AND table_schema = 'public'
ORDER BY ordinal_position;