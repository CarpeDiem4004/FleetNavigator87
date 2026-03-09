-- =====================================================
-- SCRIPT FINAL PARA CORRIGIR ERROS DE COLUNAS FALTANTES
-- Corrige os erros: "column veiculo_placa does not exist" e "column provedor_cartao does not exist"
-- =====================================================

-- ETAPA 1: Verificar estrutura atual das tabelas e mostrar colunas existentes
SELECT 'VERIFICANDO_TABELA_SOLICITACOES_FUEL_CARD' as etapa;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card' 
ORDER BY ordinal_position;

SELECT 'VERIFICANDO_TABELA_LINEHALL_FUEL_CARD_REQUESTS' as etapa;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests' 
ORDER BY ordinal_position;

-- ETAPA 2: Adicionar colunas faltantes na tabela solicitacoes_fuel_card
DO $$
BEGIN
  -- Verificar e adicionar veiculo_placa se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna veiculo_placa já existe na tabela solicitacoes_fuel_card';
  END IF;

  -- Verificar e adicionar provedor_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'provedor_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN provedor_cartao VARCHAR(100);
    RAISE NOTICE 'Coluna provedor_cartao adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna provedor_cartao já existe na tabela solicitacoes_fuel_card';
  END IF;

  -- Verificar e adicionar placa se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'placa'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN placa VARCHAR(10);
    RAISE NOTICE 'Coluna placa adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna placa já existe na tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar outras colunas necessárias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'numero_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN numero_cartao VARCHAR(20);
    RAISE NOTICE 'Coluna numero_cartao adicionada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'tipo_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN tipo_cartao VARCHAR(50);
    RAISE NOTICE 'Coluna tipo_cartao adicionada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'km'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN km INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna km adicionada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'base'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN base VARCHAR(100);
    RAISE NOTICE 'Coluna base adicionada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'origem_tipo'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN origem_tipo VARCHAR(20) DEFAULT 'tradicional';
    RAISE NOTICE 'Coluna origem_tipo adicionada';
  END IF;
END $$;

-- ETAPA 3: Adicionar colunas faltantes na tabela linehall_fuel_card_requests
DO $$
BEGIN
  -- Verificar e adicionar veiculo_placa se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à tabela linehall_fuel_card_requests';
  ELSE
    RAISE NOTICE 'Coluna veiculo_placa já existe na tabela linehall_fuel_card_requests';
  END IF;

  -- Verificar e adicionar observacoes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN observacoes TEXT;
    RAISE NOTICE 'Coluna observacoes adicionada';
  END IF;

  -- Verificar e adicionar atendido_por se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'atendido_por'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN atendido_por VARCHAR(100);
    RAISE NOTICE 'Coluna atendido_por adicionada';
  END IF;

  -- Verificar e adicionar data_atendimento se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'data_atendimento'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN data_atendimento TIMESTAMP;
    RAISE NOTICE 'Coluna data_atendimento adicionada';
  END IF;
END $$;

-- ETAPA 4: Sincronizar dados entre as colunas placa e veiculo_placa
UPDATE solicitacoes_fuel_card 
SET 
  veiculo_placa = COALESCE(veiculo_placa, placa),
  placa = COALESCE(placa, veiculo_placa, 'SEM-PLACA'),
  provedor_cartao = COALESCE(provedor_cartao, 'Padrão'),
  numero_cartao = COALESCE(numero_cartao, ''),
  tipo_cartao = COALESCE(tipo_cartao, 'Padrão'),
  km = COALESCE(km, 0),
  base = COALESCE(base, 'Base Principal'),
  origem_tipo = COALESCE(origem_tipo, 'tradicional')
WHERE veiculo_placa IS NULL OR placa IS NULL OR provedor_cartao IS NULL;

-- ETAPA 5: Preencher dados padrão na tabela linehall_fuel_card_requests
UPDATE linehall_fuel_card_requests 
SET 
  veiculo_placa = COALESCE(veiculo_placa, 'LH-' || id),
  observacoes = COALESCE(observacoes, observacoes_operador, 'Sem observações'),
  atendido_por = COALESCE(atendido_por, operador_aprovacao),
  data_atendimento = COALESCE(data_atendimento, updated_at)
WHERE veiculo_placa IS NULL OR observacoes IS NULL OR atendido_por IS NULL OR data_atendimento IS NULL;

-- ETAPA 6: Testar as consultas que estavam falhando
SELECT 'TESTE_CONSULTA_SOLICITACOES_FUEL_CARD' as teste;
SELECT 
  id,
  placa,
  veiculo_placa,
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

SELECT 'TESTE_CONSULTA_LINEHALL_FUEL_CARD_REQUESTS' as teste;
SELECT 
  id,
  veiculo_placa,
  km_total,
  motorista_nome,
  observacoes,
  status,
  data_solicitacao,
  atendido_por,
  data_atendimento
FROM linehall_fuel_card_requests
LIMIT 1;

-- ETAPA 7: Testar a consulta UNION que estava falhando
SELECT 'TESTE_CONSULTA_UNION_CORRIGIDA' as teste;
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
    motorista,
    status,
    COALESCE(origem_tipo, 'tradicional') as origem_tipo
  FROM solicitacoes_fuel_card
  UNION ALL
  SELECT 
    id,
    COALESCE(veiculo_placa, 'LH-' || id) as placa,
    motorista_nome as motorista,
    status,
    'line_hall' as origem_tipo
  FROM linehall_fuel_card_requests
) combined_requests
ORDER BY id DESC
LIMIT 5;

-- ETAPA 8: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_veiculo_placa ON solicitacoes_fuel_card(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_origem ON solicitacoes_fuel_card(origem_tipo);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_veiculo_placa ON linehall_fuel_card_requests(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);

-- FINAL: Confirmação de sucesso
SELECT 
  'CORREÇÃO_DEFINITIVA_CONCLUÍDA' as status,
  CURRENT_TIMESTAMP as executado_em,
  'Todos os erros de colunas faltantes foram corrigidos' as mensagem;

-- Mostrar estrutura final das tabelas
SELECT 'ESTRUTURA_FINAL_SOLICITACOES_FUEL_CARD' as tabela;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card' 
ORDER BY ordinal_position;

SELECT 'ESTRUTURA_FINAL_LINEHALL_FUEL_CARD_REQUESTS' as tabela;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests' 
ORDER BY ordinal_position;