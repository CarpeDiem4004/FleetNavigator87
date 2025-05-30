-- Script para adicionar apenas a coluna "numero_cartao" na tabela solicitacoes_fuel_card
-- Execute no editor SQL do Supabase

-- Comando simples para adicionar a coluna se não existir
ALTER TABLE solicitacoes_fuel_card 
ADD COLUMN IF NOT EXISTS numero_cartao VARCHAR(100);

-- Script alternativo com verificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'numero_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN numero_cartao VARCHAR(100);
    RAISE NOTICE 'Coluna numero_cartao adicionada';
  ELSE
    RAISE NOTICE 'Coluna numero_cartao já existe';
  END IF;
END $$;