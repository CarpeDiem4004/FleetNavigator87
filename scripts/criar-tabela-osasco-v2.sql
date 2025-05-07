-- Script para criação da tabela e views para o Posto Osasco V2
-- Baseado na mesma estrutura utilizada para Campinas V2 e Osasco

-- Verificação e criação da tabela de abastecimentos
CREATE TABLE IF NOT EXISTS abastecimentos_posto_osasco_v2 (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    km_atual INTEGER,
    tipo_combustivel VARCHAR(20) NOT NULL,
    litros DECIMAL(10, 2) NOT NULL,
    motorista VARCHAR(100) NOT NULL,
    motorista_rg VARCHAR(20),
    operador VARCHAR(100) NOT NULL,
    valor_litro DECIMAL(10, 3) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    tipo_veiculo VARCHAR(50),
    observacoes TEXT,
    lavagem BOOLEAN DEFAULT FALSE,
    tipo_lavagem VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificação e criação da tabela de configuração de tanques
CREATE TABLE IF NOT EXISTS configuracao_tanques_osasco_v2 (
    id SERIAL PRIMARY KEY,
    tanque VARCHAR(50) NOT NULL,
    capacidade_maxima DECIMAL(10, 2) NOT NULL,
    nivel_atual DECIMAL(10, 2) NOT NULL,
    tipo_combustivel VARCHAR(20) NOT NULL,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização das consultas
CREATE INDEX IF NOT EXISTS idx_abastecimentos_osasco_v2_placa ON abastecimentos_posto_osasco_v2(placa);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_osasco_v2_created_at ON abastecimentos_posto_osasco_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_osasco_v2_tipo_combustivel ON abastecimentos_posto_osasco_v2(tipo_combustivel);

-- View para consumo por veículo
CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_consumo_por_veiculo AS
SELECT 
    placa,
    COUNT(*) as total_abastecimentos,
    SUM(litros) as total_litros,
    SUM(valor_total) as total_valor,
    MAX(created_at) as ultimo_abastecimento,
    MIN(created_at) as primeiro_abastecimento
FROM abastecimentos_posto_osasco_v2
GROUP BY placa
ORDER BY total_litros DESC;

-- View para estatísticas mensais
CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_estatisticas_mensais AS
SELECT 
    EXTRACT(YEAR FROM created_at) as ano,
    EXTRACT(MONTH FROM created_at) as mes,
    COUNT(*) as total_abastecimentos,
    SUM(litros) as total_litros,
    SUM(valor_total) as total_valor,
    COUNT(DISTINCT placa) as total_veiculos,
    SUM(CASE WHEN tipo_combustivel = 'DIESEL' THEN litros ELSE 0 END) as total_diesel,
    SUM(CASE WHEN tipo_combustivel = 'ARLA' THEN litros ELSE 0 END) as total_arla,
    SUM(CASE WHEN lavagem = true THEN 1 ELSE 0 END) as total_lavagens
FROM abastecimentos_posto_osasco_v2
GROUP BY ano, mes
ORDER BY ano DESC, mes DESC;

-- View para comparativo de combustíveis
CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_comparativo_combustiveis AS
SELECT 
    tipo_combustivel,
    COUNT(*) as total_abastecimentos,
    SUM(litros) as total_litros,
    SUM(valor_total) as total_valor,
    AVG(valor_litro) as media_valor_litro,
    MAX(valor_litro) as max_valor_litro,
    MIN(valor_litro) as min_valor_litro
FROM abastecimentos_posto_osasco_v2
GROUP BY tipo_combustivel;

-- View para últimos abastecimentos
CREATE OR REPLACE VIEW abastecimentos_posto_osasco_v2_ultimos AS
SELECT 
    id,
    placa,
    km_atual as km,
    tipo_combustivel,
    litros as quantidade_litros,
    motorista as nome_motorista,
    motorista_rg as rg_motorista,
    operador as nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
    created_at
FROM abastecimentos_posto_osasco_v2
ORDER BY created_at DESC
LIMIT 50;

-- Função para atualizar timestamp de última atualização quando houver modificação nos tanques
CREATE OR REPLACE FUNCTION atualizar_timestamp_tanque_osasco_v2()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp
DROP TRIGGER IF EXISTS trigger_update_tanque_timestamp_osasco_v2 ON configuracao_tanques_osasco_v2;
CREATE TRIGGER trigger_update_tanque_timestamp_osasco_v2
BEFORE UPDATE ON configuracao_tanques_osasco_v2
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp_tanque_osasco_v2();

-- Inserção dos dados iniciais dos tanques se não existirem
INSERT INTO configuracao_tanques_osasco_v2 (tanque, capacidade_maxima, nivel_atual, tipo_combustivel)
SELECT 'Tanque Principal', 15000.00, 7500.00, 'DIESEL'
WHERE NOT EXISTS (
    SELECT 1 FROM configuracao_tanques_osasco_v2 WHERE tanque = 'Tanque Principal' AND tipo_combustivel = 'DIESEL'
);

INSERT INTO configuracao_tanques_osasco_v2 (tanque, capacidade_maxima, nivel_atual, tipo_combustivel)
SELECT 'Tanque ARLA', 5000.00, 2500.00, 'ARLA'
WHERE NOT EXISTS (
    SELECT 1 FROM configuracao_tanques_osasco_v2 WHERE tanque = 'Tanque ARLA' AND tipo_combustivel = 'ARLA'
);