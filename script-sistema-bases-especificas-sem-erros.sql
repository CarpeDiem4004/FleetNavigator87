-- SCRIPT FINAL - SISTEMA DE BASES ESPECÍFICAS
-- Execute cada comando separadamente no Supabase para evitar erros

-- 1. VERIFICAR PROJETO FULL MELI (deve existir)
SELECT 
    id as projeto_id,
    name as nome,
    description as descricao,
    is_active as ativo
FROM projects
WHERE name = 'FULL MELI';

-- 2. VERIFICAR BASE FULL MELI (deve existir)
SELECT 
    id as base_id,
    base_name as nome,
    base_code as codigo,
    project_id,
    is_active as ativa
FROM project_bases
WHERE project_id = 13;

-- 3. ATUALIZAR BASE_NAME NOS REGISTROS EXISTENTES (executar um por vez)
UPDATE abastecimentos_posto_osasco_v2 
SET base_name = 'OSASCO' 
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_alair_v2 
SET base_name = 'ALAIR' 
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_campinas_v2 
SET base_name = 'CAMPINAS' 
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_abc_v2 
SET base_name = 'ABC' 
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_socorro_v2 
SET base_name = 'SOCORRO' 
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_sorocaba_v2 
SET base_name = 'SOROCABA' 
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_guarulhos_v2 
SET base_name = 'GUARULHOS' 
WHERE base_name IS NULL OR base_name = '';

-- 4. CRIAR ÍNDICES PARA PERFORMANCE (executar em grupos)
-- Índices Osasco
CREATE INDEX IF NOT EXISTS idx_osasco_v2_projeto_id ON abastecimentos_posto_osasco_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_base_id ON abastecimentos_posto_osasco_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_created_at ON abastecimentos_posto_osasco_v2(created_at);

-- Índices Alair
CREATE INDEX IF NOT EXISTS idx_alair_v2_projeto_id ON abastecimentos_posto_alair_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_alair_v2_base_id ON abastecimentos_posto_alair_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_alair_v2_created_at ON abastecimentos_posto_alair_v2(created_at);

-- Índices Campinas
CREATE INDEX IF NOT EXISTS idx_campinas_v2_projeto_id ON abastecimentos_posto_campinas_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_base_id ON abastecimentos_posto_campinas_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_created_at ON abastecimentos_posto_campinas_v2(created_at);

-- Índices ABC
CREATE INDEX IF NOT EXISTS idx_abc_v2_projeto_id ON abastecimentos_posto_abc_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_abc_v2_base_id ON abastecimentos_posto_abc_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_abc_v2_created_at ON abastecimentos_posto_abc_v2(created_at);

-- Índices Socorro
CREATE INDEX IF NOT EXISTS idx_socorro_v2_projeto_id ON abastecimentos_posto_socorro_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_base_id ON abastecimentos_posto_socorro_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_created_at ON abastecimentos_posto_socorro_v2(created_at);

-- Índices Sorocaba
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_projeto_id ON abastecimentos_posto_sorocaba_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_base_id ON abastecimentos_posto_sorocaba_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_created_at ON abastecimentos_posto_sorocaba_v2(created_at);

-- Índices Guarulhos
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_projeto_id ON abastecimentos_posto_guarulhos_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_base_id ON abastecimentos_posto_guarulhos_v2(base_id);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_created_at ON abastecimentos_posto_guarulhos_v2(created_at);

-- 5. VERIFICAÇÃO FINAL
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

-- 6. TESTE DE INSERÇÃO (opcional - para validar funcionamento)
INSERT INTO abastecimentos_posto_osasco_v2 (
    placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total,
    motorista, motorista_rg, operador, projeto, projeto_id, base_id, base_name,
    tipo_veiculo, created_at
) VALUES (
    'TEST999', 10000, 'Diesel', 10.0, 6.39, 63.90,
    'Teste Sistema', '999999999', 'Sistema', 'FULL MELI', 13, 145, 'FULL MELI (FMELI01)',
    'frota', NOW()
);

-- 7. VERIFICAR TESTE INSERIDO
SELECT 
    id, placa, projeto, base_name, created_at
FROM abastecimentos_posto_osasco_v2 
WHERE placa = 'TEST999';

-- 8. LIMPAR TESTE
DELETE FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TEST999';