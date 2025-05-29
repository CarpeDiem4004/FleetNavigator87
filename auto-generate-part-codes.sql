-- Script para implementar auto-geração de códigos para peças
-- Este script adiciona uma função e trigger para gerar códigos automaticamente

-- 1. Criar função para gerar código automático baseado na categoria
CREATE OR REPLACE FUNCTION generate_part_code(categoria_input VARCHAR DEFAULT NULL)
RETURNS VARCHAR AS $$
DECLARE
    categoria_upper VARCHAR;
    next_number INTEGER;
    codigo_gerado VARCHAR;
BEGIN
    -- Se não foi fornecida categoria, usar 'GERAL'
    IF categoria_input IS NULL OR categoria_input = '' THEN
        categoria_upper := 'GERAL';
    ELSE
        categoria_upper := UPPER(categoria_input);
    END IF;
    
    -- Buscar o próximo número sequencial para a categoria
    SELECT COALESCE(MAX(
        CASE 
            WHEN codigo ~ ('^' || categoria_upper || '[0-9]+$') 
            THEN CAST(SUBSTRING(codigo FROM LENGTH(categoria_upper) + 1) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_number
    FROM estoque_pecas 
    WHERE UPPER(categoria) = categoria_upper OR categoria IS NULL;
    
    -- Gerar código no formato CATEGORIA001, CATEGORIA002, etc.
    codigo_gerado := categoria_upper || LPAD(next_number::TEXT, 3, '0');
    
    RETURN codigo_gerado;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar função trigger para auto-geração de código
CREATE OR REPLACE FUNCTION auto_generate_part_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o código não foi fornecido ou está vazio, gerar automaticamente
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generate_part_code(NEW.categoria);
    END IF;
    
    -- Garantir que updated_at seja atualizado
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para execução automática antes de inserir
DROP TRIGGER IF EXISTS trigger_auto_generate_part_code ON estoque_pecas;
CREATE TRIGGER trigger_auto_generate_part_code
    BEFORE INSERT ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code();

-- 4. Criar trigger para atualização do updated_at
DROP TRIGGER IF EXISTS trigger_update_part_timestamp ON estoque_pecas;
CREATE TRIGGER trigger_update_part_timestamp
    BEFORE UPDATE ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code();

-- 5. Função auxiliar para verificar se código já existe
CREATE OR REPLACE FUNCTION check_part_code_exists(codigo_input VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM estoque_pecas WHERE codigo = codigo_input);
END;
$$ LANGUAGE plpgsql;

-- 6. Função para regenerar códigos de peças existentes (opcional)
CREATE OR REPLACE FUNCTION regenerate_existing_part_codes()
RETURNS TABLE(
    id INTEGER,
    codigo_antigo VARCHAR,
    codigo_novo VARCHAR,
    nome VARCHAR,
    categoria VARCHAR
) AS $$
DECLARE
    peca RECORD;
    novo_codigo VARCHAR;
BEGIN
    FOR peca IN SELECT * FROM estoque_pecas WHERE codigo IS NULL OR codigo = '' ORDER BY id
    LOOP
        novo_codigo := generate_part_code(peca.categoria);
        
        -- Verificar se o código gerado já existe
        WHILE check_part_code_exists(novo_codigo) LOOP
            -- Se já existe, incrementar o número
            novo_codigo := generate_part_code(peca.categoria);
        END LOOP;
        
        -- Atualizar o registro
        UPDATE estoque_pecas 
        SET codigo = novo_codigo, updated_at = CURRENT_TIMESTAMP
        WHERE estoque_pecas.id = peca.id;
        
        -- Retornar resultado
        RETURN QUERY SELECT 
            peca.id,
            peca.codigo::VARCHAR AS codigo_antigo,
            novo_codigo::VARCHAR AS codigo_novo,
            peca.nome::VARCHAR,
            peca.categoria::VARCHAR;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentários de uso:
-- Para inserir uma nova peça sem código (será gerado automaticamente):
-- INSERT INTO estoque_pecas (nome, categoria, preco_unitario) 
-- VALUES ('Nova Peça', 'Filtros', 25.00);

-- Para gerar código manualmente:
-- SELECT generate_part_code('Motor'); -- Retorna algo como 'MOTOR001'

-- Para regenerar códigos de peças sem código:
-- SELECT * FROM regenerate_existing_part_codes();