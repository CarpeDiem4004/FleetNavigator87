-- Script para adicionar campos necessários à tabela de viagens do Line Hall Shopee
-- Adiciona: data_viagem, rota_selecionada, km_total

-- Verificar se as colunas já existem antes de adicioná-las
DO $$ 
BEGIN
    -- Adicionar coluna data_viagem se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'line_hall_shopee_trips' 
                   AND column_name = 'data_viagem') THEN
        ALTER TABLE line_hall_shopee_trips 
        ADD COLUMN data_viagem DATE DEFAULT CURRENT_DATE;
        
        RAISE NOTICE 'Coluna data_viagem adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna data_viagem já existe';
    END IF;

    -- Adicionar coluna rota_selecionada se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'line_hall_shopee_trips' 
                   AND column_name = 'rota_selecionada') THEN
        ALTER TABLE line_hall_shopee_trips 
        ADD COLUMN rota_selecionada VARCHAR(255);
        
        RAISE NOTICE 'Coluna rota_selecionada adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna rota_selecionada já existe';
    END IF;

    -- Adicionar coluna km_total se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'line_hall_shopee_trips' 
                   AND column_name = 'km_total') THEN
        ALTER TABLE line_hall_shopee_trips 
        ADD COLUMN km_total DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Coluna km_total adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna km_total já existe';
    END IF;

    RAISE NOTICE 'Script executado com sucesso!';
END $$;

-- Verificar a estrutura da tabela após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'line_hall_shopee_trips'
ORDER BY ordinal_position;