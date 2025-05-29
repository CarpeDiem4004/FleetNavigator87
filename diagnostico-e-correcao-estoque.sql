-- DIAGNÓSTICO E CORREÇÃO COMPLETA DO SISTEMA DE ESTOQUE
-- Execute este script para identificar e corrigir problemas

-- 1. VERIFICAR SE A TABELA EXISTE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'estoque_pecas') THEN
        RAISE NOTICE 'DIAGNÓSTICO: Tabela estoque_pecas existe no esquema public';
    ELSE
        RAISE NOTICE 'ERRO: Tabela estoque_pecas NÃO existe';
        -- Criar tabela se não existir
        CREATE TABLE estoque_pecas (
            id SERIAL PRIMARY KEY,
            codigo VARCHAR(50) NOT NULL UNIQUE,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            categoria VARCHAR(100),
            fornecedor VARCHAR(255),
            preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            quantidade_estoque INTEGER DEFAULT 0,
            quantidade_minima INTEGER DEFAULT 1,
            unidade_medida VARCHAR(20) DEFAULT 'UN',
            localizacao VARCHAR(100),
            data_entrada DATE DEFAULT CURRENT_DATE,
            data_validade DATE,
            status VARCHAR(20) DEFAULT 'ativo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'CORREÇÃO: Tabela estoque_pecas criada com sucesso';
    END IF;
END $$;

-- 2. VERIFICAR PERMISSÕES
DO $$
BEGIN
    -- Testar SELECT
    PERFORM COUNT(*) FROM estoque_pecas;
    RAISE NOTICE 'DIAGNÓSTICO: Permissão SELECT funcionando - % registros encontrados', (SELECT COUNT(*) FROM estoque_pecas);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO: Problema de permissão SELECT - %', SQLERRM;
END $$;

-- 3. LIMPAR FUNÇÕES E TRIGGERS ANTIGOS
DROP TRIGGER IF EXISTS trigger_auto_generate_part_code ON estoque_pecas;
DROP TRIGGER IF EXISTS trigger_update_part_timestamp ON estoque_pecas;
DROP TRIGGER IF EXISTS auto_codigo_trigger ON estoque_pecas;

DROP FUNCTION IF EXISTS auto_generate_part_code();
DROP FUNCTION IF EXISTS generate_part_code(VARCHAR);
DROP FUNCTION IF EXISTS gerar_codigo_peca(VARCHAR);
DROP FUNCTION IF EXISTS trigger_codigo_automatico();

-- 4. CRIAR FUNÇÃO ÚNICA E SIMPLIFICADA
CREATE OR REPLACE FUNCTION auto_codigo_estoque()
RETURNS TRIGGER AS $$
DECLARE
    categoria_limpa VARCHAR;
    proximo_numero INTEGER;
    codigo_novo VARCHAR;
BEGIN
    -- Só gerar código se estiver vazio
    IF NEW.codigo IS NULL OR TRIM(NEW.codigo) = '' THEN
        -- Limpar categoria
        categoria_limpa := UPPER(COALESCE(TRIM(NEW.categoria), 'GERAL'));
        
        -- Buscar próximo número
        SELECT COALESCE(MAX(
            CASE 
                WHEN codigo ~ ('^' || categoria_limpa || '[0-9]+$') 
                THEN CAST(SUBSTRING(codigo FROM LENGTH(categoria_limpa) + 1) AS INTEGER)
                ELSE 0
            END
        ), 0) + 1
        INTO proximo_numero
        FROM estoque_pecas 
        WHERE UPPER(COALESCE(categoria, '')) = categoria_limpa;
        
        -- Gerar código
        codigo_novo := categoria_limpa || LPAD(proximo_numero::TEXT, 3, '0');
        NEW.codigo := codigo_novo;
        
        RAISE NOTICE 'CÓDIGO GERADO: % para categoria %', codigo_novo, categoria_limpa;
    END IF;
    
    -- Atualizar timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CRIAR TRIGGER ÚNICO
CREATE TRIGGER estoque_auto_codigo
    BEFORE INSERT OR UPDATE ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_codigo_estoque();

-- 6. GARANTIR CONSTRAINT UNIQUE NO CÓDIGO
DO $$
BEGIN
    -- Verificar se já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'estoque_pecas' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%codigo%'
    ) THEN
        ALTER TABLE estoque_pecas ADD CONSTRAINT estoque_pecas_codigo_unique UNIQUE (codigo);
        RAISE NOTICE 'CORREÇÃO: Constraint UNIQUE adicionada no campo codigo';
    ELSE
        RAISE NOTICE 'DIAGNÓSTICO: Constraint UNIQUE já existe no campo codigo';
    END IF;
END $$;

-- 7. TESTE COMPLETO DO SISTEMA
DO $$
DECLARE
    teste_id INTEGER;
    teste_codigo VARCHAR;
BEGIN
    -- Teste 1: Inserção com código vazio
    INSERT INTO estoque_pecas (nome, categoria, preco_unitario) 
    VALUES ('Teste Sistema', 'TesteCategoria', 10.00)
    RETURNING id, codigo INTO teste_id, teste_codigo;
    
    RAISE NOTICE 'TESTE 1 SUCESSO: ID=%, Código=%', teste_id, teste_codigo;
    
    -- Limpar teste
    DELETE FROM estoque_pecas WHERE id = teste_id;
    
    RAISE NOTICE 'SISTEMA FUNCIONANDO CORRETAMENTE!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO NO TESTE: %', SQLERRM;
END $$;

-- 8. ESTATÍSTICAS FINAIS
SELECT 
    'estoque_pecas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN codigo IS NOT NULL AND codigo != '' THEN 1 END) as com_codigo,
    COUNT(CASE WHEN codigo IS NULL OR codigo = '' THEN 1 END) as sem_codigo
FROM estoque_pecas;

-- 9. VERIFICAR TRIGGERS ATIVOS
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'estoque_pecas'
ORDER BY trigger_name;

-- Resultado final
SELECT 'DIAGNÓSTICO COMPLETO EXECUTADO' as status;