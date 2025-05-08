-- Script para criar todas as tabelas necessárias para todos os postos no Supabase
-- Este script cria as tabelas para Campinas_v2, Osasco_v2, Sorocaba_v2, Socorro_v2, ABC_v2, Alair_v2, Guarulhos_v2

-- Tabelas para o posto Osasco_v2
-- ------------------------------

-- Tabela de recebimentos para o posto Osasco_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de movimentações de pátio para o posto Osasco_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_osasco_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabelas para o posto Socorro_v2
-- ------------------------------

-- Tabela de recebimentos para o posto Socorro_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_socorro_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de movimentações de pátio para o posto Socorro_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_socorro_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabelas para o posto Sorocaba_v2
-- ------------------------------

-- Tabela de recebimentos para o posto Sorocaba_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_sorocaba_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de movimentações de pátio para o posto Sorocaba_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_sorocaba_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabelas para o posto ABC_v2
-- ------------------------------

-- Tabela de abastecimentos para o posto ABC_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_abc_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2),
  quantidade_litros NUMERIC(10, 2),
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT false,
  tipo_lavagem VARCHAR(50),
  data_registro TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de recebimentos para o posto ABC_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_abc_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de movimentações de pátio para o posto ABC_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_abc_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabelas para o posto Alair_v2
-- ------------------------------

-- Tabela de abastecimentos para o posto Alair_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_alair_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2),
  quantidade_litros NUMERIC(10, 2),
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT false,
  tipo_lavagem VARCHAR(50),
  data_registro TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de recebimentos para o posto Alair_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_alair_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de movimentações de pátio para o posto Alair_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_alair_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabelas para o posto Guarulhos_v2
-- ----------------------------------

-- Tabela de abastecimentos para o posto Guarulhos_v2
CREATE TABLE IF NOT EXISTS abastecimentos_posto_guarulhos_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2),
  quantidade_litros NUMERIC(10, 2),
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT false,
  tipo_lavagem VARCHAR(50),
  data_registro TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de recebimentos para o posto Guarulhos_v2
CREATE TABLE IF NOT EXISTS recebimentos_posto_guarulhos_v2 (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20),
  quantidade_litros NUMERIC(10, 2),
  valor_litro NUMERIC(10, 3),
  valor_total NUMERIC(10, 2),
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(100),
  data_recebimento TIMESTAMP,
  usuario_operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de movimentações de pátio para o posto Guarulhos_v2
CREATE TABLE IF NOT EXISTS movimentacoes_patio_guarulhos_v2 (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL,
  tipo_veiculo VARCHAR(50),
  tipo_movimentacao VARCHAR(20) NOT NULL, -- entrada ou saida
  data_hora TIMESTAMP NOT NULL,
  km NUMERIC(10, 2),
  motorista VARCHAR(100),
  origem VARCHAR(100),
  destino VARCHAR(100),
  carga VARCHAR(100),
  observacoes TEXT,
  usuario_operador VARCHAR(100),
  tempo_patio INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Atualizar a view de histórico consolidado para incluir todos os postos
-- ----------------------------------------------------------------------

CREATE OR REPLACE VIEW historico_consolidado_postos AS
  -- Abastecimentos do posto Campinas_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'campinas_v2' AS posto
  FROM abastecimentos_posto_campinas_v2
  
  UNION ALL
  
  -- Abastecimentos do posto Osasco_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'osasco_v2' AS posto
  FROM abastecimentos_posto_osasco_v2
  
  UNION ALL
  
  -- Abastecimentos do posto Socorro_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'socorro_v2' AS posto
  FROM abastecimentos_posto_socorro_v2
  
  UNION ALL
  
  -- Abastecimentos do posto Sorocaba_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'sorocaba_v2' AS posto
  FROM abastecimentos_posto_sorocaba_v2
  
  UNION ALL
  
  -- Abastecimentos do posto ABC_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'abc_v2' AS posto
  FROM abastecimentos_posto_abc_v2
  
  UNION ALL
  
  -- Abastecimentos do posto Alair_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'alair_v2' AS posto
  FROM abastecimentos_posto_alair_v2
  
  UNION ALL
  
  -- Abastecimentos do posto Guarulhos_v2
  SELECT 
    id,
    placa,
    COALESCE(km_atual, 0) AS km,
    tipo_combustivel,
    COALESCE(litros, quantidade_litros) AS quantidade_litros,
    motorista AS nome_motorista,
    motorista_rg AS rg_motorista,
    operador AS nome_operador,
    valor_litro,
    valor_total,
    tipo_veiculo,
    observacoes,
    lavagem,
    tipo_lavagem,
    TO_CHAR(COALESCE(data_registro, created_at), 'DD/MM/YYYY HH24:MI') AS data_hora,
    created_at,
    'guarulhos_v2' AS posto
  FROM abastecimentos_posto_guarulhos_v2;
  
-- Inserir configurações iniciais para os postos (se não existirem)
-- ---------------------------------------------------------------

-- Configuração para Osasco_v2
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Osasco_v2', 
  15000, 
  10000, 
  800, 
  500, 
  5.10, 
  3.10
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Osasco_v2'
  );

-- Configuração para Socorro_v2
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Socorro_v2', 
  12000, 
  8000, 
  700, 
  450, 
  5.05, 
  3.05
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Socorro_v2'
  );

-- Configuração para Sorocaba_v2
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Sorocaba_v2', 
  10000, 
  7500, 
  600, 
  400, 
  5.15, 
  3.15
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Sorocaba_v2'
  );

-- Configuração para ABC_v2
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Abc_v2', 
  18000, 
  12000, 
  900, 
  600, 
  5.08, 
  3.08
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Abc_v2'
  );

-- Configuração para Alair_v2
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Alair_v2', 
  8000, 
  5000, 
  500, 
  320, 
  5.12, 
  3.12
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Alair_v2'
  );

-- Configuração para Guarulhos_v2
INSERT INTO configuracao_tanques (
  posto, 
  diesel_capacidade, 
  diesel_nivel, 
  arla_capacidade, 
  arla_nivel, 
  diesel_valor_litro, 
  arla_valor_litro
)
SELECT 
  'Guarulhos_v2', 
  16000, 
  11000, 
  850, 
  580, 
  5.18, 
  3.18
WHERE 
  NOT EXISTS (
    SELECT 1 FROM configuracao_tanques WHERE posto = 'Guarulhos_v2'
  );