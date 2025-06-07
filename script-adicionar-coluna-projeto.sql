-- SCRIPT PARA ADICIONAR COLUNA PROJETO EM TODAS AS TABELAS DE ABASTECIMENTOS
-- Execute comando por comando no Supabase

-- 1. ADICIONAR COLUNA PROJETO EM TODAS AS TABELAS (se não existir)
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);

-- 2. ADICIONAR DEMAIS COLUNAS NECESSÁRIAS (se não existirem)
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- 3. ATUALIZAR REGISTROS EXISTENTES COM VALORES PADRÃO
UPDATE abastecimentos_posto_osasco_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'OSASCO' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_alair_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'ALAIR' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_campinas_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'CAMPINAS' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_abc_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'ABC' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_socorro_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'SOCORRO' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_sorocaba_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'SOROCABA' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_guarulhos_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'GUARULHOS' 
WHERE projeto IS NULL;

-- 4. VERIFICAR SE AS COLUNAS FORAM CRIADAS
SELECT 
    table_name,
    COUNT(CASE WHEN column_name = 'projeto' THEN 1 END) as tem_projeto,
    COUNT(CASE WHEN column_name = 'projeto_id' THEN 1 END) as tem_projeto_id,
    COUNT(CASE WHEN column_name = 'base_id' THEN 1 END) as tem_base_id,
    COUNT(CASE WHEN column_name = 'base_name' THEN 1 END) as tem_base_name
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

-- 5. TESTE PARA VERIFICAR SE O SCRIPT DOS PROJETOS FUNCIONA AGORA
SELECT 
    p.id as projeto_id,
    p.name as nome,
    p.description as descricao,
    p.is_active as ativo
FROM projects p
WHERE p.name = 'FULL MELI';

-- 6. VERIFICAR BASE FULL MELI
SELECT 
    b.id as base_id,
    b.base_name as nome,
    b.base_code as codigo,
    b.project_id,
    b.is_active as ativa
FROM project_bases b
WHERE b.project_id = 13;