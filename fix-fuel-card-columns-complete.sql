-- =====================================================
-- SCRIPT FINAL PARA CORRIGIR TODAS AS COLUNAS DO SISTEMA DE CARTÃO COMBUSTÍVEL
-- Corrige erros SQL e garante estrutura completa das tabelas
-- =====================================================

-- ETAPA 1: Verificar e adicionar colunas faltantes na tabela principal
DO $$
BEGIN
  -- Adicionar provedor_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'provedor_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN provedor_cartao VARCHAR(100);
    RAISE NOTICE 'Coluna provedor_cartao adicionada à tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar numero_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'numero_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN numero_cartao VARCHAR(20);
    RAISE NOTICE 'Coluna numero_cartao adicionada à tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar tipo_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'tipo_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN tipo_cartao VARCHAR(50);
    RAISE NOTICE 'Coluna tipo_cartao adicionada à tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar km se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'km'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN km INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna km adicionada à tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar base se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'base'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN base VARCHAR(100);
    RAISE NOTICE 'Coluna base adicionada à tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar id_rota se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'id_rota'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN id_rota VARCHAR(100);
    RAISE NOTICE 'Coluna id_rota adicionada à tabela solicitacoes_fuel_card';
  END IF;

  -- Adicionar origem_tipo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'origem_tipo'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN origem_tipo VARCHAR(20) DEFAULT 'tradicional';
    RAISE NOTICE 'Coluna origem_tipo adicionada à tabela solicitacoes_fuel_card';
  END IF;
END $$;

-- ETAPA 2: Verificar e adicionar colunas faltantes na tabela Line Hall
DO $$
BEGIN
  -- Verificar se observacoes existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN observacoes TEXT;
    RAISE NOTICE 'Coluna observacoes adicionada à tabela linehall_fuel_card_requests';
  END IF;

  -- Verificar se atendido_por existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'atendido_por'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN atendido_por VARCHAR(100);
    RAISE NOTICE 'Coluna atendido_por adicionada à tabela linehall_fuel_card_requests';
  END IF;

  -- Verificar se data_atendimento existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'data_atendimento'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN data_atendimento TIMESTAMP;
    RAISE NOTICE 'Coluna data_atendimento adicionada à tabela linehall_fuel_card_requests';
  END IF;
END $$;

-- ETAPA 3: Preencher dados padrão nas colunas novas
UPDATE solicitacoes_fuel_card 
SET 
  provedor_cartao = COALESCE(provedor_cartao, 'Padrão'),
  numero_cartao = COALESCE(numero_cartao, ''),
  tipo_cartao = COALESCE(tipo_cartao, 'Padrão'),
  km = COALESCE(km, km_veiculo, 0),
  base = COALESCE(base, 'Base Principal'),
  id_rota = COALESCE(id_rota, ''),
  origem_tipo = COALESCE(origem_tipo, 'tradicional')
WHERE provedor_cartao IS NULL OR numero_cartao IS NULL OR tipo_cartao IS NULL;

-- ETAPA 4: Atualizar dados da tabela Line Hall
UPDATE linehall_fuel_card_requests 
SET 
  observacoes = COALESCE(observacoes, observacoes_operador, 'Sem observações'),
  atendido_por = COALESCE(atendido_por, operador_aprovacao),
  data_atendimento = COALESCE(data_atendimento, updated_at)
WHERE observacoes IS NULL OR atendido_por IS NULL OR data_atendimento IS NULL;

-- ETAPA 5: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_data ON linehall_fuel_card_requests(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_placa ON linehall_fuel_card_requests(veiculo_placa);

-- ETAPA 6: Testar a consulta UNION completa
SELECT 'TESTE_CONSULTA_UNION_FINAL' as teste;

-- Teste da primeira parte (solicitações tradicionais)
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
    origem_tipo
  FROM solicitacoes_fuel_card
  LIMIT 3
) t;

-- Teste da segunda parte (Line Hall Shopee)
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
    data_solicitacao::timestamp as data_solicitacao,
    atendido_por,
    data_atendimento,
    created_at,
    updated_at,
    COALESCE(valor_calculado, 0) as valor_solicitado,
    'Line Hall Shopee' as base,
    CONCAT(COALESCE(rota_origem, ''), ' → ', COALESCE(rota_destino, '')) as id_rota,
    'line_hall' as origem_tipo
  FROM linehall_fuel_card_requests
  LIMIT 3
) t;

-- ETAPA 7: Verificação final da estrutura
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('solicitacoes_fuel_card', 'linehall_fuel_card_requests')
AND column_name IN ('placa', 'veiculo_placa', 'provedor_cartao', 'tipo_cartao', 'km', 'base', 'origem_tipo')
ORDER BY table_name, column_name;

-- FINAL: Confirmação de sucesso
SELECT 
  'ESTRUTURA_CORRIGIDA' as status,
  CURRENT_TIMESTAMP as executado_em,
  'Todas as colunas necessárias foram criadas e testadas' as mensagem;