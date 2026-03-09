-- Script para adicionar apenas a coluna "km" na tabela solicitacoes_fuel_card
-- Execute no editor SQL do Supabase

-- Comando simples para adicionar a coluna se não existir
ALTER TABLE solicitacoes_fuel_card 
ADD COLUMN IF NOT EXISTS km INTEGER DEFAULT 0;

-- Script alternativo com verificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'km'
  ) THEN
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN km INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna km adicionada';
  ELSE
    RAISE NOTICE 'Coluna km já existe';
  END IF;
END $$;