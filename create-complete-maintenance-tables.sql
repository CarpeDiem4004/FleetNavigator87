-- ============================================================================
-- SCRIPT COMPLETO PARA CRIAÇÃO DAS TABELAS DE MANUTENÇÃO
-- Este script garante que todas as tabelas tenham a estrutura correta
-- ============================================================================

-- 1. Criar tabela bases se não existir
CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserir dados padrão de bases se não existirem
INSERT INTO bases (id, name, location) VALUES 
(1, 'Base São Paulo', 'São Paulo - SP'),
(2, 'Campinas', 'Campinas - SP'),
(3, 'Guarulhos', 'Guarulhos - SP')
ON CONFLICT (id) DO NOTHING;

-- 3. Criar tabela oficinas se não existir
CREATE TABLE IF NOT EXISTS oficinas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(255),
    responsavel VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo',
    tipo VARCHAR(50) DEFAULT 'parceira',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inserir dados padrão de oficinas se não existirem
INSERT INTO oficinas (id, cnpj, razao_social, nome_fantasia, status, tipo) VALUES 
(1, '12.345.678/0001-90', 'Oficina Mecânica São Paulo LTDA', 'Oficina SP', 'ativo', 'parceira'),
(2, '98.765.432/0001-10', 'Auto Center Rio de Janeiro LTDA', 'Auto Center RJ', 'ativo', 'parceira')
ON CONFLICT (cnpj) DO NOTHING;

-- 5. Criar tabela manutencao com TODAS as colunas necessárias
CREATE TABLE IF NOT EXISTS manutencao (
    id SERIAL PRIMARY KEY,
    veiculo_id INTEGER,
    placa VARCHAR(10) NOT NULL,
    tipo VARCHAR(100) NOT NULL DEFAULT 'preventiva',
    descricao TEXT,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_agendada TIMESTAMP,
    data_conclusao TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pendente',
    custo DECIMAL(10,2),
    oficina_id INTEGER,
    km_atual INTEGER,
    solicitante_id INTEGER,
    base_id INTEGER, -- COLUNA ESSENCIAL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prioridade VARCHAR(20) DEFAULT 'media',
    responsavel VARCHAR(255),
    observacoes TEXT
);

-- 6. Adicionar coluna base_id se não existir (para tabelas já criadas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manutencao' AND column_name = 'base_id'
    ) THEN
        ALTER TABLE manutencao ADD COLUMN base_id INTEGER;
    END IF;
END $$;

-- 7. Inserir dados de exemplo se a tabela estiver vazia
INSERT INTO manutencao (
    id, placa, tipo, descricao, status, prioridade, responsavel, 
    custo, oficina_id, base_id, data_solicitacao
) VALUES 
(1, 'ABC-1234', 'preventiva', 'Troca de óleo e filtros', 'pendente', 'media', 'João Silva', 250.00, 1, 1, NOW() - INTERVAL '2 days'),
(2, 'DEF-5678', 'corretiva', 'Reparo no sistema de freios', 'em_andamento', 'alta', 'Maria Santos', 800.00, 2, 2, NOW() - INTERVAL '1 day'),
(3, 'GHI-9012', 'preventiva', 'Revisão dos 10.000 km', 'concluida', 'media', 'Carlos Lima', 450.00, 1, 1, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 8. Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_manutencao_base_id ON manutencao(base_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_oficina_id ON manutencao(oficina_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_status ON manutencao(status);
CREATE INDEX IF NOT EXISTS idx_manutencao_data_solicitacao ON manutencao(data_solicitacao);

-- 9. Verificação final da estrutura
SELECT 
    'VERIFICAÇÃO ESTRUTURA MANUTENCAO' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'manutencao' 
ORDER BY ordinal_position;

-- 10. Teste das consultas principais
SELECT 
    'TESTE CONSULTA BÁSICA' as teste,
    id, placa, base_id, status
FROM manutencao 
ORDER BY id;

-- 11. Teste do JOIN completo
SELECT 
    'TESTE JOIN COMPLETO' as teste,
    m.id,
    m.placa,
    m.descricao,
    m.status,
    m.prioridade,
    o.razao_social as oficina_nome,
    b.name as base_nome
FROM manutencao m
LEFT JOIN oficinas o ON m.oficina_id = o.id
LEFT JOIN bases b ON m.base_id = b.id
ORDER BY m.data_solicitacao DESC;

-- 12. Estatísticas finais
SELECT 
    'ESTATÍSTICAS DO SISTEMA' as info,
    (SELECT COUNT(*) FROM manutencao) as total_manutencoes,
    (SELECT COUNT(*) FROM manutencao WHERE base_id IS NOT NULL) as manutencoes_com_base,
    (SELECT COUNT(*) FROM oficinas WHERE status = 'ativo') as oficinas_ativas,
    (SELECT COUNT(*) FROM bases) as total_bases;