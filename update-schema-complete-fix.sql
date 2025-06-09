-- ========================================================
-- SCRIPT COMPLETO DE ATUALIZAÇÃO DO SCHEMA DO SISTEMA
-- Corrige inconsistências nas tabelas de abastecimentos
-- Data: 09/06/2025
-- ========================================================

-- PARTE 1: Adicionar colunas essenciais que faltam nas tabelas principais
-- ========================================================

-- 1.1: Adicionar hodometro_atual nas tabelas que não possuem
ALTER TABLE abastecimentos_postos 
ADD COLUMN IF NOT EXISTS hodometro_atual INTEGER;

ALTER TABLE abastecimentos_postos_supabase 
ADD COLUMN IF NOT EXISTS hodometro_atual INTEGER;

-- 1.2: Adicionar campos de cartão combustível em todas as tabelas V2
ALTER TABLE abastecimentos_posto_abc_v2 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50);

ALTER TABLE abastecimentos_posto_alair_v2 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50);

ALTER TABLE abastecimentos_posto_campinas_v2 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50);

ALTER TABLE abastecimentos_posto_guarulhos_v2 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50);

ALTER TABLE abastecimentos_posto_osasco_v2 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50);

ALTER TABLE abastecimentos_posto_socorro_v2 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50);

ALTER TABLE abastecimentos_posto_sorocaba_v2 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50);

-- 1.3: Adicionar campos de rastreamento nas tabelas principais
ALTER TABLE abastecimentos_postos 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50),
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

ALTER TABLE abastecimentos_postos_supabase 
ADD COLUMN IF NOT EXISTS valor_calculado NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(20),
ADD COLUMN IF NOT EXISTS cartao_abastecimento VARCHAR(50),
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(50),
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

-- PARTE 2: Atualizar valores calculados automaticamente
-- ========================================================

