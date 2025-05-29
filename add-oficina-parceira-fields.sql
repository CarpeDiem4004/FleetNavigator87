-- Script SQL para adicionar campos de oficina parceira à tabela oficina_murici_manutencoes
-- Execute este script no seu banco de dados PostgreSQL/Supabase

-- Adicionar novos campos à tabela oficina_murici_manutencoes
ALTER TABLE oficina_murici_manutencoes 
ADD COLUMN IF NOT EXISTS mechanic_name TEXT,
ADD COLUMN IF NOT EXISTS used_partner_workshop BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS partner_workshop_name TEXT,
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT 0;

-- Adicionar comentários para documentar os novos campos
COMMENT ON COLUMN oficina_murici_manutencoes.mechanic_name IS 'Nome do mecânico responsável pela manutenção';
COMMENT ON COLUMN oficina_murici_manutencoes.used_partner_workshop IS 'Indica se foi utilizada oficina parceira (terceirizada)';
COMMENT ON COLUMN oficina_murici_manutencoes.partner_workshop_name IS 'Nome da oficina parceira utilizada';
COMMENT ON COLUMN oficina_murici_manutencoes.labor_cost IS 'Valor da mão de obra da oficina parceira em reais';

-- Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'oficina_murici_manutencoes' 
AND column_name IN ('mechanic_name', 'used_partner_workshop', 'partner_workshop_name', 'labor_cost')
ORDER BY column_name;