-- Script para adicionar a coluna 'marca' na tabela veiculos
-- Este script resolve o erro "column marca does not exist"

-- 1. Verificar se a coluna 'marca' já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'veiculos' AND column_name = 'marca'
    ) THEN
        -- Adicionar a coluna marca
        ALTER TABLE veiculos ADD COLUMN marca VARCHAR(100);
        RAISE NOTICE 'Coluna marca adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna marca já existe';
    END IF;
END $$;

-- 2. Atualizar registros existentes com valor padrão
UPDATE veiculos 
SET marca = 'Mercedes' 
WHERE marca IS NULL OR marca = '';

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_veiculos_marca ON veiculos(marca);

-- 4. Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'veiculos' 
AND column_name IN ('marca', 'modelo', 'placa', 'status')
ORDER BY column_name;

-- 5. Verificar dados atualizados
SELECT 
    'Coluna marca criada com sucesso!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN marca IS NOT NULL AND marca != '' THEN 1 END) as vehicles_with_brand,
    COUNT(DISTINCT marca) as unique_brands
FROM veiculos;