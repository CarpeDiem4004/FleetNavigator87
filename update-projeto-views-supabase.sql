-- SQL para corrigir a exibição do campo projeto no Supabase
-- Este script atualiza todas as views de histórico consolidado para considerar
-- tanto o campo "project" quanto "projeto" em todas as tabelas

-- Função para criar ou substituir a view de histórico consolidado
CREATE OR REPLACE FUNCTION update_historico_consolidado_view() RETURNS VOID AS $$
BEGIN
    -- Remover a view existente se existir
    DROP VIEW IF EXISTS historico_consolidado_abastecimentos;
    
    -- Criar a nova view com tratamento correto para o campo projeto
    EXECUTE '
    CREATE VIEW historico_consolidado_abastecimentos AS
    
    -- Campinas V2
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
        COALESCE(projeto, project, ''Não definido'') AS projeto,
        to_char(created_at, ''DD/MM/YYYY HH24:MI'') AS data_hora,
        created_at,
        ''Campinas_v2'' AS posto
    FROM abastecimentos_posto_campinas_v2
    
    UNION ALL
    
    -- Osasco V2
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
        COALESCE(projeto, project, ''Não definido'') AS projeto,
        to_char(created_at, ''DD/MM/YYYY HH24:MI'') AS data_hora,
        created_at,
        ''Osasco_v2'' AS posto
    FROM abastecimentos_posto_osasco_v2
    
    UNION ALL
    
    -- ABC V2
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
        COALESCE(projeto, project, ''Não definido'') AS projeto,
        to_char(created_at, ''DD/MM/YYYY HH24:MI'') AS data_hora,
        created_at,
        ''ABC_v2'' AS posto
    FROM abastecimentos_posto_abc_v2
    
    UNION ALL
    
    -- Alair V2 (se existir)
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
        COALESCE(projeto, project, ''Não definido'') AS projeto,
        to_char(created_at, ''DD/MM/YYYY HH24:MI'') AS data_hora,
        created_at,
        ''Alair_v2'' AS posto
    FROM abastecimentos_posto_alair_v2
    
    ORDER BY created_at DESC;
    ';
    
    -- Informar que a view foi atualizada
    RAISE NOTICE 'View de histórico consolidado atualizada com sucesso';
END;
$$ LANGUAGE plpgsql;

-- Executar a função para atualizar a view
SELECT update_historico_consolidado_view();