-- Criação da tabela para histórico de montagem de pneus
CREATE TABLE IF NOT EXISTS montagem_pneus (
  id SERIAL PRIMARY KEY,
  pneu_id INTEGER NOT NULL,
  placa_veiculo VARCHAR(20) NOT NULL,
  km_instalacao INTEGER NOT NULL,
  km_remocao INTEGER,
  data_instalacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_remocao TIMESTAMP,
  motivo_remocao VARCHAR(255),
  posicao VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índice para pesquisas por pneu
CREATE INDEX IF NOT EXISTS idx_montagem_pneus_pneu_id ON montagem_pneus(pneu_id);

-- Índice para pesquisas por veículo
CREATE INDEX IF NOT EXISTS idx_montagem_pneus_placa_veiculo ON montagem_pneus(placa_veiculo);

-- Comentários da tabela
COMMENT ON TABLE montagem_pneus IS 'Registra o histórico de montagem e remoção de pneus em veículos';
COMMENT ON COLUMN montagem_pneus.pneu_id IS 'ID do pneu na tabela pneus';
COMMENT ON COLUMN montagem_pneus.placa_veiculo IS 'Placa do veículo onde o pneu foi montado';
COMMENT ON COLUMN montagem_pneus.km_instalacao IS 'Quilometragem do veículo no momento da instalação';
COMMENT ON COLUMN montagem_pneus.km_remocao IS 'Quilometragem do veículo no momento da remoção';
COMMENT ON COLUMN montagem_pneus.data_instalacao IS 'Data e hora da instalação do pneu';
COMMENT ON COLUMN montagem_pneus.data_remocao IS 'Data e hora da remoção do pneu';
COMMENT ON COLUMN montagem_pneus.motivo_remocao IS 'Motivo da remoção do pneu';
COMMENT ON COLUMN montagem_pneus.posicao IS 'Posição de montagem do pneu no veículo';
COMMENT ON COLUMN montagem_pneus.observacoes IS 'Observações adicionais sobre a montagem ou remoção';