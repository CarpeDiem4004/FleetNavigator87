-- Primeiro, vamos verificar se a tabela configuracao_tanques_socorro_v2 existe
-- e quais são as colunas exatas

-- Comentado para referência ao executar no Supabase SQL Editor
/*
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'configuracao_tanques_socorro_v2'
ORDER BY ordinal_position;
*/

-- Remove a view existente
DROP VIEW IF EXISTS status_tanques_socorro_v2;

-- Cria a view com base na estrutura real da tabela
-- Ajuste os nomes das colunas conforme necessário
CREATE VIEW status_tanques_socorro_v2 AS
SELECT
  t.id,
  t.tipo_combustivel,
  t.capacidade_total,
  t.nivel_atual,
  t.valor_litro,
  ROUND((t.nivel_atual / t.capacidade_total) * 100) AS percentual,
  (
    SELECT COALESCE(SUM(litros), 0)
    FROM abastecimentos_posto_socorro_v2
    WHERE tipo_combustivel = t.tipo_combustivel
    AND created_at > (CURRENT_DATE - INTERVAL '30 days')
  ) AS consumo_mensal
FROM configuracao_tanques_socorro_v2 t;

-- Verifique se a view foi criada corretamente
/*
SELECT * FROM status_tanques_socorro_v2;
*/