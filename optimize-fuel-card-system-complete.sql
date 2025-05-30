-- =====================================================
-- SCRIPT COMPLETO DE OTIMIZAÇÃO DO SISTEMA DE CARTÃO COMBUSTÍVEL
-- Implementa integração Line Hall Shopee + correções de performance
-- =====================================================

-- ETAPA 1: Adicionar campo origem_tipo na tabela principal
ALTER TABLE solicitacoes_fuel_card 
ADD COLUMN IF NOT EXISTS origem_tipo VARCHAR(20) DEFAULT 'tradicional';

-- ETAPA 2: Padronizar status entre as tabelas
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

-- ETAPA 3: Corrigir dados duplicados na tabela Line Hall
UPDATE linehall_fuel_card_requests 
SET motorista_id = id 
WHERE motorista_id IS NULL OR motorista_id = id;

-- ETAPA 4: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_data ON linehall_fuel_card_requests(data_solicitacao);

-- ETAPA 5: Criar view consolidada para relatórios (opcional)
CREATE OR REPLACE VIEW vw_fuel_card_requests_consolidated AS
SELECT 
  id,
  placa,
  motorista,
  valor_solicitado,
  status,
  data_solicitacao,
  COALESCE(origem_tipo, 'tradicional') as origem_tipo,
  base,
  'Tradicional' as sistema_origem
FROM solicitacoes_fuel_card

UNION ALL

SELECT 
  id,
  veiculo_placa as placa,
  motorista_nome as motorista,
  valor_calculado as valor_solicitado,
  status,
  data_solicitacao,
  'line_hall' as origem_tipo,
  'Line Hall Shopee' as base,
  'Line Hall Shopee' as sistema_origem
FROM linehall_fuel_card_requests;

-- ETAPA 6: Verificar estrutura das tabelas
SELECT 
  'solicitacoes_fuel_card' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'Recarga Efetuada' THEN 1 END) as atendidas
FROM solicitacoes_fuel_card

UNION ALL

SELECT 
  'linehall_fuel_card_requests' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'atendido' THEN 1 END) as atendidas
FROM linehall_fuel_card_requests;

-- ETAPA 7: Criar função para calcular consumo de combustível (Line Hall)
CREATE OR REPLACE FUNCTION calcular_combustivel_line_hall(
  km_rota INTEGER,
  consumo_medio DECIMAL DEFAULT 8.0,
  valor_litro DECIMAL DEFAULT 6.50
) RETURNS JSON AS $$
DECLARE
  km_acrescimo INTEGER := 30;
  km_total INTEGER;
  litros_necessarios DECIMAL;
  valor_total DECIMAL;
BEGIN
  km_total := km_rota + km_acrescimo;
  litros_necessarios := km_total::DECIMAL / consumo_medio;
  valor_total := litros_necessarios * valor_litro;
  
  RETURN json_build_object(
    'km_rota', km_rota,
    'km_acrescimo', km_acrescimo,
    'km_total', km_total,
    'consumo_medio', consumo_medio,
    'litros_necessarios', ROUND(litros_necessarios, 2),
    'valor_por_litro', valor_litro,
    'valor_total', ROUND(valor_total, 2)
  );
END;
$$ LANGUAGE plpgsql;

-- ETAPA 8: Comentários e documentação
COMMENT ON TABLE solicitacoes_fuel_card IS 'Tabela principal para solicitações de cartão combustível tradicional';
COMMENT ON TABLE linehall_fuel_card_requests IS 'Tabela específica para solicitações Line Hall Shopee com cálculo automático';
COMMENT ON COLUMN solicitacoes_fuel_card.origem_tipo IS 'Identifica a origem da solicitação: tradicional ou line_hall';
COMMENT ON VIEW vw_fuel_card_requests_consolidated IS 'View consolidada que unifica solicitações tradicionais e Line Hall Shopee';

-- FINAL: Verificar se tudo foi aplicado corretamente
SELECT 
  'OTIMIZAÇÃO CONCLUÍDA' as status,
  CURRENT_TIMESTAMP as executado_em,
  'Sistema de cartão combustível otimizado com sucesso' as mensagem;