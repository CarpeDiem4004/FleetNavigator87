-- Script para criar as tabelas de recebimento de combustível para todos os postos
-- Execute este script no Supabase SQL Editor

-- Tabela para recebimentos do posto Osasco V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(10,3) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(255) NOT NULL,
    numero_nota_fiscal VARCHAR(100) NOT NULL,
    data_recebimento DATE NOT NULL,
    nome_operador VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para recebimentos do posto ABC V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_abc_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(10,3) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(255) NOT NULL,
    numero_nota_fiscal VARCHAR(100) NOT NULL,
    data_recebimento DATE NOT NULL,
    nome_operador VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para recebimentos do posto Alair V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_alair_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(10,3) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(255) NOT NULL,
    numero_nota_fiscal VARCHAR(100) NOT NULL,
    data_recebimento DATE NOT NULL,
    nome_operador VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para recebimentos do posto Campinas V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_campinas_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(10,3) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(255) NOT NULL,
    numero_nota_fiscal VARCHAR(100) NOT NULL,
    data_recebimento DATE NOT NULL,
    nome_operador VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para recebimentos do posto Socorro V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_socorro_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(10,3) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(255) NOT NULL,
    numero_nota_fiscal VARCHAR(100) NOT NULL,
    data_recebimento DATE NOT NULL,
    nome_operador VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para recebimentos do posto Sorocaba V2
CREATE TABLE IF NOT EXISTS recebimentos_posto_sorocaba_v2 (
    id SERIAL PRIMARY KEY,
    tipo_produto VARCHAR(50) NOT NULL,
    litros_recebidos DECIMAL(10,2) NOT NULL,
    valor_litro DECIMAL(10,3) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    nome_fornecedor VARCHAR(255) NOT NULL,
    numero_nota_fiscal VARCHAR(100) NOT NULL,
    data_recebimento DATE NOT NULL,
    nome_operador VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criação de índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_recebimentos_osasco_v2_data ON recebimentos_posto_osasco_v2(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_recebimentos_osasco_v2_created ON recebimentos_posto_osasco_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_recebimentos_osasco_v2_tipo ON recebimentos_posto_osasco_v2(tipo_produto);

CREATE INDEX IF NOT EXISTS idx_recebimentos_abc_v2_data ON recebimentos_posto_abc_v2(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_recebimentos_abc_v2_created ON recebimentos_posto_abc_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_recebimentos_abc_v2_tipo ON recebimentos_posto_abc_v2(tipo_produto);

CREATE INDEX IF NOT EXISTS idx_recebimentos_alair_v2_data ON recebimentos_posto_alair_v2(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_recebimentos_alair_v2_created ON recebimentos_posto_alair_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_recebimentos_alair_v2_tipo ON recebimentos_posto_alair_v2(tipo_produto);

CREATE INDEX IF NOT EXISTS idx_recebimentos_campinas_v2_data ON recebimentos_posto_campinas_v2(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_recebimentos_campinas_v2_created ON recebimentos_posto_campinas_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_recebimentos_campinas_v2_tipo ON recebimentos_posto_campinas_v2(tipo_produto);

CREATE INDEX IF NOT EXISTS idx_recebimentos_socorro_v2_data ON recebimentos_posto_socorro_v2(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_recebimentos_socorro_v2_created ON recebimentos_posto_socorro_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_recebimentos_socorro_v2_tipo ON recebimentos_posto_socorro_v2(tipo_produto);

CREATE INDEX IF NOT EXISTS idx_recebimentos_sorocaba_v2_data ON recebimentos_posto_sorocaba_v2(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_recebimentos_sorocaba_v2_created ON recebimentos_posto_sorocaba_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_recebimentos_sorocaba_v2_tipo ON recebimentos_posto_sorocaba_v2(tipo_produto);

-- Comentários nas tabelas
COMMENT ON TABLE recebimentos_posto_osasco_v2 IS 'Registro de recebimentos de combustível no posto Osasco V2';
COMMENT ON TABLE recebimentos_posto_abc_v2 IS 'Registro de recebimentos de combustível no posto ABC V2';
COMMENT ON TABLE recebimentos_posto_alair_v2 IS 'Registro de recebimentos de combustível no posto Alair V2';
COMMENT ON TABLE recebimentos_posto_campinas_v2 IS 'Registro de recebimentos de combustível no posto Campinas V2';
COMMENT ON TABLE recebimentos_posto_socorro_v2 IS 'Registro de recebimentos de combustível no posto Socorro V2';
COMMENT ON TABLE recebimentos_posto_sorocaba_v2 IS 'Registro de recebimentos de combustível no posto Sorocaba V2';

-- Verificação das tabelas criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE 'recebimentos_posto_%_v2'
ORDER BY tablename;

-- Confirmação de sucesso
SELECT 'Todas as tabelas de recebimento foram criadas com sucesso!' as status;