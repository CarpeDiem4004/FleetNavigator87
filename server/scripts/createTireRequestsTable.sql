-- Criação da tabela para solicitações de pneus
CREATE TABLE IF NOT EXISTS solicitacoes_pneus (
  id SERIAL PRIMARY KEY,
  base_id INTEGER NOT NULL,
  base_nome VARCHAR(100) NOT NULL,
  usuario_id INTEGER NOT NULL,
  usuario_nome VARCHAR(100) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  medida VARCHAR(50) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  motivo TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  data_solicitacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_aprovacao TIMESTAMP,
  aprovador_id INTEGER,
  aprovador_nome VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índice para pesquisas por base
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_base_id ON solicitacoes_pneus(base_id);

-- Índice para pesquisas por status
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_status ON solicitacoes_pneus(status);

-- Comentários da tabela
COMMENT ON TABLE solicitacoes_pneus IS 'Registra solicitações de compra ou transferência de pneus';
COMMENT ON COLUMN solicitacoes_pneus.base_id IS 'ID da base que está solicitando';
COMMENT ON COLUMN solicitacoes_pneus.base_nome IS 'Nome da base que está solicitando';
COMMENT ON COLUMN solicitacoes_pneus.usuario_id IS 'ID do usuário que fez a solicitação';
COMMENT ON COLUMN solicitacoes_pneus.usuario_nome IS 'Nome do usuário que fez a solicitação';
COMMENT ON COLUMN solicitacoes_pneus.marca IS 'Marca do pneu solicitado';
COMMENT ON COLUMN solicitacoes_pneus.modelo IS 'Modelo do pneu solicitado';
COMMENT ON COLUMN solicitacoes_pneus.medida IS 'Medida do pneu solicitado';
COMMENT ON COLUMN solicitacoes_pneus.tipo IS 'Tipo do pneu (direção, tração, etc.)';
COMMENT ON COLUMN solicitacoes_pneus.quantidade IS 'Quantidade de pneus solicitados';
COMMENT ON COLUMN solicitacoes_pneus.motivo IS 'Motivo da solicitação';
COMMENT ON COLUMN solicitacoes_pneus.status IS 'Status da solicitação (pendente, aprovado, rejeitado)';
COMMENT ON COLUMN solicitacoes_pneus.data_solicitacao IS 'Data em que a solicitação foi feita';
COMMENT ON COLUMN solicitacoes_pneus.data_aprovacao IS 'Data em que a solicitação foi aprovada/rejeitada';
COMMENT ON COLUMN solicitacoes_pneus.aprovador_id IS 'ID do usuário que aprovou/rejeitou a solicitação';
COMMENT ON COLUMN solicitacoes_pneus.aprovador_nome IS 'Nome do usuário que aprovou/rejeitou a solicitação';
COMMENT ON COLUMN solicitacoes_pneus.observacoes IS 'Observações adicionais sobre a solicitação';