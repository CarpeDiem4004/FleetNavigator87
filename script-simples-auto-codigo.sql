-- SCRIPT SIMPLES PARA AUTO-GERAÇÃO DE CÓDIGOS
-- Execute cada bloco separadamente se necessário

-- 1. Função básica para gerar códigos
CREATE OR REPLACE FUNCTION gerar_codigo_peca(categoria_nome VARCHAR DEFAULT 'GERAL')
RETURNS VARCHAR AS $$
DECLARE
    categoria_clean VARCHAR;
    proximo_num INTEGER;
    codigo_final VARCHAR;
BEGIN
    -- Limpar categoria
    categoria_clean := UPPER(COALESCE(categoria_nome, 'GERAL'));
    
    -- Buscar próximo número
    SELECT COALESCE(MAX(
        CASE 
            WHEN codigo ~ ('^' || categoria_clean || '[0-9]+$') 
            THEN CAST(SUBSTRING(codigo FROM LENGTH(categoria_clean) + 1) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO proximo_num
    FROM estoque_pecas 
    WHERE UPPER(categoria) = categoria_clean;
    
    -- Gerar código
    codigo_final := categoria_clean || LPAD(proximo_num::TEXT, 3, '0');
    
    RETURN codigo_final;
END;
$$ LANGUAGE plpgsql;

-- 2. Função trigger simples
CREATE OR REPLACE FUNCTION trigger_codigo_automatico()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := gerar_codigo_peca(NEW.categoria);
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Remover trigger existente
DROP TRIGGER IF EXISTS auto_codigo_trigger ON estoque_pecas;

-- 4. Criar novo trigger
CREATE TRIGGER auto_codigo_trigger
    BEFORE INSERT OR UPDATE ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_codigo_automatico();

-- 5. Teste simples
SELECT gerar_codigo_peca('Motor') as codigo_teste;