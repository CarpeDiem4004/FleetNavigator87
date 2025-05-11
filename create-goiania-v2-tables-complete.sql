-- Script para criar a nova base Goiânia clonando a estrutura da base Campinas
-- Autor: Sistema Murici OnFleet
-- Data: 11/05/2025

-- 1. Criar tabela de abastecimentos para Goiânia
CREATE TABLE IF NOT EXISTS abastecimentos_posto_goiania_v2 (
    id SERIAL PRIMARY KEY,
    placa VARCHAR,
    km_atual INTEGER,
    hodometro_atual INTEGER,
    tipo_combustivel VARCHAR,
    litros NUMERIC,
    quantidade_litros NUMERIC,
    motorista VARCHAR,
    motorista_rg VARCHAR,
    operador VARCHAR,
    valor_litro NUMERIC,
    valor_total NUMERIC,
    tipo_veiculo VARCHAR,
    observacoes TEXT,
    lavagem BOOLEAN DEFAULT FALSE,
    tipo_lavagem VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    projeto VARCHAR
);

-- 2. Criar tabela de movimentações de pátio para Goiânia
CREATE TABLE IF NOT EXISTS movimentacoes_patio_goiania_v2 (
    id SERIAL PRIMARY KEY,
    placa VARCHAR NOT NULL,
    tipo_veiculo VARCHAR,
    tipo_movimentacao VARCHAR NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    km NUMERIC,
    motorista VARCHAR,
    origem VARCHAR,
    destino VARCHAR,
    carga VARCHAR,
    observacoes TEXT,
    usuario_operador VARCHAR,
    tempo_patio INTERVAL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 3. Criar tabela de recebimentos de combustível para Goiânia
CREATE TABLE IF NOT EXISTS recebimentos_posto_goiania_v2 (
    id SERIAL PRIMARY KEY,
    tipo_combustivel VARCHAR,
    quantidade_litros NUMERIC,
    valor_litro NUMERIC,
    valor_total NUMERIC,
    nota_fiscal VARCHAR,
    fornecedor VARCHAR,
    data_recebimento TIMESTAMP,
    usuario_operador VARCHAR,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 4. Criar tabela de solicitações de orçamento para Goiânia
CREATE TABLE IF NOT EXISTS goiania_budget_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pendente',
    requester_id INTEGER NOT NULL,
    requester_name VARCHAR NOT NULL,
    estimated_value NUMERIC NOT NULL,
    department VARCHAR NOT NULL,
    approved_value NUMERIC,
    approved_by VARCHAR,
    approved_at TIMESTAMPTZ,
    comments TEXT,
    budget_file_url TEXT,
    budget_file_name VARCHAR,
    invoice_file_url TEXT,
    invoice_file_name VARCHAR,
    pending_invoice BOOLEAN DEFAULT FALSE,
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    base_name VARCHAR DEFAULT 'Base Goiânia',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar tabela de despesas para Goiânia
CREATE TABLE IF NOT EXISTS goiania_expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR NOT NULL,
    description TEXT,
    payment_method VARCHAR,
    status VARCHAR DEFAULT 'registrado',
    receipt_url TEXT,
    created_by INTEGER NOT NULL,
    created_by_name VARCHAR NOT NULL,
    department VARCHAR,
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    base_name VARCHAR DEFAULT 'Base Goiânia',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Criar tabela de solicitações de manutenção para Goiânia
CREATE TABLE IF NOT EXISTS goiania_fleet_maintenance (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    vehicle_plate VARCHAR NOT NULL,
    priority VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'aberto',
    requester_id INTEGER NOT NULL,
    requester_name VARCHAR NOT NULL,
    assigned_to_id INTEGER,
    assigned_to_name VARCHAR,
    estimated_cost NUMERIC,
    final_cost NUMERIC,
    maintenance_type VARCHAR NOT NULL,
    scheduled_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    workshop_id INTEGER,
    workshop_name VARCHAR,
    odometer_reading INTEGER,
    attachments_urls TEXT[],
    comments TEXT,
    maintenance_items TEXT[],
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    base_name VARCHAR DEFAULT 'Base Goiânia',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Criar tabela de solicitações de pneus para Goiânia
CREATE TABLE IF NOT EXISTS goiania_tire_requests (
    id SERIAL PRIMARY KEY,
    vehicle_plate VARCHAR NOT NULL,
    quantity INTEGER NOT NULL,
    tire_type VARCHAR NOT NULL,
    tire_size VARCHAR NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pendente',
    requester_id INTEGER NOT NULL,
    requester_name VARCHAR NOT NULL,
    approver_id INTEGER,
    approver_name VARCHAR,
    request_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    comments TEXT,
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    base_name VARCHAR DEFAULT 'Base Goiânia',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Criar tabelas estatísticas para Goiânia
CREATE TABLE IF NOT EXISTS goiania_budget_stats (
    id SERIAL PRIMARY KEY,
    total_requests INTEGER DEFAULT 0,
    approved_requests INTEGER DEFAULT 0,
    rejected_requests INTEGER DEFAULT 0,
    pending_requests INTEGER DEFAULT 0,
    total_approved_value NUMERIC DEFAULT 0,
    total_estimated_value NUMERIC DEFAULT 0,
    average_approval_time INTERVAL,
    current_month_requests INTEGER DEFAULT 0,
    current_month_approved_value NUMERIC DEFAULT 0,
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goiania_expenses_stats (
    id SERIAL PRIMARY KEY,
    total_expenses INTEGER DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    current_month_expenses INTEGER DEFAULT 0,
    current_month_amount NUMERIC DEFAULT 0,
    by_category JSONB,
    by_payment_method JSONB,
    by_department JSONB,
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goiania_maintenance_stats (
    id SERIAL PRIMARY KEY,
    total_requests INTEGER DEFAULT 0,
    open_requests INTEGER DEFAULT 0,
    in_progress_requests INTEGER DEFAULT 0,
    completed_requests INTEGER DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    current_month_requests INTEGER DEFAULT 0,
    current_month_cost NUMERIC DEFAULT 0,
    by_maintenance_type JSONB,
    by_vehicle JSONB,
    by_priority JSONB,
    average_completion_time INTERVAL,
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goiania_tire_stats (
    id SERIAL PRIMARY KEY,
    total_requests INTEGER DEFAULT 0,
    approved_requests INTEGER DEFAULT 0,
    rejected_requests INTEGER DEFAULT 0,
    pending_requests INTEGER DEFAULT 0,
    total_tires_requested INTEGER DEFAULT 0,
    total_tires_approved INTEGER DEFAULT 0,
    by_tire_type JSONB,
    by_tire_size JSONB,
    current_month_requests INTEGER DEFAULT 0,
    current_month_tires INTEGER DEFAULT 0,
    base_id INTEGER DEFAULT 10, -- ID 10 para a Base Goiânia
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Adicionar configuração de tanques para Goiânia
INSERT INTO configuracao_tanques (
    posto, 
    diesel_capacidade, 
    diesel_nivel, 
    diesel_valor_litro, 
    arla_capacidade, 
    arla_nivel, 
    arla_valor_litro, 
    created_at, 
    updated_at
) VALUES (
    'Goiania_v2', 
    15000, 
    10000, 
    6.39, 
    1000, 
    800, 
    10.5, 
    NOW(), 
    NOW()
) ON CONFLICT (posto) DO NOTHING;

-- 10. Criar views para a base Goiânia
CREATE OR REPLACE VIEW view_goiania_v2_status_tanques AS
SELECT
    posto,
    diesel_capacidade,
    diesel_nivel,
    (diesel_nivel / NULLIF(diesel_capacidade, 0) * 100)::NUMERIC(5,2) AS diesel_percentual,
    diesel_valor_litro,
    arla_capacidade,
    arla_nivel,
    (arla_nivel / NULLIF(arla_capacidade, 0) * 100)::NUMERIC(5,2) AS arla_percentual,
    arla_valor_litro,
    updated_at
FROM configuracao_tanques
WHERE posto = 'Goiania_v2';

-- 11. Adicionar a base Goiânia à tabela de bases
INSERT INTO bases (
    id, 
    name, 
    location, 
    basename,
    type, 
    active, 
    operation,
    has_maintenance,
    has_tires,
    requests_enabled,
    created_at
) VALUES (
    10, 
    'Base Goiânia', 
    'Goiânia, GO',
    'Goiânia',
    'operational', 
    TRUE, 
    'Goiânia',
    TRUE,
    TRUE,
    TRUE,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 12. Criar views adicionais para análise de dados
CREATE OR REPLACE VIEW abastecimentos_posto_goiania_v2_ultimos AS
SELECT *
FROM abastecimentos_posto_goiania_v2
ORDER BY created_at DESC
LIMIT 10;

CREATE OR REPLACE VIEW abastecimentos_posto_goiania_v2_consumo_por_veiculo AS
SELECT
    placa,
    COUNT(*) as total_abastecimentos,
    SUM(litros) as total_litros,
    SUM(valor_total) as total_valor,
    MAX(created_at) as ultimo_abastecimento
FROM abastecimentos_posto_goiania_v2
GROUP BY placa
ORDER BY total_litros DESC;

CREATE OR REPLACE VIEW abastecimentos_posto_goiania_v2_estatisticas_mensais AS
SELECT
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as total_abastecimentos,
    SUM(litros) as total_litros,
    SUM(valor_total) as total_valor,
    COUNT(DISTINCT placa) as total_veiculos
FROM abastecimentos_posto_goiania_v2
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

CREATE OR REPLACE VIEW abastecimentos_posto_goiania_v2_comparativo_combustiveis AS
SELECT
    tipo_combustivel,
    COUNT(*) as total_abastecimentos,
    SUM(litros) as total_litros,
    SUM(valor_total) as total_valor,
    AVG(valor_litro) as preco_medio_litro
FROM abastecimentos_posto_goiania_v2
GROUP BY tipo_combustivel;

CREATE OR REPLACE VIEW abastecimentos_posto_goiania_v2_consolidado AS
SELECT
    COUNT(*) as total_abastecimentos,
    SUM(litros) as total_litros,
    SUM(valor_total) as total_valor,
    COUNT(DISTINCT placa) as total_veiculos,
    COUNT(DISTINCT motorista) as total_motoristas,
    MIN(created_at) as primeiro_abastecimento,
    MAX(created_at) as ultimo_abastecimento
FROM abastecimentos_posto_goiania_v2;

-- 13. Atualizar a view de histórico consolidado para incluir Goiânia
DROP VIEW IF EXISTS historico_consolidado_abastecimentos;
CREATE OR REPLACE VIEW historico_consolidado_abastecimentos AS
SELECT 
    id, 
    placa, 
    km_atual, 
    tipo_combustivel, 
    litros, 
    motorista AS nome_motorista, 
    operador AS nome_operador, 
    valor_litro, 
    valor_total, 
    COALESCE(projeto, '') AS project, 
    'campinas_v2' AS posto, 
    created_at
FROM 
    abastecimentos_posto_campinas_v2
UNION ALL
SELECT 
    id, 
    placa, 
    km_atual, 
    tipo_combustivel, 
    litros, 
    motorista AS nome_motorista, 
    operador AS nome_operador, 
    valor_litro, 
    valor_total, 
    COALESCE(projeto, '') AS project, 
    'osasco_v2' AS posto, 
    created_at
FROM 
    abastecimentos_posto_osasco_v2
UNION ALL
SELECT 
    id, 
    placa, 
    km_atual, 
    tipo_combustivel, 
    litros, 
    motorista AS nome_motorista, 
    operador AS nome_operador, 
    valor_litro, 
    valor_total, 
    COALESCE(projeto, '') AS project, 
    'alair_v2' AS posto, 
    created_at
FROM 
    abastecimentos_posto_alair_v2
UNION ALL
SELECT 
    id, 
    placa, 
    km_atual, 
    tipo_combustivel, 
    litros, 
    motorista AS nome_motorista, 
    operador AS nome_operador, 
    valor_litro, 
    valor_total, 
    COALESCE(projeto, '') AS project, 
    'abc_v2' AS posto, 
    created_at
FROM 
    abastecimentos_posto_abc_v2
UNION ALL
SELECT 
    id, 
    placa, 
    km_atual, 
    tipo_combustivel, 
    litros, 
    motorista AS nome_motorista, 
    operador AS nome_operador, 
    valor_litro, 
    valor_total, 
    COALESCE(projeto, '') AS project, 
    'socorro_v2' AS posto, 
    created_at
FROM 
    abastecimentos_posto_socorro_v2
UNION ALL
SELECT 
    id, 
    placa, 
    km_atual, 
    tipo_combustivel, 
    litros, 
    motorista AS nome_motorista, 
    operador AS nome_operador, 
    valor_litro, 
    valor_total, 
    COALESCE(projeto, '') AS project, 
    'sorocaba_v2' AS posto, 
    created_at
FROM 
    abastecimentos_posto_sorocaba_v2
UNION ALL
SELECT 
    id, 
    placa, 
    km_atual, 
    tipo_combustivel, 
    litros, 
    motorista AS nome_motorista, 
    operador AS nome_operador, 
    valor_litro, 
    valor_total, 
    COALESCE(projeto, '') AS project, 
    'goiania_v2' AS posto, 
    created_at
FROM 
    abastecimentos_posto_goiania_v2;

-- Fim do script