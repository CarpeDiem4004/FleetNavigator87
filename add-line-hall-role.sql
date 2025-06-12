-- Script para adicionar o papel 'line_hall' ao enum user_role
-- Este script adiciona o novo papel de forma segura

-- Verificar se o valor já existe no enum
DO $$
BEGIN
    -- Tentar adicionar o valor 'line_hall' ao enum user_role
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'user_role' 
        AND e.enumlabel = 'line_hall'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'line_hall';
        RAISE NOTICE 'Papel "line_hall" adicionado com sucesso ao enum user_role';
    ELSE
        RAISE NOTICE 'Papel "line_hall" já existe no enum user_role';
    END IF;
END
$$;

-- Verificar se a adição foi bem-sucedida
SELECT enumlabel as papel_disponivel 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'user_role' 
ORDER BY enumlabel;