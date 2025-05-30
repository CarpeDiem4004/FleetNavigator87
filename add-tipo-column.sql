-- Script para adicionar a coluna 'tipo' na tabela veiculos
-- Resolve erro "column v.tipo does not exist"

-- 1. Verificar se a coluna 'tipo' já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'veiculos' AND column_name = 'tipo'
    ) THEN
        -- Adicionar a coluna tipo
        ALTER TABLE veiculos ADD COLUMN tipo VARCHAR(100);
        RAISE NOTICE 'Coluna tipo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna tipo já existe';
    END IF;
END $$;

-- 2. Atualizar registros existentes com valor padrão baseado no modelo ou marca
UPDATE veiculos 
SET tipo = 'cavalo_mecanico' 
WHERE tipo IS NULL OR tipo = '';

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_veiculos_tipo ON veiculos(tipo);

-- 4. Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'veiculos' 
AND column_name IN ('tipo', 'marca', 'modelo', 'placa', 'status')
ORDER BY column_name;

-- 5. Verificar dados atualizados
SELECT 
    'Coluna tipo criada com sucesso!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN tipo IS NOT NULL AND tipo != '' THEN 1 END) as vehicles_with_type,
    COUNT(DISTINCT tipo) as unique_types
FROM veiculos;