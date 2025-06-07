-- Script final para Supabase - Sistema de Bases Específicas
-- Execute este script completo no Editor SQL do Supabase

-- 1. Adicionar colunas projeto_id nas tabelas de abastecimentos
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

-- 2. Criar projeto FULL MELI se não existir
INSERT INTO projects (id, name, description, is_active)
VALUES (13, 'FULL MELI', 'Full Meli - Operações completas Mercado Livre', true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 3. Criar base FULL MELI se não existir
INSERT INTO project_bases (id, project_id, base_name, base_code, is_active)
VALUES (145, 13, 'FULL MELI (FMELI01)', 'FMELI01', true)
ON CONFLICT (id) DO UPDATE SET 
    project_id = EXCLUDED.project_id,
    base_name = EXCLUDED.base_name,
    base_code = EXCLUDED.base_code,
    is_active = EXCLUDED.is_active;

-- 4. Atualizar registros existentes com base_name padrão se vazio
UPDATE abastecimentos_posto_osasco_v2 SET base_name = 'OSASCO' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_alair_v2 SET base_name = 'ALAIR' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_campinas_v2 SET base_name = 'CAMPINAS' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_abc_v2 SET base_name = 'ABC' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_socorro_v2 SET base_name = 'SOCORRO' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_sorocaba_v2 SET base_name = 'SOROCABA' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_guarulhos_v2 SET base_name = 'GUARULHOS' WHERE base_name IS NULL OR base_name = '';

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_osasco_v2_projeto_id ON abastecimentos_posto_osasco_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_base_id ON abastecimentos_posto_osasco_v2(base_id);

-- 6. Teste de funcionalidade - inserir e verificar
INSERT INTO abastecimentos_posto_osasco_v2 (
    placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total,
    motorista, motorista_rg, operador, projeto, projeto_id, base_id, base_name,
    tipo_veiculo, created_at
) VALUES (
    'TESTE888', 50000, 'Diesel', 25.0, 6.39, 159.75,
    'Teste Sistema', '123456789', 'Sistema', 'FULL MELI', 13, 145, 'FULL MELI (FMELI01)',
    'frota', NOW()
);

-- 7. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    (SELECT COUNT(*) FROM projects WHERE name = 'FULL MELI') as projeto_full_meli,
    (SELECT COUNT(*) FROM project_bases WHERE project_id = 13) as base_full_meli,
    (SELECT COUNT(*) FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TESTE888') as teste_inserido;

-- 8. Mostrar estrutura do projeto criado
SELECT 
    p.id as projeto_id,
    p.name as projeto_nome,
    b.id as base_id,
    b.base_name,
    b.base_code
FROM projects p
LEFT JOIN project_bases b ON p.id = b.project_id
WHERE p.name = 'FULL MELI';

-- 9. Limpar teste
DELETE FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TESTE888';

-- 10. Resultado
SELECT 'Sistema configurado com sucesso!' as resultado;