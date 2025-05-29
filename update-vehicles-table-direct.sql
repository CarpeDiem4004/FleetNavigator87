-- Script SQL para atualizar a tabela de veículos com os novos campos
-- Execute este script diretamente no Editor SQL do Supabase

-- 1. Adicionar coluna make (marca) se não existir
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS make VARCHAR(100);

-- 2. Adicionar coluna year (ano) se não existir
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS year INTEGER;

-- 3. Adicionar coluna fuel_type (tipo de combustível) se não existir
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) DEFAULT 'Diesel';

-- 4. Adicionar coluna media_consumo_combustivel se não existir
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS media_consumo_combustivel NUMERIC(5,2);

-- 5. Adicionar coluna model (para compatibilidade) se não existir
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS model VARCHAR(100);

-- 6. Copiar dados da coluna modelo para model se existir
UPDATE veiculos 
SET model = modelo 
WHERE modelo IS NOT NULL AND (model IS NULL OR model = '');

-- 7. Atualizar veículos existentes com valores padrão
UPDATE veiculos 
SET 
  fuel_type = COALESCE(fuel_type, 'Diesel'),
  make = COALESCE(make, 'N/A')
WHERE fuel_type IS NULL OR make IS NULL;

-- 8. Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'veiculos' 
ORDER BY ordinal_position;