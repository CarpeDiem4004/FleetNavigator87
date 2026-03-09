-- Script de verificação e correção do schema do formulário de abastecimento
-- Execute após o script principal para garantir compatibilidade completa

-- 1. Verificar se todas as colunas necessárias existem em todas as tabelas
DO $$
DECLARE
    tabela_nome TEXT;
    colunas_necessarias TEXT[] := ARRAY['projeto_id', 'base_id', 'base_name', 'projeto'];
    coluna TEXT;
BEGIN
    -- Lista de todas as tabelas de abastecimento
    FOR tabela_nome IN 
        SELECT unnest(ARRAY[
            'abastecimentos_posto_osasco_v2',
            'abastecimentos_posto_alair_v2', 
            'abastecimentos_posto_campinas_v2',
            'abastecimentos_posto_abc_v2',
            'abastecimentos_posto_socorro_v2',
            'abastecimentos_posto_sorocaba_v2',
            'abastecimentos_posto_guarulhos_v2'
        ])
    LOOP
        -- Verificar cada coluna necessária
        FOREACH coluna IN ARRAY colunas_necessarias
        LOOP
            -- Verificar se a coluna existe
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tabela_nome AND column_name = coluna
            ) THEN
                -- Adicionar a coluna se não existir
                CASE coluna
                    WHEN 'projeto_id' THEN
                        EXECUTE format('ALTER TABLE %I ADD COLUMN projeto_id INTEGER', tabela_nome);
                        RAISE NOTICE 'Adicionada coluna projeto_id na tabela %', tabela_nome;
                    WHEN 'base_id' THEN
                        EXECUTE format('ALTER TABLE %I ADD COLUMN base_id INTEGER', tabela_nome);
                        RAISE NOTICE 'Adicionada coluna base_id na tabela %', tabela_nome;
                    WHEN 'base_name' THEN
                        EXECUTE format('ALTER TABLE %I ADD COLUMN base_name TEXT', tabela_nome);
                        RAISE NOTICE 'Adicionada coluna base_name na tabela %', tabela_nome;
                    WHEN 'projeto' THEN
                        -- A coluna projeto já deve existir na maioria das tabelas
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = tabela_nome AND column_name = 'projeto'
                        ) THEN
                            EXECUTE format('ALTER TABLE %I ADD COLUMN projeto TEXT', tabela_nome);
                            RAISE NOTICE 'Adicionada coluna projeto na tabela %', tabela_nome;
                        END IF;
                END CASE;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 2. Atualizar registros existentes que não têm base_name preenchido
-- Mapear bases padrões para cada posto

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

-- 3. Criar view consolidada atualizada que inclui as novas colunas
DROP VIEW IF EXISTS historico_consolidado_abastecimentos_v2;

CREATE VIEW historico_consolidado_abastecimentos_v2 AS
-- Osasco V2
SELECT 
    id,
    placa,
    km_atual as km,
    hodometro_atual,
    tipo_combustivel,
    litros as quantidade_litros,
    motorista as nome_motorista,
    motorista_rg as rg_motorista,
    operador as nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') as projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'OSASCO') as base_name,
    created_at,
    updated_at,
    'Posto Osasco V2' as posto
FROM abastecimentos_posto_osasco_v2

UNION ALL

-- Alair V2
SELECT 
    id,
    placa,
    km_atual as km,
    hodometro_atual,
    tipo_combustivel,
    litros as quantidade_litros,
    motorista as nome_motorista,
    motorista_rg as rg_motorista,
    operador as nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') as projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'ALAIR') as base_name,
    created_at,
    updated_at,
    'Posto Alair V2' as posto
FROM abastecimentos_posto_alair_v2

UNION ALL

-- Campinas V2
SELECT 
    id,
    placa,
    km_atual as km,
    hodometro_atual,
    tipo_combustivel,
    litros as quantidade_litros,
    motorista as nome_motorista,
    motorista_rg as rg_motorista,
    operador as nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') as projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'CAMPINAS') as base_name,
    created_at,
    updated_at,
    'Posto Campinas V2' as posto
FROM abastecimentos_posto_campinas_v2

UNION ALL

-- ABC V2
SELECT 
    id,
    placa,
    km_atual as km,
    hodometro_atual,
    tipo_combustivel,
    litros as quantidade_litros,
    motorista as nome_motorista,
    motorista_rg as rg_motorista,
    operador as nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') as projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'ABC') as base_name,
    created_at,
    updated_at,
    'Posto Abc V2' as posto
