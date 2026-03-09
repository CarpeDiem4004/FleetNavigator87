-- SISTEMA DE AUTO-GERAÇÃO DE CÓDIGOS SEQUENCIAIS PARA PEÇAS
-- Padrão: M001, M002, M003, etc.

-- 1. Remover triggers e funções antigas
DROP TRIGGER IF EXISTS estoque_auto_codigo ON estoque_pecas;
DROP TRIGGER IF EXISTS estoque_codigo_simples ON estoque_pecas;
DROP FUNCTION IF EXISTS auto_codigo_estoque();
DROP FUNCTION IF EXISTS auto_codigo_simples();

-- 2. Criar função para códigos sequenciais simples
CREATE OR REPLACE FUNCTION auto_codigo_sequencial()
RETURNS TRIGGER AS $$
DECLARE
    proximo_numero INTEGER;
    codigo_novo VARCHAR;
BEGIN
    -- Só gerar código se estiver vazio
    IF NEW.codigo IS NULL OR TRIM(NEW.codigo) = '' THEN
        -- Buscar o próximo número sequencial baseado no padrão M001, M002, etc.
        SELECT COALESCE(MAX(
            CASE 
                WHEN codigo ~ '^M[0-9]+$' 
                THEN CAST(SUBSTRING(codigo FROM 2) AS INTEGER)
                ELSE 0
            END
        ), 0) + 1
        INTO proximo_numero
        FROM estoque_pecas;
        
        -- Gerar código no formato M001, M002, M003, etc.
        codigo_novo := 'M' || LPAD(proximo_numero::TEXT, 3, '0');
        NEW.codigo := codigo_novo;
    END IF;
    
    -- Atualizar timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para auto-geração
CREATE TRIGGER trigger_codigo_sequencial
    BEFORE INSERT OR UPDATE ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_codigo_sequencial();

-- 4. Atualizar códigos existentes para o novo padrão (OPCIONAL)
-- Descomente as linhas abaixo se quiser converter todos os códigos existentes

/*
DO $$
DECLARE
    rec RECORD;
    novo_codigo VARCHAR;
    contador INTEGER := 1;
BEGIN
    -- Atualizar cada registro com novo código sequencial
    FOR rec IN 
        SELECT id FROM estoque_pecas 
        WHERE codigo !~ '^M[0-9]+$' 
        ORDER BY id
    LOOP
        novo_codigo := 'M' || LPAD(contador::TEXT, 3, '0');
        
        UPDATE estoque_pecas 
        SET codigo = novo_codigo 
        WHERE id = rec.id;
        
        contador := contador + 1;
        
        RAISE NOTICE 'Código atualizado para ID %: %', rec.id, novo_codigo;
    END LOOP;
    
    RAISE NOTICE 'Atualização concluída! % registros atualizados.', contador - 1;
END $$;
*/

-- 5. Teste do sistema
INSERT INTO estoque_pecas (nome, categoria, preco_unitario) 
VALUES ('Teste Código Automático', 'Teste', 10.00);

-- Verificar o resultado
SELECT id, codigo, nome FROM estoque_pecas WHERE nome = 'Teste Código Automático';

-- Limpar teste
DELETE FROM estoque_pecas WHERE nome = 'Teste Código Automático';

-- Confirmação
SELECT 'SISTEMA DE CÓDIGOS SEQUENCIAIS ATIVO' as status;