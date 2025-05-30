-- Script para verificar e corrigir a estrutura das tabelas de cartão combustível

-- 1. Verificar estrutura da tabela solicitacoes_fuel_card
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card' 
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela linehall_fuel_card_requests
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'linehall_fuel_card_requests' 
ORDER BY ordinal_position;

-- 3. Verificar se existem dados nas tabelas
SELECT 'solicitacoes_fuel_card' as tabela, COUNT(*) as total_registros
FROM solicitacoes_fuel_card
UNION ALL
SELECT 'linehall_fuel_card_requests' as tabela, COUNT(*) as total_registros
FROM linehall_fuel_card_requests;

-- 4. Testar a query unificada
SELECT 
  id,
  placa,
  motorista,
  valor_solicitado,
  status,
  origem_tipo,
  base
FROM (
  SELECT 
    id,
    placa,
    motorista,
    valor_solicitado,
    status,
    base,
    'tradicional' as origem_tipo
  FROM solicitacoes_fuel_card
  
  UNION ALL
  
  SELECT 
    id,
    veiculo_placa as placa,
    motorista_nome as motorista,
    COALESCE(valor_calculado::numeric, 0) as valor_solicitado,
    status,
    'Line Hall Shopee' as base,
    'line_hall' as origem_tipo
  FROM linehall_fuel_card_requests
) unified_requests
ORDER BY id DESC
LIMIT 5;