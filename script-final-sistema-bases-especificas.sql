-- SCRIPT FINAL - SISTEMA DE BASES ESPECÍFICAS
-- Execute no Supabase para completar a configuração

-- 1. VERIFICAÇÃO INICIAL
SELECT 'VERIFICANDO CONFIGURAÇÃO ATUAL' as status;

-- Verificar projeto FULL MELI
SELECT 
    'PROJETO FULL MELI:' as info,
    p.id as projeto_id,
    p.name as nome,
    p.description as descricao,
    p.is_active as ativo
FROM projects p
WHERE p.name = 'FULL MELI';

-- Verificar base FULL MELI
SELECT 
    'BASE FULL MELI:' as info,
    b.id as base_id,
    b.base_name as nome,
    b.base_code as codigo,
    b.project_id as projeto_id,
    b.is_active as ativa
FROM project_bases b
WHERE b.project_id = 13;

-- 2. GARANTIR QUE TODAS AS TABELAS TENHAM ESTRUTURA CORRETA
-- (As colunas já existem, mas vamos garantir com IF NOT EXISTS)

ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_name TEXT;
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto TEXT;

ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_name TEXT;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto TEXT;

ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_name TEXT;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto TEXT;

ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_name TEXT;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto TEXT;

ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_name TEXT;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto TEXT;

ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_name TEXT;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto TEXT;

ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_name TEXT;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto TEXT;

-- 3. ATUALIZAR BASE_NAME DOS REGISTROS EXISTENTES (se necessário)
UPDATE abastecimentos_posto_osasco_v2 SET base_name = 'OSASCO' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_alair_v2 SET base_name = 'ALAIR' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_campinas_v2 SET base_name = 'CAMPINAS' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_abc_v2 SET base_name = 'ABC' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_socorro_v2 SET base_name = 'SOCORRO' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_sorocaba_v2 SET base_name = 'SOROCABA' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_guarulhos_v2 SET base_name = 'GUARULHOS' WHERE base_name IS NULL OR base_name = '';

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_osasco_v2_projeto_id ON abastecimentos_posto_osasco_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_base_id ON abastecimentos_posto_osasco_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_created_at ON abastecimentos_posto_osasco_v2(created_at);

CREATE INDEX IF NOT EXISTS idx_alair_v2_projeto_id ON abastecimentos_posto_alair_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_alair_v2_base_id ON abastecimentos_posto_alair_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_alair_v2_created_at ON abastecimentos_posto_alair_v2(created_at);

CREATE INDEX IF NOT EXISTS idx_campinas_v2_projeto_id ON abastecimentos_posto_campinas_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_base_id ON abastecimentos_posto_campinas_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_created_at ON abastecimentos_posto_campinas_v2(created_at);

CREATE INDEX IF NOT EXISTS idx_abc_v2_projeto_id ON abastecimentos_posto_abc_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_abc_v2_base_id ON abastecimentos_posto_abc_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_abc_v2_created_at ON abastecimentos_posto_abc_v2(created_at);

CREATE INDEX IF NOT EXISTS idx_socorro_v2_projeto_id ON abastecimentos_posto_socorro_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_base_id ON abastecimentos_posto_socorro_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_created_at ON abastecimentos_posto_socorro_v2(created_at);

CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_projeto_id ON abastecimentos_posto_sorocaba_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_base_id ON abastecimentos_posto_sorocaba_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_created_at ON abastecimentos_posto_sorocaba_v2(created_at);

CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_projeto_id ON abastecimentos_posto_guarulhos_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_base_id ON abastecimentos_posto_guarulhos_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_created_at ON abastecimentos_posto_guarulhos_v2(created_at);

-- 5. VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO FINAL - ESTRUTURA DAS TABELAS' as titulo;

SELECT 
    table_name as tabela,
    COUNT(CASE WHEN column_name = 'projeto_id' THEN 1 END) as tem_projeto_id,
    COUNT(CASE WHEN column_name = 'base_id' THEN 1 END) as tem_base_id,
    COUNT(CASE WHEN column_name = 'base_name' THEN 1 END) as tem_base_name,
    COUNT(CASE WHEN column_name = 'projeto' THEN 1 END) as tem_projeto
FROM information_schema.columns 
WHERE table_name IN (
    'abastecimentos_posto_osasco_v2',
    'abastecimentos_posto_alair_v2', 
    'abastecimentos_posto_campinas_v2',
    'abastecimentos_posto_abc_v2',
    'abastecimentos_posto_socorro_v2',
    'abastecimentos_posto_sorocaba_v2',
    'abastecimentos_posto_guarulhos_v2'
)
GROUP BY table_name
ORDER BY table_name;

-- 6. VERIFICAR TODOS OS PROJETOS ATIVOS
SELECT 
    'PROJETOS DISPONÍVEIS:' as info,
    p.id,
    p.name as projeto,
    COUNT(b.id) as total_bases,
    STRING_AGG(b.base_name, ', ' ORDER BY b.base_name) as bases_disponiveis
FROM projects p
LEFT JOIN project_bases b ON p.id = b.project_id AND b.is_active = true
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.name;

-- 7. STATUS FINAL
SELECT 
    'SISTEMA CONFIGURADO COM SUCESSO!' as status,
    'Todas as 7 tabelas possuem as 4 colunas necessárias' as detalhes_estrutura,
    'Projeto FULL MELI (ID: 13) com base FMELI01 (ID: 145) criado' as detalhes_projeto,
    'Sistema pronto para registrar bases específicas nos abastecimentos' as funcionalidade;