-- 2.1: Atualizar valor_calculado baseado em litros * valor_litro onde estiver NULL
UPDATE abastecimentos_posto_abc_v2 
SET valor_calculado = (COALESCE(litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL AND litros IS NOT NULL AND valor_litro IS NOT NULL;

UPDATE abastecimentos_posto_alair_v2 
SET valor_calculado = (COALESCE(litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL AND litros IS NOT NULL AND valor_litro IS NOT NULL;

UPDATE abastecimentos_posto_campinas_v2 
SET valor_calculado = (COALESCE(litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL AND litros IS NOT NULL AND valor_litro IS NOT NULL;

UPDATE abastecimentos_posto_guarulhos_v2 
SET valor_calculado = (COALESCE(litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL AND litros IS NOT NULL AND valor_litro IS NOT NULL;

UPDATE abastecimentos_posto_osasco_v2 
SET valor_calculado = (COALESCE(litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL AND litros IS NOT NULL AND valor_litro IS NOT NULL;

UPDATE abastecimentos_posto_socorro_v2 
SET valor_calculado = (COALESCE(litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL AND litros IS NOT NULL AND valor_litro IS NOT NULL;

UPDATE abastecimentos_posto_sorocaba_v2 
SET valor_calculado = (COALESCE(litros, 0) * COALESCE(valor_litro, 0))
WHERE valor_calculado IS NULL AND litros IS NOT NULL AND valor_litro IS NOT NULL;

-- PARTE 3: Criar triggers para manter valor_calculado atualizado
-- ========================================================

-- 3.1: Função para calcular valor automaticamente
CREATE OR REPLACE FUNCTION update_valor_calculado() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.valor_calculado = COALESCE(NEW.litros, 0) * COALESCE(NEW.valor_litro, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.2: Criar triggers para todas as tabelas V2
DROP TRIGGER IF EXISTS trigger_valor_calculado_abc_v2 ON abastecimentos_posto_abc_v2;
CREATE TRIGGER trigger_valor_calculado_abc_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_abc_v2
    FOR EACH ROW EXECUTE FUNCTION update_valor_calculado();

DROP TRIGGER IF EXISTS trigger_valor_calculado_alair_v2 ON abastecimentos_posto_alair_v2;
CREATE TRIGGER trigger_valor_calculado_alair_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_alair_v2
    FOR EACH ROW EXECUTE FUNCTION update_valor_calculado();

DROP TRIGGER IF EXISTS trigger_valor_calculado_campinas_v2 ON abastecimentos_posto_campinas_v2;
CREATE TRIGGER trigger_valor_calculado_campinas_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_campinas_v2
    FOR EACH ROW EXECUTE FUNCTION update_valor_calculado();

DROP TRIGGER IF EXISTS trigger_valor_calculado_guarulhos_v2 ON abastecimentos_posto_guarulhos_v2;
CREATE TRIGGER trigger_valor_calculado_guarulhos_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_guarulhos_v2
    FOR EACH ROW EXECUTE FUNCTION update_valor_calculado();

DROP TRIGGER IF EXISTS trigger_valor_calculado_osasco_v2 ON abastecimentos_posto_osasco_v2;
CREATE TRIGGER trigger_valor_calculado_osasco_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_osasco_v2
    FOR EACH ROW EXECUTE FUNCTION update_valor_calculado();

DROP TRIGGER IF EXISTS trigger_valor_calculado_socorro_v2 ON abastecimentos_posto_socorro_v2;
CREATE TRIGGER trigger_valor_calculado_socorro_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_socorro_v2
    FOR EACH ROW EXECUTE FUNCTION update_valor_calculado();

DROP TRIGGER IF EXISTS trigger_valor_calculado_sorocaba_v2 ON abastecimentos_posto_sorocaba_v2;
CREATE TRIGGER trigger_valor_calculado_sorocaba_v2
    BEFORE INSERT OR UPDATE ON abastecimentos_posto_sorocaba_v2
    FOR EACH ROW EXECUTE FUNCTION update_valor_calculado();

-- PARTE 4: Atualizar view de histórico consolidado
-- ========================================================

-- 4.1: Recriar view com todos os campos novos
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

-- Guarulhos V2
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

-- PARTE 5: Criar índices para performance
-- ========================================================

-- 5.1: Índices para busca por placa
CREATE INDEX IF NOT EXISTS idx_abc_v2_placa ON abastecimentos_posto_abc_v2(placa);
CREATE INDEX IF NOT EXISTS idx_alair_v2_placa ON abastecimentos_posto_alair_v2(placa);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_placa ON abastecimentos_posto_campinas_v2(placa);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_placa ON abastecimentos_posto_guarulhos_v2(placa);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_placa ON abastecimentos_posto_osasco_v2(placa);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_placa ON abastecimentos_posto_socorro_v2(placa);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_placa ON abastecimentos_posto_sorocaba_v2(placa);

-- 5.2: Índices para busca por data
CREATE INDEX IF NOT EXISTS idx_abc_v2_data ON abastecimentos_posto_abc_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_alair_v2_data ON abastecimentos_posto_alair_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_data ON abastecimentos_posto_campinas_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_data ON abastecimentos_posto_guarulhos_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_data ON abastecimentos_posto_osasco_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_data ON abastecimentos_posto_socorro_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_data ON abastecimentos_posto_sorocaba_v2(created_at);

-- 5.3: Índices para busca por projeto
CREATE INDEX IF NOT EXISTS idx_abc_v2_projeto ON abastecimentos_posto_abc_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_alair_v2_projeto ON abastecimentos_posto_alair_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_campinas_v2_projeto ON abastecimentos_posto_campinas_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_guarulhos_v2_projeto ON abastecimentos_posto_guarulhos_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_projeto ON abastecimentos_posto_osasco_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_socorro_v2_projeto ON abastecimentos_posto_socorro_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_sorocaba_v2_projeto ON abastecimentos_posto_sorocaba_v2(projeto_id);

-- PARTE 6: Validações finais
-- ========================================================

-- 6.1: Verificar se todas as atualizações foram aplicadas
SELECT 'Script executado com sucesso!' as status;

-- 6.2: Mostrar estatísticas das tabelas atualizadas
SELECT 
    'abastecimentos_posto_abc_v2' as tabela,
    COUNT(*) as total_registros,
    COUNT(valor_calculado) as registros_com_valor_calculado
FROM abastecimentos_posto_abc_v2
UNION ALL
SELECT 
    'abastecimentos_posto_osasco_v2' as tabela,
    COUNT(*) as total_registros,
    COUNT(valor_calculado) as registros_com_valor_calculado
FROM abastecimentos_posto_osasco_v2
UNION ALL
SELECT 
    'abastecimentos_posto_alair_v2' as tabela,
    COUNT(*) as total_registros,
    COUNT(valor_calculado) as registros_com_valor_calculado
FROM abastecimentos_posto_alair_v2;

-- ========================================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO
-- ========================================================