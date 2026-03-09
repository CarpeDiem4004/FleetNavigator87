-- ANÁLISE COMPLETA DO SISTEMA DE CARTÃO COMBUSTÍVEL
-- Baseado nas alterações realizadas e estruturas identificadas

-- ========================================
-- PROBLEMAS IDENTIFICADOS E SOLUÇÕES
-- ========================================

-- 1. PADRONIZAÇÃO DE COLUNAS ENTRE TABELAS
-- As tabelas solicitacoes_fuel_card e linehall_fuel_card_requests têm estruturas diferentes
-- Precisamos padronizar os nomes de colunas para as consultas UNION funcionarem

-- Colunas que existem em linehall_fuel_card_requests mas faltam em solicitacoes_fuel_card:
ALTER TABLE solicitacoes_fuel_card ADD COLUMN IF NOT EXISTS motorista_cpf VARCHAR(14);
ALTER TABLE solicitacoes_fuel_card ADD COLUMN IF NOT EXISTS veiculo_modelo VARCHAR(100);
ALTER TABLE solicitacoes_fuel_card ADD COLUMN IF NOT EXISTS rota_origem VARCHAR(255);
ALTER TABLE solicitacoes_fuel_card ADD COLUMN IF NOT EXISTS rota_destino VARCHAR(255);
ALTER TABLE solicitacoes_fuel_card ADD COLUMN IF NOT EXISTS horario_abastecimento VARCHAR(50);
ALTER TABLE solicitacoes_fuel_card ADD COLUMN IF NOT EXISTS telefone_motorista VARCHAR(20);
ALTER TABLE solicitacoes_fuel_card ADD COLUMN IF NOT EXISTS operador_aprovacao VARCHAR(100);

-- Colunas que existem em solicitacoes_fuel_card mas faltam em linehall_fuel_card_requests:
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS valor_solicitado DECIMAL(10,2) DEFAULT 150.00;
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS tipo_cartao VARCHAR(100);
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS atendido_por VARCHAR(100);
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS data_atendimento TIMESTAMP;
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS km INTEGER;
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(100);
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(100);
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS base VARCHAR(100);
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS id_rota VARCHAR(100);
ALTER TABLE linehall_fuel_card_requests ADD COLUMN IF NOT EXISTS origem_tipo VARCHAR(50) DEFAULT 'linehall';

