-- Script para corrigir inconsistências nas tabelas do sistema de manutenção
-- Execute este script para padronizar a estrutura das tabelas

-- 1. CORRIGIR TABELA MANUTENCAO - Remover colunas duplicadas e padronizar
-- Primeiro, verificar se existem dados nas colunas inglesas
DO $$
BEGIN
    -- Se vehicle_plate tem dados diferentes de placa, copiar para placa
    UPDATE manutencao 
    SET placa = vehicle_plate 
    WHERE vehicle_plate IS NOT NULL 
    AND (placa IS NULL OR placa != vehicle_plate);
    
    -- Se request_base_id tem dados diferentes de base_id, copiar para base_id
    UPDATE manutencao 
    SET base_id = request_base_id 
    WHERE request_base_id IS NOT NULL 
    AND (base_id IS NULL OR base_id != request_base_id);
END $$;

-- Remover colunas duplicadas da tabela manutencao
ALTER TABLE manutencao DROP COLUMN IF EXISTS vehicle_plate;
ALTER TABLE manutencao DROP COLUMN IF EXISTS request_base_id;
ALTER TABLE manutencao DROP COLUMN IF EXISTS entry_date;

-- 2. CORRIGIR TABELA VEICULOS - Remover colunas duplicadas e padronizar
DO $$
BEGIN
    -- Se plate tem dados diferentes de placa, copiar para placa
    UPDATE veiculos 
    SET placa = plate 
    WHERE plate IS NOT NULL 
    AND (placa IS NULL OR placa != plate);
    
    -- Se model tem dados diferentes de modelo, copiar para modelo
    UPDATE veiculos 
    SET modelo = model 
    WHERE model IS NOT NULL 
    AND (modelo IS NULL OR modelo != model);
    
    -- Se year tem dados diferentes de ano, copiar para ano
    UPDATE veiculos 
    SET ano = year 
    WHERE year IS NOT NULL 
    AND (ano IS NULL OR ano != year);
END $$;

-- Remover colunas duplicadas da tabela veiculos
ALTER TABLE veiculos DROP COLUMN IF EXISTS plate;
ALTER TABLE veiculos DROP COLUMN IF EXISTS model;
ALTER TABLE veiculos DROP COLUMN IF EXISTS year;

-- 3. ADICIONAR COLUNAS FALTANTES SE NECESSÁRIO
-- Adicionar coluna de prioridade na tabela manutencao se não existir
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT 'media';

-- Adicionar coluna de pessoa responsável se não existir
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS responsavel VARCHAR(255);

-- Adicionar coluna de tipo de manutenção se não existir (renomear se necessário)
DO $$
BEGIN
    -- Se a coluna 'tipo' existe mas não 'tipo_manutencao', renomear
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manutencao' AND column_name = 'tipo') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manutencao' AND column_name = 'tipo_manutencao') THEN
        ALTER TABLE manutencao RENAME COLUMN tipo TO tipo_manutencao;
    END IF;
END $$;

-- 4. PADRONIZAR STATUS DA TABELA OFICINAS
-- Garantir que os status estejam padronizados
UPDATE oficinas SET status = 'ativa' WHERE status IN ('ativo', 'active', 'ATIVO', 'ATIVA');
UPDATE oficinas SET status = 'inativa' WHERE status IN ('inativo', 'inactive', 'INATIVO', 'INATIVA');

-- 5. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_manutencao_placa ON manutencao(placa);
CREATE INDEX IF NOT EXISTS idx_manutencao_status ON manutencao(status);
CREATE INDEX IF NOT EXISTS idx_manutencao_oficina_id ON manutencao(oficina_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_base_id ON manutencao(base_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_base_id ON veiculos(base_id);
CREATE INDEX IF NOT EXISTS idx_oficinas_cnpj ON oficinas(cnpj);

-- 6. ADICIONAR CONSTRAINTS SE NECESSÁRIO
-- Garantir que CNPJ seja único na tabela oficinas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'oficinas' AND constraint_name = 'oficinas_cnpj_unique') THEN
        ALTER TABLE oficinas ADD CONSTRAINT oficinas_cnpj_unique UNIQUE (cnpj);
    END IF;
END $$;

-- Garantir que placa seja única na tabela veiculos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'veiculos' AND constraint_name = 'veiculos_placa_unique') THEN
        ALTER TABLE veiculos ADD CONSTRAINT veiculos_placa_unique UNIQUE (placa);
    END IF;
END $$;

-- 7. LIMPAR REGISTROS DUPLICADOS SE EXISTIREM
-- Remover oficinas duplicadas por CNPJ (manter a mais recente)
DELETE FROM oficinas 
WHERE id NOT IN (
    SELECT DISTINCT ON (cnpj) id 
    FROM oficinas 
    ORDER BY cnpj, created_at DESC
);

-- Remover veículos duplicados por placa (manter o mais recente)
DELETE FROM veiculos 
WHERE id NOT IN (
    SELECT DISTINCT ON (placa) id 
    FROM veiculos 
    ORDER BY placa, created_at DESC
);

-- 8. ATUALIZAR TIMESTAMPS PARA UTC
-- Garantir que todos os timestamps estejam corretos
UPDATE manutencao SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE oficinas SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE veiculos SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

COMMIT;

-- Mostrar estatísticas finais
SELECT 'manutencao' as tabela, COUNT(*) as total_registros FROM manutencao
UNION ALL
SELECT 'oficinas' as tabela, COUNT(*) as total_registros FROM oficinas  
UNION ALL
SELECT 'veiculos' as tabela, COUNT(*) as total_registros FROM veiculos
UNION ALL
SELECT 'bases' as tabela, COUNT(*) as total_registros FROM bases;