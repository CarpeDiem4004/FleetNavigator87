-- ====================================================================
-- SCRIPT COMPLETO PARA CORRIGIR TABELA OFICINA_MURICI_MANUTENCOES
-- ====================================================================
-- Este script resolve definitivamente o problema da coluna "placa"
-- e configura todos os campos necessários para o sistema de manutenção

-- 1. BACKUP DOS DADOS EXISTENTES (se houver)
-- ====================================================================
CREATE TABLE IF NOT EXISTS oficina_murici_manutencoes_backup AS 
SELECT * FROM oficina_murici_manutencoes 
WHERE EXISTS (SELECT 1 FROM oficina_murici_manutencoes LIMIT 1);

-- 2. REMOVER TABELA PROBLEMÁTICA
-- ====================================================================
DROP TABLE IF EXISTS oficina_murici_manutencoes CASCADE;

-- 3. RECRIAR TABELA COM ESTRUTURA COMPLETA E CORRETA
-- ====================================================================
CREATE TABLE oficina_murici_manutencoes (
    -- Campos principais
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
    
    -- Campos de controle de tempo
    data_hora_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_hora_fim TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Campos específicos para status "Aguardando Peça"
    peca_descricao TEXT,
    peca_valor DECIMAL(10,2),
    fornecedor_nome VARCHAR(200),
    fornecedor_telefone VARCHAR(20),
    prazo_entrega VARCHAR(100)
);

-- 4. RESTAURAR DADOS DO BACKUP (se existir)
-- ====================================================================
INSERT INTO oficina_murici_manutencoes (
    placa, km, prazo, descricao_manutencao, status, mecanico, 
    custo_total, observacoes, peças_utilizadas, data_hora_inicio, 
    data_hora_fim, created_at, updated_at
)
SELECT 
    placa, 
    COALESCE(km, 0), 
    prazo, 
    descricao_manutencao, 
    COALESCE(status, 'em_andamento'), 
    mecanico,
    COALESCE(custo_total, 0),
    observacoes,
    peças_utilizadas,
    COALESCE(data_hora_inicio, CURRENT_TIMESTAMP),
    data_hora_fim,
    COALESCE(created_at, CURRENT_TIMESTAMP),
    COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM oficina_murici_manutencoes_backup
WHERE EXISTS (SELECT 1 FROM oficina_murici_manutencoes_backup);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ====================================================================
CREATE INDEX idx_oficina_manutencoes_placa ON oficina_murici_manutencoes(placa);
CREATE INDEX idx_oficina_manutencoes_status ON oficina_murici_manutencoes(status);
CREATE INDEX idx_oficina_manutencoes_created_at ON oficina_murici_manutencoes(created_at);
CREATE INDEX idx_oficina_manutencoes_mecanico ON oficina_murici_manutencoes(mecanico);

-- 6. INSERIR DADOS DE EXEMPLO PARA TESTE
-- ====================================================================
INSERT INTO oficina_murici_manutencoes (
    placa, km, prazo, descricao_manutencao, status, mecanico, custo_total
) VALUES (
    'ABC-1234', 50000, '2024-12-31', 'Revisão geral do sistema', 'em_andamento', 'João Silva', 250.00
) ON CONFLICT DO NOTHING;

-- 7. LIMPAR TABELA DE BACKUP
-- ====================================================================
DROP TABLE IF EXISTS oficina_murici_manutencoes_backup;

-- 8. VERIFICAR SE TUDO ESTÁ FUNCIONANDO
-- ====================================================================
-- Teste básico de SELECT
SELECT 'TESTE SELECT' as teste, COUNT(*) as total_registros 
FROM oficina_murici_manutencoes;

-- Verificar estrutura da tabela
SELECT 'ESTRUTURA TABELA' as teste, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'oficina_murici_manutencoes' 
ORDER BY ordinal_position;

-- Teste de INSERT com campos "Aguardando Peça"
INSERT INTO oficina_murici_manutencoes (
    placa, km, descricao_manutencao, status, mecanico, 
    peca_descricao, peca_valor, fornecedor_nome, fornecedor_telefone, prazo_entrega
) VALUES (
    'TESTE-2024', 30000, 'Aguardando filtro de ar', 'aguardando_peca', 'Sistema',
    'Filtro de ar K&N', 150.00, 'AutoPeças Brasil', '(11) 9999-8888', '5 dias úteis'
) RETURNING id, placa, status, peca_descricao;

-- Teste final de SELECT com todos os campos
SELECT 'TESTE COMPLETO' as teste, id, placa, status, custo_total, peca_descricao, peca_valor
FROM oficina_murici_manutencoes 
WHERE placa = 'TESTE-2024';

-- Limpar registro de teste
DELETE FROM oficina_murici_manutencoes WHERE placa = 'TESTE-2024';

-- ====================================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- ====================================================================
-- A tabela oficina_murici_manutencoes está agora totalmente funcional
-- com todos os campos necessários para o sistema de manutenção,
-- incluindo os 5 campos específicos para status "Aguardando Peça":
-- - peca_descricao
-- - peca_valor  
-- - fornecedor_nome
-- - fornecedor_telefone
-- - prazo_entrega
-- ====================================================================