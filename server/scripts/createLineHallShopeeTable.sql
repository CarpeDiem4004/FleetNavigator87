-- Criação da tabela line_hall_shopee
CREATE TABLE IF NOT EXISTS line_hall_shopee (
  id SERIAL PRIMARY KEY,
  placa_cavalo VARCHAR(20) NOT NULL,
  placa_carreta_1 VARCHAR(20) NOT NULL,
  placa_carreta_2 VARCHAR(20),
  motorista_id INTEGER NOT NULL,
  motorista_nome VARCHAR(100) NOT NULL,
  local_carregamento VARCHAR(255) NOT NULL,
  local_descarregamento VARCHAR(255) NOT NULL,
  horario_carregamento TIME,
  status_viagem VARCHAR(50) NOT NULL,
  data_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_line_hall_shopee_placa_cavalo ON line_hall_shopee(placa_cavalo);
CREATE INDEX IF NOT EXISTS idx_line_hall_shopee_motorista_id ON line_hall_shopee(motorista_id);
CREATE INDEX IF NOT EXISTS idx_line_hall_shopee_status_viagem ON line_hall_shopee(status_viagem);

-- Comentários da tabela
COMMENT ON TABLE line_hall_shopee IS 'Registra viagens do Line Hall Shopee';
COMMENT ON COLUMN line_hall_shopee.placa_cavalo IS 'Placa do cavalo mecânico';
COMMENT ON COLUMN line_hall_shopee.placa_carreta_1 IS 'Placa da primeira carreta';
COMMENT ON COLUMN line_hall_shopee.placa_carreta_2 IS 'Placa da segunda carreta (se houver)';
COMMENT ON COLUMN line_hall_shopee.motorista_id IS 'ID do motorista';
COMMENT ON COLUMN line_hall_shopee.motorista_nome IS 'Nome do motorista';
COMMENT ON COLUMN line_hall_shopee.local_carregamento IS 'Local de carregamento';
COMMENT ON COLUMN line_hall_shopee.local_descarregamento IS 'Local de descarregamento';
COMMENT ON COLUMN line_hall_shopee.horario_carregamento IS 'Horário de carregamento da carreta';
COMMENT ON COLUMN line_hall_shopee.status_viagem IS 'Status da viagem (Concluída, No Show, Cancelada pelo Cliente)';
COMMENT ON COLUMN line_hall_shopee.data_inicio IS 'Data de início da viagem';
COMMENT ON COLUMN line_hall_shopee.data_fim IS 'Data de finalização da viagem';
COMMENT ON COLUMN line_hall_shopee.observacoes IS 'Observações sobre a viagem';