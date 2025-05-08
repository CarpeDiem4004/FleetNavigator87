-- Script para verificar a estrutura de todas as tabelas de postos v2 e garantir que estejam corretas

-- Função para verificar e, se necessário, criar todas as views para um posto
CREATE OR REPLACE FUNCTION verificar_criar_views_para_posto(IN posto_nome text) RETURNS void AS $$
BEGIN
  RAISE NOTICE 'Verificando views para o posto %', posto_nome;
  
  -- Verificar e criar view de últimos abastecimentos
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'abastecimentos_posto_' || posto_nome || '_ultimos'
  ) THEN
    EXECUTE format('
      CREATE OR REPLACE VIEW abastecimentos_posto_%1$s_ultimos AS
      SELECT * FROM abastecimentos_posto_%1$s
      ORDER BY created_at DESC
      LIMIT 10;
    ', posto_nome);
    RAISE NOTICE 'Criada view de últimos abastecimentos para %', posto_nome;
  END IF;
  
  -- Verificar e criar view consolidada
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'abastecimentos_posto_' || posto_nome || '_consolidado'
  ) THEN
    EXECUTE format('
      CREATE OR REPLACE VIEW abastecimentos_posto_%1$s_consolidado AS
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
      FROM abastecimentos_posto_%1$s
      ORDER BY created_at DESC;
    ', posto_nome);
    RAISE NOTICE 'Criada view consolidada para %', posto_nome;
  END IF;
  
  -- Verificar e criar view de estatísticas mensais
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'abastecimentos_posto_' || posto_nome || '_estatisticas_mensais'
  ) THEN
    EXECUTE format('
      CREATE OR REPLACE VIEW abastecimentos_posto_%1$s_estatisticas_mensais AS
      SELECT
        EXTRACT(YEAR FROM created_at) AS ano,
        EXTRACT(MONTH FROM created_at) AS mes,
        TO_CHAR(DATE_TRUNC(''month'', created_at), ''TMMonth/YYYY'') AS periodo,
        COALESCE(SUM(CASE WHEN tipo_combustivel = ''Diesel'' THEN litros ELSE 0 END), 0) AS volume_diesel,
        COALESCE(SUM(CASE WHEN tipo_combustivel = ''ARLA'' THEN litros ELSE 0 END), 0) AS volume_arla,
        COALESCE(SUM(CASE WHEN tipo_combustivel = ''Diesel'' THEN valor_total ELSE 0 END), 0) AS valor_diesel,
        COALESCE(SUM(CASE WHEN tipo_combustivel = ''ARLA'' THEN valor_total ELSE 0 END), 0) AS valor_arla,
        COUNT(DISTINCT placa) AS qtd_veiculos,
        COUNT(*) AS qtd_abastecimentos
      FROM abastecimentos_posto_%1$s
      GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), TO_CHAR(DATE_TRUNC(''month'', created_at), ''TMMonth/YYYY'')
      ORDER BY ano DESC, mes DESC;
    ', posto_nome);
    RAISE NOTICE 'Criada view de estatísticas mensais para %', posto_nome;
  END IF;
  
  -- Verificar e criar view de consumo por veículo
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'abastecimentos_posto_' || posto_nome || '_consumo_por_veiculo'
  ) THEN
    EXECUTE format('
      CREATE OR REPLACE VIEW abastecimentos_posto_%1$s_consumo_por_veiculo AS
      SELECT
        placa,
        COUNT(*) AS qtd_abastecimentos,
        SUM(CASE WHEN tipo_combustivel = ''Diesel'' THEN litros ELSE 0 END) AS total_litros,
        SUM(CASE WHEN tipo_combustivel = ''Diesel'' THEN valor_total ELSE 0 END) AS total_valor,
        MAX(created_at) AS ultimo_abastecimento
      FROM abastecimentos_posto_%1$s
      GROUP BY placa
      ORDER BY total_litros DESC;
    ', posto_nome);
    RAISE NOTICE 'Criada view de consumo por veículo para %', posto_nome;
  END IF;
  
  -- Verificar e criar view de comparativo de combustíveis
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'abastecimentos_posto_' || posto_nome || '_comparativo_combustiveis'
  ) THEN
    EXECUTE format('
      CREATE OR REPLACE VIEW abastecimentos_posto_%1$s_comparativo_combustiveis AS
      SELECT
        tipo_combustivel,
        COUNT(*) AS qtd_abastecimentos,
        SUM(litros) AS total_litros,
        SUM(valor_total) AS total_valor,
        ROUND(AVG(valor_litro), 2) AS media_valor_litro,
        COUNT(DISTINCT placa) AS qtd_veiculos
      FROM abastecimentos_posto_%1$s
      GROUP BY tipo_combustivel
      ORDER BY total_litros DESC;
    ', posto_nome);
    RAISE NOTICE 'Criada view de comparativo de combustíveis para %', posto_nome;
  END IF;
  
  -- Verificar e criar view de status dos tanques
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'view_' || posto_nome || '_status_tanques'
  ) AND EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'configuracao_tanques_' || posto_nome
  ) THEN
    EXECUTE format('
      CREATE OR REPLACE VIEW view_%1$s_status_tanques AS
      SELECT
        diesel_capacidade::NUMERIC AS diesel_capacidade,
        diesel_nivel::NUMERIC AS diesel_nivel,
        arla_capacidade::NUMERIC AS arla_capacidade,
        arla_nivel::NUMERIC AS arla_nivel,
        diesel_valor_litro::NUMERIC AS diesel_valor_litro,
        arla_valor_litro::NUMERIC AS arla_valor_litro,
        posto,
        ROUND((diesel_nivel::NUMERIC / diesel_capacidade::NUMERIC) * 100, 2) AS diesel_percentual,
        ROUND((arla_nivel::NUMERIC / arla_capacidade::NUMERIC) * 100, 2) AS arla_percentual,
        diesel_consumo_total::NUMERIC AS diesel_consumo_total,
        diesel_valor_total::NUMERIC AS diesel_valor_total,
        arla_consumo_total::NUMERIC AS arla_consumo_total,
        arla_valor_total::NUMERIC AS arla_valor_total
      FROM configuracao_tanques_%1$s
      WHERE posto = ''%1$s'';
    ', posto_nome);
    RAISE NOTICE 'Criada view de status dos tanques para %', posto_nome;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Verificar todas as tabelas de postos v2
DO $$
DECLARE
  posto_name text;
BEGIN
  -- Obter todos os postos v2
  FOR posto_name IN
    SELECT DISTINCT
      SUBSTRING(table_name FROM 'abastecimentos_posto_(.+)') AS posto_nome
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE 'abastecimentos_posto_%_v2'
    AND table_type = 'BASE TABLE'
  LOOP
    -- Verificar se a tabela configuracao_tanques existe para este posto
    IF NOT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'configuracao_tanques_' || posto_name
    ) THEN
      -- Criar a tabela de configuração de tanques
      EXECUTE format('
        CREATE TABLE configuracao_tanques_%1$s (
          id SERIAL PRIMARY KEY,
          posto VARCHAR(50) NOT NULL DEFAULT ''%1$s'',
          diesel_capacidade VARCHAR(20) NOT NULL DEFAULT ''20000'',
          diesel_nivel VARCHAR(20) NOT NULL DEFAULT ''10000'',
          arla_capacidade VARCHAR(20) NOT NULL DEFAULT ''1000'',
          arla_nivel VARCHAR(20) NOT NULL DEFAULT ''500'',
          diesel_valor_litro VARCHAR(20) NOT NULL DEFAULT ''5.00'',
          arla_valor_litro VARCHAR(20) NOT NULL DEFAULT ''3.00'',
          diesel_consumo_total VARCHAR(20) NOT NULL DEFAULT ''0.00'',
          diesel_valor_total VARCHAR(20) NOT NULL DEFAULT ''0.00'',
          arla_consumo_total VARCHAR(20) NOT NULL DEFAULT ''0.00'',
          arla_valor_total VARCHAR(20) NOT NULL DEFAULT ''0.00'',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        -- Inserir configuração inicial
        INSERT INTO configuracao_tanques_%1$s (
          posto, diesel_capacidade, diesel_nivel, arla_capacidade, arla_nivel,
          diesel_valor_litro, arla_valor_litro, diesel_consumo_total, diesel_valor_total,
          arla_consumo_total, arla_valor_total, created_at, updated_at
        ) VALUES (
          ''%1$s'', ''20000'', ''10000'', ''1000'', ''500'',
          ''5.00'', ''3.00'', ''0.00'', ''0.00'',
          ''0.00'', ''0.00'', NOW(), NOW()
        );
      ', posto_name);
      
      RAISE NOTICE 'Criada tabela de configuração de tanques para %', posto_name;
    END IF;
    
    -- Verificar se a tabela de movimentações de pátio existe
    IF NOT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'movimentacoes_patio_' || posto_name
    ) THEN
      -- Criar a tabela de movimentações de pátio
      EXECUTE format('
        CREATE TABLE movimentacoes_patio_%1$s (
          id SERIAL PRIMARY KEY,
          placa VARCHAR(10) NOT NULL,
          motorista VARCHAR(100) NOT NULL,
          tipo_veiculo VARCHAR(50) NOT NULL,
          tipo_operacao VARCHAR(20) NOT NULL,
          data_entrada TIMESTAMP,
          data_saida TIMESTAMP,
          observacoes TEXT,
          posto VARCHAR(50) NOT NULL DEFAULT ''%1$s'',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      ', posto_name);
      
      RAISE NOTICE 'Criada tabela de movimentações de pátio para %', posto_name;
    END IF;
    
    -- Verificar se a tabela de recebimentos existe
    IF NOT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'recebimentos_posto_' || posto_name
    ) THEN
      -- Criar a tabela de recebimentos
      EXECUTE format('
        CREATE TABLE recebimentos_posto_%1$s (
          id SERIAL PRIMARY KEY,
          tipo_combustivel VARCHAR(20) NOT NULL,
          quantidade NUMERIC(10,2) NOT NULL,
          valor_litro NUMERIC(10,3) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          fornecedor VARCHAR(100),
          nota_fiscal VARCHAR(30),
          observacoes TEXT,
          posto VARCHAR(50) NOT NULL DEFAULT ''%1$s'',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      ', posto_name);
      
      RAISE NOTICE 'Criada tabela de recebimentos para %', posto_name;
    END IF;
    
    -- Verificar/criar as views para este posto
    PERFORM verificar_criar_views_para_posto(posto_name);
  END LOOP;
END
$$;