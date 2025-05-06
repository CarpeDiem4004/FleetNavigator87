-- Script corrigido para a tabela preco_combustivel
-- A estrutura atual tem 'tipo_combustivel' e não 'tipo', e 'preco' em vez de 'valor'

-- Verificar a estrutura atual da tabela para diagnóstico
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'preco_combustivel'
ORDER BY ordinal_position;

-- Adicionar a coluna 'nome' se não existir, para compatibilidade com o código existente
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'preco_combustivel' AND column_name = 'nome') THEN
        ALTER TABLE preco_combustivel 
        ADD COLUMN nome VARCHAR(100);
        
        -- Inicializar a coluna 'nome' com base no tipo_combustivel
        UPDATE preco_combustivel
        SET nome = CASE 
            WHEN tipo_combustivel = 'Diesel' THEN 'Diesel Comum'
            WHEN tipo_combustivel = 'Gasolina' THEN 'Gasolina Comum'
            WHEN tipo_combustivel = 'Etanol' THEN 'Etanol'
            WHEN tipo_combustivel = 'Arla' THEN 'Arla 32'
            WHEN tipo_combustivel = 'S10' THEN 'Diesel S10'
            ELSE tipo_combustivel -- Mantém o mesmo valor se não corresponder
        END;
        
        RAISE NOTICE 'Coluna "nome" adicionada à tabela preco_combustivel';
    ELSE
        RAISE NOTICE 'A coluna "nome" já existe na tabela preco_combustivel';
    END IF;
END $$;

-- Adicionar a coluna 'valor' se não existir, para compatibilidade com o código existente
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'preco_combustivel' AND column_name = 'valor') THEN
        ALTER TABLE preco_combustivel 
        ADD COLUMN valor DECIMAL(10, 2);
        
        -- Inicializar a coluna 'valor' com base no preco
        UPDATE preco_combustivel
        SET valor = preco;
        
        RAISE NOTICE 'Coluna "valor" adicionada à tabela preco_combustivel';
    ELSE
        RAISE NOTICE 'A coluna "valor" já existe na tabela preco_combustivel';
    END IF;
END $$;

-- Adicionar a coluna 'tipo' se não existir, para compatibilidade com o código existente
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'preco_combustivel' AND column_name = 'tipo') THEN
        ALTER TABLE preco_combustivel 
        ADD COLUMN tipo VARCHAR(50);
        
        -- Inicializar a coluna 'tipo' com base no tipo_combustivel
        UPDATE preco_combustivel
        SET tipo = tipo_combustivel;
        
        RAISE NOTICE 'Coluna "tipo" adicionada à tabela preco_combustivel';
    ELSE
        RAISE NOTICE 'A coluna "tipo" já existe na tabela preco_combustivel';
    END IF;
END $$;

-- Verificar se existem registros na tabela
DO $$
DECLARE
    contador INTEGER;
BEGIN
    SELECT COUNT(*) INTO contador FROM preco_combustivel;
    
    IF contador = 0 THEN
        -- Inserir dados iniciais se a tabela estiver vazia
        INSERT INTO preco_combustivel (tipo_combustivel, preco, nome, valor, tipo) VALUES 
            ('Diesel', 5.79, 'Diesel Comum', 5.79, 'Diesel'),
            ('Gasolina', 6.29, 'Gasolina Comum', 6.29, 'Gasolina'),
            ('Etanol', 4.29, 'Etanol', 4.29, 'Etanol'),
            ('S10', 5.89, 'Diesel S10', 5.89, 'S10'),
            ('Arla', 3.50, 'Arla 32', 3.50, 'Arla');
            
        RAISE NOTICE 'Dados iniciais inseridos na tabela preco_combustivel';
    ELSE
        RAISE NOTICE 'A tabela preco_combustivel já contém dados. Nenhum dado inicial foi inserido.';
    END IF;
END $$;

-- Verificar a estrutura final da tabela para confirmação
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'preco_combustivel'
ORDER BY ordinal_position;