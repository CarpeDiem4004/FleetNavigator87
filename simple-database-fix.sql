-- Simple script to fix database structure issues
-- This avoids complex syntax that might cause errors

-- Remove duplicate columns if they exist
ALTER TABLE manutencao DROP COLUMN IF EXISTS vehicle_plate;
ALTER TABLE manutencao DROP COLUMN IF EXISTS request_base_id;
ALTER TABLE manutencao DROP COLUMN IF EXISTS entry_date;

ALTER TABLE veiculos DROP COLUMN IF EXISTS plate;
ALTER TABLE veiculos DROP COLUMN IF EXISTS model;
ALTER TABLE veiculos DROP COLUMN IF EXISTS year;

-- Add missing columns if needed
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT 'media';
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS responsavel VARCHAR(255);

-- Standardize data
UPDATE manutencao SET prioridade = 'media' WHERE prioridade IS NULL;
UPDATE manutencao SET responsavel = 'Sistema' WHERE responsavel IS NULL;
UPDATE manutencao SET status = 'pendente' WHERE status IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manutencao_placa ON manutencao(placa);
CREATE INDEX IF NOT EXISTS idx_manutencao_status ON manutencao(status);
CREATE INDEX IF NOT EXISTS idx_manutencao_oficina_id ON manutencao(oficina_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_base_id ON manutencao(base_id);

-- Verify final structure
SELECT 'Database structure correction completed' as status;
SELECT COUNT(*) as maintenance_records FROM manutencao;
SELECT COUNT(*) as workshop_records FROM oficinas;