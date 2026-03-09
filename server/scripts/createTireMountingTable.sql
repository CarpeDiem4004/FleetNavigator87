-- Criação da tabela montagem_pneus
CREATE TABLE IF NOT EXISTS montagem_pneus (
  id SERIAL PRIMARY KEY,
  pneu_id INTEGER NOT NULL,
  placa_veiculo VARCHAR(20) NOT NULL,
  km_instalacao INTEGER NOT NULL,
  km_remocao INTEGER,
  distancia_percorrida INTEGER,
  data_instalacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_remocao TIMESTAMP,
  motivo_remocao TEXT,
  posicao VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (pneu_id) REFERENCES pneus(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_montagem_pneus_pneu_id ON montagem_pneus(pneu_id);
CREATE INDEX IF NOT EXISTS idx_montagem_pneus_placa_veiculo ON montagem_pneus(placa_veiculo);

-- Comentários da tabela
COMMENT ON TABLE montagem_pneus IS 'Registra montagem e remoção de pneus em veículos';
COMMENT ON COLUMN montagem_pneus.pneu_id IS 'ID do pneu montado (referência à tabela pneus)';
COMMENT ON COLUMN montagem_pneus.placa_veiculo IS 'Placa do veículo onde o pneu foi montado';
COMMENT ON COLUMN montagem_pneus.km_instalacao IS 'Quilometragem do veículo no momento da instalação';
COMMENT ON COLUMN montagem_pneus.km_remocao IS 'Quilometragem do veículo no momento da remoção, se aplicável';
COMMENT ON COLUMN montagem_pneus.distancia_percorrida IS 'Distância percorrida pelo pneu (km_remocao - km_instalacao)';
COMMENT ON COLUMN montagem_pneus.data_instalacao IS 'Data em que o pneu foi instalado';
COMMENT ON COLUMN montagem_pneus.data_remocao IS 'Data em que o pneu foi removido, se aplicável';
COMMENT ON COLUMN montagem_pneus.motivo_remocao IS 'Motivo da remoção do pneu, se aplicável';
COMMENT ON COLUMN montagem_pneus.posicao IS 'Posição do pneu no veículo';