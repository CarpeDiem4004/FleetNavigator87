-- Script SQL para criar todas as tabelas do Posto Murici no Supabase

-- 1. Criar tabela posto_murici_postos (se não existir)
CREATE TABLE IF NOT EXISTS posto_murici_postos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  endereco TEXT,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  telefone TEXT,
  responsavel TEXT,
  email_responsavel TEXT,
  esta_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela posto_murici_tanques (se não existir)
CREATE TABLE IF NOT EXISTS posto_murici_tanques (
  id SERIAL PRIMARY KEY,
  posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  capacidade_total NUMERIC(10, 2) NOT NULL,
  nivel_atual NUMERIC(10, 2) NOT NULL,
  valor_litro_frota NUMERIC(10, 2) NOT NULL,
  valor_litro_agregado NUMERIC(10, 2) NOT NULL,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela posto_murici_abastecimentos (se não existir)
CREATE TABLE IF NOT EXISTS posto_murici_abastecimentos (
  id SERIAL PRIMARY KEY,
  posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
  tanque_id INTEGER NOT NULL REFERENCES posto_murici_tanques(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  km INTEGER NOT NULL,
  tipo_veiculo TEXT NOT NULL,
  tipo_combustivel TEXT NOT NULL,
  quantidade_litros NUMERIC(10, 2) NOT NULL,
  valor_litro NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  motorista TEXT NOT NULL,
  rg_motorista TEXT,
  usuario_id INTEGER,
  observacoes TEXT,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela posto_murici_abastecimentos_tanque (se não existir)
CREATE TABLE IF NOT EXISTS posto_murici_abastecimentos_tanque (
  id SERIAL PRIMARY KEY,
  posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
  tanque_id INTEGER NOT NULL REFERENCES posto_murici_tanques(id) ON DELETE CASCADE,
  quantidade_litros NUMERIC(10, 2) NOT NULL,
  valor_litro NUMERIC(10, 2) NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL,
  nota_fiscal TEXT,
  fornecedor TEXT,
  usuario_id INTEGER,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela posto_murici_configuracoes (se não existir)
CREATE TABLE IF NOT EXISTS posto_murici_configuracoes (
  id SERIAL PRIMARY KEY,
  posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
  nome_configuracao TEXT NOT NULL,
  valor TEXT,
  tipo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela posto_murici_movimentacoes_patio (se não existir)
CREATE TABLE IF NOT EXISTS posto_murici_movimentacoes_patio (
  id SERIAL PRIMARY KEY,
  posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  motorista TEXT NOT NULL,
  rg_motorista TEXT,
  tipo_operacao TEXT NOT NULL,
  base_destino TEXT,
  observacoes TEXT,
  usuario_id INTEGER,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados iniciais (apenas se a tabela estiver vazia)
DO $$
DECLARE
  posto_id INTEGER;
  tanque_diesel_existe BOOLEAN;
  tanque_arla_existe BOOLEAN;
BEGIN
  -- Verificar se já existem postos
  SELECT EXISTS(SELECT 1 FROM posto_murici_postos LIMIT 1) INTO tanque_diesel_existe;
  
  IF NOT tanque_diesel_existe THEN
    -- Inserir um posto inicial
    INSERT INTO posto_murici_postos (
      nome, 
      codigo, 
      endereco, 
      cidade, 
      uf, 
      telefone, 
      responsavel, 
      email_responsavel, 
      esta_ativo
    ) VALUES (
      'Posto Murici Osasco',
      'MRC-OSC',
      'Rua Murici, 123',
      'Osasco',
      'SP',
      '(11) 1234-5678',
      'Administrador',
      'admin@muricionfleet.com',
      true
    ) RETURNING id INTO posto_id;
    
    -- Inserir tanque de diesel
    INSERT INTO posto_murici_tanques (
      posto_id,
      tipo,
      capacidade_total,
      nivel_atual,
      valor_litro_frota,
      valor_litro_agregado
    ) VALUES (
      posto_id,
      'diesel',
      10000,
      5000,
      5.10,
      5.65
    );
    
    -- Inserir tanque de arla
    INSERT INTO posto_murici_tanques (
      posto_id,
      tipo,
      capacidade_total,
      nivel_atual,
      valor_litro_frota,
      valor_litro_agregado
    ) VALUES (
      posto_id,
      'arla',
      2000,
      1000,
      3.20,
      3.80
    );
    
    RAISE NOTICE 'Dados iniciais inseridos com sucesso para o posto ID: %', posto_id;
  ELSE
    RAISE NOTICE 'Dados iniciais não inseridos, pois já existem registros na tabela de postos.';
  END IF;
END $$;