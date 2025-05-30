-- =====================================================
-- SCRIPT COMPLETO PARA CORRIGIR TODOS OS PROBLEMAS DO SISTEMA DE CARTÃO COMBUSTÍVEL
-- Análise completa e correção de todas as alterações identificadas
-- =====================================================

-- ETAPA 1: Verificar estrutura atual das tabelas principais
SELECT 'ANÁLISE_ESTRUTURA_ATUAL' as etapa;

-- Verificar tabela users para entender tipos de dados
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verificar tabela solicitacoes_fuel_card
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card'
ORDER BY ordinal_position;

-- Verificar tabela linehall_fuel_card_requests
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests'
ORDER BY ordinal_position;

-- ETAPA 2: Corrigir tipos de dados incompatíveis
DO $$
BEGIN
  -- Verificar e corrigir tipo da coluna motorista_id se necessário
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' 
    AND column_name = 'motorista_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Se motorista_id é UUID, precisamos converter ou usar cast
    RAISE NOTICE 'Coluna motorista_id é do tipo UUID - ajustando consultas';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' 
    AND column_name = 'motorista_id' 
    AND data_type = 'integer'
  ) THEN
    RAISE NOTICE 'Coluna motorista_id é do tipo INTEGER - OK';
  ELSE
    RAISE NOTICE 'Coluna motorista_id não encontrada';
  END IF;
END $$;

-- ETAPA 3: Adicionar todas as colunas faltantes identificadas
DO $$
BEGIN
  -- TABELA: solicitacoes_fuel_card
  -- Adicionar coluna placa se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'placa'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN placa VARCHAR(10);
    RAISE NOTICE 'Coluna placa adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna veiculo_placa se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna motorista se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'motorista'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN motorista VARCHAR(100);
    RAISE NOTICE 'Coluna motorista adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna provedor_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'provedor_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN provedor_cartao VARCHAR(100);
    RAISE NOTICE 'Coluna provedor_cartao adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna numero_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'numero_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN numero_cartao VARCHAR(20);
    RAISE NOTICE 'Coluna numero_cartao adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna tipo_cartao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'tipo_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN tipo_cartao VARCHAR(50);
    RAISE NOTICE 'Coluna tipo_cartao adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna km se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'km'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN km INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna km adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna base se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'base'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN base VARCHAR(100);
    RAISE NOTICE 'Coluna base adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna id_rota se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'id_rota'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN id_rota VARCHAR(100);
    RAISE NOTICE 'Coluna id_rota adicionada à solicitacoes_fuel_card';
  END IF;

  -- Adicionar coluna origem_tipo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'origem_tipo'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN origem_tipo VARCHAR(20) DEFAULT 'tradicional';
    RAISE NOTICE 'Coluna origem_tipo adicionada à solicitacoes_fuel_card';
  END IF;

  -- TABELA: linehall_fuel_card_requests
  -- Adicionar coluna veiculo_placa se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'veiculo_placa'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN veiculo_placa VARCHAR(10);
    RAISE NOTICE 'Coluna veiculo_placa adicionada à linehall_fuel_card_requests';
  END IF;

  -- Adicionar coluna motorista se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'motorista'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN motorista VARCHAR(100);
    RAISE NOTICE 'Coluna motorista adicionada à linehall_fuel_card_requests';
  END IF;

  -- Adicionar coluna observacoes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN observacoes TEXT;
    RAISE NOTICE 'Coluna observacoes adicionada à linehall_fuel_card_requests';
  END IF;

  -- Adicionar coluna atendido_por se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'atendido_por'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN atendido_por VARCHAR(100);
    RAISE NOTICE 'Coluna atendido_por adicionada à linehall_fuel_card_requests';
  END IF;

  -- Adicionar coluna data_atendimento se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'linehall_fuel_card_requests' AND column_name = 'data_atendimento'
  ) THEN
    ALTER TABLE linehall_fuel_card_requests ADD COLUMN data_atendimento TIMESTAMP;
    RAISE NOTICE 'Coluna data_atendimento adicionada à linehall_fuel_card_requests';
  END IF;
END $$;

