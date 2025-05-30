-- =====================================================
-- SCRIPT PARA CORRIGIR ERRO DA COLUNA "motorista"
-- Corrige o erro: column "motorista" does not exist (talvez seja "motorista_id")
-- =====================================================

-- ETAPA 1: Verificar estrutura atual das tabelas
SELECT 'VERIFICANDO_COLUNAS_MOTORISTA' as etapa;

-- Verificar colunas relacionadas a motorista na tabela solicitacoes_fuel_card
SELECT 
  table_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card' 
AND column_name LIKE '%motorista%'
ORDER BY column_name;

-- Verificar colunas relacionadas a motorista na tabela linehall_fuel_card_requests
SELECT 
  table_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests' 
AND column_name LIKE '%motorista%'
ORDER BY column_name;

-- ETAPA 2: Adicionar coluna motorista se não existir
DO $$
BEGIN
  -- Adicionar coluna motorista na tabela solicitacoes_fuel_card se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'motorista'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN motorista VARCHAR(100);
    RAISE NOTICE 'Coluna motorista adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna motorista já existe na tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna motorista na tabela linehall_fuel_card_requests se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'motorista'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN motorista VARCHAR(100);
    RAISE NOTICE 'Coluna motorista adicionada à tabela linehall_fuel_card_requests';
  ELSE
    RAISE NOTICE 'Coluna motorista já existe na tabela linehall_fuel_card_requests';
  END IF;

  -- Adicionar outras colunas essenciais que podem estar faltando
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à tabela solicitacoes_fuel_card';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à tabela linehall_fuel_card_requests';
  END IF;
END $$;

-- ETAPA 3: Preencher dados da coluna motorista com base nas colunas existentes
UPDATE solicitacoes_fuel_card 
SET motorista = COALESCE(
  motorista, 
  (SELECT name FROM users WHERE id = motorista_id),
  'Motorista não informado'
)
WHERE motorista IS NULL;

UPDATE linehall_fuel_card_requests 
SET motorista = COALESCE(
  motorista,
  motorista_nome,
  'Motorista não informado'
)
WHERE motorista IS NULL;

-- ETAPA 4: Sincronizar dados entre colunas placa e veiculo_placa
UPDATE solicitacoes_fuel_card 
SET 
  veiculo_placa = COALESCE(veiculo_placa, placa),
  placa = COALESCE(placa, veiculo_placa, 'SEM-PLACA')
WHERE veiculo_placa IS NULL OR placa IS NULL;

UPDATE linehall_fuel_card_requests 
SET veiculo_placa = COALESCE(veiculo_placa, 'LH-' || id)
WHERE veiculo_placa IS NULL;

-- ETAPA 5: Testar as consultas que estavam falhando
SELECT 'TESTE_CONSULTA_COM_MOTORISTA' as teste;

-- Teste da consulta da tabela solicitacoes_fuel_card
SELECT 
  id,
  placa,
  veiculo_placa,
  motorista,
  status,
  data_solicitacao
FROM solicitacoes_fuel_card
LIMIT 1;

-- Teste da consulta da tabela linehall_fuel_card_requests
SELECT 
  id,
  veiculo_placa,
  motorista,
  status,
  data_solicitacao
FROM linehall_fuel_card_requests
LIMIT 1;

-- ETAPA 6: Testar a consulta UNION que estava falhando
SELECT 'TESTE_CONSULTA_UNION_COM_MOTORISTA' as teste;
SELECT 
  id,
  placa,
  motorista,
  status,
  origem_tipo
FROM (
  SELECT 
    id,
    COALESCE(placa, veiculo_placa, 'SEM-PLACA') as placa,
    COALESCE(motorista, 'Motorista não informado') as motorista,
    status,
    COALESCE(origem_tipo, 'tradicional') as origem_tipo
  FROM solicitacoes_fuel_card
  UNION ALL
  SELECT 
    id,
    COALESCE(veiculo_placa, 'LH-' || id) as placa,
    COALESCE(motorista, motorista_nome, 'Motorista não informado') as motorista,
    status,
    'line_hall' as origem_tipo
  FROM linehall_fuel_card_requests
) combined_requests
ORDER BY id DESC
LIMIT 5;

-- ETAPA 7: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_motorista ON solicitacoes_fuel_card(motorista);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_motorista ON linehall_fuel_card_requests(motorista);

-- FINAL: Confirmação de sucesso
SELECT 
  'ERRO_COLUNA_MOTORISTA_CORRIGIDO' as status,
  CURRENT_TIMESTAMP as executado_em,
  'Coluna motorista adicionada e dados sincronizados' as mensagem;

-- Mostrar estrutura final das colunas relacionadas a motorista
SELECT 'ESTRUTURA_FINAL_COLUNAS_MOTORISTA' as resultado;
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('solicitacoes_fuel_card', 'linehall_fuel_card_requests')
AND column_name LIKE '%motorista%'
ORDER BY table_name, column_name;