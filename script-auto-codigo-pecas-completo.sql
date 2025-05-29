-- =====================================================
-- SCRIPT COMPLETO: AUTO-GERAÇÃO DE CÓDIGOS PARA PEÇAS
-- =====================================================

-- 1. CRIAR TABELA ESTOQUE_PECAS (se não existir)
CREATE TABLE IF NOT EXISTS estoque_pecas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
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

-- 2. FUNÇÃO PARA GERAR CÓDIGO AUTOMÁTICO
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

-- 3. FUNÇÃO TRIGGER PARA AUTO-GERAÇÃO
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

-- 4. REMOVER TRIGGERS ANTIGOS (se existirem)
DROP TRIGGER IF EXISTS trigger_auto_generate_part_code ON estoque_pecas;
DROP TRIGGER IF EXISTS trigger_update_part_timestamp ON estoque_pecas;

-- 5. CRIAR TRIGGERS
CREATE TRIGGER trigger_auto_generate_part_code
    BEFORE INSERT ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code();

CREATE TRIGGER trigger_update_part_timestamp
    BEFORE UPDATE ON estoque_pecas
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_part_code();

-- 6. INSERIR DADOS DE EXEMPLO (opcional)
INSERT INTO estoque_pecas (nome, categoria, descricao, preco_unitario, quantidade_estoque, fornecedor) VALUES
('Óleo Motor 5W30', 'Lubrificantes', 'Óleo sintético para motor', 45.90, 50, 'Petrobras'),
('Filtro de Óleo', 'Filtros', 'Filtro de óleo para motor', 28.50, 30, 'Mann Filter'),
('Pastilha de Freio Dianteira', 'Freios', 'Pastilha de freio cerâmica', 89.90, 25, 'Bosch'),
('Amortecedor Dianteiro', 'Suspensão', 'Amortecedor hidráulico', 245.00, 10, 'Monroe'),
('Pneu 215/75R17.5', 'Pneus', 'Pneu para caminhão', 890.00, 8, 'Bridgestone'),
('Bateria 12V 100Ah', 'Elétrica', 'Bateria para caminhão', 320.00, 15, 'Moura'),
('Correia Dentada', 'Motor', 'Correia de distribuição', 125.00, 20, 'Gates'),
('Lâmpada H7 12V', 'Elétrica', 'Lâmpada para farol', 35.00, 40, 'Osram')
ON CONFLICT (codigo) DO NOTHING;

-- 7. FUNÇÕES AUXILIARES

-- Verificar se código já existe
CREATE OR REPLACE FUNCTION check_part_code_exists(codigo_input VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM estoque_pecas WHERE codigo = codigo_input);
END;
$$ LANGUAGE plpgsql;

-- Regenerar códigos para peças sem código
CREATE OR REPLACE FUNCTION regenerate_missing_part_codes()
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

-- =====================================================
-- EXEMPLOS DE USO:
-- =====================================================

-- Inserir peça SEM código (será gerado automaticamente):
-- INSERT INTO estoque_pecas (nome, categoria, preco_unitario) 
-- VALUES ('Nova Peça', 'Motor', 25.00);

-- Inserir peça COM código específico:
-- INSERT INTO estoque_pecas (codigo, nome, categoria, preco_unitario) 
-- VALUES ('ESPECIAL001', 'Peça Especial', 'Motor', 150.00);

-- Gerar código manualmente:
-- SELECT generate_part_code('Hidráulica'); -- Retorna HIDRÁULICA001

-- Regenerar códigos para peças sem código:
-- SELECT * FROM regenerate_missing_part_codes();

-- Verificar se um código existe:
-- SELECT check_part_code_exists('MOTOR001'); -- Retorna true/false

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================