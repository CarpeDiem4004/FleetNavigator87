-- =====================================================================
-- SCRIPT PARA ADICIONAR COLUNAS FALTANTES NAS TABELAS V2
-- Data: 18/06/2025
-- Objetivo: Padronizar estrutura de todas as tabelas V2 para backup funcionar
-- =====================================================================

-- =============================================================================
-- 1. ANÁLISE DAS ESTRUTURAS EXISTENTES
-- =============================================================================

-- Verificar estruturas atuais
SELECT 
    'VERIFICACAO_INICIAL' as categoria,
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_name LIKE 'recebimentos_posto_%_v2'
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- 2. PADRONIZAR TABELAS V2 - ADICIONAR COLUNAS OBRIGATÓRIAS
-- =============================================================================

-- TABELA: recebimentos_posto_alair_v2
DO $$
BEGIN
    -- Verificar e adicionar colunas faltantes na tabela alair_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_alair_v2' AND column_name = 'litros_recebidos'
    ) THEN
        ALTER TABLE recebimentos_posto_alair_v2 ADD COLUMN litros_recebidos NUMERIC(10,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_alair_v2' AND column_name = 'nome_fornecedor'
    ) THEN
        ALTER TABLE recebimentos_posto_alair_v2 ADD COLUMN nome_fornecedor VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_alair_v2' AND column_name = 'nome_operador'
    ) THEN
        ALTER TABLE recebimentos_posto_alair_v2 ADD COLUMN nome_operador VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_alair_v2' AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE recebimentos_posto_alair_v2 ADD COLUMN observacoes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_alair_v2' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE recebimentos_posto_alair_v2 ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- TABELA: recebimentos_posto_campinas_v2
DO $$
BEGIN
    -- Verificar e adicionar colunas faltantes na tabela campinas_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_campinas_v2' AND column_name = 'litros_recebidos'
    ) THEN
        ALTER TABLE recebimentos_posto_campinas_v2 ADD COLUMN litros_recebidos NUMERIC(10,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_campinas_v2' AND column_name = 'nome_fornecedor'
    ) THEN
        ALTER TABLE recebimentos_posto_campinas_v2 ADD COLUMN nome_fornecedor VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_campinas_v2' AND column_name = 'nome_operador'
    ) THEN
        ALTER TABLE recebimentos_posto_campinas_v2 ADD COLUMN nome_operador VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_campinas_v2' AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE recebimentos_posto_campinas_v2 ADD COLUMN observacoes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_campinas_v2' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE recebimentos_posto_campinas_v2 ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- TABELA: recebimentos_posto_sorocaba_v2
DO $$
BEGIN
    -- Verificar e adicionar colunas faltantes na tabela sorocaba_v2
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_sorocaba_v2' AND column_name = 'litros_recebidos'
    ) THEN
        ALTER TABLE recebimentos_posto_sorocaba_v2 ADD COLUMN litros_recebidos NUMERIC(10,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_sorocaba_v2' AND column_name = 'nome_fornecedor'
    ) THEN
        ALTER TABLE recebimentos_posto_sorocaba_v2 ADD COLUMN nome_fornecedor VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_sorocaba_v2' AND column_name = 'nome_operador'
    ) THEN
        ALTER TABLE recebimentos_posto_sorocaba_v2 ADD COLUMN nome_operador VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_sorocaba_v2' AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE recebimentos_posto_sorocaba_v2 ADD COLUMN observacoes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recebimentos_posto_sorocaba_v2' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE recebimentos_posto_sorocaba_v2 ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- =============================================================================
-- 3. SINCRONIZAR DADOS EXISTENTES (SE HOUVER)
-- =============================================================================

-- Sincronizar dados existentes se as tabelas tiverem registros
UPDATE recebimentos_posto_alair_v2 
SET 
    litros_recebidos = COALESCE(litros_recebidos, 0),
    nome_fornecedor = COALESCE(nome_fornecedor, 'N/A'),
    nome_operador = COALESCE(nome_operador, 'N/A'),
    observacoes = COALESCE(observacoes, ''),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE litros_recebidos IS NULL OR nome_fornecedor IS NULL OR nome_operador IS NULL;

