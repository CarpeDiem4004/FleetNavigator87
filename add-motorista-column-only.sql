-- Script para adicionar apenas a coluna "motorista" na tabela solicitacoes_fuel_card
-- Execute no editor SQL do Supabase

-- Opção 1: Comando mais simples
ALTER TABLE solicitacoes_fuel_card 
ADD COLUMN IF NOT EXISTS motorista VARCHAR(100);

-- Opção 2: Com verificação detalhada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'motorista'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN motorista VARCHAR(100);
    RAISE NOTICE 'Coluna motorista adicionada';
  ELSE
    RAISE NOTICE 'Coluna motorista já existe';
  END IF;
END $$;