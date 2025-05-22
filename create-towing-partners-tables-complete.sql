-- Script completo para criar toda a estrutura de parceiros de guincho no Supabase
-- Criado em: 22/05/2025

-- Tabela principal de parceiros de guincho
CREATE TABLE IF NOT EXISTS public.towing_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Comentários na tabela de parceiros
COMMENT ON TABLE public.towing_partners IS 'Cadastro de parceiros que fornecem serviços de guincho';
COMMENT ON COLUMN public.towing_partners.id IS 'Identificador único do parceiro';
COMMENT ON COLUMN public.towing_partners.name IS 'Nome do parceiro (pessoa física)';
COMMENT ON COLUMN public.towing_partners.company_name IS 'Nome da empresa ou razão social';
COMMENT ON COLUMN public.towing_partners.is_active IS 'Indica se o parceiro está ativo para receber solicitações';

-- Tabela de tokens de acesso para parceiros
CREATE TABLE IF NOT EXISTS public.towing_access_tokens (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES public.towing_partners(id),
  token VARCHAR(500) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  description VARCHAR(255)
);

-- Índices para tokens de acesso
CREATE INDEX IF NOT EXISTS towing_access_tokens_partner_id_idx ON public.towing_access_tokens(partner_id);
CREATE INDEX IF NOT EXISTS towing_access_tokens_token_idx ON public.towing_access_tokens(token);

-- Comentários na tabela de tokens
COMMENT ON TABLE public.towing_access_tokens IS 'Tokens de acesso para parceiros de guincho acessarem a API externa';
COMMENT ON COLUMN public.towing_access_tokens.partner_id IS 'ID do parceiro associado ao token';
COMMENT ON COLUMN public.towing_access_tokens.token IS 'Token único de acesso';
COMMENT ON COLUMN public.towing_access_tokens.expires_at IS 'Data de expiração do token, NULL se não expira';
COMMENT ON COLUMN public.towing_access_tokens.is_permanent IS 'Indica se o token é permanente (não expira)';

