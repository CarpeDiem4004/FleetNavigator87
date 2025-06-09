-- ========================================================
-- SCRIPT COMPLETO DE CORREÇÃO DO SCHEMA SUPABASE
-- Corrige todas as inconsistências nas tabelas de abastecimentos
-- Data: 09/06/2025
-- ========================================================

-- PARTE 1: Corrigir inconsistências na tabela Guarulhos V2
-- ========================================================

-- 1.1: Padronizar nomes de colunas na tabela Guarulhos V2
ALTER TABLE abastecimentos_posto_guarulhos_v2 
ADD COLUMN IF NOT EXISTS motorista VARCHAR(255),
ADD COLUMN IF NOT EXISTS motorista_rg VARCHAR(50),
ADD COLUMN IF NOT EXISTS operador VARCHAR(255),
ADD COLUMN IF NOT EXISTS lavagem BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_lavagem VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Migrar dados existentes para as novas colunas padronizadas
UPDATE abastecimentos_posto_guarulhos_v2 
SET 
    motorista = nome_motorista,
    motorista_rg = rg_motorista,
    operador = nome_operador
WHERE motorista IS NULL;

-- PARTE 2: Corrigir inconsistências na tabela Campinas V2
-- ========================================================

-- 2.1: Adicionar coluna updated_at que está faltando
ALTER TABLE abastecimentos_posto_campinas_v2 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- PARTE 3: Padronizar tabela abastecimentos_supabase
-- ========================================================

-- 3.1: Adicionar todas as colunas necessárias na tabela principal
ALTER TABLE abastecimentos_supabase 
ADD COLUMN IF NOT EXISTS placa VARCHAR(20),
ADD COLUMN IF NOT EXISTS km_atual INTEGER,
ADD COLUMN IF NOT EXISTS hodometro_atual INTEGER,
ADD COLUMN IF NOT EXISTS tipo_combustivel VARCHAR(50),
ADD COLUMN IF NOT EXISTS litros NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_litro NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_total NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS motorista VARCHAR(255),
ADD COLUMN IF NOT EXISTS motorista_rg VARCHAR(50),
ADD COLUMN IF NOT EXISTS operador VARCHAR(255),
ADD COLUMN IF NOT EXISTS projeto VARCHAR(255),
ADD COLUMN IF NOT EXISTS tipo_veiculo VARCHAR(100),
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS lavagem BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_lavagem VARCHAR(50),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50),
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS posto VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- PARTE 4: Criar triggers atualizados para todas as tabelas V2
-- ========================================================

-- 4.1: Função atualizada para calcular valor e timestamp
CREATE OR REPLACE FUNCTION update_abastecimento_fields() 
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular valor automaticamente
    NEW.valor_calculado = COALESCE(NEW.litros, 0) * COALESCE(NEW.valor_litro, 0);
    
    -- Atualizar timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2: Aplicar triggers em todas as tabelas V2
DROP TRIGGER IF EXISTS trigger_update_abc_v2 ON abastecimentos_posto_abc_v2;
CREATE TRIGGER trigger_update_abc_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_abc_v2
    FOR EACH ROW EXECUTE FUNCTION update_abastecimento_fields();

DROP TRIGGER IF EXISTS trigger_update_alair_v2 ON abastecimentos_posto_alair_v2;
CREATE TRIGGER trigger_update_alair_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_alair_v2
    FOR EACH ROW EXECUTE FUNCTION update_abastecimento_fields();

DROP TRIGGER IF EXISTS trigger_update_campinas_v2 ON abastecimentos_posto_campinas_v2;
CREATE TRIGGER trigger_update_campinas_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_campinas_v2
    FOR EACH ROW EXECUTE FUNCTION update_abastecimento_fields();

DROP TRIGGER IF EXISTS trigger_update_guarulhos_v2 ON abastecimentos_posto_guarulhos_v2;
CREATE TRIGGER trigger_update_guarulhos_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_guarulhos_v2
    FOR EACH ROW EXECUTE FUNCTION update_abastecimento_fields();

