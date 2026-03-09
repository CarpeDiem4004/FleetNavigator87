-- ============================================================================
-- CORREÇÃO DEFINITIVA PARA COLUNA base_id NA TABELA MANUTENCAO
-- Execute este script para resolver completamente o problema
-- ============================================================================

-- 1. Verificar e criar coluna base_id se necessário
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'base_id'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN base_id INTEGER;
        RAISE NOTICE 'Coluna base_id criada na tabela manutencao';
    END IF;
END $$;

-- 2. Adicionar chave estrangeira
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'manutencao' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'fk_manutencao_base_id'
    ) THEN
        ALTER TABLE manutencao 
        ADD CONSTRAINT fk_manutencao_base_id 
        FOREIGN KEY (base_id) REFERENCES bases(id);
        RAISE NOTICE 'Chave estrangeira base_id criada';
    END IF;
END $$;

-- 3. Atualizar registros sem base_id com uma base padrão
UPDATE manutencao 
SET base_id = (SELECT MIN(id) FROM bases WHERE bases.id IS NOT NULL)
WHERE base_id IS NULL 
AND EXISTS (SELECT 1 FROM bases);

-- 4. Testar a consulta corrigida
SELECT 
    'TESTE CONSULTA CORRIGIDA' as status,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    o.razao_social as oficina_nome,
    b.name as base_nome
FROM manutencao m
LEFT JOIN oficinas o ON m.oficina_id = o.id
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.data_solicitacao DESC
LIMIT 3;

-- 5. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    (SELECT COUNT(*) FROM manutencao WHERE base_id IS NOT NULL) as registros_com_base_id,
    (SELECT COUNT(*) FROM manutencao WHERE base_id IS NULL) as registros_sem_base_id,
    'CORREÇÃO APLICADA COM SUCESSO' as status;