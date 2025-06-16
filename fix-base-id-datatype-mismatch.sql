-- ============================================================================
-- CORREÇÃO COMPLETA PARA INCOMPATIBILIDADE DE TIPOS base_id
-- Este script resolve problemas de tipos de dados incompatíveis
-- ============================================================================

-- 1. Primeiro, vamos verificar os tipos atuais
SELECT 
    'VERIFICAÇÃO DE TIPOS' as check_type,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'manutencao' AND column_name = 'base_id') as manutencao_base_id_type,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'bases' AND column_name = 'id') as bases_id_type;

-- 2. Remover constraint existente se houver conflito
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'manutencao' 
        AND constraint_name = 'fk_manutencao_base_id'
    ) THEN
        ALTER TABLE manutencao DROP CONSTRAINT fk_manutencao_base_id;
        RAISE NOTICE 'Constraint existente removida';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao remover constraint: %', SQLERRM;
END $$;

-- 3. Verificar se bases.id é realmente UUID e converter se necessário
DO $$
DECLARE
    bases_id_type text;
    manutencao_base_id_type text;
BEGIN
    -- Obter tipos atuais
    SELECT data_type INTO bases_id_type
    FROM information_schema.columns 
    WHERE table_name = 'bases' AND column_name = 'id';
    
    SELECT data_type INTO manutencao_base_id_type
    FROM information_schema.columns 
    WHERE table_name = 'manutencao' AND column_name = 'base_id';
    
    RAISE NOTICE 'Tipo bases.id: %, Tipo manutencao.base_id: %', bases_id_type, manutencao_base_id_type;
    
    -- Se bases.id for UUID e manutencao.base_id for integer, converter base_id para UUID
    IF bases_id_type = 'uuid' AND manutencao_base_id_type = 'integer' THEN
        -- Primeiro, converter os valores existentes
        ALTER TABLE manutencao ALTER COLUMN base_id TYPE uuid USING 
            CASE 
                WHEN base_id IS NOT NULL THEN 
                    (SELECT id FROM bases WHERE bases.id::text = base_id::text LIMIT 1)
                ELSE NULL 
            END;
        RAISE NOTICE 'Convertido manutencao.base_id de integer para uuid';
        
    -- Se bases.id for integer e manutencao.base_id for UUID, converter bases.id para UUID
    ELSIF bases_id_type = 'integer' AND manutencao_base_id_type = 'uuid' THEN
        -- Isso é mais complexo, vamos manter base_id como integer e verificar se há conflito real
        ALTER TABLE manutencao ALTER COLUMN base_id TYPE integer USING base_id::text::integer;
        RAISE NOTICE 'Convertido manutencao.base_id para integer';
        
    -- Se ambos forem diferentes tipos não esperados, padronizar para integer
    ELSIF bases_id_type != manutencao_base_id_type THEN
        -- Converter ambos para integer se possível
        IF bases_id_type = 'uuid' THEN
            RAISE NOTICE 'ATENÇÃO: bases.id é UUID, mas manutencao.base_id é %. Isso requer intervenção manual.', manutencao_base_id_type;
        ELSE
            -- Tentar converter base_id para o tipo de bases.id
            EXECUTE format('ALTER TABLE manutencao ALTER COLUMN base_id TYPE %s', bases_id_type);
            RAISE NOTICE 'Convertido manutencao.base_id para %', bases_id_type;
        END IF;
    END IF;
END $$;

-- 4. Criar a foreign key com tipos compatíveis
DO $$
BEGIN
    -- Verificar se os tipos agora são compatíveis
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'manutencao' AND column_name = 'base_id') =
       (SELECT data_type FROM information_schema.columns WHERE table_name = 'bases' AND column_name = 'id') THEN
        
        ALTER TABLE manutencao 
        ADD CONSTRAINT fk_manutencao_base_id 
        FOREIGN KEY (base_id) REFERENCES bases(id);
        
        RAISE NOTICE 'Foreign key constraint criada com sucesso';
    ELSE
        RAISE NOTICE 'TIPOS AINDA INCOMPATÍVEIS - intervenção manual necessária';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar foreign key: %', SQLERRM;
END $$;

-- 5. Atualizar registros com base_id NULL para uma base padrão
UPDATE manutencao 
SET base_id = (
    SELECT id FROM bases 
    WHERE bases.id IS NOT NULL 
    ORDER BY id 
    LIMIT 1
)
WHERE base_id IS NULL 
AND EXISTS (SELECT 1 FROM bases);

-- 6. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'manutencao' AND column_name = 'base_id') as manutencao_base_id_final,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'bases' AND column_name = 'id') as bases_id_final,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name = 'manutencao' AND constraint_name = 'fk_manutencao_base_id') as constraint_exists;

-- 7. Teste da consulta
SELECT 
    'TESTE CONSULTA FINAL' as teste,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.base_id,
    b.name as base_nome
FROM manutencao m
LEFT JOIN bases b ON m.base_id = b.id
LIMIT 3;