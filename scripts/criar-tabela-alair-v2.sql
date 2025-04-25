-- Criação da tabela para o Posto Alair V2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_alair_v2 (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10),
    km_atual NUMERIC,
    tipo_combustivel VARCHAR(20),
    litros NUMERIC(10, 2),
    motorista VARCHAR(255),
    motorista_rg VARCHAR(20),
    operador VARCHAR(100),
    valor_litro NUMERIC(10, 3),
    valor_total NUMERIC(10, 2),
    tipo_veiculo VARCHAR(50),
    observacoes TEXT,
    lavagem BOOLEAN DEFAULT FALSE,
    tipo_lavagem VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_alair_v2_placa ON abastecimentos_posto_alair_v2(placa);
CREATE INDEX IF NOT EXISTS idx_alair_v2_created_at ON abastecimentos_posto_alair_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_alair_v2_motorista ON abastecimentos_posto_alair_v2(motorista);

-- Inserir registro de teste
INSERT INTO abastecimentos_posto_alair_v2 (placa, km_atual, tipo_combustivel, litros, motorista, motorista_rg, operador, valor_litro, valor_total, tipo_veiculo, observacoes)
VALUES ('ALA1234', 65000, 'DIESEL', 120.50, 'Pedro Motorista', '987123456', 'Operador Alair', 5.200, 626.60, 'Caminhão', 'Teste de abastecimento Alair V2');

-- Configurar tanque de combustível para Posto Alair V2
INSERT INTO configuracao_tanques (posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel, diesel_valor_litro, arla_valor_litro)
VALUES ('Alair_v2', '25000', '12500', '1500', '800', '5.20', '3.50')
ON CONFLICT (posto) DO UPDATE 
SET diesel_capacidade = '25000',
    diesel_nivel = '12500',
    arla_capacidade = '1500',
    arla_nivel = '800',
    diesel_valor_litro = '5.20',
    arla_valor_litro = '3.50',
    updated_at = CURRENT_TIMESTAMP;