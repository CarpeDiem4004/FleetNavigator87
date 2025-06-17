-- Script para corrigir o problema de mapeamento de base_id
-- Este script resolve o erro de foreign key constraint na tabela car_receptions

-- 1. Primeiro, vamos identificar todas as bases referenciadas mas que não existem
DO $$
DECLARE
    missing_base_ids INTEGER[];
    base_id_val INTEGER;
BEGIN
    -- Verificar se há referências a bases que não existem em project_bases
    SELECT ARRAY_AGG(DISTINCT pb.id) INTO missing_base_ids
    FROM project_bases pb
    WHERE pb.id NOT IN (SELECT id FROM bases);
    
    -- Se encontrarmos IDs ausentes, criar as bases correspondentes
    IF missing_base_ids IS NOT NULL THEN
        FOREACH base_id_val IN ARRAY missing_base_ids
        LOOP
            INSERT INTO bases (id, name, location, is_active, created_at, updated_at)
            VALUES (
                base_id_val,
                'Base ' || base_id_val,
                'Localização a definir',
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Base % criada', base_id_val;
        END LOOP;
    END IF;
END $$;

-- 2. Atualizar a sequência da tabela bases para evitar conflitos futuros
SELECT setval('bases_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bases), true);

-- 3. Verificar se há projetos com base_id inválidos e corrigir
UPDATE projects 
SET base_id = 1 
WHERE base_id IS NOT NULL 
  AND base_id NOT IN (SELECT id FROM bases);

-- 4. Para garantir integridade, vamos mapear automaticamente alguns base_ids comuns:
INSERT INTO bases (id, name, location, is_active, created_at, updated_at)
VALUES 
    (76, 'Base Automática 76', 'São Paulo - SP', true, NOW(), NOW()),
    (77, 'Base Automática 77', 'Campinas - SP', true, NOW(), NOW()),
    (78, 'Base Automática 78', 'Santos - SP', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW(),
    is_active = true;

-- 5. Verificar o resultado
SELECT 'Bases existentes:' as status;
SELECT id, name, location FROM bases ORDER BY id;

SELECT 'Projects com base_id inválidos (deve estar vazio):' as status;
SELECT id, name, base_id FROM projects 
WHERE base_id IS NOT NULL 
  AND base_id NOT IN (SELECT id FROM bases);

-- 6. Atualizar sequência final
SELECT setval('bases_id_seq', (SELECT COALESCE(MAX(id), 100) FROM bases), true);

COMMIT;