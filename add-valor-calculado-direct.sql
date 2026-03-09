-- Script SQL direto para adicionar a coluna valor_calculado
-- Execute este comando no editor SQL do Supabase

-- Comando único e direto
ALTER TABLE solicitacoes_fuel_card 
DROP COLUMN IF EXISTS valor_calculado CASCADE,
ADD COLUMN valor_calculado DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Verificação
SELECT 'Coluna valor_calculado criada com sucesso' as status;