DROP TRIGGER IF EXISTS trigger_update_osasco_v2 ON abastecimentos_posto_osasco_v2;
CREATE TRIGGER trigger_update_osasco_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_osasco_v2
    FOR EACH ROW EXECUTE FUNCTION update_abastecimento_fields();

DROP TRIGGER IF EXISTS trigger_update_socorro_v2 ON abastecimentos_posto_socorro_v2;
CREATE TRIGGER trigger_update_socorro_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_socorro_v2
    FOR EACH ROW EXECUTE FUNCTION update_abastecimento_fields();

DROP TRIGGER IF EXISTS trigger_update_sorocaba_v2 ON abastecimentos_posto_sorocaba_v2;
CREATE TRIGGER trigger_update_sorocaba_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_sorocaba_v2
    FOR EACH ROW EXECUTE FUNCTION update_abastecimento_fields();

-- PARTE 5: Recriar view de histórico consolidado com correção de fuso horário
-- ========================================================

DROP VIEW IF EXISTS historico_consolidado_abastecimentos;

CREATE VIEW historico_consolidado_abastecimentos AS
-- ABC V2
SELECT 
    id,
    placa,
    km_atual AS km,
    hodometro_atual,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    valor_calculado,
    numero_cartao,
    cartao_abastecimento,
    provedor_cartao,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') AS projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'ABC') AS base_name,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    updated_at,
    'ABC V2' AS posto
FROM abastecimentos_posto_abc_v2

UNION ALL

-- Alair V2
SELECT 
    id,
    placa,
    km_atual AS km,
    hodometro_atual,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    valor_calculado,
    numero_cartao,
    cartao_abastecimento,
    provedor_cartao,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') AS projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'ALAIR') AS base_name,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    updated_at,
    'Alair V2' AS posto
FROM abastecimentos_posto_alair_v2

UNION ALL

-- Campinas V2
SELECT 
    id,
    placa,
    km_atual AS km,
    hodometro_atual,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    valor_calculado,
    numero_cartao,
    cartao_abastecimento,
    provedor_cartao,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') AS projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'CAMPINAS') AS base_name,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    updated_at,
    'Campinas V2' AS posto
FROM abastecimentos_posto_campinas_v2

UNION ALL

-- Guarulhos V2 (com campos padronizados)
SELECT 
    id,
    placa,
    km_atual AS km,
    hodometro_atual,
    tipo_combustivel,
    quantity_litros AS quantidade_litros,
    COALESCE(motorista, nome_motorista) AS nome_motorista,
    COALESCE(motorista_rg, rg_motorista) AS rg_motorista,
    COALESCE(operador, nome_operador) AS nome_operador,
    valor_litro,
    valor_total,
    valor_calculado,
    numero_cartao,
    cartao_abastecimento,
    provedor_cartao,
    tipo_veiculo,
    observacoes,
    COALESCE(lavagem, false) AS lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') AS projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'GUARULHOS') AS base_name,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    updated_at,
    'Guarulhos V2' AS posto
FROM abastecimentos_posto_guarulhos_v2

UNION ALL

-- Osasco V2
SELECT 
    id,
    placa,
    km_atual AS km,
    hodometro_atual,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    valor_calculado,
    numero_cartao,
    cartao_abastecimento,
    provedor_cartao,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') AS projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'OSASCO') AS base_name,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    updated_at,
    'Osasco V2' AS posto
FROM abastecimentos_posto_osasco_v2

UNION ALL

-- Socorro V2
SELECT 
    id,
    placa,
    km_atual AS km,
    hodometro_atual,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    valor_calculado,
    numero_cartao,
    cartao_abastecimento,
    provedor_cartao,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') AS projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'SOCORRO') AS base_name,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    updated_at,
    'Socorro V2' AS posto
FROM abastecimentos_posto_socorro_v2

UNION ALL