FROM abastecimentos_posto_abc_v2

UNION ALL

-- Socorro V2
SELECT 
    id,
    placa,
    km_atual as km,
    hodometro_atual,
    tipo_combustivel,
    litros as quantidade_litros,
    motorista as nome_motorista,
    motorista_rg as rg_motorista,
    operador as nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') as projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'SOCORRO') as base_name,
    created_at,
    updated_at,
    'Posto Socorro V2' as posto
FROM abastecimentos_posto_socorro_v2

UNION ALL

-- Sorocaba V2
SELECT 
    id,
    placa,
    km_atual as km,
    hodometro_atual,
    tipo_combustivel,
    litros as quantidade_litros,
    motorista as nome_motorista,
    motorista_rg as rg_motorista,
    operador as nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') as projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'SOROCABA') as base_name,
    created_at,
    updated_at,
    'Posto Sorocaba V2' as posto
FROM abastecimentos_posto_sorocaba_v2

UNION ALL

-- Guarulhos V2
SELECT 
    id,
    placa,
    km_atual as km,
    NULL as hodometro_atual,
    tipo_combustivel,
    litros as quantidade_litros,
    nome_motorista,
    rg_motorista,
    nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    NULL as lavagem,
    NULL as tipo_lavagem,
    COALESCE(projeto, 'Não definido') as projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'GUARULHOS') as base_name,
    created_at,
    created_at as updated_at,
    'Posto Guarulhos V2' as posto
FROM abastecimentos_posto_guarulhos_v2;

-- 4. Relatório final de verificação
SELECT 
    'VERIFICAÇÃO FINAL - ESTRUTURA DAS TABELAS' as titulo,
    '' as tabela,
    '' as tem_projeto_id,
    '' as tem_base_id, 
    '' as tem_base_name,
    '' as total_registros

UNION ALL

SELECT 
    '',
    'abastecimentos_posto_osasco_v2' as tabela,
    CASE WHEN COUNT(CASE WHEN column_name = 'projeto_id' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN COUNT(CASE WHEN column_name = 'base_id' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN COUNT(CASE WHEN column_name = 'base_name' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name,
    (SELECT COUNT(*)::TEXT FROM abastecimentos_posto_osasco_v2) as total_registros
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_osasco_v2'

UNION ALL

SELECT 
    '',
    'abastecimentos_posto_alair_v2' as tabela,
    CASE WHEN COUNT(CASE WHEN column_name = 'projeto_id' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_projeto_id,
    CASE WHEN COUNT(CASE WHEN column_name = 'base_id' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_id,
    CASE WHEN COUNT(CASE WHEN column_name = 'base_name' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END as tem_base_name,
    (SELECT COUNT(*)::TEXT FROM abastecimentos_posto_alair_v2) as total_registros
FROM information_schema.columns 
WHERE table_name = 'abastecimentos_posto_alair_v2'

UNION ALL

SELECT 
    '',
    'VERIFICAÇÃO PROJETO FULL MELI' as tabela,
    (SELECT COUNT(*)::TEXT FROM projects WHERE name = 'FULL MELI') as tem_projeto_id,
    (SELECT COUNT(*)::TEXT FROM project_bases WHERE project_id = 13) as tem_base_id,
    'FULL MELI (FMELI01)' as tem_base_name,
    '13' as total_registros;

-- 5. Teste de inserção para validar o schema
INSERT INTO abastecimentos_posto_osasco_v2 (
    placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total,
    motorista, motorista_rg, operador, projeto, projeto_id, base_id, base_name,
    tipo_veiculo, created_at
) VALUES (
    'TESTE123', 45000, 'Diesel', 20.0, 6.39, 127.80,
    'Teste Motorista', '987654321', 'Operador Teste', 'FULL MELI', 13, 145, 'FULL MELI (FMELI01)',
    'frota', NOW()
) 
ON CONFLICT DO NOTHING;

-- Verificar se o teste foi inserido
SELECT 
    'TESTE DE INSERÇÃO' as status,
    COUNT(*) as registros_inseridos
FROM abastecimentos_posto_osasco_v2 
WHERE placa = 'TESTE123' AND projeto = 'FULL MELI';

-- Limpar teste
DELETE FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TESTE123';

SELECT 'Script executado com sucesso! Todas as colunas necessárias foram adicionadas.' as resultado;