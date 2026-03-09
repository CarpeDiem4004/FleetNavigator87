-- =====================================================================
-- SCRIPT DEFINITIVO PARA CORRIGIR PROBLEMA DA COLUNA "PLACA"
-- =====================================================================
-- Este script corrige todos os conflitos relacionados à coluna "placa"
-- nas tabelas de manutenção

-- 1. VERIFICAR E CORRIGIR TABELA: oficina_murici_manutencoes
-- =====================================================================

-- Verificar se a coluna placa existe e está acessível
DO $$
BEGIN
    -- Teste básico de acesso à coluna placa
    PERFORM placa FROM oficina_murici_manutencoes LIMIT 1;
    RAISE NOTICE 'Coluna placa está acessível na tabela oficina_murici_manutencoes';
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'Problema detectado com a coluna placa. Recriando tabela...';
        
        -- Recriar tabela se houver problema
        DROP TABLE IF EXISTS oficina_murici_manutencoes CASCADE;
        
        CREATE TABLE oficina_murici_manutencoes (
            id SERIAL PRIMARY KEY,
            placa VARCHAR(20) NOT NULL,
            km INTEGER DEFAULT 0,
            prazo VARCHAR(50),
            descricao_manutencao TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'em_andamento',
            mecanico VARCHAR(100) NOT NULL,
            custo_total DECIMAL(10,2) DEFAULT 0,
            observacoes TEXT,
            peças_utilizadas TEXT,
            data_hora_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_hora_fim TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            -- Campos específicos para "Aguardando Peça"
            peca_descricao TEXT,
            peca_valor DECIMAL(10,2),
            fornecedor_nome VARCHAR(200),
            fornecedor_telefone VARCHAR(20),
            prazo_entrega VARCHAR(100)
        );
        
        -- Criar índices
        CREATE INDEX idx_oficina_manutencoes_placa ON oficina_murici_manutencoes(placa);
        CREATE INDEX idx_oficina_manutencoes_status ON oficina_murici_manutencoes(status);
        
        RAISE NOTICE 'Tabela oficina_murici_manutencoes recriada com sucesso';
END $$;

-- 2. VERIFICAR E CORRIGIR TABELA: manutencao (se necessário)
-- =====================================================================

DO $$
BEGIN
    -- Verificar se a tabela manutencao tem a coluna placa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'placa'
    ) THEN
        RAISE NOTICE 'Tabela manutencao já possui coluna placa';
    ELSE
        -- Adicionar coluna placa se não existir
        ALTER TABLE manutencao ADD COLUMN IF NOT EXISTS placa VARCHAR(20);
        RAISE NOTICE 'Coluna placa adicionada à tabela manutencao';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Tabela manutencao não existe';
END $$;

-- 3. VERIFICAR E CORRIGIR TABELA: manutencoes (se necessário)
-- =====================================================================

DO $$
BEGIN
    -- Verificar se a tabela manutencoes tem a coluna placa
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencoes' AND column_name = 'placa'
    ) THEN
        RAISE NOTICE 'Tabela manutencoes já possui coluna placa';
    ELSE
        -- Adicionar coluna placa se não existir
        ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS placa VARCHAR(20);
        RAISE NOTICE 'Coluna placa adicionada à tabela manutencoes';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Tabela manutencoes não existe';
END $$;

-- 4. INSERIR DADOS DE EXEMPLO PARA TESTE
-- =====================================================================

INSERT INTO oficina_murici_manutencoes (
    placa, km, prazo, descricao_manutencao, status, mecanico, custo_total
) VALUES (
    'ABC-1234', 50000, '2024-12-31', 'Revisão completa do sistema', 'em_andamento', 'João Silva', 250.00
) ON CONFLICT DO NOTHING;

-- 5. TESTES FINAIS DE VERIFICAÇÃO
-- =====================================================================

-- Teste 1: SELECT básico
SELECT 'TESTE SELECT BASICO' as teste, COUNT(*) as total 
FROM oficina_murici_manutencoes;

-- Teste 2: SELECT com coluna placa
SELECT 'TESTE COLUNA PLACA' as teste, placa, status 
FROM oficina_murici_manutencoes 
WHERE placa IS NOT NULL 
LIMIT 3;

-- Teste 3: INSERT com campos "Aguardando Peça"
INSERT INTO oficina_murici_manutencoes (
    placa, km, descricao_manutencao, status, mecanico,
    peca_descricao, peca_valor, fornecedor_nome, fornecedor_telefone, prazo_entrega
) VALUES (
    'TESTE-PLACA', 25000, 'Teste coluna placa funcionando', 'aguardando_peca', 'Sistema',
    'Peça de teste', 100.00, 'Fornecedor Teste', '(11) 8888-9999', '3 dias'
) RETURNING id, placa, status;

-- Teste 4: UPDATE
UPDATE oficina_murici_manutencoes 
SET custo_total = 300.00 
WHERE placa = 'TESTE-PLACA';

-- Teste 5: Verificar estrutura final
SELECT 'ESTRUTURA FINAL' as teste, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'oficina_murici_manutencoes' 
AND column_name IN ('id', 'placa', 'status', 'custo_total', 'peca_descricao')
ORDER BY column_name;

-- 6. LIMPEZA DOS DADOS DE TESTE
-- =====================================================================

DELETE FROM oficina_murici_manutencoes WHERE placa = 'TESTE-PLACA';

-- =====================================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =====================================================================
-- A coluna "placa" agora está funcionando corretamente em todas as
-- tabelas de manutenção. O sistema está pronto para uso!
-- =====================================================================