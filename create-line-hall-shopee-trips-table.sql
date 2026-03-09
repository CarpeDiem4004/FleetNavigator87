-- Script para criar a tabela line_hall_shopee_trips completa
-- Inclui todos os campos necessários para o sistema de viagens do Line Hall Shopee

-- Primeiro, verificar se a tabela já existe e removê-la se necessário
DROP TABLE IF EXISTS line_hall_shopee_trips CASCADE;

-- Criar a tabela com todos os campos necessários
CREATE TABLE line_hall_shopee_trips (
    id SERIAL PRIMARY KEY,
    placa_cavalo VARCHAR(20) NOT NULL,
    placa_carreta_1 VARCHAR(20) NOT NULL,
    placa_carreta_2 VARCHAR(20),
    motorista_id INTEGER NOT NULL DEFAULT 0,
    motorista_nome VARCHAR(255) NOT NULL,
    local_carregamento VARCHAR(255) NOT NULL,
    local_descarregamento VARCHAR(255) NOT NULL,
    data_viagem DATE NOT NULL DEFAULT CURRENT_DATE,
    horario_carregamento TIME,
    status_viagem VARCHAR(50) NOT NULL DEFAULT 'Concluída',
    rota_selecionada VARCHAR(255),
    km_total DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX idx_line_hall_trips_placa_cavalo ON line_hall_shopee_trips(placa_cavalo);
CREATE INDEX idx_line_hall_trips_motorista ON line_hall_shopee_trips(motorista_nome);
CREATE INDEX idx_line_hall_trips_data_viagem ON line_hall_shopee_trips(data_viagem);
CREATE INDEX idx_line_hall_trips_status ON line_hall_shopee_trips(status_viagem);

-- Adicionar comentários para documentação
COMMENT ON TABLE line_hall_shopee_trips IS 'Tabela para registrar viagens do Line Hall Shopee';
COMMENT ON COLUMN line_hall_shopee_trips.placa_cavalo IS 'Placa do cavalo mecânico';
COMMENT ON COLUMN line_hall_shopee_trips.placa_carreta_1 IS 'Placa da primeira carreta (obrigatória)';
COMMENT ON COLUMN line_hall_shopee_trips.placa_carreta_2 IS 'Placa da segunda carreta (opcional)';
COMMENT ON COLUMN line_hall_shopee_trips.motorista_id IS 'ID do motorista no sistema';
COMMENT ON COLUMN line_hall_shopee_trips.motorista_nome IS 'Nome do motorista';
COMMENT ON COLUMN line_hall_shopee_trips.local_carregamento IS 'Local de carregamento/origem';
COMMENT ON COLUMN line_hall_shopee_trips.local_descarregamento IS 'Local de descarregamento/destino';
COMMENT ON COLUMN line_hall_shopee_trips.data_viagem IS 'Data da viagem';
COMMENT ON COLUMN line_hall_shopee_trips.horario_carregamento IS 'Horário de carregamento';
COMMENT ON COLUMN line_hall_shopee_trips.status_viagem IS 'Status da viagem (Concluída, No Show, Cancelada pelo Cliente)';
COMMENT ON COLUMN line_hall_shopee_trips.rota_selecionada IS 'ID da rota selecionada das rotas cadastradas';
COMMENT ON COLUMN line_hall_shopee_trips.km_total IS 'Quilometragem total da viagem';
COMMENT ON COLUMN line_hall_shopee_trips.observacoes IS 'Observações sobre a viagem';

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'line_hall_shopee_trips'
ORDER BY ordinal_position;

-- Mostrar contagem de registros (deve ser 0 para tabela nova)
SELECT COUNT(*) as total_registros FROM line_hall_shopee_trips;