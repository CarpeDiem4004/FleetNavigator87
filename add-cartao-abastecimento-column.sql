-- Adicionar coluna cartao_abastecimento à tabela vehicles
-- Este campo é específico para veículos do Line Hall Shopee

ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS cartao_abastecimento TEXT;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN veiculos.cartao_abastecimento IS 'Número do cartão de abastecimento para veículos Line Hall';

-- Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'veiculos' 
AND column_name = 'cartao_abastecimento';