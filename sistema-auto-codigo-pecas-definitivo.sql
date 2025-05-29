-- =====================================================
-- SISTEMA COMPLETO: AUTO-GERAÇÃO DE CÓDIGOS PARA PEÇAS
-- ANÁLISE: Sistema possui duas tabelas (estoque_pecas e frota_estoque_pecas)
-- =====================================================

-- 1. ATUALIZAR FUNÇÃO DE GERAÇÃO PARA AMBAS AS TABELAS
CREATE OR REPLACE FUNCTION generate_part_code_universal(categoria_input VARCHAR DEFAULT NULL, tabela_origem VARCHAR DEFAULT 'estoque_pecas')
RETURNS VARCHAR AS $$
DECLARE
    categoria_upper VARCHAR;
    next_number INTEGER;
    codigo_gerado VARCHAR;
    query_text TEXT;
BEGIN
    -- Se não foi fornecida categoria, usar 'GERAL'
    IF categoria_input IS NULL OR categoria_input = '' THEN
        categoria_upper := 'GERAL';
    ELSE
        categoria_upper := UPPER(categoria_input);
    END IF;
    
    -- Construir query dinâmica baseada na tabela
    IF tabela_origem = 'frota_estoque_pecas' THEN
        query_text := 'SELECT COALESCE(MAX(
            CASE 
                WHEN codigo ~ (''^'' || $1 || ''[0-9]+$'') 
                THEN CAST(SUBSTRING(codigo FROM LENGTH($1) + 1) AS INTEGER)
                ELSE 0
            END
        ), 0) + 1 FROM frota_estoque_pecas WHERE UPPER(categoria) = $1 OR categoria IS NULL';
    ELSE
        query_text := 'SELECT COALESCE(MAX(
            CASE 
                WHEN codigo ~ (''^'' || $1 || ''[0-9]+$'') 
                THEN CAST(SUBSTRING(codigo FROM LENGTH($1) + 1) AS INTEGER)
                ELSE 0
            END
        ), 0) + 1 FROM estoque_pecas WHERE UPPER(categoria) = $1 OR categoria IS NULL';
    END IF;
    
    EXECUTE query_text INTO next_number USING categoria_upper;
    
    -- Gerar código no formato CATEGORIA001, CATEGORIA002, etc.
    codigo_gerado := categoria_upper || LPAD(next_number::TEXT, 3, '0');
    
    RETURN codigo_gerado;
END;
$$ LANGUAGE plpgsql;

-- 2. ATUALIZAR FUNÇÃO TRIGGER PARA estoque_pecas
CREATE OR REPLACE FUNCTION auto_generate_part_code_estoque()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o código não foi fornecido ou está vazio, gerar automaticamente
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generate_part_code_universal(NEW.categoria, 'estoque_pecas');
    END IF;
    
    -- Garantir que updated_at seja atualizado
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR FUNÇÃO TRIGGER PARA frota_estoque_pecas
CREATE OR REPLACE FUNCTION auto_generate_part_code_frota()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o código não foi fornecido ou está vazio, gerar automaticamente
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generate_part_code_universal(NEW.categoria, 'frota_estoque_pecas');
    END IF;
    
    -- Garantir que ultima_atualizacao seja atualizado
    NEW.ultima_atualizacao := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. REMOVER TRIGGERS EXISTENTES E RECRIAR
DROP TRIGGER IF EXISTS trigger_auto_generate_part_code ON estoque_pecas;
DROP TRIGGER IF EXISTS trigger_update_part_timestamp ON estoque_pecas;
DROP TRIGGER IF EXISTS trigger_auto_generate_frota_code ON frota_estoque_pecas;

-- 5. CRIAR TRIGGERS PARA ESTOQUE_PECAS
CREATE TRIGGER trigger_auto_generate_part_code
    BEFORE INSERT ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code_estoque();

CREATE TRIGGER trigger_update_part_timestamp
    BEFORE UPDATE ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code_estoque();

-- 6. CRIAR TRIGGERS PARA FROTA_ESTOQUE_PECAS
CREATE TRIGGER trigger_auto_generate_frota_code
    BEFORE INSERT ON frota_estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code_frota();

CREATE TRIGGER trigger_update_frota_timestamp
    BEFORE UPDATE ON frota_estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code_frota();

-- 7. ADICIONAR CONSTRAINT UNIQUE PARA frota_estoque_pecas (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'frota_estoque_pecas' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'frota_estoque_pecas_codigo_unique'
    ) THEN
        ALTER TABLE frota_estoque_pecas ADD CONSTRAINT frota_estoque_pecas_codigo_unique UNIQUE (codigo);
    END IF;
END $$;

-- 8. FUNÇÕES AUXILIARES PARA AMBAS AS TABELAS

