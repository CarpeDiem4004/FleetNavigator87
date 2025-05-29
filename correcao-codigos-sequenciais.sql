-- SCRIPT DE CORREÇÃO PARA CÓDIGOS SEQUENCIAIS
-- Este script converte todos os códigos existentes para o padrão M001, M002, M003...

BEGIN;

-- 1. Backup dos códigos atuais (opcional)
CREATE TABLE IF NOT EXISTS backup_codigos_antigos AS
SELECT id, codigo, nome FROM estoque_pecas;

-- 2. Atualizar todos os códigos para o novo padrão sequencial
DO $$
DECLARE
    rec RECORD;
    novo_codigo VARCHAR;
    contador INTEGER := 1;
    total_registros INTEGER;
BEGIN
    -- Contar total de registros
    SELECT COUNT(*) INTO total_registros FROM estoque_pecas;
    
    RAISE NOTICE 'Iniciando conversão de % registros para códigos sequenciais...', total_registros;
    
    -- Atualizar cada registro com novo código sequencial
    FOR rec IN 
        SELECT id, codigo, nome FROM estoque_pecas 
        ORDER BY id
    LOOP
        -- Gerar novo código no formato M001, M002, etc.
        novo_codigo := 'M' || LPAD(contador::TEXT, 3, '0');
        
        -- Atualizar o registro
        UPDATE estoque_pecas 
        SET codigo = novo_codigo,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = rec.id;
        
        RAISE NOTICE 'ID %: % → % (%)', rec.id, rec.codigo, novo_codigo, rec.nome;
        
        contador := contador + 1;
    END LOOP;
    
    RAISE NOTICE 'Conversão concluída! % códigos atualizados para o padrão M001-M%', 
                 total_registros, LPAD(total_registros::TEXT, 3, '0');
END $$;

-- 3. Verificar se há duplicatas (não deveria haver)
DO $$
DECLARE
    duplicatas INTEGER;
BEGIN
    SELECT COUNT(*) - COUNT(DISTINCT codigo) INTO duplicatas FROM estoque_pecas;
    
    IF duplicatas > 0 THEN
        RAISE EXCEPTION 'ERRO: Encontradas % duplicatas de códigos!', duplicatas;
    ELSE
        RAISE NOTICE 'Verificação OK: Nenhuma duplicata encontrada';
    END IF;
END $$;

-- 4. Estatísticas finais
SELECT 
    'CONVERSÃO CONCLUÍDA' as status,
    COUNT(*) as total_pecas,
    MIN(codigo) as primeiro_codigo,
    MAX(codigo) as ultimo_codigo,
    COUNT(CASE WHEN codigo ~ '^M[0-9]{3}$' THEN 1 END) as codigos_padrao_correto
FROM estoque_pecas;

-- 5. Mostrar alguns exemplos
SELECT 
    id,
    codigo,
    nome,
    categoria
FROM estoque_pecas 
ORDER BY codigo 
LIMIT 10;

COMMIT;

-- Resultado final
SELECT 'TODOS OS CÓDIGOS CONVERTIDOS PARA PADRÃO M001, M002, M003...' as resultado_final;