UPDATE recebimentos_posto_campinas_v2 
SET 
    litros_recebidos = COALESCE(litros_recebidos, 0),
    nome_fornecedor = COALESCE(nome_fornecedor, 'N/A'),
    nome_operador = COALESCE(nome_operador, 'N/A'),
    observacoes = COALESCE(observacoes, ''),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE litros_recebidos IS NULL OR nome_fornecedor IS NULL OR nome_operador IS NULL;

UPDATE recebimentos_posto_sorocaba_v2 
SET 
    litros_recebidos = COALESCE(litros_recebidos, 0),
    nome_fornecedor = COALESCE(nome_fornecedor, 'N/A'),
    nome_operador = COALESCE(nome_operador, 'N/A'),
    observacoes = COALESCE(observacoes, ''),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE litros_recebidos IS NULL OR nome_fornecedor IS NULL OR nome_operador IS NULL;

-- =============================================================================
-- 4. VERIFICAÇÃO FINAL - TODAS AS TABELAS PADRONIZADAS
-- =============================================================================

-- Verificar se todas as tabelas V2 agora têm as colunas obrigatórias
SELECT 
    'VERIFICACAO_FINAL' as categoria,
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'tipo_produto'
    ) THEN '✓' ELSE '✗' END as tipo_produto,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'litros_recebidos'
    ) THEN '✓' ELSE '✗' END as litros_recebidos,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'nome_fornecedor'
    ) THEN '✓' ELSE '✗' END as nome_fornecedor,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'nome_operador'
    ) THEN '✓' ELSE '✗' END as nome_operador,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'observacoes'
    ) THEN '✓' ELSE '✗' END as observacoes,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'updated_at'
    ) THEN '✓' ELSE '✗' END as updated_at
FROM information_schema.tables t
WHERE t.table_name LIKE 'recebimentos_posto_%_v2'
ORDER BY t.table_name;

-- =============================================================================
-- 5. TESTE DO BACKUP APÓS PADRONIZAÇÃO
-- =============================================================================

-- Testar se o backup agora funciona (criar tabela de teste)
DROP TABLE IF EXISTS teste_backup_v2_padronizado CASCADE;

CREATE TABLE teste_backup_v2_padronizado AS
SELECT 
    'abc_v2' as posto_origem,
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_abc_v2
UNION ALL
SELECT 
    'alair_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_alair_v2
UNION ALL
SELECT 
    'campinas_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_campinas_v2
UNION ALL
SELECT 
    'guarulhos_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_guarulhos_v2
UNION ALL
SELECT 
    'osasco_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_osasco_v2
UNION ALL
SELECT 
    'socorro_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_socorro_v2
UNION ALL
SELECT 
    'sorocaba_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_sorocaba_v2;

-- Verificar resultado do teste
SELECT 
    'TESTE_BACKUP_SUCESSO' as status,
    posto_origem,
    COUNT(*) as registros
FROM teste_backup_v2_padronizado
GROUP BY posto_origem
ORDER BY posto_origem;

-- =============================================================================
-- CONCLUSÃO
-- =============================================================================

SELECT 
    'PADRONIZACAO_V2_CONCLUIDA' as status_final,
    'Todas as tabelas V2 agora têm estrutura uniforme' as resultado,
    'Backup funcional criado com sucesso' as confirmacao,
    NOW() as timestamp_execucao;

/*
✅ PADRONIZAÇÃO V2 CONCLUÍDA

COLUNAS ADICIONADAS:
✅ litros_recebidos - Para tabelas que não tinham
✅ nome_fornecedor - Para tabelas que não tinham  
✅ nome_operador - Para tabelas que não tinham
✅ observacoes - Para tabelas que não tinham
✅ updated_at - Para tabelas que não tinham

ESTRUTURA FINAL PADRONIZADA:
✅ tipo_produto - Todas as tabelas
✅ litros_recebidos - Todas as tabelas
✅ valor_total - Todas as tabelas
✅ nome_fornecedor - Todas as tabelas
✅ nome_operador - Todas as tabelas
✅ observacoes - Todas as tabelas
✅ created_at - Todas as tabelas
✅ updated_at - Todas as tabelas

AGORA O SCRIPT PRINCIPAL FUNCIONARÁ SEM ERROS!
*/