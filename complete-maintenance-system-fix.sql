-- SCRIPT COMPLETO PARA CORRIGIR SISTEMA DE MANUTENÇÃO
-- Este script resolve todos os problemas de estrutura do banco de dados
-- e garante funcionamento completo do sistema de manutenção

BEGIN;

-- =============================================================================
-- 1. LIMPEZA E PADRONIZAÇÃO DA TABELA MANUTENCAO
-- =============================================================================

-- Verificar e remover colunas duplicadas/antigas se existirem
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Lista de colunas antigas que devem ser removidas
    DECLARE columns_to_check text[] := ARRAY['vehicle_plate', 'request_base_id', 'entry_date'];
    DECLARE col text;
    
    FOREACH col IN ARRAY columns_to_check LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'manutencao' AND column_name = col
        ) INTO col_exists;
        
        IF col_exists THEN
            EXECUTE format('ALTER TABLE manutencao DROP COLUMN IF EXISTS %I', col);
            RAISE NOTICE 'Coluna % removida da tabela manutencao', col;
        END IF;
    END LOOP;
END $$;

-- Garantir que todas as colunas necessárias existam com tipos corretos
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS veiculo_id INTEGER;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS placa VARCHAR(20);
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) NOT NULL DEFAULT 'preventiva';
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS data_solicitacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS data_agendada TIMESTAMPTZ;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMPTZ;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente';
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2);
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS oficina_id INTEGER;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS km_atual INTEGER;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS solicitante_id INTEGER;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT 'media';
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS responsavel VARCHAR(255);
ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- =============================================================================
-- 2. LIMPEZA E PADRONIZAÇÃO DA TABELA VEICULOS
-- =============================================================================

DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Remover colunas duplicadas da tabela veiculos
    DECLARE columns_to_check text[] := ARRAY['plate', 'model', 'year'];
    DECLARE col text;
    
    FOREACH col IN ARRAY columns_to_check LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'veiculos' AND column_name = col
        ) INTO col_exists;
        
        IF col_exists THEN
            EXECUTE format('ALTER TABLE veiculos DROP COLUMN IF EXISTS %I', col);
            RAISE NOTICE 'Coluna % removida da tabela veiculos', col;
        END IF;
    END LOOP;
END $$;

-- Garantir estrutura padrão da tabela veiculos
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS placa VARCHAR(20) UNIQUE NOT NULL;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS modelo VARCHAR(100);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS marca VARCHAR(50);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ano INTEGER;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS km_atual INTEGER DEFAULT 0;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ultima_manutencao TIMESTAMPTZ;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS proxima_manutencao TIMESTAMPTZ;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) DEFAULT 'Diesel';
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS media_consumo_combustivel DECIMAL(5,2);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS cartao_abastecimento TEXT;

-- =============================================================================
-- 3. GARANTIR ESTRUTURA DA TABELA OFICINAS
-- =============================================================================

-- Criar tabela oficinas se não existir
CREATE TABLE IF NOT EXISTS oficinas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(255),
    contato_responsavel VARCHAR(255),
    especialidades TEXT[],
    status VARCHAR(20) DEFAULT 'ativa',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices para tabela manutencao
