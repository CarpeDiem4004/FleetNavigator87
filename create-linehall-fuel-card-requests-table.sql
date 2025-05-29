-- Criar tabela para solicitações de recarga de cartão combustível do Line Hall Shopee
CREATE TABLE IF NOT EXISTS linehall_fuel_card_requests (
  id SERIAL PRIMARY KEY,
  motorista_id INTEGER NOT NULL,
  motorista_nome VARCHAR(255) NOT NULL,
  motorista_cpf VARCHAR(14) NOT NULL,
  veiculo_placa VARCHAR(20) NOT NULL,
  veiculo_modelo VARCHAR(100),
  rota_origem VARCHAR(255),
  rota_destino VARCHAR(255),
  data_solicitacao DATE NOT NULL,
  horario_solicitacao TIME NOT NULL,
  km_total INTEGER,
  horario_abastecimento VARCHAR(20) CHECK (horario_abastecimento IN ('antes_17h', 'apos_18h')),
  telefone_motorista VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'processada')),
  observacoes_operador TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_motorista ON linehall_fuel_card_requests(motorista_id);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_data ON linehall_fuel_card_requests(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_created ON linehall_fuel_card_requests(created_at);

-- Comentários da tabela
COMMENT ON TABLE linehall_fuel_card_requests IS 'Tabela para solicitações de recarga de cartão combustível do Line Hall Shopee';
COMMENT ON COLUMN linehall_fuel_card_requests.motorista_id IS 'ID do motorista que fez a solicitação';
COMMENT ON COLUMN linehall_fuel_card_requests.horario_abastecimento IS 'Preferência de horário para abastecimento (antes_17h ou apos_18h)';
COMMENT ON COLUMN linehall_fuel_card_requests.status IS 'Status da solicitação (pendente, aprovada, rejeitada, processada)';