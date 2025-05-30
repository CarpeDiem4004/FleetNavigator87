-- Script para adicionar apenas a coluna "provedor_cartao" na tabela solicitacoes_fuel_card
-- Execute no editor SQL do Supabase

-- Comando simples para adicionar a coluna se não existir
ALTER TABLE solicitacoes_fuel_card 
ADD COLUMN IF NOT EXISTS provedor_cartao VARCHAR(100);

-- Script alternativo com verificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'provedor_cartao'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN provedor_cartao VARCHAR(100);
    RAISE NOTICE 'Coluna provedor_cartao adicionada';
  ELSE
    RAISE NOTICE 'Coluna provedor_cartao já existe';
  END IF;
END $$;