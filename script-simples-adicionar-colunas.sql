-- SCRIPT SIMPLES PARA ADICIONAR APENAS AS COLUNAS QUE FALTAM
-- Execute comando por comando no Supabase

-- 1. ADICIONAR COLUNA PROJETO (se não existir)
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);

-- 2. ADICIONAR COLUNA PROJETO_ID (se não existir)  
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

-- 3. ADICIONAR COLUNA BASE_ID (se não existir)
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;

-- 4. ADICIONAR COLUNA BASE_NAME (se não existir)
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- 5. FAZER O MESMO PARA TODAS AS OUTRAS TABELAS
-- Alair
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- Campinas
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- ABC
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- Socorro
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- Sorocaba
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- Guarulhos
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- 6. VERIFICAR RESULTADO SEM USAR TABELA PROJECTS
SELECT 'Colunas adicionadas com sucesso' as status;