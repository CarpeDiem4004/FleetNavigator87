-- Script para criar tabelas relacionadas a pneus no Supabase
-- Baseado na estrutura das tabelas locais do PostgreSQL

-- Tabela principal de pneus
CREATE TABLE IF NOT EXISTS pneus_completo (
  id SERIAL PRIMARY KEY,
  tire_number TEXT,
  change_date DATE,
  change_km INTEGER,
  status TEXT,
  codigo VARCHAR(50),
  marca VARCHAR(50),
  modelo VARCHAR(50),
  medida VARCHAR(50),
  aro VARCHAR(20),
  tipo VARCHAR(20),
  origem VARCHAR(20),
  data_aquisicao DATE,
  veiculo_placa VARCHAR(10),
  posicao VARCHAR(20),
  km_inicial INTEGER,
  km_atual INTEGER,
  profundidade_sulco NUMERIC,
  localizacao VARCHAR(50),
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de movimentações de pneus
CREATE TABLE IF NOT EXISTS movimentacao_pneu (
  id SERIAL PRIMARY KEY,
  id_pneu INTEGER NOT NULL,
  id_veiculo TEXT,
  tipo_movimentacao TEXT NOT NULL,
  km INTEGER NOT NULL,
  data TIMESTAMP NOT NULL,
  local TEXT,
  responsavel TEXT,
  possui_estepe BOOLEAN,
  motivo TEXT,
  distancia_percorrida INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de solicitações de pneus
CREATE TABLE IF NOT EXISTS solicitacoes_pneus (
  id SERIAL PRIMARY KEY,
  base_id INTEGER NOT NULL,
  base_nome VARCHAR(100) NOT NULL,
  usuario_id INTEGER NOT NULL,
  usuario_nome VARCHAR(100) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  medida VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  quantidade INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  data_solicitacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_aprovacao TIMESTAMP,
  aprovador_id INTEGER,
  aprovador_nome VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de montagem de pneus
CREATE TABLE IF NOT EXISTS montagem_pneus (
  id SERIAL PRIMARY KEY,
  pneu_id INTEGER NOT NULL,
  placa_veiculo VARCHAR(10) NOT NULL,
  km_instalacao INTEGER NOT NULL,
  km_remocao INTEGER,
  data_instalacao TIMESTAMP NOT NULL,
  data_remocao TIMESTAMP,
  motivo_remocao VARCHAR(100),
  posicao VARCHAR(20),
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  distancia_percorrida INTEGER
);

-- Tabela de atividades com pneus
CREATE TABLE IF NOT EXISTS pneus_atividades (
  id SERIAL PRIMARY KEY,
  pneu_id INTEGER NOT NULL,
  tipo_atividade VARCHAR(50) NOT NULL,
  data TIMESTAMP NOT NULL,
  responsavel VARCHAR(100),
  descricao TEXT,
  km_veiculo INTEGER,
  profundidade_sulco_antes NUMERIC,
  profundidade_sulco_depois NUMERIC,
  localizacao VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de modelos de pneus
CREATE TABLE IF NOT EXISTS modelos_pneu (
  id SERIAL PRIMARY KEY,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  medida VARCHAR(50) NOT NULL,
  aro VARCHAR(20),
  tipo VARCHAR(20),
  vida_util_km INTEGER,
  profundidade_sulco_nova NUMERIC,
  profundidade_sulco_minima NUMERIC,
  preco_medio NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pneus_completo_codigo ON pneus_completo(codigo);
CREATE INDEX IF NOT EXISTS idx_pneus_completo_placa ON pneus_completo(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_pneus_completo_status ON pneus_completo(status);
CREATE INDEX IF NOT EXISTS idx_pneus_completo_localizacao ON pneus_completo(localizacao);

CREATE INDEX IF NOT EXISTS idx_movimentacao_pneu_id_pneu ON movimentacao_pneu(id_pneu);
CREATE INDEX IF NOT EXISTS idx_movimentacao_pneu_tipo ON movimentacao_pneu(tipo_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacao_pneu_data ON movimentacao_pneu(data);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_base ON solicitacoes_pneus(base_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_status ON solicitacoes_pneus(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_pneus_data ON solicitacoes_pneus(data_solicitacao);

CREATE INDEX IF NOT EXISTS idx_montagem_pneus_pneu_id ON montagem_pneus(pneu_id);
CREATE INDEX IF NOT EXISTS idx_montagem_pneus_placa ON montagem_pneus(placa_veiculo);

-- Funções para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pneus_completo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_solicitacoes_pneus_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_montagem_pneus_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pneus_atividades_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_modelos_pneu_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps automaticamente
DROP TRIGGER IF EXISTS update_pneus_completo_timestamp ON pneus_completo;
CREATE TRIGGER update_pneus_completo_timestamp
BEFORE UPDATE ON pneus_completo
FOR EACH ROW
EXECUTE PROCEDURE update_pneus_completo_timestamp();

DROP TRIGGER IF EXISTS update_solicitacoes_pneus_timestamp ON solicitacoes_pneus;
CREATE TRIGGER update_solicitacoes_pneus_timestamp
BEFORE UPDATE ON solicitacoes_pneus
FOR EACH ROW
EXECUTE PROCEDURE update_solicitacoes_pneus_timestamp();

DROP TRIGGER IF EXISTS update_montagem_pneus_timestamp ON montagem_pneus;
CREATE TRIGGER update_montagem_pneus_timestamp
BEFORE UPDATE ON montagem_pneus
FOR EACH ROW
EXECUTE PROCEDURE update_montagem_pneus_timestamp();

DROP TRIGGER IF EXISTS update_pneus_atividades_timestamp ON pneus_atividades;
CREATE TRIGGER update_pneus_atividades_timestamp
BEFORE UPDATE ON pneus_atividades
FOR EACH ROW
EXECUTE PROCEDURE update_pneus_atividades_timestamp();

DROP TRIGGER IF EXISTS update_modelos_pneu_timestamp ON modelos_pneu;
CREATE TRIGGER update_modelos_pneu_timestamp
BEFORE UPDATE ON modelos_pneu
FOR EACH ROW
EXECUTE PROCEDURE update_modelos_pneu_timestamp();

-- View para facilitar a visualização do histórico de um pneu
CREATE OR REPLACE VIEW view_pneu_historico AS
SELECT 
  p.id AS pneu_id,
  p.codigo,
  p.marca,
  p.modelo,
  p.medida,
  p.status,
  p.origem,
  p.localizacao,
  mp.id AS movimentacao_id,
  mp.tipo_movimentacao,
  mp.km,
  mp.data,
  mp.local,
  mp.responsavel,
  mp.motivo,
  mp.distancia_percorrida
FROM pneus_completo p
LEFT JOIN movimentacao_pneu mp ON p.id = mp.id_pneu
ORDER BY p.id, mp.data DESC;

-- View para exibir pneus montados em veículos com informações detalhadas
CREATE OR REPLACE VIEW view_pneus_montados AS
SELECT 
  p.id AS pneu_id,
  p.codigo,
  p.marca,
  p.modelo,
  p.medida,
  p.status,
  p.km_inicial,
  p.km_atual,
  mp.id AS montagem_id,
  mp.placa_veiculo,
  mp.posicao,
  mp.km_instalacao,
  mp.data_instalacao,
  mp.distancia_percorrida,
  p.profundidade_sulco
FROM pneus_completo p
JOIN montagem_pneus mp ON p.id = mp.pneu_id
WHERE mp.data_remocao IS NULL
ORDER BY mp.placa_veiculo, mp.posicao;