-- Sorocaba V2
SELECT 
    id,
    placa,
    km_atual AS km,
    hodometro_atual,
    tipo_combustivel,
    litros AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    valor_calculado,
    numero_cartao,
    cartao_abastecimento,
    provedor_cartao,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    COALESCE(projeto, 'Não definido') AS projeto,
    projeto_id,
    base_id,
    COALESCE(base_name, 'SOROCABA') AS base_name,
    to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    updated_at,
    'Sorocaba V2' AS posto
FROM abastecimentos_posto_sorocaba_v2

ORDER BY created_at DESC;

-- PARTE 6: Criar índices para performance otimizada
-- ========================================================

-- 6.1: Índices para campos de busca frequente
CREATE INDEX IF NOT EXISTS idx_abc_v2_placa_data ON abastecimentos_posto_abc_v2(placa, created_at);
CREATE INDEX IF NOT EXISTS idx_alair_v2_placa_data ON abastecimentos_posto_alair_v2(placa, created_at);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_placa_data ON abastecimentos_posto_campinas_v2(placa, created_at);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_placa_data ON abastecimentos_posto_guarulhos_v2(placa, created_at);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_placa_data ON abastecimentos_posto_osasco_v2(placa, created_at);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_placa_data ON abastecimentos_posto_socorro_v2(placa, created_at);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_placa_data ON abastecimentos_posto_sorocaba_v2(placa, created_at);

-- 6.2: Índices para busca por projeto e base
CREATE INDEX IF NOT EXISTS idx_abc_v2_projeto_base ON abastecimentos_posto_abc_v2(projeto_id, base_id);
CREATE INDEX IF NOT EXISTS idx_alair_v2_projeto_base ON abastecimentos_posto_alair_v2(projeto_id, base_id);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_projeto_base ON abastecimentos_posto_campinas_v2(projeto_id, base_id);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_projeto_base ON abastecimentos_posto_guarulhos_v2(projeto_id, base_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_projeto_base ON abastecimentos_posto_osasco_v2(projeto_id, base_id);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_projeto_base ON abastecimentos_posto_socorro_v2(projeto_id, base_id);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_projeto_base ON abastecimentos_posto_sorocaba_v2(projeto_id, base_id);

-- PARTE 7: Atualizar dados existentes
-- ========================================================

-- 7.1: Calcular valores faltantes em todas as tabelas
UPDATE abastecimentos_posto_guarulhos_v2 
SET valor_calculado = (COALESCE(quantity_litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL OR valor_calculado = 0;

-- 7.2: Definir valores padrão para campos obrigatórios
UPDATE abastecimentos_posto_guarulhos_v2 
SET 
    lavagem = false,
    updated_at = CURRENT_TIMESTAMP
WHERE lavagem IS NULL OR updated_at IS NULL;

UPDATE abastecimentos_posto_campinas_v2 
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

-- PARTE 8: Validação final
-- ========================================================

-- 8.1: Verificar se todas as correções foram aplicadas
SELECT 'Schema corrigido com sucesso!' as status;

-- 8.2: Mostrar estatísticas das tabelas corrigidas
SELECT 
    table_name,
    COUNT(*) as total_registros
FROM (
    SELECT 'abc_v2' as table_name, COUNT(*) FROM abastecimentos_posto_abc_v2
    UNION ALL
    SELECT 'alair_v2', COUNT(*) FROM abastecimentos_posto_alair_v2
    UNION ALL
    SELECT 'campinas_v2', COUNT(*) FROM abastecimentos_posto_campinas_v2
    UNION ALL
    SELECT 'guarulhos_v2', COUNT(*) FROM abastecimentos_posto_guarulhos_v2
    UNION ALL
    SELECT 'osasco_v2', COUNT(*) FROM abastecimentos_posto_osasco_v2
    UNION ALL
    SELECT 'socorro_v2', COUNT(*) FROM abastecimentos_posto_socorro_v2
    UNION ALL
    SELECT 'sorocaba_v2', COUNT(*) FROM abastecimentos_posto_sorocaba_v2
) t
ORDER BY table_name;

-- ========================================================
-- FIM DO SCRIPT DE CORREÇÃO COMPLETA
-- ========================================================