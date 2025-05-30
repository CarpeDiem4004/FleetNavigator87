-- Script para adicionar apenas a coluna "placa" na tabela solicitacoes_fuel_card
-- Execute este script no editor SQL do Supabase

DO $$
BEGIN
  -- Verificar se a coluna placa existe na tabela solicitacoes_fuel_card
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solicitacoes_fuel_card' AND column_name = 'placa'
  ) THEN
    -- Adicionar a coluna placa
    ALTER TABLE solicitacoes_fuel_card ADD COLUMN placa VARCHAR(10);
    RAISE NOTICE 'Coluna placa adicionada à tabela solicitacoes_fuel_card';
  ELSE
    RAISE NOTICE 'Coluna placa já existe na tabela solicitacoes_fuel_card';
  END IF;
END $$;