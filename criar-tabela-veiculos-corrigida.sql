-- Script corrigido para criar a tabela veiculos com estrutura completa
-- Este script funciona com PostgreSQL e inclui todas as colunas necessárias

CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(100),
    marca VARCHAR(50),
    ano INTEGER,
    tipo VARCHAR(50),
    base_id INTEGER,
    status VARCHAR(20) DEFAULT 'ativo',
    km_atual INTEGER DEFAULT 0,
    ultima_manutencao TIMESTAMP WITH TIME ZONE,
    proxima_manutencao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    plate VARCHAR(10),
    make VARCHAR(50),
    year INTEGER,
    fuel_type VARCHAR(20) DEFAULT 'Diesel',
    media_consumo_combustivel NUMERIC(5,2),
    model VARCHAR(100),
    cartao_abastecimento TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_base_id ON veiculos(base_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_cartao_abastecimento ON veiculos(cartao_abastecimento);

-- Adicionar constraint de chave estrangeira para base_id (se a tabela bases existir)
-- ALTER TABLE veiculos ADD CONSTRAINT fk_veiculos_base_id 
-- FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL;

-- Comentários para documentação
COMMENT ON TABLE veiculos IS 'Tabela de veículos do sistema de gestão de frotas';
COMMENT ON COLUMN veiculos.placa IS 'Placa do veículo (chave única)';
COMMENT ON COLUMN veiculos.cartao_abastecimento IS 'Número do cartão de abastecimento do veículo';
COMMENT ON COLUMN veiculos.base_id IS 'ID da base à qual o veículo pertence';
COMMENT ON COLUMN veiculos.status IS 'Status do veículo (ativo, inativo, manutenção, etc.)';
COMMENT ON COLUMN veiculos.media_consumo_combustivel IS 'Média de consumo de combustível em km/l';

-- Verificar se a tabela foi criada corretamente
SELECT 'Tabela veiculos criada com sucesso!' as resultado;