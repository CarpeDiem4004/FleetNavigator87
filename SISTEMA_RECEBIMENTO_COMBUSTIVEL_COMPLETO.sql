-- ========================================
-- SISTEMA COMPLETO DE RECEBIMENTO DE COMBUSTÍVEL
-- Recriação total do sistema de postos externos
-- ========================================

-- ETAPA 1: Limpar e recriar tabelas de recebimento
DROP TABLE IF EXISTS recebimentos_posto_abc_v2 CASCADE;
DROP TABLE IF EXISTS recebimentos_posto_campinas_v2 CASCADE;
DROP TABLE IF EXISTS recebimentos_posto_guarulhos_v2 CASCADE;
DROP TABLE IF EXISTS recebimentos_posto_osasco_v2 CASCADE;
DROP TABLE IF EXISTS recebimentos_posto_socorro_v2 CASCADE;
DROP TABLE IF EXISTS recebimentos_posto_sorocaba_v2 CASCADE;
DROP TABLE IF EXISTS recebimentos_posto_alair_v2 CASCADE;

-- ETAPA 2: Criar estrutura padrão para recebimentos
CREATE TABLE recebimentos_posto_abc_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(8,4),
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(100) NOT NULL,
    nome_operador VARCHAR(100) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    posto_origem VARCHAR(50) DEFAULT 'ABC_V2',
    tanque_numero INTEGER,
    densidade DECIMAL(6,4),
    temperatura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recebimentos_posto_campinas_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(8,4),
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(100) NOT NULL,
    nome_operador VARCHAR(100) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    posto_origem VARCHAR(50) DEFAULT 'CAMPINAS_V2',
    tanque_numero INTEGER,
    densidade DECIMAL(6,4),
    temperatura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recebimentos_posto_guarulhos_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(8,4),
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(100) NOT NULL,
    nome_operador VARCHAR(100) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    posto_origem VARCHAR(50) DEFAULT 'GUARULHOS_V2',
    tanque_numero INTEGER,
    densidade DECIMAL(6,4),
    temperatura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recebimentos_posto_osasco_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(8,4),
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(100) NOT NULL,
    nome_operador VARCHAR(100) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    posto_origem VARCHAR(50) DEFAULT 'OSASCO_V2',
    tanque_numero INTEGER,
    densidade DECIMAL(6,4),
    temperatura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recebimentos_posto_socorro_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(8,4),
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(100) NOT NULL,
    nome_operador VARCHAR(100) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    posto_origem VARCHAR(50) DEFAULT 'SOCORRO_V2',
    tanque_numero INTEGER,
    densidade DECIMAL(6,4),
    temperatura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recebimentos_posto_sorocaba_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(8,4),
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(100) NOT NULL,
    nome_operador VARCHAR(100) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    posto_origem VARCHAR(50) DEFAULT 'SOROCABA_V2',
    tanque_numero INTEGER,
    densidade DECIMAL(6,4),
    temperatura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recebimentos_posto_alair_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(8,4),
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(100) NOT NULL,
    nome_operador VARCHAR(100) NOT NULL,
    numero_nota_fiscal VARCHAR(50),
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    posto_origem VARCHAR(50) DEFAULT 'ALAIR_V2',
    tanque_numero INTEGER,
    densidade DECIMAL(6,4),
    temperatura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ETAPA 3: Criar índices para performance
CREATE INDEX idx_recebimentos_abc_data ON recebimentos_posto_abc_v2(data_recebimento);
CREATE INDEX idx_recebimentos_abc_produto ON recebimentos_posto_abc_v2(tipo_produto);
CREATE INDEX idx_recebimentos_abc_operador ON recebimentos_posto_abc_v2(nome_operador);

CREATE INDEX idx_recebimentos_campinas_data ON recebimentos_posto_campinas_v2(data_recebimento);
CREATE INDEX idx_recebimentos_campinas_produto ON recebimentos_posto_campinas_v2(tipo_produto);
CREATE INDEX idx_recebimentos_campinas_operador ON recebimentos_posto_campinas_v2(nome_operador);

CREATE INDEX idx_recebimentos_guarulhos_data ON recebimentos_posto_guarulhos_v2(data_recebimento);
CREATE INDEX idx_recebimentos_guarulhos_produto ON recebimentos_posto_guarulhos_v2(tipo_produto);
CREATE INDEX idx_recebimentos_guarulhos_operador ON recebimentos_posto_guarulhos_v2(nome_operador);

CREATE INDEX idx_recebimentos_osasco_data ON recebimentos_posto_osasco_v2(data_recebimento);
CREATE INDEX idx_recebimentos_osasco_produto ON recebimentos_posto_osasco_v2(tipo_produto);
CREATE INDEX idx_recebimentos_osasco_operador ON recebimentos_posto_osasco_v2(nome_operador);

CREATE INDEX idx_recebimentos_socorro_data ON recebimentos_posto_socorro_v2(data_recebimento);
CREATE INDEX idx_recebimentos_socorro_produto ON recebimentos_posto_socorro_v2(tipo_produto);
CREATE INDEX idx_recebimentos_socorro_operador ON recebimentos_posto_socorro_v2(nome_operador);