-- 2. CRIAR TABELA DE CONFIGURAÇÃO DE CONSUMO DE VEÍCULOS (se não existir)
CREATE TABLE IF NOT EXISTS vehicle_fuel_consumption (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    average_consumption DECIMAL(5,2) NOT NULL DEFAULT 8.0, -- km/l
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir dados padrão de consumo se a tabela estiver vazia
INSERT INTO vehicle_fuel_consumption (vehicle_type, average_consumption)
SELECT * FROM (VALUES 
    ('fiorino', 10.0),
    ('van', 8.0),
    ('vuc', 7.0),
    ('toco', 6.0),
    ('truck', 5.0),
    ('cavalo_mecanico', 4.0),
    ('carreta', 3.5)
) AS v(vehicle_type, average_consumption)
WHERE NOT EXISTS (SELECT 1 FROM vehicle_fuel_consumption);

-- 3. CRIAR TABELA DE HISTÓRICO DE APROVAÇÕES
CREATE TABLE IF NOT EXISTS fuel_card_approvals (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('tradicional', 'linehall')),
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    aprovado_por VARCHAR(100),
    motivo_aprovacao TEXT,
    valor_aprovado DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. ATUALIZAR VALORES CALCULADOS BASEADO NO CONSUMO MÉDIO
-- Para solicitacoes_fuel_card
UPDATE solicitacoes_fuel_card s
SET valor_calculado = CASE 
    WHEN s.km > 0 THEN 
        ((s.km + 30) / COALESCE(v.consumo_medio_km_l, 8.0)) * 6.50
    ELSE 
        s.valor_solicitado
END
FROM vehicles v
WHERE s.placa = v.plate 
AND (s.valor_calculado = 0 OR s.valor_calculado IS NULL);

-- Para linehall_fuel_card_requests
UPDATE linehall_fuel_card_requests l
SET valor_calculado = CASE 
    WHEN l.km_total > 0 THEN 
        ((l.km_total + 30) / COALESCE(v.consumo_medio_km_l, 8.0)) * 6.50
    ELSE 
        150.00
END
FROM vehicles v
WHERE l.veiculo_placa = v.plate 
AND (l.valor_calculado = 0 OR l.valor_calculado IS NULL);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_placa ON linehall_fuel_card_requests(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_data ON linehall_fuel_card_requests(data_solicitacao);

-- 6. PADRONIZAR STATUS ENTRE AS TABELAS
-- Atualizar status para usar valores padronizados
UPDATE solicitacoes_fuel_card 
SET status = CASE 
    WHEN LOWER(status) LIKE '%pendente%' THEN 'Pendente'
    WHEN LOWER(status) LIKE '%aprovado%' OR LOWER(status) LIKE '%efetuada%' THEN 'Recarga Efetuada'
    WHEN LOWER(status) LIKE '%negado%' OR LOWER(status) LIKE '%rejeitado%' THEN 'Negado'
    WHEN LOWER(status) LIKE '%analise%' THEN 'Em Análise'
    ELSE 'Pendente'
END
WHERE status IS NOT NULL;

UPDATE linehall_fuel_card_requests 
SET status = CASE 
    WHEN LOWER(status) LIKE '%pendente%' THEN 'Pendente'
    WHEN LOWER(status) LIKE '%aprovado%' OR LOWER(status) LIKE '%efetuada%' THEN 'Recarga Efetuada'
    WHEN LOWER(status) LIKE '%negado%' OR LOWER(status) LIKE '%rejeitado%' THEN 'Negado'
    WHEN LOWER(status) LIKE '%analise%' THEN 'Em Análise'
    ELSE 'Pendente'
END
WHERE status IS NOT NULL;

-- 7. CRIAR VIEW UNIFICADA PARA CONSULTAS
CREATE OR REPLACE VIEW vw_fuel_card_requests_unified AS
SELECT 
    s.id::text as id,
    s.placa as veiculo_placa,
    s.motorista,
    s.motorista_cpf,
    s.veiculo_modelo,
    s.rota_origem,
    s.rota_destino,
    s.valor_solicitado,
    s.valor_calculado,
    s.km,
    s.km_veiculo,
    s.tipo_cartao,
    s.provedor_cartao,
    s.numero_cartao,
    s.horario_abastecimento,
    s.telefone_motorista,
    s.observacoes,
    s.status,
    s.data_solicitacao::date as data_solicitacao,
    s.data_solicitacao::time as horario_solicitacao,
    s.atendido_por as operador_aprovacao,
    s.data_atendimento,
    s.created_at,
    s.updated_at,
    s.base,
    s.id_rota,
    COALESCE(s.origem_tipo, 'tradicional') as origem_tipo
FROM solicitacoes_fuel_card s

UNION ALL

SELECT 
    ('LH' || l.id::text) as id,
    l.veiculo_placa,
    COALESCE(l.motorista, l.motorista_nome) as motorista,
    l.motorista_cpf,
    l.veiculo_modelo,
    l.rota_origem,
    l.rota_destino,
    COALESCE(l.valor_solicitado, 150.00) as valor_solicitado,
    l.valor_calculado,
    COALESCE(l.km, l.km_total) as km,
    l.km_veiculo,
    l.tipo_cartao,
    l.provedor_cartao,
    l.numero_cartao,
    l.horario_abastecimento,
    l.telefone_motorista,
    l.observacoes_operador as observacoes,
    l.status,
    l.data_solicitacao,
    l.horario_solicitacao,
    l.operador_aprovacao,
    l.data_atendimento,
    l.created_at,
    l.updated_at,
    l.base,
    l.id_rota,
    COALESCE(l.origem_tipo, 'linehall') as origem_tipo
FROM linehall_fuel_card_requests l;

-- 8. VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO CONCLUÍDA - Estruturas padronizadas' as resultado;

-- Mostrar contagem de registros por tipo
SELECT 
    origem_tipo,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'Recarga Efetuada' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'Negado' THEN 1 END) as negados
FROM vw_fuel_card_requests_unified 
GROUP BY origem_tipo;