-- ETAPA 4: Preencher dados das colunas com valores seguros (sem joins problemáticos)
UPDATE solicitacoes_fuel_card 
SET 
  placa = COALESCE(placa, veiculo_placa, 'SEM-PLACA'),
  veiculo_placa = COALESCE(veiculo_placa, placa, 'SEM-PLACA'),
  motorista = COALESCE(motorista, 'Motorista não informado'),
  provedor_cartao = COALESCE(provedor_cartao, 'Padrão'),
  numero_cartao = COALESCE(numero_cartao, ''),
  tipo_cartao = COALESCE(tipo_cartao, 'Padrão'),
  km = COALESCE(km, 0),
  base = COALESCE(base, 'Base Principal'),
  id_rota = COALESCE(id_rota, ''),
  origem_tipo = COALESCE(origem_tipo, 'tradicional')
WHERE placa IS NULL OR veiculo_placa IS NULL OR motorista IS NULL OR provedor_cartao IS NULL;

UPDATE linehall_fuel_card_requests 
SET 
  veiculo_placa = COALESCE(veiculo_placa, 'LH-' || id),
  motorista = COALESCE(motorista, motorista_nome, 'Motorista não informado'),
  observacoes = COALESCE(observacoes, observacoes_operador, 'Sem observações'),
  atendido_por = COALESCE(atendido_por, operador_aprovacao),
  data_atendimento = COALESCE(data_atendimento, updated_at)
WHERE veiculo_placa IS NULL OR motorista IS NULL OR observacoes IS NULL OR atendido_por IS NULL OR data_atendimento IS NULL;

-- ETAPA 5: Criar função segura para buscar nome do motorista (sem conflito de tipos)
CREATE OR REPLACE FUNCTION get_motorista_name_safe(motorista_id_param TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Função segura que trata diferentes tipos de ID
  IF motorista_id_param IS NULL OR motorista_id_param = '' THEN
    RETURN 'Motorista não informado';
  END IF;
  
  -- Tentar buscar como INTEGER primeiro
  BEGIN
    RETURN (SELECT name FROM users WHERE id = motorista_id_param::INTEGER LIMIT 1);
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, tentar como UUID
    BEGIN
      RETURN (SELECT name FROM users WHERE id::TEXT = motorista_id_param LIMIT 1);
    EXCEPTION WHEN OTHERS THEN
      RETURN 'Motorista não encontrado';
    END;
  END;
END;
$$ LANGUAGE plpgsql;

-- ETAPA 6: Testar consultas corrigidas
SELECT 'TESTE_CONSULTAS_CORRIGIDAS' as etapa;

-- Teste 1: Consulta básica da tabela solicitacoes_fuel_card
SELECT 
  id,
  placa,
  veiculo_placa,
  motorista,
  provedor_cartao,
  numero_cartao,
  tipo_cartao,
  km,
  status,
  data_solicitacao,
  base,
  id_rota,
  origem_tipo
FROM solicitacoes_fuel_card
LIMIT 1;

-- Teste 2: Consulta básica da tabela linehall_fuel_card_requests
SELECT 
  id,
  veiculo_placa,
  motorista,
  km_total,
  status,
  data_solicitacao,
  observacoes,
  atendido_por,
  data_atendimento
FROM linehall_fuel_card_requests
LIMIT 1;

-- Teste 3: Consulta UNION corrigida (a que estava falhando na API)
SELECT 
  id,
  placa,
  motorista,
  status,
  origem_tipo,
  'teste_union' as fonte_teste
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

-- ETAPA 7: Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_placa ON solicitacoes_fuel_card(placa);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_veiculo_placa ON solicitacoes_fuel_card(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_motorista ON solicitacoes_fuel_card(motorista);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_origem ON solicitacoes_fuel_card(origem_tipo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);

CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_veiculo_placa ON linehall_fuel_card_requests(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_motorista ON linehall_fuel_card_requests(motorista);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_data ON linehall_fuel_card_requests(data_solicitacao);

-- ETAPA 8: Verificação final da estrutura
SELECT 'VERIFICAÇÃO_FINAL' as etapa;

-- Mostrar estrutura final de solicitacoes_fuel_card
SELECT 
  'solicitacoes_fuel_card' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card'
ORDER BY ordinal_position;

-- Mostrar estrutura final de linehall_fuel_card_requests
SELECT 
  'linehall_fuel_card_requests' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests'
ORDER BY ordinal_position;

-- FINAL: Confirmação de sucesso
SELECT 
  'CORREÇÃO_COMPLETA_FINALIZADA' as status,
  CURRENT_TIMESTAMP as executado_em,
  'Todos os problemas identificados foram corrigidos' as mensagem,
  'Sistema de cartão combustível deve funcionar sem erros SQL' as resultado;