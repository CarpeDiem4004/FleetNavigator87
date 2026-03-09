-- Script completo para criar todas as tabelas do sistema de solicitações de pneus
-- Este script cria a tabela principal e as tabelas específicas para cada base

-- 1. Criação da tabela principal de solicitações de pneus (caso ainda não exista)
CREATE TABLE IF NOT EXISTS solicitacoes_pneus (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- 2. Criação da tabela específica para a base Campinas
CREATE TABLE IF NOT EXISTS campinas_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- 3. Criação da tabela específica para outras bases (caso necessário)
-- Base Socorro
CREATE TABLE IF NOT EXISTS socorro_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- Base Osasco
CREATE TABLE IF NOT EXISTS osasco_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- Base ABC
CREATE TABLE IF NOT EXISTS abc_tire_requests (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    medida VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    aprovador_id INTEGER,
    aprovador_nome VARCHAR(100),
    observacoes_aprovacao TEXT,
    data_previsao DATE,
    placa_veiculo VARCHAR(10),
    km_veiculo INTEGER
);

-- 4. Verificação das colunas e adição em todas as tabelas caso necessário
-- Usar ALTER TABLE para garantir que todas as tabelas tenham as mesmas colunas
DO $$
DECLARE
    tables TEXT[] := ARRAY['solicitacoes_pneus', 'campinas_tire_requests', 'socorro_tire_requests', 'osasco_tire_requests', 'abc_tire_requests'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        -- Verificar se a tabela existe
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = table_name) THEN
            -- Adicionar colunas se não existirem
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = table_name AND column_name = 'placa_veiculo') THEN
                EXECUTE 'ALTER TABLE ' || table_name || ' ADD COLUMN placa_veiculo VARCHAR(10)';
                RAISE NOTICE 'Added placa_veiculo column to %', table_name;
            END IF;
            
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = table_name AND column_name = 'km_veiculo') THEN
                EXECUTE 'ALTER TABLE ' || table_name || ' ADD COLUMN km_veiculo INTEGER';
                RAISE NOTICE 'Added km_veiculo column to %', table_name;
            END IF;
            
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = table_name AND column_name = 'data_previsao') THEN
                EXECUTE 'ALTER TABLE ' || table_name || ' ADD COLUMN data_previsao DATE';
                RAISE NOTICE 'Added data_previsao column to %', table_name;
            END IF;
            
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = table_name AND column_name = 'observacoes_aprovacao') THEN
                EXECUTE 'ALTER TABLE ' || table_name || ' ADD COLUMN observacoes_aprovacao TEXT';
                RAISE NOTICE 'Added observacoes_aprovacao column to %', table_name;
            END IF;
        ELSE
            RAISE NOTICE 'Table % does not exist', table_name;
        END IF;
    END LOOP;
END $$;