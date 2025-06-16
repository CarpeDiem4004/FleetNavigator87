-- Simple fix for base_id column issue without foreign key constraints
-- This avoids the UUID/integer operator error

-- 1. Ensure bases table exists with correct structure
CREATE TABLE IF NOT EXISTS bases (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

-- 2. Insert basic data if empty
INSERT INTO bases (id, name) VALUES 
(1, 'Base São Paulo'),
(2, 'Campinas'),
(3, 'Guarulhos')
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure manutencao table has base_id column
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS base_id INTEGER;

-- 4. Update null values with valid base_id
UPDATE manutencao SET base_id = 1 WHERE base_id IS NULL;

-- 5. Test the query that was failing
SELECT 
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.base_id,
    b.name as base_nome
FROM manutencao m
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.id
LIMIT 5;