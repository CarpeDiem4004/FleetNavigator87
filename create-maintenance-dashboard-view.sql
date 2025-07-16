-- View para consolidar dados de manutenção para o painel operacional
-- Esta view combina dados de múltiplas tabelas de manutenção

CREATE OR REPLACE VIEW painel_manutencao_resumo AS
WITH todas_manutencoes AS (
  -- Dados da tabela principal manutencao
  SELECT 
    m.id,
    CASE 
      WHEN m.oficina_id = 2 THEN 'Oficina Alair'
      WHEN m.oficina_id = 6 THEN 'Oficina Murici'
      ELSE COALESCE(w.nome, 'Oficina não identificada')
    END as oficina,
    m.status,
    CASE 
      WHEN m.status = 'concluido' THEN 'Finalizada'
      WHEN m.status IN ('pendente', 'em_andamento', 'aguardando_pecas') THEN 'Em andamento'
      ELSE m.status
    END as status_display,
    COALESCE(m.custo, 0) as valor_total,
    COALESCE(v.plate, m.placa) as placa,
    m.created_at as data_inicio,
    m.data_conclusao as data_fim,
    v.model as modelo_veiculo,
    v.brand as marca_veiculo,
    EXTRACT(DAY FROM (COALESCE(m.data_conclusao, NOW()) - m.created_at)) as dias_em_manutencao,
    m.descricao
  FROM manutencao m
  LEFT JOIN workshops w ON m.oficina_id = w.id
  LEFT JOIN vehicles v ON m.veiculo_id = v.id
  WHERE m.oficina_id IN (2, 6) -- Apenas Alair e Murici
  
  UNION ALL
  
  -- Dados da tabela específica da Oficina Murici
  SELECT 
    om.id + 100000 as id, -- Offset para evitar conflito de IDs
    'Oficina Murici' as oficina,
    om.status,
    CASE 
      WHEN om.status = 'concluido' THEN 'Finalizada'
      WHEN om.status IN ('pendente', 'em_andamento', 'aguardando_pecas') THEN 'Em andamento'
      ELSE om.status
    END as status_display,
    COALESCE(om.custo_total, 0) as valor_total,
    om.placa,
    om.created_at as data_inicio,
    om.data_hora_fim as data_fim,
    om.marca as marca_veiculo,
    om.modelo as modelo_veiculo,
    EXTRACT(DAY FROM (COALESCE(om.data_hora_fim, NOW()) - om.created_at)) as dias_em_manutencao,
    om.descricao_problema as descricao
  FROM oficina_murici_manutencoes om
)
SELECT 
  oficina,
  status,
  status_display,
  COUNT(*) as total_manutencoes,
  SUM(valor_total) as valor_total,
  AVG(dias_em_manutencao) as tempo_medio_dias,
  COUNT(CASE WHEN dias_em_manutencao > 5 THEN 1 END) as veiculos_mais_5_dias
FROM todas_manutencoes
GROUP BY oficina, status, status_display;

-- View detalhada para veículos em manutenção
CREATE OR REPLACE VIEW painel_manutencao_detalhes AS
WITH todas_manutencoes AS (
  -- Dados da tabela principal manutencao
  SELECT 
    m.id,
    CASE 
      WHEN m.oficina_id = 2 THEN 'Oficina Alair'
      WHEN m.oficina_id = 6 THEN 'Oficina Murici'
      ELSE COALESCE(w.nome, 'Oficina não identificada')
    END as oficina,
    m.status,
    COALESCE(m.custo, 0) as valor_total,
    COALESCE(v.plate, m.placa) as placa,
    m.created_at as data_entrada,
    m.data_conclusao as data_saida,
    v.model as modelo,
    v.brand as marca,
    EXTRACT(DAY FROM (COALESCE(m.data_conclusao, NOW()) - m.created_at)) as dias_parado,
    m.descricao,
    m.veiculo_id
  FROM manutencao m
  LEFT JOIN workshops w ON m.oficina_id = w.id
  LEFT JOIN vehicles v ON m.veiculo_id = v.id
  WHERE m.oficina_id IN (2, 6)
  
  UNION ALL
  
  -- Dados da tabela específica da Oficina Murici
  SELECT 
    om.id + 100000 as id,
    'Oficina Murici' as oficina,
    om.status,
    COALESCE(om.custo_total, 0) as valor_total,
    om.placa,
    om.created_at as data_entrada,
    om.data_hora_fim as data_saida,
    om.modelo,
    om.marca,
    EXTRACT(DAY FROM (COALESCE(om.data_hora_fim, NOW()) - om.created_at)) as dias_parado,
    om.descricao_problema as descricao,
    NULL as veiculo_id
  FROM oficina_murici_manutencoes om
)
SELECT * FROM todas_manutencoes
ORDER BY data_entrada DESC;

-- View para KPIs do painel
CREATE OR REPLACE VIEW painel_manutencao_kpis AS
SELECT 
  -- Total de veículos em manutenção
  COUNT(CASE WHEN status IN ('pendente', 'em_andamento', 'aguardando_pecas') THEN 1 END) as veiculos_em_manutencao,
  
  -- Total de manutenções concluídas
  COUNT(CASE WHEN status = 'concluido' THEN 1 END) as manutencoes_concluidas,
  
  -- Tempo médio de manutenção (em dias)
  ROUND(AVG(CASE 
    WHEN status = 'concluido' AND data_saida IS NOT NULL 
    THEN EXTRACT(DAY FROM (data_saida - data_entrada))
    ELSE NULL
  END), 1) as tempo_medio_dias,
  
  -- Veículos parados há mais de 5 dias
  COUNT(CASE 
    WHEN status IN ('pendente', 'em_andamento', 'aguardando_pecas') 
    AND dias_parado > 5 
    THEN 1 
  END) as veiculos_mais_5_dias,
  
  -- Custo total de manutenção
  SUM(valor_total) as custo_total,
  
  -- Custo médio por manutenção
  ROUND(AVG(valor_total), 2) as custo_medio
FROM painel_manutencao_detalhes;

-- View para análise por oficina
CREATE OR REPLACE VIEW painel_manutencao_por_oficina AS
SELECT 
  oficina,
  COUNT(CASE WHEN status IN ('pendente', 'em_andamento', 'aguardando_pecas') THEN 1 END) as em_andamento,
  COUNT(CASE WHEN status = 'concluido' THEN 1 END) as finalizadas,
  SUM(valor_total) as valor_total,
  ROUND(AVG(dias_parado), 1) as tempo_medio_dias,
  COUNT(CASE WHEN dias_parado > 5 AND status IN ('pendente', 'em_andamento', 'aguardando_pecas') THEN 1 END) as veiculos_atrasados
FROM painel_manutencao_detalhes
GROUP BY oficina
ORDER BY oficina;