-- Tabela para registro de serviços de guincho
CREATE TABLE IF NOT EXISTS public.towing_service_notes (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES public.towing_partners(id),
  plate VARCHAR(20) NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  service_description TEXT,
  service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cost DECIMAL(10, 2) NOT NULL,
  mileage INTEGER,
  notes TEXT,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by_user_id INTEGER,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Índices para tabela de serviços
CREATE INDEX IF NOT EXISTS towing_service_notes_partner_id_idx ON public.towing_service_notes(partner_id);
CREATE INDEX IF NOT EXISTS towing_service_notes_plate_idx ON public.towing_service_notes(plate);
CREATE INDEX IF NOT EXISTS towing_service_notes_status_idx ON public.towing_service_notes(status);
CREATE INDEX IF NOT EXISTS towing_service_notes_payment_status_idx ON public.towing_service_notes(payment_status);
CREATE INDEX IF NOT EXISTS towing_service_notes_service_date_idx ON public.towing_service_notes(service_date);

-- Comentários na tabela de serviços
COMMENT ON TABLE public.towing_service_notes IS 'Registro de serviços de guincho realizados pelos parceiros';
COMMENT ON COLUMN public.towing_service_notes.partner_id IS 'ID do parceiro que realizou o serviço';
COMMENT ON COLUMN public.towing_service_notes.plate IS 'Placa do veículo guinchado';
COMMENT ON COLUMN public.towing_service_notes.pickup_location IS 'Local de retirada do veículo';
COMMENT ON COLUMN public.towing_service_notes.delivery_location IS 'Local de entrega do veículo';
COMMENT ON COLUMN public.towing_service_notes.service_description IS 'Descrição do serviço realizado';
COMMENT ON COLUMN public.towing_service_notes.cost IS 'Valor do serviço em Reais';
COMMENT ON COLUMN public.towing_service_notes.mileage IS 'Quilometragem percorrida durante o serviço';
COMMENT ON COLUMN public.towing_service_notes.status IS 'Status do serviço: pendente, aprovado, rejeitado';
COMMENT ON COLUMN public.towing_service_notes.payment_status IS 'Status do pagamento: pendente, pago, cancelado';

-- View para serviços de guincho (consolidada)
CREATE OR REPLACE VIEW public.servicos_guincho AS
SELECT
  id,
  partner_id AS parceiro_id,
  plate AS placa,
  pickup_location AS origem,
  delivery_location AS destino,
  service_description AS tipo_servico,
  service_date AS data_lancamento,
  cost AS valor,
  mileage AS km_reboque,
  notes AS observacoes,
  status,
  priority AS prioridade,
  approved_at AS data_aprovacao,
  payment_status AS status_pagamento,
  created_at AS data_criacao
FROM public.towing_service_notes;

-- View para parceiros de guincho (consolidada)
CREATE OR REPLACE VIEW public.parceiros_guincho AS
SELECT
  p.id,
  p.name AS nome,
  p.company_name AS empresa,
  p.contact_name AS contato,
  p.contact_phone AS telefone,
  p.address AS endereco,
  p.is_active AS ativo,
  COUNT(t.id) AS total_tokens,
  COUNT(s.id) AS total_servicos,
  SUM(CASE WHEN s.status = 'aprovado' THEN s.cost ELSE 0 END) AS valor_total_aprovado,
  SUM(CASE WHEN s.payment_status = 'pago' THEN s.cost ELSE 0 END) AS valor_total_pago,
  p.created_at AS data_cadastro
FROM public.towing_partners p
LEFT JOIN public.towing_access_tokens t ON p.id = t.partner_id
LEFT JOIN public.towing_service_notes s ON p.id = s.partner_id
GROUP BY p.id, p.name, p.company_name, p.contact_name, p.contact_phone, p.address, p.is_active, p.created_at;

-- Inserir parceiros de teste
INSERT INTO public.towing_partners 
  (id, name, company_name, contact_name, contact_phone, address, is_active, created_at)
VALUES
  (5, 'Guincho Águia', 'Guincho Águia LTDA', 'João Silva', '11988887777', 'Av. Brasil, 1500, São Paulo, SP', true, NOW()),
  (6, 'Ford', 'Ford Serviços de Guincho Ltda', 'Maria Ford', '11977776666', 'Rua das Concessionárias, 500, São Paulo, SP', true, NOW()),
  (8, 'Caio Ramos de Souza', 'Ramos Guincho Express', 'Caio Ramos', '11966665555', 'Rua dos Guinchos, 123, São Paulo, SP', true, NOW()),
  (9, 'Claudio de Oliveira Silva', 'Oliveira Auto Socorro', 'Claudio Silva', '11955554444', 'Av. dos Socorros, 456, Guarulhos, SP', true, NOW()),
  (10, 'Daiane do Vale Amaral', 'Vale Serviços de Guincho', 'Daiane Amaral', '11944443333', 'Rua das Assistências, 789, Osasco, SP', true, NOW()),
  (11, 'Delões Guinchos e Munck', 'Delões Guinchos e Munck LTDA', 'Roberto Delões', '11933332222', 'Av. dos Transportes, 101, Campinas, SP', true, NOW()),
  (12, 'Fluxo Guinchos', 'Fluxo Guinchos e Serviços LTDA', 'Carlos Fluxo', '11922221111', 'Rua dos Reboques, 202, São Bernardo, SP', true, NOW()),
  (15, 'Allan de Souza Vieira', 'Vieira Serviços Automotivos', 'Allan Vieira', '11911110000', 'Av. das Oficinas, 303, Santo André, SP', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir tokens de acesso para parceiros de teste
INSERT INTO public.towing_access_tokens
  (partner_id, token, created_at, expires_at, is_permanent, description)
VALUES
  (5, 'TESTE_GUINCHO_AGUIA_TOKEN', NOW(), NULL, true, 'Token de teste para Guincho Águia'),
  (6, 'TESTE_FORD_TOKEN', NOW(), NULL, true, 'Token de teste para Ford'),
  (8, 'TESTE_CAIO_RAMOS_DE_SOUZA_TOKEN', NOW(), NULL, true, 'Token de teste para Caio Ramos'),
  (9, 'TESTE_CLAUDIO_DE_OLIVEIRA_SILVA_TOKEN', NOW(), NULL, true, 'Token de teste para Claudio Silva'),
  (10, 'TESTE_DAIANE_DO_VALE_AMARAL_TOKEN', NOW(), NULL, true, 'Token de teste para Daiane Amaral'),
  (11, 'TESTE_DELOES_GUINCHOS_TOKEN', NOW(), NULL, true, 'Token de teste para Delões Guinchos'),
  (12, 'TESTE_FLUXO_GUINCHOS_TOKEN', NOW(), NULL, true, 'Token de teste para Fluxo Guinchos'),
  (15, 'TESTE_ALLAN_DE_SOUZA_VIEIRA_TOKEN', NOW(), NULL, true, 'Token de teste para Allan Vieira')
ON CONFLICT (token) DO NOTHING;

-- Função para gerar serviços de teste
CREATE OR REPLACE FUNCTION create_sample_towing_services() 
RETURNS void AS $$
DECLARE
  partner RECORD;
  num_services INTEGER;
  plate TEXT;
  pickup TEXT;
  delivery TEXT;
  service TEXT;
  random_date TIMESTAMP;
  random_cost DECIMAL;
  random_mileage INTEGER;
  random_status TEXT;
  random_payment TEXT;
BEGIN
  -- Lista de placas disponíveis
  DECLARE plates TEXT[] := ARRAY['ABC1234', 'DEF5678', 'GHI9012', 'JKL3456', 'MNO7890', 'PQR1011', 'STU1213', 'VWX1415', 'YZA1617', 'BCD1819'];
  
  -- Lista de endereços de retirada
  DECLARE pickups TEXT[] := ARRAY[
    'Av. Paulista, 1000, São Paulo, SP',
    'Rua Augusta, 500, São Paulo, SP',
    'Av. Anhanguera, km 15, Goiânia, GO',
    'Rod. Pres. Dutra, km 230, São José dos Campos, SP',
    'Av. Brasil, 2500, Rio de Janeiro, RJ'
  ];
  
  -- Lista de endereços de entrega
  DECLARE deliveries TEXT[] := ARRAY[
    'Oficina Central, Rua dos Mecânicos, 123, São Paulo, SP',
    'Concessionária AutoStar, Av. Rebouças, 789, São Paulo, SP',
    'Centro Automotivo Silva, Rua da Indústria, 456, Campinas, SP',
    'Estacionamento Shopping Center, Av. Comercial, 1000, Rio de Janeiro, RJ',
    'Base Muricion Logística, Rua Transportadora, 555, Guarulhos, SP'
  ];
  
  -- Lista de tipos de serviço
  DECLARE services TEXT[] := ARRAY['Reboque', 'Guincho', 'Reboque de veículo quebrado', 'Transporte de veículo', 'Socorro mecânico'];
  
  -- Lista de status possíveis
  DECLARE statuses TEXT[] := ARRAY['pendente', 'aprovado', 'rejeitado'];
  
  -- Lista de status de pagamento
  DECLARE payments TEXT[] := ARRAY['pendente', 'pago', 'cancelado'];
  
  -- Percorre cada parceiro de teste
  FOR partner IN SELECT id FROM public.towing_partners WHERE id IN (5, 6, 8, 9, 10, 11, 12, 15) LOOP
    -- Verifica se já existem serviços para este parceiro
    SELECT COUNT(*) INTO num_services FROM public.towing_service_notes WHERE partner_id = partner.id;
    
    -- Se não há serviços, criar alguns
    IF num_services = 0 THEN
      -- Criar entre 2 e 4 serviços para cada parceiro
      FOR i IN 1..floor(random() * 3 + 2)::int LOOP
        -- Selecionar valores aleatórios
        plate := plates[floor(random() * array_length(plates, 1) + 1)];
        pickup := pickups[floor(random() * array_length(pickups, 1) + 1)];
        delivery := deliveries[floor(random() * array_length(deliveries, 1) + 1)];
        service := services[floor(random() * array_length(services, 1) + 1)];
        random_date := NOW() - (random() * 30)::integer * interval '1 day';
        random_cost := (random() * 500 + 100)::numeric(10,2);
        random_mileage := floor(random() * 50 + 5)::integer;
        random_status := statuses[floor(random() * array_length(statuses, 1) + 1)];
        random_payment := CASE WHEN random_status = 'aprovado' THEN
                            payments[floor(random() * 2 + 1)]
                          ELSE
                            'pendente'
                          END;
        
        -- Inserir o serviço
        INSERT INTO public.towing_service_notes (
          partner_id, plate, pickup_location, delivery_location, 
          service_description, service_date, cost, mileage, 
          notes, status, payment_status, approved_at, created_at
        )
        VALUES (
          partner.id, plate, pickup, delivery, 
          service, random_date, random_cost, random_mileage,
          'Serviço de teste gerado automaticamente', random_status, random_payment,
          CASE WHEN random_status = 'aprovado' THEN random_date + interval '1 hour' ELSE NULL END,
          random_date - interval '1 hour'
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função para criar serviços de teste
SELECT create_sample_towing_services();

-- Trigger para atualizar a coluna updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers para atualização automática de updated_at
CREATE TRIGGER set_timestamp_towing_partners
BEFORE UPDATE ON public.towing_partners
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_towing_service_notes
BEFORE UPDATE ON public.towing_service_notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Concluído!