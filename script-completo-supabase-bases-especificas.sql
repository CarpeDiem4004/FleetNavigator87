-- Script completo para implementar sistema de bases específicas no Supabase
-- Execute este script no Editor SQL do Supabase para garantir que todas as colunas necessárias existam

-- 1. Adicionar coluna projeto_id em todas as tabelas de abastecimentos (se não existir)
ALTER TABLE abastecimentos_posto_osasco_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

ALTER TABLE abastecimentos_posto_alair_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

ALTER TABLE abastecimentos_posto_campinas_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

ALTER TABLE abastecimentos_posto_abc_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

ALTER TABLE abastecimentos_posto_socorro_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

ALTER TABLE abastecimentos_posto_sorocaba_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

ALTER TABLE abastecimentos_posto_guarulhos_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

-- 2. Verificar se as colunas base_id e base_name já existem (foram adicionadas anteriormente)
-- Se não existirem, adicionar:

ALTER TABLE abastecimentos_posto_osasco_v2 
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_alair_v2 
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_campinas_v2 
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_abc_v2 
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_socorro_v2 
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_sorocaba_v2 
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_guarulhos_v2 
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

-- 3. Verificar se o projeto "FULL MELI" existe, se não existir, criar
INSERT INTO projects (id, name, description, is_active)
VALUES (13, 'FULL MELI', 'Full Meli - Operações completas Mercado Livre', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar se a base "FULL MELI" existe, se não existir, criar
INSERT INTO project_bases (id, project_id, base_name, base_code, is_active)
VALUES (145, 13, 'FULL MELI (FMELI01)', 'FMELI01', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Criar índices para melhorar performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_osasco_v2_projeto_id ON abastecimentos_posto_osasco_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_base_id ON abastecimentos_posto_osasco_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_created_at ON abastecimentos_posto_osasco_v2(created_at);

CREATE INDEX IF NOT EXISTS idx_alair_v2_projeto_id ON abastecimentos_posto_alair_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_alair_v2_base_id ON abastecimentos_posto_alair_v2(base_id);

CREATE INDEX IF NOT EXISTS idx_campinas_v2_projeto_id ON abastecimentos_posto_campinas_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_base_id ON abastecimentos_posto_campinas_v2(base_id);

CREATE INDEX IF NOT EXISTS idx_abc_v2_projeto_id ON abastecimentos_posto_abc_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_abc_v2_base_id ON abastecimentos_posto_abc_v2(base_id);

CREATE INDEX IF NOT EXISTS idx_socorro_v2_projeto_id ON abastecimentos_posto_socorro_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_base_id ON abastecimentos_posto_socorro_v2(base_id);

CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_projeto_id ON abastecimentos_posto_sorocaba_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_base_id ON abastecimentos_posto_sorocaba_v2(base_id);

CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_projeto_id ON abastecimentos_posto_guarulhos_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_base_id ON abastecimentos_posto_guarulhos_v2(base_id);

-- 6. Verificar a estrutura final das tabelas
SELECT 
    'abastecimentos_posto_osasco_v2' as tabela,
    COUNT(column_name) as total_colunas,
    CASE WHEN SUM(CASE WHEN column_name = 'projeto_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_name' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_osasco_v2'

UNION ALL

SELECT 
    'abastecimentos_posto_alair_v2' as tabela,
    COUNT(column_name) as total_colunas,
    CASE WHEN SUM(CASE WHEN column_name = 'projeto_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_name' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_alair_v2'

UNION ALL

SELECT 
    'abastecimentos_posto_campinas_v2' as tabela,
    COUNT(column_name) as total_colunas,
    CASE WHEN SUM(CASE WHEN column_name = 'projeto_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_name' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_campinas_v2'

UNION ALL

SELECT 
    'abastecimentos_posto_abc_v2' as tabela,
    COUNT(column_name) as total_colunas,
    CASE WHEN SUM(CASE WHEN column_name = 'projeto_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_name' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_abc_v2'

UNION ALL

SELECT 
    'abastecimentos_posto_socorro_v2' as tabela,
    COUNT(column_name) as total_colunas,
    CASE WHEN SUM(CASE WHEN column_name = 'projeto_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_name' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_socorro_v2'

UNION ALL

SELECT 
    'abastecimentos_posto_sorocaba_v2' as tabela,
    COUNT(column_name) as total_colunas,
    CASE WHEN SUM(CASE WHEN column_name = 'projeto_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_name' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_sorocaba_v2'

UNION ALL

SELECT 
    'abastecimentos_posto_guarulhos_v2' as tabela,
    COUNT(column_name) as total_colunas,
    CASE WHEN SUM(CASE WHEN column_name = 'projeto_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_id' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN SUM(CASE WHEN column_name = 'base_name' THEN 1 ELSE 0 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_guarulhos_v2';

-- 7. Verificar se o projeto FULL MELI foi criado corretamente
SELECT 
    p.id as projeto_id,
    p.name as projeto_nome,
    p.description,
    p.is_active,
    b.id as base_id,
    b.base_name,
    b.base_code,
    b.is_active as base_ativa
FROM projects p
LEFT JOIN project_bases b ON p.id = b.project_id
WHERE p.name = 'FULL MELI'
ORDER BY p.id, b.id;

-- 8. Comentários finais
-- Este script garante que:
-- - Todas as tabelas de abastecimentos tenham as colunas projeto_id, base_id e base_name
-- - O projeto "FULL MELI" esteja criado com ID 13
-- - A base "FULL MELI (FMELI01)" esteja criada com ID 145
-- - Índices sejam criados para melhorar a performance
-- - Uma verificação final seja executada para confirmar a estrutura

-- Para testar após executar este script, execute:
-- SELECT * FROM projects WHERE name = 'FULL MELI';
-- SELECT * FROM project_bases WHERE project_id = 13;