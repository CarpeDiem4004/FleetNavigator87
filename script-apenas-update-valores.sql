-- SCRIPT APENAS PARA ATUALIZAR VALORES NAS COLUNAS
-- Execute um comando por vez

-- Atualizar tabela Osasco
UPDATE abastecimentos_posto_osasco_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'OSASCO' 
WHERE projeto IS NULL;

-- Atualizar tabela Alair  
UPDATE abastecimentos_posto_alair_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'ALAIR' 
WHERE projeto IS NULL;

-- Atualizar tabela Campinas
UPDATE abastecimentos_posto_campinas_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'CAMPINAS' 
WHERE projeto IS NULL;

-- Atualizar tabela ABC
UPDATE abastecimentos_posto_abc_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'ABC' 
WHERE projeto IS NULL;

-- Atualizar tabela Socorro
UPDATE abastecimentos_posto_socorro_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'SOCORRO' 
WHERE projeto IS NULL;

-- Atualizar tabela Sorocaba
UPDATE abastecimentos_posto_sorocaba_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'SOROCABA' 
WHERE projeto IS NULL;

-- Atualizar tabela Guarulhos
UPDATE abastecimentos_posto_guarulhos_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_name = 'GUARULHOS' 
WHERE projeto IS NULL;

-- Verificar resultado
SELECT COUNT(*) as total_sem_projeto 
FROM abastecimentos_posto_osasco_v2 
WHERE projeto IS NULL;