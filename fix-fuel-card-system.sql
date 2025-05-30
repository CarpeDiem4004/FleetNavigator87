-- Script para corrigir e otimizar o sistema de cartão combustível

-- 1. Adicionar campos faltantes na tabela solicitacoes_fuel_card se não existirem
DO $$ 
BEGIN
    -- Verificar e adicionar campo origem_tipo se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='solicitacoes_fuel_card' AND column_name='origem_tipo') THEN
        ALTER TABLE solicitacoes_fuel_card ADD COLUMN origem_tipo VARCHAR(20) DEFAULT 'tradicional';
    END IF;
END $$;

-- 2. Padronizar status entre as tabelas
UPDATE solicitacoes_fuel_card 
SET status = 'Pendente' 
WHERE status IN ('pendente', 'pending');

UPDATE solicitacoes_fuel_card 
SET status = 'Em Análise' 
WHERE status = 'em_analise';

UPDATE solicitacoes_fuel_card 
SET status = 'Recarga Efetuada' 
WHERE status IN ('atendido', 'aprovada', 'approved');

UPDATE solicitacoes_fuel_card 
SET status = 'Negado' 
WHERE status IN ('rejeitado', 'rejected', 'rejeitada');

-- 3. Corrigir motor_id duplicado na tabela Line Hall
UPDATE linehall_fuel_card_requests 
SET motorista_id = id 
WHERE motorista_id IS NULL OR motorista_id = id;

-- 4. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_data ON linehall_fuel_card_requests(data_solicitacao);

-- 5. Criar view unificada para facilitar consultas
CREATE OR REPLACE VIEW vw_fuel_card_requests_unified AS
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
  'tradicional' as origem_tipo,
  -- Campos específicos do Line Hall (NULL para solicitações tradicionais)
  NULL as veiculo_modelo,
  NULL as rota_origem,
  NULL as rota_destino,
  km as km_total,
  NULL as telefone_motorista,
  NULL as horario_abastecimento,
  NULL as valor_calculado,
  NULL as calculo_detalhes
FROM solicitacoes_fuel_card

UNION ALL

SELECT 
  id,
  veiculo_placa as placa,
  km_total as km,
  'Line Hall' as tipo_cartao,
  'Line Hall Shopee' as provedor_cartao,
  '' as numero_cartao,
  motorista_nome as motorista,
  CONCAT('Rota: ', COALESCE(rota_origem, 'N/I'), ' → ', COALESCE(rota_destino, 'N/I'), 
         ' | Tel: ', telefone_motorista, ' | Horário: ', 
         CASE WHEN horario_abastecimento = 'antes_17h' THEN 'Antes das 17h' 
              ELSE 'Após 18h' END) as observacoes,
  CASE 
    WHEN status = 'pendente' THEN 'Pendente'
    WHEN status = 'aprovada' THEN 'Recarga Efetuada'
    WHEN status = 'rejeitada' THEN 'Negado'
    ELSE status
  END as status,
  (data_solicitacao::date + horario_solicitacao::time)::timestamp as data_solicitacao,
  operador_aprovacao as atendido_por,
  updated_at as data_atendimento,
  created_at,
  updated_at,
  COALESCE(valor_calculado, 0) as valor_solicitado,
  'Line Hall Shopee' as base,
  NULL as id_rota,
  'line_hall' as origem_tipo,
  -- Campos específicos do Line Hall
  veiculo_modelo,
  rota_origem,
  rota_destino,
  km_total,
  telefone_motorista,
  horario_abastecimento,
  valor_calculado,
  CASE 
    WHEN valor_calculado IS NOT NULL THEN
      JSON_BUILD_OBJECT(
        'km_rota', km_total,
        'km_acrescimo', 30,
        'km_total', km_total + 30,
        'consumo_medio', 8,
        'litros_necessarios', ROUND((km_total + 30) / 8.0, 2),
        'valor_por_litro', 6.50,
        'valor_total', valor_calculado
      )
    ELSE NULL
  END as calculo_detalhes
FROM linehall_fuel_card_requests;

-- 6. Verificar se tudo está funcionando
SELECT 
  origem_tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'Recarga Efetuada' THEN 1 END) as atendidas
FROM vw_fuel_card_requests_unified
GROUP BY origem_tipo;

-- 7. Listar as últimas 5 solicitações para teste
SELECT 
  id, 
  placa, 
  motorista, 
  origem_tipo, 
  status, 
  valor_solicitado,
  base
FROM vw_fuel_card_requests_unified
ORDER BY data_solicitacao DESC
LIMIT 5;