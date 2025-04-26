-- Script para criar tabela de sincronização no Supabase
-- Esta tabela serve como ponte entre o ambiente Replit e externo

-- Criação de enum para status de sincronização
CREATE TYPE IF NOT EXISTS sync_status AS ENUM (
  'pendente',
  'sincronizado',
  'erro',
  'ignorado'
);

-- Criação de enum para tipo de entidade
CREATE TYPE IF NOT EXISTS entity_type AS ENUM (
  'usuario',
  'veiculo',
  'base',
  'abastecimento',
  'manutencao',
  'pneu',
  'movimentacao',
  'posto',
  'tanque',
  'configuracao'
);

-- Criação de enum para direção de sincronização
CREATE TYPE IF NOT EXISTS sync_direction AS ENUM (
  'replit_para_externo',
  'externo_para_replit',
  'bidirecional'
);

-- Criação da tabela de sincronização
CREATE TABLE IF NOT EXISTS sync_control (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  status sync_status NOT NULL DEFAULT 'pendente',
  direction sync_direction NOT NULL DEFAULT 'bidirecional',
  replit_last_update TIMESTAMP WITH TIME ZONE,
  external_last_update TIMESTAMP WITH TIME ZONE,
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  next_sync_attempt TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_sync_control_entity ON sync_control(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_control_status ON sync_control(status);
CREATE INDEX IF NOT EXISTS idx_sync_control_next_sync ON sync_control(next_sync_attempt);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_sync_control_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sync_control_timestamp ON sync_control;
CREATE TRIGGER update_sync_control_timestamp
BEFORE UPDATE ON sync_control
FOR EACH ROW
EXECUTE PROCEDURE update_sync_control_timestamp();

-- Criação da tabela de configuração da sincronização
CREATE TABLE IF NOT EXISTS sync_config (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 60,
  max_retries INTEGER NOT NULL DEFAULT 3,
  priority INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_sync_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sync_config_timestamp ON sync_config;
CREATE TRIGGER update_sync_config_timestamp
BEFORE UPDATE ON sync_config
FOR EACH ROW
EXECUTE PROCEDURE update_sync_config_timestamp();

-- Inserir configurações padrão para sincronização de entidades
INSERT INTO sync_config (entity_type, is_enabled, sync_interval_minutes, max_retries, priority)
VALUES
  ('usuario', true, 60, 3, 10),
  ('veiculo', true, 120, 3, 8),
  ('base', true, 240, 3, 9),
  ('abastecimento', true, 30, 5, 7),
  ('manutencao', true, 60, 3, 6),
  ('pneu', true, 120, 3, 5),
  ('movimentacao', true, 30, 5, 7),
  ('posto', true, 180, 3, 8),
  ('tanque', true, 60, 3, 7),
  ('configuracao', true, 360, 3, 10)
ON CONFLICT (entity_type) DO NOTHING;

-- Criação da tabela de log de sincronização
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  sync_id INTEGER REFERENCES sync_control(id),
  entity_type entity_type NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  status sync_status NOT NULL,
  direction sync_direction NOT NULL,
  error_message TEXT,
  sync_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice para otimizar consultas no log
CREATE INDEX IF NOT EXISTS idx_sync_log_sync_id ON sync_log(sync_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity_type, entity_id);

-- Função para registrar logs de sincronização
CREATE OR REPLACE FUNCTION log_sync_event(
  p_sync_id INTEGER,
  p_entity_type entity_type,
  p_entity_id VARCHAR(50),
  p_status sync_status,
  p_direction sync_direction,
  p_error_message TEXT DEFAULT NULL,
  p_sync_details JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  log_id INTEGER;
BEGIN
  INSERT INTO sync_log (
    sync_id, entity_type, entity_id, status, 
    direction, error_message, sync_details
  ) VALUES (
    p_sync_id, p_entity_type, p_entity_id, p_status, 
    p_direction, p_error_message, p_sync_details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Criação de uma view para facilitar a visualização dos dados de sincronização
CREATE OR REPLACE VIEW sync_status_view AS
SELECT
  sc.id,
  sc.entity_type,
  sc.entity_id,
  sc.status,
  sc.direction,
  sc.replit_last_update,
  sc.external_last_update,
  sc.last_sync_attempt,
  sc.next_sync_attempt,
  sc.retry_count,
  sc.error_message,
  cfg.sync_interval_minutes,
  cfg.max_retries,
  cfg.priority,
  cfg.is_enabled,
  CASE 
    WHEN sc.status = 'pendente' AND sc.next_sync_attempt <= NOW() AND cfg.is_enabled THEN true 
    ELSE false 
  END AS ready_for_sync
FROM
  sync_control sc
JOIN
  sync_config cfg ON sc.entity_type = cfg.entity_type
ORDER BY
  cfg.priority DESC,
  sc.next_sync_attempt ASC;

-- Comentário explicativo
COMMENT ON TABLE sync_control IS 'Tabela de controle de sincronização entre ambiente Replit e externo';
COMMENT ON TABLE sync_config IS 'Configurações de sincronização para diferentes tipos de entidades';
COMMENT ON TABLE sync_log IS 'Registro de eventos de sincronização para auditoria';

-- Término do script