-- Verificar se código já existe em qualquer tabela
CREATE OR REPLACE FUNCTION check_code_exists_anywhere(codigo_input VARCHAR)
RETURNS TABLE(
    existe_estoque BOOLEAN,
    existe_frota BOOLEAN,
    total_usos INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT 
        EXISTS(SELECT 1 FROM estoque_pecas WHERE codigo = codigo_input) as existe_estoque,
        EXISTS(SELECT 1 FROM frota_estoque_pecas WHERE codigo = codigo_input) as existe_frota,
        (SELECT COUNT(*)::INTEGER FROM (
            SELECT codigo FROM estoque_pecas WHERE codigo = codigo_input
            UNION ALL
            SELECT codigo FROM frota_estoque_pecas WHERE codigo = codigo_input
        ) as combined) as total_usos;
END;
$$ LANGUAGE plpgsql;

-- Regenerar códigos ausentes em ambas as tabelas
CREATE OR REPLACE FUNCTION regenerate_all_missing_codes()
RETURNS TABLE(
    tabela VARCHAR,
    id INTEGER,
    codigo_antigo VARCHAR,
    codigo_novo VARCHAR,
    nome VARCHAR,
    categoria VARCHAR
) AS $$
DECLARE
    peca_estoque RECORD;
    peca_frota RECORD;
    novo_codigo VARCHAR;
BEGIN
    -- Processar tabela estoque_pecas
    FOR peca_estoque IN SELECT * FROM estoque_pecas WHERE codigo IS NULL OR codigo = '' ORDER BY id
    LOOP
        novo_codigo := generate_part_code_universal(peca_estoque.categoria, 'estoque_pecas');
        
        UPDATE estoque_pecas 
        SET codigo = novo_codigo, updated_at = CURRENT_TIMESTAMP
        WHERE estoque_pecas.id = peca_estoque.id;
        
        RETURN QUERY SELECT 
            'estoque_pecas'::VARCHAR,
            peca_estoque.id,
            peca_estoque.codigo::VARCHAR,
            novo_codigo::VARCHAR,
            peca_estoque.nome::VARCHAR,
            peca_estoque.categoria::VARCHAR;
    END LOOP;
    
    -- Processar tabela frota_estoque_pecas
    FOR peca_frota IN SELECT * FROM frota_estoque_pecas WHERE codigo IS NULL OR codigo = '' ORDER BY id
    LOOP
        novo_codigo := generate_part_code_universal(peca_frota.categoria, 'frota_estoque_pecas');
        
        UPDATE frota_estoque_pecas 
        SET codigo = novo_codigo, ultima_atualizacao = CURRENT_TIMESTAMP
        WHERE frota_estoque_pecas.id = peca_frota.id;
        
        RETURN QUERY SELECT 
            'frota_estoque_pecas'::VARCHAR,
            peca_frota.id,
            peca_frota.codigo::VARCHAR,
            novo_codigo::VARCHAR,
            peca_frota.nome::VARCHAR,
            peca_frota.categoria::VARCHAR;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA LISTAR ESTATÍSTICAS DO SISTEMA
CREATE OR REPLACE FUNCTION parts_statistics()
RETURNS TABLE(
    tabela VARCHAR,
    total_pecas INTEGER,
    pecas_com_codigo INTEGER,
    pecas_sem_codigo INTEGER,
    categorias_distintas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'estoque_pecas'::VARCHAR,
        COUNT(*)::INTEGER as total_pecas,
        COUNT(CASE WHEN codigo IS NOT NULL AND codigo != '' THEN 1 END)::INTEGER as pecas_com_codigo,
        COUNT(CASE WHEN codigo IS NULL OR codigo = '' THEN 1 END)::INTEGER as pecas_sem_codigo,
        COUNT(DISTINCT categoria)::INTEGER as categorias_distintas
    FROM estoque_pecas
    
    UNION ALL
    
    SELECT 
        'frota_estoque_pecas'::VARCHAR,
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN codigo IS NOT NULL AND codigo != '' THEN 1 END)::INTEGER,
        COUNT(CASE WHEN codigo IS NULL OR codigo = '' THEN 1 END)::INTEGER,
        COUNT(DISTINCT categoria)::INTEGER
    FROM frota_estoque_pecas;
END;
$$ LANGUAGE plpgsql;

-- 10. TESTE COMPLETO DO SISTEMA
DO $$
DECLARE
    teste_codigo_estoque VARCHAR;
    teste_codigo_frota VARCHAR;
    stats RECORD;
BEGIN
    -- Testar geração para estoque_pecas
    SELECT generate_part_code_universal('Teste', 'estoque_pecas') INTO teste_codigo_estoque;
    RAISE NOTICE 'Código gerado para estoque_pecas categoria Teste: %', teste_codigo_estoque;
    
    -- Testar geração para frota_estoque_pecas
    SELECT generate_part_code_universal('Teste', 'frota_estoque_pecas') INTO teste_codigo_frota;
    RAISE NOTICE 'Código gerado para frota_estoque_pecas categoria Teste: %', teste_codigo_frota;
    
    -- Mostrar estatísticas
    FOR stats IN SELECT * FROM parts_statistics() LOOP
        RAISE NOTICE 'Tabela: % - Total: % peças, Com código: %, Sem código: %, Categorias: %', 
            stats.tabela, stats.total_pecas, stats.pecas_com_codigo, stats.pecas_sem_codigo, stats.categorias_distintas;
    END LOOP;
    
    RAISE NOTICE 'Sistema de auto-geração de códigos instalado com sucesso para ambas as tabelas!';
END $$;

-- =====================================================
-- EXEMPLOS DE USO APÓS INSTALAÇÃO:
-- =====================================================

-- Para estoque_pecas (código gerado automaticamente):
-- INSERT INTO estoque_pecas (nome, categoria, preco_unitario) 
-- VALUES ('Nova Peça Estoque', 'Motor', 25.00);

-- Para frota_estoque_pecas (código gerado automaticamente):
-- INSERT INTO frota_estoque_pecas (nome, categoria, valor_unitario) 
-- VALUES ('Nova Peça Frota', 'Motor', 35.00);

-- Verificar estatísticas:
-- SELECT * FROM parts_statistics();

-- Regenerar códigos ausentes:
-- SELECT * FROM regenerate_all_missing_codes();

-- Verificar se código existe em alguma tabela:
-- SELECT * FROM check_code_exists_anywhere('MOTOR001');

-- =====================================================
-- FIM DO SCRIPT DEFINITIVO
-- =====================================================