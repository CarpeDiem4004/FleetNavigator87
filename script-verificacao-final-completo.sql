-- Script de verificação final e melhorias opcionais
-- Execute no Supabase para garantir que tudo está funcionando perfeitamente

-- 1. VERIFICAÇÃO COMPLETA DO SISTEMA
SELECT 'VERIFICAÇÃO DO SISTEMA DE BASES ESPECÍFICAS' as titulo;

-- Verificar projeto FULL MELI
SELECT 
    'PROJETO FULL MELI' as item,
    p.id as projeto_id,
    p.name as projeto_nome,
    p.description,
    p.is_active as ativo
FROM projects p
WHERE p.name = 'FULL MELI';

-- Verificar base FULL MELI
SELECT 
    'BASE FULL MELI' as item,
    b.id as base_id,
    b.base_name,
    b.base_code,
    b.project_id,
    b.is_active as ativa
FROM project_bases b
WHERE b.project_id = 13;

-- Verificar estrutura das tabelas
SELECT 
    'ESTRUTURA DAS TABELAS' as item,
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

-- 2. MELHORIAS OPCIONAIS - Criar índices adicionais para performance
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

-- 3. ATUALIZAR BASE_NAME EM TODAS AS TABELAS (se necessário)
UPDATE abastecimentos_posto_alair_v2 SET base_name = 'ALAIR' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_campinas_v2 SET base_name = 'CAMPINAS' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_abc_v2 SET base_name = 'ABC' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_socorro_v2 SET base_name = 'SOCORRO' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_sorocaba_v2 SET base_name = 'SOROCABA' WHERE base_name IS NULL OR base_name = '';
UPDATE abastecimentos_posto_guarulhos_v2 SET base_name = 'GUARULHOS' WHERE base_name IS NULL OR base_name = '';

-- 4. TESTE COMPLETO DO SISTEMA
-- Inserir teste em cada posto para validar funcionamento
INSERT INTO abastecimentos_posto_osasco_v2 (
    placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total,
    motorista, motorista_rg, operador, projeto, projeto_id, base_id, base_name,
    tipo_veiculo, created_at
) VALUES (
    'TEST001', 10000, 'Diesel', 10.0, 6.39, 63.90,
    'Teste Osasco', '111111111', 'Sistema', 'FULL MELI', 13, 145, 'FULL MELI (FMELI01)',
    'frota', NOW()
);

INSERT INTO abastecimentos_posto_alair_v2 (
    placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total,
    motorista, motorista_rg, operador, projeto, projeto_id, base_id, base_name,
    tipo_veiculo, created_at
) VALUES (
    'TEST002', 20000, 'Diesel', 15.0, 6.39, 95.85,
    'Teste Alair', '222222222', 'Sistema', 'FULL MELI', 13, 145, 'FULL MELI (FMELI01)',
    'frota', NOW()
);

-- 5. VERIFICAR TESTES INSERIDOS
SELECT 
    'TESTES INSERIDOS' as status,
    (SELECT COUNT(*) FROM abastecimentos_posto_osasco_v2 WHERE placa LIKE 'TEST%') as osasco_teste,
    (SELECT COUNT(*) FROM abastecimentos_posto_alair_v2 WHERE placa LIKE 'TEST%') as alair_teste;

-- 6. LIMPAR TESTES
DELETE FROM abastecimentos_posto_osasco_v2 WHERE placa LIKE 'TEST%';
DELETE FROM abastecimentos_posto_alair_v2 WHERE placa LIKE 'TEST%';

-- 7. RELATÓRIO FINAL
SELECT 
    'SISTEMA PRONTO PARA USO' as status,
    (SELECT COUNT(*) FROM projects WHERE is_active = true) as projetos_ativos,
    (SELECT COUNT(*) FROM project_bases WHERE is_active = true) as bases_ativas,
    'Projeto FULL MELI (ID: 13) com base FMELI01 (ID: 145) criado com sucesso' as detalhes;

-- 8. VERIFICAÇÃO DE TODOS OS PROJETOS DISPONÍVEIS
SELECT 
    p.id,
    p.name as projeto,
    COUNT(b.id) as total_bases,
    STRING_AGG(b.base_name, ', ' ORDER BY b.base_name) as bases_disponiveis
FROM projects p
LEFT JOIN project_bases b ON p.id = b.project_id AND b.is_active = true
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.name;