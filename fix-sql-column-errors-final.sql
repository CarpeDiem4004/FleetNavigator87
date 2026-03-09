-- =====================================================
-- SCRIPT DEFINITIVO PARA CORRIGIR ERROS DE COLUNAS SQL
-- Corrige os erros: "column placa does not exist" e "column provedor_cartao does not exist"
-- =====================================================

-- ETAPA 1: Verificar estrutura atual das tabelas
SELECT 'VERIFICANDO ESTRUTURA DAS TABELAS' as etapa;

-- Verificar colunas da tabela solicitacoes_fuel_card
SELECT 
  'solicitacoes_fuel_card' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card'
ORDER BY ordinal_position;

-- Verificar colunas da tabela linehall_fuel_card_requests
SELECT 
  'linehall_fuel_card_requests' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests'
ORDER BY ordinal_position;

-- ETAPA 2: Corrigir tabela solicitacoes_fuel_card
DO $$
BEGIN
  -- Adicionar coluna placa se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'placa'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN placa VARCHAR(10);
    RAISE NOTICE 'Coluna placa adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna placa já existe na tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna provedor_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'provedor_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN provedor_cartao VARCHAR(100);
    RAISE NOTICE 'Coluna provedor_cartao adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna provedor_cartao já existe na tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar outras colunas essenciais se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'numero_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN numero_cartao VARCHAR(20);
    RAISE NOTICE 'Coluna numero_cartao adicionada à tabela solicitacoes_fuel_card';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'tipo_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN tipo_cartao VARCHAR(50);
    RAISE NOTICE 'Coluna tipo_cartao adicionada à tabela solicitacoes_fuel_card';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'km'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN km INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna km adicionada à tabela solicitacoes_fuel_card';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'base'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN base VARCHAR(100);
    RAISE NOTICE 'Coluna base adicionada à tabela solicitacoes_fuel_card';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'id_rota'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN id_rota VARCHAR(100);
    RAISE NOTICE 'Coluna id_rota adicionada à tabela solicitacoes_fuel_card';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'origem_tipo'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN origem_tipo VARCHAR(20) DEFAULT 'tradicional';
    RAISE NOTICE 'Coluna origem_tipo adicionada à tabela solicitacoes_fuel_card';
  END IF;
END $$;

-- ETAPA 3: Corrigir tabela linehall_fuel_card_requests
DO $$
BEGIN
  -- Verificar se veiculo_placa existe (essa é a coluna correta para esta tabela)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à tabela linehall_fuel_card_requests';
  ELSE
    RAISE NOTICE 'Coluna veiculo_placa já existe na tabela linehall_fuel_card_requests';
  END IF;

  -- Adicionar observacoes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN observacoes TEXT;
    RAISE NOTICE 'Coluna observacoes adicionada à tabela linehall_fuel_card_requests';
  END IF;

  -- Adicionar atendido_por se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'atendido_por'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN atendido_por VARCHAR(100);
    RAISE NOTICE 'Coluna atendido_por adicionada à tabela linehall_fuel_card_requests';
  END IF;

  -- Adicionar data_atendimento se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'data_atendimento'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN data_atendimento TIMESTAMP;
    RAISE NOTICE 'Coluna data_atendimento adicionada à tabela linehall_fuel_card_requests';
  END IF;
END $$;

-- ETAPA 4: Preencher dados padrão nas colunas novas
UPDATE solicitacoes_fuel_card 
SET 
  placa = COALESCE(placa, veiculo_placa, 'SEM-PLACA'),
  provedor_cartao = COALESCE(provedor_cartao, 'Padrão'),
  numero_cartao = COALESCE(numero_cartao, ''),
  tipo_cartao = COALESCE(tipo_cartao, 'Padrão'),
  km = COALESCE(km, km_veiculo, 0),
  base = COALESCE(base, 'Base Principal'),
  id_rota = COALESCE(id_rota, ''),
  origem_tipo = COALESCE(origem_tipo, 'tradicional')
WHERE placa IS NULL OR provedor_cartao IS NULL OR numero_cartao IS NULL OR tipo_cartao IS NULL;

-- Preencher dados da tabela Line Hall
UPDATE linehall_fuel_card_requests 
SET 
  observacoes = COALESCE(observacoes, observacoes_operador, 'Sem observações'),
  atendido_por = COALESCE(atendido_por, operador_aprovacao),
  data_atendimento = COALESCE(data_atendimento, updated_at)
WHERE observacoes IS NULL OR atendido_por IS NULL OR data_atendimento IS NULL;

-- ETAPA 5: Testar as consultas que estavam falhando
SELECT 'TESTANDO CONSULTAS QUE ESTAVAM FALHANDO' as etapa;

-- Teste 1: Consulta da tabela solicitacoes_fuel_card
SELECT 
  id,
  placa,
  km,
  tipo_cartao,
  provedor_cartao,
  numero_cartao,
  motorista,
  observacoes,
  status,
  data_solicitacao,
  origem_tipo
FROM solicitacoes_fuel_card
LIMIT 1;

-- Teste 2: Consulta da tabela linehall_fuel_card_requests
SELECT 
  id,
  veiculo_placa,
  km_total,
  motorista_nome,
  observacoes,
  status,
  data_solicitacao
FROM linehall_fuel_card_requests
LIMIT 1;

-- Teste 3: Consulta UNION que estava falhando
SELECT 
  id,
  placa,
  motorista,
  status,
  origem_tipo
FROM (
  SELECT 
    id,
    placa,
    motorista,
    status,
    COALESCE(origem_tipo, 'tradicional') as origem_tipo
  FROM solicitacoes_fuel_card
  UNION ALL
  SELECT 
    id,
    veiculo_placa as placa,
    motorista_nome as motorista,
    status,
    'line_hall' as origem_tipo
  FROM linehall_fuel_card_requests
) combined_requests
ORDER BY id DESC
LIMIT 5;

-- ETAPA 6: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_origem ON solicitacoes_fuel_card(origem_tipo);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_placa ON linehall_fuel_card_requests(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);

-- FINAL: Confirmação de sucesso
SELECT 
  'CORREÇÃO_CONCLUÍDA' as status,
  CURRENT_TIMESTAMP as executado_em,
  'Erros de coluna placa e provedor_cartao foram corrigidos' as mensagem;