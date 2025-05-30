-- Script para adicionar apenas a coluna "valor_calculado" na tabela solicitacoes_fuel_card
-- Execute no editor SQL do Supabase

-- Comando simples para adicionar a coluna se não existir
ALTER TABLE solicitacoes_fuel_card 
ADD COLUMN IF NOT EXISTS valor_calculado DECIMAL(10,2) DEFAULT 0;

-- Script alternativo com verificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'valor_calculado'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN valor_calculado DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE 'Coluna valor_calculado adicionada';
  ELSE
    RAISE NOTICE 'Coluna valor_calculado já existe';
  END IF;
END $$;