-- Script para garantir que os campos bancários estejam corretamente configurados
-- e reconhecidos pelo Supabase na tabela towing_partners

-- Primeiro, verificamos se os campos existem e, se não, os adicionamos
ALTER TABLE towing_partners
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pix_type VARCHAR(50);

-- Em seguida, modificamos os campos para garantir que estão com o tipo correto
-- Isso é importante para resolver problemas de cache do Supabase
ALTER TABLE towing_partners
  ALTER COLUMN bank_account TYPE VARCHAR(50),
  ALTER COLUMN bank_name TYPE VARCHAR(100),
  ALTER COLUMN bank_agency TYPE VARCHAR(20),
  ALTER COLUMN pix_key TYPE VARCHAR(100),
  ALTER COLUMN pix_type TYPE VARCHAR(50);

-- Forçar a atualização do cache de esquema do Supabase
COMMENT ON COLUMN towing_partners.bank_account IS 'Número da conta bancária do parceiro';
COMMENT ON COLUMN towing_partners.bank_name IS 'Nome do banco do parceiro';
COMMENT ON COLUMN towing_partners.bank_agency IS 'Número da agência bancária do parceiro';
COMMENT ON COLUMN towing_partners.pix_key IS 'Chave PIX do parceiro';
COMMENT ON COLUMN towing_partners.pix_type IS 'Tipo da chave PIX (CPF, CNPJ, email, telefone, aleatória)';

-- Comentário na tabela para forçar a atualização do cache
COMMENT ON TABLE towing_partners IS 'Tabela de parceiros de guincho com informações bancárias';

-- Adicionar uma política RLS para garantir acesso aos usuários autenticados
-- (somente se a tabela usar Row Level Security)
DO $$
BEGIN
  -- Verificar se o RLS está habilitado na tabela
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'towing_partners'
    AND rowsecurity = true
  ) THEN
    -- Remover políticas existentes para evitar conflitos
    DROP POLICY IF EXISTS "Acesso completo para usuários autenticados" ON towing_partners;
    
    -- Criar nova política
    CREATE POLICY "Acesso completo para usuários autenticados"
    ON towing_partners
    USING (auth.role() IN ('authenticated', 'service_role'))
    WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
  END IF;
END $$;