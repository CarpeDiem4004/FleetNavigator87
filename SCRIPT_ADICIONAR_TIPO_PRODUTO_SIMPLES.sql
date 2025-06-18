-- =====================================================================
-- SCRIPT SIMPLES PARA ADICIONAR TIPO_PRODUTO
-- Data: 18/06/2025
-- Objetivo: Adicionar apenas a coluna tipo_produto onde está faltando
-- =====================================================================

-- Adicionar tipo_produto em TODAS as tabelas V2 (safe - não dará erro se já existir)
ALTER TABLE recebimentos_posto_abc_v2 
ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'diesel';

ALTER TABLE recebimentos_posto_alair_v2 
ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'diesel';

ALTER TABLE recebimentos_posto_campinas_v2 
ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'diesel';

ALTER TABLE recebimentos_posto_guarulhos_v2 
ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'diesel';

ALTER TABLE recebimentos_posto_osasco_v2 
ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'diesel';

ALTER TABLE recebimentos_posto_socorro_v2 
ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'diesel';

ALTER TABLE recebimentos_posto_sorocaba_v2 
ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50) DEFAULT 'diesel';

-- Verificar resultado
SELECT 
    'VERIFICACAO_TIPO_PRODUTO' as status,
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.table_name AND column_name = 'tipo_produto'
    ) THEN 'OK ✓' ELSE 'FALTA ✗' END as tem_tipo_produto
FROM information_schema.tables t
WHERE t.table_name LIKE 'recebimentos_posto_%_v2'
ORDER BY t.table_name;

-- Teste simples do backup após adicionar tipo_produto
SELECT 
    'TESTE_BACKUP' as categoria,
    COUNT(*) as tabelas_testadas
FROM (
    SELECT 'abc_v2' as posto FROM recebimentos_posto_abc_v2 WHERE tipo_produto IS NOT NULL LIMIT 1
    UNION ALL
    SELECT 'alair_v2' FROM recebimentos_posto_alair_v2 WHERE tipo_produto IS NOT NULL LIMIT 1
    UNION ALL
    SELECT 'campinas_v2' FROM recebimentos_posto_campinas_v2 WHERE tipo_produto IS NOT NULL LIMIT 1
    UNION ALL
    SELECT 'guarulhos_v2' FROM recebimentos_posto_guarulhos_v2 WHERE tipo_produto IS NOT NULL LIMIT 1
    UNION ALL
    SELECT 'osasco_v2' FROM recebimentos_posto_osasco_v2 WHERE tipo_produto IS NOT NULL LIMIT 1
    UNION ALL
    SELECT 'socorro_v2' FROM recebimentos_posto_socorro_v2 WHERE tipo_produto IS NOT NULL LIMIT 1
    UNION ALL
    SELECT 'sorocaba_v2' FROM recebimentos_posto_sorocaba_v2 WHERE tipo_produto IS NOT NULL LIMIT 1
) test;

SELECT 
    'SCRIPT_TIPO_PRODUTO_CONCLUIDO' as resultado,
    NOW() as timestamp;