CREATE INDEX IF NOT EXISTS idx_manutencao_placa ON manutencao(placa);
CREATE INDEX IF NOT EXISTS idx_manutencao_status ON manutencao(status);
CREATE INDEX IF NOT EXISTS idx_manutencao_oficina_id ON manutencao(oficina_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_base_id ON manutencao(base_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_data_solicitacao ON manutencao(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_manutencao_tipo ON manutencao(tipo);
CREATE INDEX IF NOT EXISTS idx_manutencao_prioridade ON manutencao(prioridade);

-- Índices para tabela veiculos
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_base_id ON veiculos(base_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_tipo ON veiculos(tipo);

-- Índices para tabela oficinas
CREATE INDEX IF NOT EXISTS idx_oficinas_cnpj ON oficinas(cnpj);
CREATE INDEX IF NOT EXISTS idx_oficinas_status ON oficinas(status);

-- =============================================================================
-- 5. ADICIONAR CONSTRAINTS DE INTEGRIDADE
-- =============================================================================

-- Foreign keys se as tabelas relacionadas existirem
DO $$
BEGIN
    -- FK para oficinas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oficinas') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'manutencao' AND constraint_name = 'fk_manutencao_oficina') THEN
            ALTER TABLE manutencao ADD CONSTRAINT fk_manutencao_oficina 
            FOREIGN KEY (oficina_id) REFERENCES oficinas(id);
        END IF;
    END IF;

    -- FK para bases
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bases') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'manutencao' AND constraint_name = 'fk_manutencao_base') THEN
            ALTER TABLE manutencao ADD CONSTRAINT fk_manutencao_base 
            FOREIGN KEY (base_id) REFERENCES bases(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'veiculos' AND constraint_name = 'fk_veiculos_base') THEN
            ALTER TABLE veiculos ADD CONSTRAINT fk_veiculos_base 
            FOREIGN KEY (base_id) REFERENCES bases(id);
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 6. INSERIR DADOS DE OFICINAS PADRÃO SE NÃO EXISTIREM
-- =============================================================================

INSERT INTO oficinas (nome, cnpj, endereco, telefone, email, contato_responsavel, especialidades, status)
SELECT * FROM (VALUES 
    ('Oficina Mecânica Central', '12.345.678/0001-90', 'Rua das Flores, 123 - Centro', '(11) 1234-5678', 'contato@oficinacentral.com', 'João Silva', ARRAY['motor', 'freios', 'suspensao'], 'ativa'),
    ('Auto Peças e Serviços', '98.765.432/0001-10', 'Av. Principal, 456 - Industrial', '(11) 9876-5432', 'vendas@autopecas.com', 'Maria Santos', ARRAY['eletrica', 'ar_condicionado', 'injecao'], 'ativa')
) AS v(nome, cnpj, endereco, telefone, email, contato_responsavel, especialidades, status)
WHERE NOT EXISTS (SELECT 1 FROM oficinas WHERE cnpj = v.cnpj);

-- =============================================================================
-- 7. ATUALIZAR DADOS EXISTENTES
-- =============================================================================

-- Padronizar status
UPDATE manutencao SET status = 'pendente' WHERE status IS NULL OR status = '';
UPDATE manutencao SET prioridade = 'media' WHERE prioridade IS NULL OR prioridade = '';
UPDATE manutencao SET responsavel = 'Sistema' WHERE responsavel IS NULL OR responsavel = '';
UPDATE manutencao SET tipo = 'preventiva' WHERE tipo IS NULL OR tipo = '';

-- Atualizar timestamps
UPDATE manutencao SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE manutencao SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE manutencao SET data_solicitacao = CURRENT_TIMESTAMP WHERE data_solicitacao IS NULL;

UPDATE veiculos SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE veiculos SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE veiculos SET status = 'ativo' WHERE status IS NULL OR status = '';

UPDATE oficinas SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE oficinas SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE oficinas SET status = 'ativa' WHERE status IS NULL OR status = '';

-- =============================================================================
-- 8. CRIAR TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =============================================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas principais
DROP TRIGGER IF EXISTS update_manutencao_updated_at ON manutencao;
CREATE TRIGGER update_manutencao_updated_at 
    BEFORE UPDATE ON manutencao 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_veiculos_updated_at ON veiculos;
CREATE TRIGGER update_veiculos_updated_at 
    BEFORE UPDATE ON veiculos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oficinas_updated_at ON oficinas;
CREATE TRIGGER update_oficinas_updated_at 
    BEFORE UPDATE ON oficinas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. LIMPAR DADOS DUPLICADOS
-- =============================================================================

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
    WHERE placa IS NOT NULL AND placa != ''
    ORDER BY placa, created_at DESC
);

COMMIT;

-- =============================================================================
-- 10. RELATÓRIO FINAL
-- =============================================================================

SELECT 'ESTRUTURA DE TABELAS CORRIGIDA COM SUCESSO' as status;

-- Estatísticas das tabelas
SELECT 
    'manutencao' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN placa IS NOT NULL AND placa != '' THEN 1 END) as registros_com_placa,
    COUNT(CASE WHEN base_id IS NOT NULL THEN 1 END) as registros_com_base_id,
    COUNT(CASE WHEN oficina_id IS NOT NULL THEN 1 END) as registros_com_oficina_id
FROM manutencao

UNION ALL

SELECT 
    'veiculos' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN placa IS NOT NULL AND placa != '' THEN 1 END) as registros_com_placa,
    COUNT(CASE WHEN base_id IS NOT NULL THEN 1 END) as registros_com_base_id,
    0 as registros_com_oficina_id
FROM veiculos

UNION ALL

SELECT 
    'oficinas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN nome IS NOT NULL AND nome != '' THEN 1 END) as registros_com_nome,
    COUNT(CASE WHEN cnpj IS NOT NULL AND cnpj != '' THEN 1 END) as registros_com_cnpj,
    COUNT(CASE WHEN status = 'ativa' THEN 1 END) as oficinas_ativas
FROM oficinas;

-- Estrutura final da tabela manutencao
SELECT 'ESTRUTURA FINAL - TABELA MANUTENCAO:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'manutencao' 
ORDER BY ordinal_position;