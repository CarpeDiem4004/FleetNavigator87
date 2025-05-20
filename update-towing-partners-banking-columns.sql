-- Script para adicionar colunas de informações bancárias na tabela towing_partners
-- Este script garante que o Supabase tenha todas as colunas necessárias

-- Adicionando colunas de informações bancárias
ALTER TABLE towing_partners
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20),
ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100),
ADD COLUMN IF NOT EXISTS pix_type VARCHAR(50);

-- Atualizando o cache de esquema do Supabase
-- Isso é importante para que o Supabase reconheça as novas colunas
SELECT pg_catalog.pg_refresh_view('towing_partners');

-- Adicionando permissões para essas colunas (Row Level Security)
-- Garantindo que os usuários possam ver e editar essas colunas
ALTER POLICY "Acesso completo para usuários autenticados" ON towing_partners
  USING (true) WITH CHECK (true);