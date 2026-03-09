-- Script para verificar e adicionar o campo media_consumo_combustivel se não existir
-- Este campo é usado para armazenar o consumo médio automático por marca

-- Verificar se o campo já existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
AND column_name = 'media_consumo_combustivel';

-- Se o campo não existir, adicionar (execute apenas se a consulta acima retornar vazio)
-- ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS media_consumo_combustivel DECIMAL(5,2);

-- Verificar a estrutura completa da tabela vehicles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Mostrar alguns registros para verificar os dados
SELECT id, plate, make, vehicle_type, media_consumo_combustivel 
FROM vehicles 
LIMIT 5;