CREATE INDEX idx_recebimentos_sorocaba_data ON recebimentos_posto_sorocaba_v2(data_recebimento);
CREATE INDEX idx_recebimentos_sorocaba_produto ON recebimentos_posto_sorocaba_v2(tipo_produto);
CREATE INDEX idx_recebimentos_sorocaba_operador ON recebimentos_posto_sorocaba_v2(nome_operador);

CREATE INDEX idx_recebimentos_alair_data ON recebimentos_posto_alair_v2(data_recebimento);
CREATE INDEX idx_recebimentos_alair_produto ON recebimentos_posto_alair_v2(tipo_produto);
CREATE INDEX idx_recebimentos_alair_operador ON recebimentos_posto_alair_v2(nome_operador);

-- ETAPA 4: Criar view consolidada de todos os recebimentos
CREATE OR REPLACE VIEW vw_recebimentos_combustivel_consolidado AS
SELECT 
    id,
    tipo_produto,
    litros_recebidos,
    valor_litro,
    valor_total,
    nome_fornecedor,
    nome_operador,
    numero_nota_fiscal,
    data_recebimento,
    observacoes,
    status,
    posto_origem,
    tanque_numero,
    densidade,
    temperatura,
    created_at,
    updated_at
FROM (
    SELECT *, 'ABC_V2' as fonte FROM recebimentos_posto_abc_v2
    UNION ALL
    SELECT *, 'CAMPINAS_V2' as fonte FROM recebimentos_posto_campinas_v2  
    UNION ALL
    SELECT *, 'GUARULHOS_V2' as fonte FROM recebimentos_posto_guarulhos_v2
    UNION ALL
    SELECT *, 'OSASCO_V2' as fonte FROM recebimentos_posto_osasco_v2
    UNION ALL
    SELECT *, 'SOCORRO_V2' as fonte FROM recebimentos_posto_socorro_v2
    UNION ALL
    SELECT *, 'SOROCABA_V2' as fonte FROM recebimentos_posto_sorocaba_v2
    UNION ALL
    SELECT *, 'ALAIR_V2' as fonte FROM recebimentos_posto_alair_v2
) todos_recebimentos
ORDER BY data_recebimento DESC;

-- ETAPA 5: Criar triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas
CREATE TRIGGER update_recebimentos_abc_updated_at BEFORE UPDATE ON recebimentos_posto_abc_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recebimentos_campinas_updated_at BEFORE UPDATE ON recebimentos_posto_campinas_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recebimentos_guarulhos_updated_at BEFORE UPDATE ON recebimentos_posto_guarulhos_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recebimentos_osasco_updated_at BEFORE UPDATE ON recebimentos_posto_osasco_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recebimentos_socorro_updated_at BEFORE UPDATE ON recebimentos_posto_socorro_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recebimentos_sorocaba_updated_at BEFORE UPDATE ON recebimentos_posto_sorocaba_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recebimentos_alair_updated_at BEFORE UPDATE ON recebimentos_posto_alair_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ETAPA 6: Inserir dados de teste para validação
INSERT INTO recebimentos_posto_abc_v2 (tipo_produto, litros_recebidos, valor_litro, valor_total, nome_fornecedor, nome_operador, numero_nota_fiscal, observacoes, tanque_numero) VALUES
('Gasolina Comum', 5000.00, 4.25, 21250.00, 'Petrobras Distribuidora', 'João Silva', 'NF-ABC-001', 'Recebimento normal - tanque limpo', 1);

INSERT INTO recebimentos_posto_campinas_v2 (tipo_produto, litros_recebidos, valor_litro, valor_total, nome_fornecedor, nome_operador, numero_nota_fiscal, observacoes, tanque_numero) VALUES
('Diesel S10', 3000.00, 5.15, 15450.00, 'Shell Brasil', 'Maria Santos', 'NF-CAM-001', 'Recebimento conforme programação', 2);

-- ETAPA 7: Criar função para estatísticas de recebimento
CREATE OR REPLACE FUNCTION get_estatisticas_recebimento(posto_nome VARCHAR DEFAULT NULL)
RETURNS TABLE(
    total_recebimentos BIGINT,
    total_litros DECIMAL,
    total_valor DECIMAL,
    ultimo_recebimento TIMESTAMP,
    produtos_tipos TEXT[]
) AS $$
BEGIN
    IF posto_nome IS NULL THEN
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT,
            SUM(litros_recebidos),
            SUM(valor_total),
            MAX(data_recebimento),
            ARRAY_AGG(DISTINCT tipo_produto)
        FROM vw_recebimentos_combustivel_consolidado
        WHERE status = 'ativo';
    ELSE
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT,
            SUM(litros_recebidos),
            SUM(valor_total),
            MAX(data_recebimento),
            ARRAY_AGG(DISTINCT tipo_produto)
        FROM vw_recebimentos_combustivel_consolidado
        WHERE posto_origem = posto_nome AND status = 'ativo';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ETAPA 8: Confirmar criação do sistema
SELECT 
    'SISTEMA_RECEBIMENTO_COMBUSTIVEL_CRIADO' as status,
    CURRENT_TIMESTAMP as criado_em,
    'Sistema completo de recebimento de combustível recriado com sucesso' as mensagem;

-- Mostrar estatísticas iniciais
SELECT * FROM get_estatisticas_recebimento();

-- Listar todas as tabelas criadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas
FROM information_schema.tables t
WHERE table_name LIKE 'recebimentos_posto_%'
ORDER BY table_name;