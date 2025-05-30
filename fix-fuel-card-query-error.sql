-- =====================================================
-- SCRIPT PARA CORRIGIR ERRO SQL DA COLUNA "PLACA"
-- Sistema de Cartão Combustível - Correção de Estrutura
-- =====================================================

-- ETAPA 1: Verificar estrutura atual das tabelas
SELECT 
  'solicitacoes_fuel_card' as tabela,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card' 
ORDER BY ordinal_position;

SELECT 
  'linehall_fuel_card_requests' as tabela,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests' 
ORDER BY ordinal_position;

-- ETAPA 2: Verificar se existe campo placa na tabela principal
DO $$
BEGIN
  -- Verificar se a coluna placa existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' 
    AND column_name = 'placa'
  ) THEN
    -- Se não existir, criar a coluna
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN placa VARCHAR(10);
    RAISE NOTICE 'Coluna placa adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna placa já existe na tabela solicitacoes_fuel_card';
  END IF;
END $$;

-- ETAPA 3: Atualizar registros existentes com placas de exemplo (se necessário)
UPDATE solicitacoes_fuel_card 
SET placa = 'ABC' || LPAD(id::text, 4, '0')
WHERE placa IS NULL OR placa = '';

-- ETAPA 4: Verificar se existe campo veiculo_placa na tabela Line Hall
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' 
    AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à tabela linehall_fuel_card_requests';
  ELSE
    RAISE NOTICE 'Coluna veiculo_placa já existe na tabela linehall_fuel_card_requests';
  END IF;
END $$;

-- ETAPA 5: Atualizar registros Line Hall com placas (se necessário)
UPDATE linehall_fuel_card_requests 
SET veiculo_placa = 'LHS' || LPAD(id::text, 4, '0')
WHERE veiculo_placa IS NULL OR veiculo_placa = '';

-- ETAPA 6: Verificar outros campos necessários
DO $$
BEGIN
  -- Campo km na tabela principal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' 
    AND column_name = 'km'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN km INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna km adicionada à tabela solicitacoes_fuel_card';
  END IF;

  -- Campo motorista_nome na tabela Line Hall
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' 
    AND column_name = 'motorista_nome'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN motorista_nome VARCHAR(100);
    RAISE NOTICE 'Coluna motorista_nome adicionada à tabela linehall_fuel_card_requests';
  END IF;

  -- Campo valor_calculado na tabela Line Hall
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' 
    AND column_name = 'valor_calculado'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN valor_calculado DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE 'Coluna valor_calculado adicionada à tabela linehall_fuel_card_requests';
  END IF;
END $$;

-- ETAPA 7: Preencher dados faltantes na tabela Line Hall
UPDATE linehall_fuel_card_requests 
SET motorista_nome = 'Motorista ' || id
WHERE motorista_nome IS NULL OR motorista_nome = '';

-- ETAPA 8: Criar índices necessários
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_placa ON linehall_fuel_card_requests(veiculo_placa);

-- ETAPA 9: Testar a consulta UNION que estava falhando
SELECT 'TESTE_CONSULTA_UNION' as teste;

SELECT COUNT(*) as total_tradicional FROM (
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
    atendido_por,
    data_atendimento,
    created_at,
    updated_at,
    valor_solicitado,
    base,
    id_rota,
    COALESCE(origem_tipo, 'tradicional') as origem_tipo
  FROM solicitacoes_fuel_card
  LIMIT 5
) t;

SELECT COUNT(*) as total_linehall FROM (
  SELECT 
    id,
    veiculo_placa as placa,
    km_total as km,
    'Line Hall' as tipo_cartao,
    'Line Hall Shopee' as provedor_cartao,
    '' as numero_cartao,
    motorista_nome as motorista,
    observacoes,
    status,
    data_solicitacao,
    atendido_por,
    data_atendimento,
    created_at,
    updated_at,
    valor_calculado as valor_solicitado,
    'Line Hall Shopee' as base,
    rota_origem || ' -> ' || rota_destino as id_rota,
    'line_hall' as origem_tipo
  FROM linehall_fuel_card_requests
  LIMIT 5
) t;

-- ETAPA 10: Verificação final da estrutura
SELECT 
  'VERIFICACAO_FINAL' as status,
  COUNT(*) as total_solicitacoes_tradicionais
FROM solicitacoes_fuel_card;

SELECT 
  'VERIFICACAO_FINAL' as status,
  COUNT(*) as total_solicitacoes_linehall
FROM linehall_fuel_card_requests;

-- FINAL: Confirmação de sucesso
SELECT 
  'CORRECAO_CONCLUIDA' as status,
  CURRENT_TIMESTAMP as executado_em,
  'Estrutura de tabelas corrigida para eliminar erro SQL' as mensagem;