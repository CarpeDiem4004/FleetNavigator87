-- Script para corrigir a tabela preco_combustivel
-- Adiciona a coluna "tipo" que está faltando, causando erro na consulta

-- Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'preco_combustivel') THEN
        -- Verificar se a coluna tipo já existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'preco_combustivel' AND column_name = 'tipo') THEN
            -- Adicionar a coluna tipo
            ALTER TABLE preco_combustivel 
            ADD COLUMN tipo VARCHAR(50);
            
            RAISE NOTICE 'Coluna "tipo" adicionada à tabela preco_combustivel';
            
            -- Preencher a coluna tipo com base no nome do combustível
            UPDATE preco_combustivel
            SET tipo = CASE 
                WHEN LOWER(nome) LIKE '%diesel%' THEN 'Diesel'
                WHEN LOWER(nome) LIKE '%gasolina%' THEN 'Gasolina'
                WHEN LOWER(nome) LIKE '%etanol%' THEN 'Etanol'
                WHEN LOWER(nome) LIKE '%arla%' THEN 'Arla'
                WHEN LOWER(nome) LIKE '%s10%' THEN 'S10'
                ELSE nome -- Mantém o nome original se não corresponder a nenhum tipo conhecido
            END;
            
            RAISE NOTICE 'Coluna "tipo" preenchida com base no nome do combustível';
        ELSE
            RAISE NOTICE 'A coluna "tipo" já existe na tabela preco_combustivel';
        END IF;
    ELSE
        -- Se a tabela não existir, vamos criá-la
        CREATE TABLE preco_combustivel (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            valor DECIMAL(10, 2) NOT NULL,
            data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            tipo VARCHAR(50),
            ativo BOOLEAN DEFAULT TRUE
        );
        
        -- Inserir alguns dados iniciais para os tipos comuns de combustível
        INSERT INTO preco_combustivel (nome, valor, tipo) VALUES 
            ('Diesel Comum', 5.79, 'Diesel'),
            ('Gasolina Comum', 6.29, 'Gasolina'),
            ('Etanol', 4.29, 'Etanol'),
            ('Diesel S10', 5.89, 'S10'),
            ('Arla 32', 3.50, 'Arla');
            
        RAISE NOTICE 'Tabela preco_combustivel criada com a coluna "tipo" e dados iniciais';
    END IF;
END $$;

-- Verificar a estrutura da tabela depois das alterações
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'preco_combustivel'
ORDER BY ordinal_position;