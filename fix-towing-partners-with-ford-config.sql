-- Script para garantir que a visualização de parceiros de guincho funcione corretamente
-- e que todos os novos parceiros registrados recebam as mesmas configurações do parceiro Ford (ID 6)

-- 1. Verificar se temos a constraint com ON UPDATE CASCADE para permitir atualização de status
DO $$
BEGIN
  -- Verifique se a constraint já existe com ON UPDATE CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'towing_requests_partner_id_fkey'
  ) THEN
    -- Drop da constraint existente
    ALTER TABLE towing_requests DROP CONSTRAINT IF EXISTS towing_requests_partner_id_fkey;
  END IF;

  -- Recrie a constraint com ON UPDATE CASCADE
  BEGIN
    ALTER TABLE towing_requests
    ADD CONSTRAINT towing_requests_partner_id_fkey
    FOREIGN KEY (partner_id) 
    REFERENCES towing_partners(id)
    ON UPDATE CASCADE;
    RAISE NOTICE 'Constraint towing_requests_partner_id_fkey adicionada com ON UPDATE CASCADE';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Não foi possível adicionar a constraint: %', SQLERRM;
  END;
END $$;

-- 2. Verificar se temos os campos de dados bancários na tabela towing_partners
DO $$
BEGIN
  -- Verifique se a coluna bank_name existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'towing_partners' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE towing_partners ADD COLUMN bank_name VARCHAR(100);
    RAISE NOTICE 'Coluna bank_name adicionada à tabela towing_partners';
  END IF;

  -- Verifique se a coluna bank_account existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'towing_partners' AND column_name = 'bank_account'
  ) THEN
    ALTER TABLE towing_partners ADD COLUMN bank_account VARCHAR(30);
    RAISE NOTICE 'Coluna bank_account adicionada à tabela towing_partners';
  END IF;

  -- Verifique se a coluna bank_agency existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'towing_partners' AND column_name = 'bank_agency'
  ) THEN
    ALTER TABLE towing_partners ADD COLUMN bank_agency VARCHAR(20);
    RAISE NOTICE 'Coluna bank_agency adicionada à tabela towing_partners';
  END IF;

  -- Verifique se a coluna pix_key existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'towing_partners' AND column_name = 'pix_key'
  ) THEN
    ALTER TABLE towing_partners ADD COLUMN pix_key VARCHAR(100);
    RAISE NOTICE 'Coluna pix_key adicionada à tabela towing_partners';
  END IF;

  -- Verifique se a coluna pix_type existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'towing_partners' AND column_name = 'pix_type'
  ) THEN
    ALTER TABLE towing_partners ADD COLUMN pix_type VARCHAR(20);
    RAISE NOTICE 'Coluna pix_type adicionada à tabela towing_partners';
  END IF;
END $$;

-- 3. Forçar atualização do cache do Supabase para reconhecer as colunas existentes
COMMENT ON TABLE public.towing_partners IS 'Tabela de parceiros de guincho com configurações padrão do parceiro Ford';
COMMENT ON COLUMN public.towing_partners.bank_name IS 'Nome do banco do parceiro';
COMMENT ON COLUMN public.towing_partners.bank_account IS 'Número da conta bancária do parceiro';
COMMENT ON COLUMN public.towing_partners.bank_agency IS 'Número da agência bancária do parceiro';
COMMENT ON COLUMN public.towing_partners.pix_key IS 'Chave PIX do parceiro';
COMMENT ON COLUMN public.towing_partners.pix_type IS 'Tipo da chave PIX (CPF, CNPJ, Email, Telefone, Aleatória)';

-- 4. Criar um stored procedure para copiar as configurações do parceiro Ford para novos parceiros
CREATE OR REPLACE FUNCTION apply_ford_partner_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Somente aplique às novas inserções e quando o status mudar para 'ativo'
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'ativo' AND NEW.status = 'ativo')) THEN
    -- Obtenha as configurações do parceiro Ford (ID 6)
    DECLARE
      ford_config RECORD;
    BEGIN
      SELECT 
        service_types, 
        payment_methods, 
        cost_per_km, 
        available_24h, 
        can_transport_multiple, 
        has_insurance, 
        coverage_radius
      INTO ford_config
      FROM towing_partners
      WHERE id = 6;
      
      -- Aplique as configurações do Ford ao novo parceiro, mantendo dados específicos do parceiro
      NEW.service_types := COALESCE(NEW.service_types, ford_config.service_types);
      NEW.payment_methods := COALESCE(NEW.payment_methods, ford_config.payment_methods);
      NEW.cost_per_km := COALESCE(NEW.cost_per_km, ford_config.cost_per_km);
      NEW.available_24h := COALESCE(NEW.available_24h, ford_config.available_24h);
      NEW.can_transport_multiple := COALESCE(NEW.can_transport_multiple, ford_config.can_transport_multiple);
      NEW.has_insurance := COALESCE(NEW.has_insurance, ford_config.has_insurance);
      NEW.coverage_radius := COALESCE(NEW.coverage_radius, ford_config.coverage_radius);
      
      RAISE NOTICE 'Configurações do parceiro Ford aplicadas ao parceiro ID %', NEW.id;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE NOTICE 'Parceiro Ford (ID 6) não encontrado. Configurações padrão não aplicadas.';
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar o trigger para aplicar as configurações automaticamente
DROP TRIGGER IF EXISTS apply_ford_config_trigger ON towing_partners;
CREATE TRIGGER apply_ford_config_trigger
BEFORE INSERT OR UPDATE ON towing_partners
FOR EACH ROW
EXECUTE FUNCTION apply_ford_partner_config();

-- 6. Função para atualizar parceiro existente que ainda não tem as configurações do Ford
CREATE OR REPLACE FUNCTION update_existing_partners_with_ford_config()
RETURNS void AS $$
DECLARE
  partner_record RECORD;
  ford_config RECORD;
BEGIN
  -- Obtenha as configurações do parceiro Ford (ID 6)
  SELECT 
    service_types, 
    payment_methods, 
    cost_per_km, 
    available_24h, 
    can_transport_multiple, 
    has_insurance, 
    coverage_radius
  INTO ford_config
  FROM towing_partners
  WHERE id = 6;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parceiro Ford (ID 6) não encontrado. Não é possível aplicar configurações padrão.';
  END IF;
  
  -- Para cada parceiro ativo, exceto o Ford, aplique as configurações
  FOR partner_record IN 
    SELECT id FROM towing_partners 
    WHERE id != 6 AND status = 'ativo'
  LOOP
    UPDATE towing_partners SET
      service_types = COALESCE(service_types, ford_config.service_types),
      payment_methods = COALESCE(payment_methods, ford_config.payment_methods),
      cost_per_km = COALESCE(cost_per_km, ford_config.cost_per_km),
      available_24h = COALESCE(available_24h, ford_config.available_24h),
      can_transport_multiple = COALESCE(can_transport_multiple, ford_config.can_transport_multiple),
      has_insurance = COALESCE(has_insurance, ford_config.has_insurance),
      coverage_radius = COALESCE(coverage_radius, ford_config.coverage_radius)
    WHERE id = partner_record.id;
    
    RAISE NOTICE 'Configurações do parceiro Ford aplicadas ao parceiro ID %', partner_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Execute a função para atualizar parceiros existentes
SELECT update_existing_partners_with_ford_config();