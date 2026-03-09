-- CORREÇÃO DO ERRO DE SINTAXE: syntax error at or near "UNION" LINE 47
-- Este script corrige o erro de sintaxe na consulta UNION que estava causando falha

-- ETAPA 1: Testar a consulta UNION corrigida para fuel card requests
SELECT 'TESTE_CONSULTA_UNION_CORRIGIDA' as status;

-- Consulta UNION corrigida e completa
SELECT 
  id::text as id,
  placa,
  motorista,
  status,
  origem_tipo,
  data_solicitacao,
  valor_solicitado
FROM (
  -- Primeira parte: solicitações tradicionais
  SELECT 
    id::text as id,
    COALESCE(placa, veiculo_placa, 'SEM-PLACA') as placa,
    COALESCE(motorista, 'Motorista não informado') as motorista,
    status,
    COALESCE(origem_tipo, 'tradicional') as origem_tipo,
    data_solicitacao,
    COALESCE(valor_solicitado, 0) as valor_solicitado
  FROM solicitacoes_fuel_card
  WHERE status IS NOT NULL

  UNION ALL

  -- Segunda parte: Line Hall requests
  SELECT 
    id::text as id,
    COALESCE(veiculo_placa, 'LH-' || id) as placa,
    COALESCE(motorista, motorista_nome, 'Motorista não informado') as motorista,
    status,
    'line_hall' as origem_tipo,
    COALESCE((data_solicitacao + horario_solicitacao)::timestamp, created_at) as data_solicitacao,
    COALESCE(valor_calculado, 0) as valor_solicitado
  FROM linehall_fuel_card_requests
  WHERE status IS NOT NULL
) unified_requests
ORDER BY data_solicitacao DESC
LIMIT 20;

-- ETAPA 2: Verificar se as tabelas existem e têm as colunas necessárias
SELECT 'VERIFICACAO_TABELAS' as etapa;

-- Verificar estrutura da tabela solicitacoes_fuel_card
SELECT 
  'solicitacoes_fuel_card' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela linehall_fuel_card_requests
SELECT 
  'linehall_fuel_card_requests' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests'
ORDER BY ordinal_position;

-- ETAPA 3: Criar view para simplificar futuras consultas
CREATE OR REPLACE VIEW vw_fuel_requests_unified AS
SELECT 
  id::text as id,
  placa,
  motorista,
  status,
  origem_tipo,
  data_solicitacao,
  valor_solicitado,
  created_at
FROM (
  SELECT 
    id::text as id,
    COALESCE(placa, veiculo_placa, 'SEM-PLACA') as placa,
    COALESCE(motorista, 'Motorista não informado') as motorista,
    status,
    COALESCE(origem_tipo, 'tradicional') as origem_tipo,
    data_solicitacao,
    COALESCE(valor_solicitado, 0) as valor_solicitado,
    created_at
  FROM solicitacoes_fuel_card
  WHERE status IS NOT NULL

  UNION ALL

  SELECT 
    id::text as id,
    COALESCE(veiculo_placa, 'LH-' || id) as placa,
    COALESCE(motorista, motorista_nome, 'Motorista não informado') as motorista,
    status,
    'line_hall' as origem_tipo,
    COALESCE((data_solicitacao + horario_solicitacao)::timestamp, created_at) as data_solicitacao,
    COALESCE(valor_calculado, 0) as valor_solicitado,
    created_at
  FROM linehall_fuel_card_requests
  WHERE status IS NOT NULL
) unified_data;

-- ETAPA 4: Testar a view criada
SELECT 'TESTE_VIEW_CRIADA' as status;
SELECT COUNT(*) as total_registros FROM vw_fuel_requests_unified;

-- ETAPA 5: Confirmar correção
SELECT 
  'ERRO_UNION_CORRIGIDO' as status,
  CURRENT_TIMESTAMP as corrigido_em,
  'Sintaxe da consulta UNION corrigida e view criada' as mensagem;