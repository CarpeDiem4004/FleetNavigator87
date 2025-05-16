-- Criar tabela workshops se não existir
CREATE TABLE IF NOT EXISTS workshops (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  endereco VARCHAR(200),
  telefone VARCHAR(20),
  email VARCHAR(100),
  responsavel VARCHAR(100),
  tipo VARCHAR(50) DEFAULT 'oficina',
  status VARCHAR(20) DEFAULT 'ativo',
  base_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela abastecimentos_postos se não existir
CREATE TABLE IF NOT EXISTS abastecimentos_postos (
  id SERIAL PRIMARY KEY,
  posto VARCHAR(100) NOT NULL,
  placa VARCHAR(10) NOT NULL,
  condutor VARCHAR(100),
  data_abastecimento TIMESTAMP DEFAULT NOW(),
  hodometro INTEGER,
  combustivel VARCHAR(20),
  quantidade NUMERIC(10,2),
  valor_unitario NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  base_id INTEGER,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar ou atualizar a tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) UNIQUE NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(50),
  ano INTEGER,
  tipo VARCHAR(50),
  combustivel VARCHAR(20),
  capacidade NUMERIC(10,2),
  base_id INTEGER,
  status VARCHAR(20) DEFAULT 'ativo',
  km_atual INTEGER DEFAULT 0,
  ultima_manutencao DATE,
  proxima_manutencao DATE,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de registro de manutenções
CREATE TABLE IF NOT EXISTS manutencoes (
  id SERIAL PRIMARY KEY,
  veiculo_id INTEGER REFERENCES veiculos(id),
  tipo VARCHAR(50) NOT NULL,
  descricao TEXT,
  data_entrada DATE NOT NULL,
  data_saida DATE,
  oficina VARCHAR(100),
  oficina_id INTEGER,
  km INTEGER,
  valor NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'pendente',
  responsavel VARCHAR(100),
  base_id INTEGER,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de solicitações de orçamento base Campinas
CREATE TABLE IF NOT EXISTS campinas_budget_requests (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER,
  vehicle_plate VARCHAR(10),
  vehicle_model VARCHAR(100),
  description TEXT NOT NULL,
  requested_by INTEGER,
  requester_name VARCHAR(100),
  base_id INTEGER,
  workshop_id INTEGER,
  workshop_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pendente',
  estimated_value NUMERIC(10,2),
  approved_value NUMERIC(10,2),
  approved_by INTEGER,
  approver_name VARCHAR(100),
  approved_at TIMESTAMP,
  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON manutencoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_workshops_nome ON workshops(nome);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_placa ON abastecimentos_postos(placa);
CREATE INDEX IF NOT EXISTS idx_budget_vehicle ON campinas_budget_requests(vehicle_plate);