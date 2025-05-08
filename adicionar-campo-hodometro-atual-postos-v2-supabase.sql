-- Script para adicionar o campo hodometro_atual em todas as tabelas de postos v2 existentes no Supabase

-- Função para adicionar a coluna hodometro_atual se ela não existir
CREATE OR REPLACE FUNCTION adicionar_hodometro_atual_se_nao_existir(IN tabela text) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = tabela
    AND column_name = 'hodometro_atual'
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN hodometro_atual INTEGER;', tabela);
    RAISE NOTICE 'Campo hodometro_atual adicionado na tabela %', tabela;
  ELSE
    RAISE NOTICE 'Campo hodometro_atual já existe na tabela %', tabela;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Lista de tabelas a serem verificadas
DO $$
DECLARE
  tabela_posto text;
BEGIN
  -- Lista de prefixos de postos a serem verificados
  FOR tabela_posto IN
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'abastecimentos_posto_%'
    AND table_name NOT LIKE '%_consolidado'
    AND table_name NOT LIKE '%_estatisticas_mensais'
    AND table_name NOT LIKE '%_consumo_por_veiculo'
    AND table_name NOT LIKE '%_comparativo_combustiveis'
    AND table_name NOT LIKE '%_ultimos%'
  LOOP
    PERFORM adicionar_hodometro_atual_se_nao_existir(tabela_posto);
  END LOOP;
END;
$$;

-- Após adicionar a coluna às tabelas, atualize as views consolidadas
DO $$
DECLARE
  v_posto text;
  v_sql text;
BEGIN
  -- Obter todos os postos v2 da tabela abastecimentos
  FOR v_posto IN
    SELECT DISTINCT SUBSTRING(table_name FROM 'abastecimentos_posto_(.+)') AS posto_nome
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'abastecimentos_posto_%_v2'
    AND table_name NOT LIKE '%_consolidado'
    AND table_name NOT LIKE '%_estatisticas_mensais'
    AND table_name NOT LIKE '%_consumo_por_veiculo'
    AND table_name NOT LIKE '%_comparativo_combustiveis'
    AND table_name NOT LIKE '%_ultimos%'
  LOOP
    -- Verificar se já existe a view consolidada
    IF EXISTS (
      SELECT FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'abastecimentos_posto_' || v_posto || '_consolidado'
    ) THEN
      -- Recriar a view consolidada incluindo hodometro_atual
      v_sql := '
        CREATE OR REPLACE VIEW abastecimentos_posto_' || v_posto || '_consolidado AS
        SELECT
          id,
          placa,
          km_atual AS km,
          hodometro_atual,
          tipo_combustivel,
          litros AS quantidade_litros,
          motorista AS nome_motorista,
          motorista_rg AS rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          TO_CHAR(created_at, ''DD/MM/YYYY HH24:MI'') AS data_hora,
          created_at
        FROM abastecimentos_posto_' || v_posto || '
        ORDER BY created_at DESC;
      ';
      
      EXECUTE v_sql;
      RAISE NOTICE 'View consolidada atualizada para o posto %', v_posto;
    END IF;
  END LOOP;
END;
$$;