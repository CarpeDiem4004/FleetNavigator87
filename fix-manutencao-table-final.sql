-- Script definitivo para corrigir a estrutura da tabela manutencao
-- Este script é seguro e só executa operações se necessário

-- 1. Verificar se existem colunas duplicadas que podem estar causando problemas
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Verificar se existe coluna request_base_id (que deve ser removida se existir)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'request_base_id'
    ) INTO col_exists;
    
    IF col_exists THEN
        -- Se request_base_id existir, copiar dados para base_id se necessário
        UPDATE manutencao 
        SET base_id = request_base_id 
        WHERE request_base_id IS NOT NULL 
        AND (base_id IS NULL OR base_id != request_base_id);
        
        -- Remover a coluna duplicada
        ALTER TABLE manutencao DROP COLUMN request_base_id;
        RAISE NOTICE 'Coluna request_base_id removida e dados migrados para base_id';
    ELSE
        RAISE NOTICE 'Coluna request_base_id não existe - OK';
    END IF;
    
    -- Verificar se existe coluna vehicle_plate (que deve ser removida se existir)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'vehicle_plate'
    ) INTO col_exists;
    
    IF col_exists THEN
        -- Se vehicle_plate existir, copiar dados para placa se necessário
        UPDATE manutencao 
        SET placa = vehicle_plate 
        WHERE vehicle_plate IS NOT NULL 
        AND (placa IS NULL OR placa != vehicle_plate);
        
        -- Remover a coluna duplicada
        ALTER TABLE manutencao DROP COLUMN vehicle_plate;
        RAISE NOTICE 'Coluna vehicle_plate removida e dados migrados para placa';
    ELSE
        RAISE NOTICE 'Coluna vehicle_plate não existe - OK';
    END IF;
    
    -- Verificar se existe coluna entry_date (que deve ser removida se existir)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'entry_date'
    ) INTO col_exists;
    
    IF col_exists THEN
        -- Se entry_date existir, copiar dados para data_solicitacao se necessário
        UPDATE manutencao 
        SET data_solicitacao = entry_date 
        WHERE entry_date IS NOT NULL 
        AND (data_solicitacao IS NULL OR data_solicitacao != entry_date);
        
        -- Remover a coluna duplicada
        ALTER TABLE manutencao DROP COLUMN entry_date;
        RAISE NOTICE 'Coluna entry_date removida e dados migrados para data_solicitacao';
    ELSE
        RAISE NOTICE 'Coluna entry_date não existe - OK';
    END IF;
END $$;

-- 2. Garantir que todas as colunas necessárias existam
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT 'media';
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS responsavel VARCHAR(255);

-- 3. Padronizar dados existentes
UPDATE manutencao SET prioridade = 'media' WHERE prioridade IS NULL;
UPDATE manutencao SET responsavel = 'Sistema' WHERE responsavel IS NULL;
UPDATE manutencao SET status = 'pendente' WHERE status IS NULL;

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_manutencao_placa ON manutencao(placa);
CREATE INDEX IF NOT EXISTS idx_manutencao_status ON manutencao(status);
CREATE INDEX IF NOT EXISTS idx_manutencao_oficina_id ON manutencao(oficina_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_base_id ON manutencao(base_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_data_solicitacao ON manutencao(data_solicitacao);

-- 5. Verificar integridade dos dados
-- Atualizar timestamps nulos
UPDATE manutencao SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE manutencao SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE manutencao SET data_solicitacao = CURRENT_TIMESTAMP WHERE data_solicitacao IS NULL;

-- 6. Mostrar estatísticas finais
SELECT 
    'manutencao' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN placa IS NOT NULL THEN 1 END) as registros_com_placa,
    COUNT(CASE WHEN base_id IS NOT NULL THEN 1 END) as registros_com_base_id,
    COUNT(CASE WHEN oficina_id IS NOT NULL THEN 1 END) as registros_com_oficina_id
FROM manutencao;

-- 7. Mostrar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'manutencao' 
ORDER BY ordinal_position;

COMMIT;