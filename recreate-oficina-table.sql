-- Script para recriar a tabela oficina_murici_manutencoes com todas as colunas necessárias
-- Primeiro, vamos fazer backup dos dados existentes

-- 1. Criar tabela temporária com os dados existentes (se houver)
CREATE TABLE IF NOT EXISTS oficina_murici_manutencoes_backup AS 
SELECT * FROM oficina_murici_manutencoes;

-- 2. Dropar a tabela atual
DROP TABLE IF EXISTS oficina_murici_manutencoes CASCADE;

-- 3. Recriar a tabela com estrutura completa
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
    -- Campos específicos para status "Aguardando Peça"
    peca_descricao TEXT,
    peca_valor DECIMAL(10,2),
    fornecedor_nome VARCHAR(200),
    fornecedor_telefone VARCHAR(20),
    prazo_entrega VARCHAR(100)
);

-- 4. Restaurar dados da tabela backup (se existir dados)
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

-- 5. Limpar tabela de backup
DROP TABLE IF EXISTS oficina_murici_manutencoes_backup;

-- 6. Criar índices para melhor performance
CREATE INDEX idx_oficina_manutencoes_placa ON oficina_murici_manutencoes(placa);
CREATE INDEX idx_oficina_manutencoes_status ON oficina_murici_manutencoes(status);
CREATE INDEX idx_oficina_manutencoes_created_at ON oficina_murici_manutencoes(created_at);

-- 7. Inserir dados de exemplo para teste (opcional)
INSERT INTO oficina_murici_manutencoes (
    placa, km, prazo, descricao_manutencao, status, mecanico, custo_total
) VALUES (
    'ABC-1234', 50000, '2024-12-31', 'Revisão geral', 'em_andamento', 'João Silva', 250.00
) ON CONFLICT DO NOTHING;