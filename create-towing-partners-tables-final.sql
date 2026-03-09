-- Script final corrigido para criar estrutura completa de parceiros de guincho no Supabase
-- Inclui tabelas, views e funções necessárias para o funcionamento do módulo

-- 1. Tabela de Parceiros de Guincho
CREATE TABLE IF NOT EXISTS towing_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  isactive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela de Tokens de Acesso dos Parceiros
CREATE TABLE IF NOT EXISTS towing_access_tokens (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_by INTEGER,
  description TEXT,
  CONSTRAINT fk_partner FOREIGN KEY (partner_id) REFERENCES towing_partners(id) ON DELETE CASCADE
);

-- 3. Tabela de Registros de Serviços de Guincho
CREATE TABLE IF NOT EXISTS towing_service_notes (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES towing_partners(id),
  plate VARCHAR(20) NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  service_description TEXT,
  service_date TIMESTAMP NOT NULL DEFAULT NOW(),
  cost NUMERIC(10, 2) DEFAULT 0,
  mileage INTEGER,
  notes TEXT,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  approved_at TIMESTAMP,
  approved_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_partner_service FOREIGN KEY (partner_id) REFERENCES towing_partners(id) ON DELETE CASCADE
);

-- 4. Tabela de Serviços Guincho (View materializada para compatibilidade com sistema legado)
CREATE TABLE IF NOT EXISTS servicos_guincho (
  id SERIAL PRIMARY KEY,
  parceiro_id INTEGER,
  placa VARCHAR(20) NOT NULL,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  tipo_servico TEXT,
  data_lancamento TIMESTAMP NOT NULL DEFAULT NOW(),
  valor NUMERIC(10, 2) DEFAULT 0,
  km_reboque INTEGER,
  observacoes TEXT,
  contato_nome VARCHAR(255),
  contato_telefone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_aprovacao TIMESTAMP,
  aprovado_por INTEGER,
  pagamento_status VARCHAR(20) DEFAULT 'pending'
);

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_towing_partners_name ON towing_partners(name);
CREATE INDEX IF NOT EXISTS idx_towing_service_notes_partner_id ON towing_service_notes(partner_id);
CREATE INDEX IF NOT EXISTS idx_towing_service_notes_status ON towing_service_notes(status);
CREATE INDEX IF NOT EXISTS idx_towing_service_notes_plate ON towing_service_notes(plate);
CREATE INDEX IF NOT EXISTS idx_towing_access_tokens_token ON towing_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_servicos_guincho_parceiro_id ON servicos_guincho(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_servicos_guincho_status ON servicos_guincho(status);

-- Criar view para consolidar informações de serviços de parceiros
CREATE OR REPLACE VIEW vw_towing_services AS
SELECT 
  t.id,
  t.partner_id,
  p.name AS partner_name,
  p.company_name,
  t.plate,
  t.pickup_location,
  t.delivery_location,
  t.service_description,
  t.service_date,
  t.cost,
  t.mileage,
  t.notes,
  t.contact_name,
  t.contact_phone,
  t.status,
  t.payment_status,
  t.approved_at,
  t.approved_by,
  t.created_at,
  t.updated_at
FROM towing_service_notes t
JOIN towing_partners p ON t.partner_id = p.id
ORDER BY t.created_at DESC;

-- Criar função para sincronizar serviços entre as tabelas
CREATE OR REPLACE FUNCTION sync_towing_services()
RETURNS TRIGGER AS $$
BEGIN
  -- Ao inserir/atualizar um serviço em towing_service_notes, sincronizar com servicos_guincho
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    INSERT INTO servicos_guincho (
      id, parceiro_id, placa, origem, destino, tipo_servico, 
      data_lancamento, valor, km_reboque, observacoes, contato_nome, 
      contato_telefone, status, data_criacao, data_aprovacao, aprovado_por, pagamento_status
    ) 
    VALUES (
      NEW.id, NEW.partner_id, NEW.plate, NEW.pickup_location, NEW.delivery_location, 
      NEW.service_description, NEW.service_date, NEW.cost, NEW.mileage, 
      NEW.notes, NEW.contact_name, NEW.contact_phone, NEW.status,
      NEW.created_at, NEW.approved_at, NEW.approved_by, NEW.payment_status
    )
    ON CONFLICT (id) DO UPDATE SET
      placa = NEW.plate,
      origem = NEW.pickup_location,
      destino = NEW.delivery_location,
      tipo_servico = NEW.service_description,
      data_lancamento = NEW.service_date,
      valor = NEW.cost,
      km_reboque = NEW.mileage,
      observacoes = NEW.notes,
      contato_nome = NEW.contact_name,
      contato_telefone = NEW.contact_phone,
      status = NEW.status,
      data_aprovacao = NEW.approved_at,
      aprovado_por = NEW.approved_by,
      pagamento_status = NEW.payment_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger para a sincronização
DROP TRIGGER IF EXISTS towing_services_sync_trigger ON towing_service_notes;
CREATE TRIGGER towing_services_sync_trigger
AFTER INSERT OR UPDATE ON towing_service_notes
FOR EACH ROW
EXECUTE FUNCTION sync_towing_services();

-- Criação de parceiros de teste para ambiente de desenvolvimento
INSERT INTO towing_partners (id, name, company_name, contact_name, contact_phone, address, isactive) 
VALUES 
  (5, 'Guincho Águia', 'Guincho Águia LTDA', 'José Silva', '11987654321', 'Av. Paulista, 1000, São Paulo, SP', true),
  (6, 'Ford', 'Ford Serviços de Guincho Ltda', 'Atendimento Ford', '11912345678', 'Av. Industrial, 2500, São Bernardo do Campo, SP', true),
  (8, 'Caio Ramos de Souza', 'Ramos Guincho Express', 'Caio Ramos', '11998887766', 'Rua das Flores, 150, São Paulo, SP', true),
  (9, 'Claudio de Oliveira Silva', 'Oliveira Auto Socorro', 'Claudio Silva', '11977766655', 'Av. Interlagos, 1500, São Paulo, SP', true),
  (10, 'Daiane do Vale Amaral', 'Vale Serviços de Guincho', 'Daiane Amaral', '11966655544', 'Rua Vergueiro, 2000, São Paulo, SP', true),
  (11, 'Delões Guinchos e Munck', 'Delões Guinchos e Munck LTDA', 'Roberto Delões', '11955544433', 'Av. das Nações Unidas, 12000, São Paulo, SP', true),
  (12, 'Fluxo Guinchos', 'Fluxo Guinchos e Serviços LTDA', 'Amanda Fluxo', '11944433322', 'Av. Morumbi, 5000, São Paulo, SP', true),
  (15, 'Allan de Souza Vieira', 'Vieira Serviços Automotivos', 'Allan Vieira', '11933322211', 'Rua Augusta, 500, São Paulo, SP', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_name = EXCLUDED.company_name,
  contact_name = EXCLUDED.contact_name,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address,
  isactive = EXCLUDED.isactive;

-- Inserir tokens de teste para os parceiros criados
INSERT INTO towing_access_tokens (partner_id, token, expires_at, description)
VALUES 
  (5, 'teste_guincho_aguia_token', NULL, 'Token de teste para Guincho Águia'),
  (6, 'teste_ford_token', NULL, 'Token de teste para Ford'),
  (8, 'teste_caio_ramos_de_souza_token', NULL, 'Token de teste para Caio Ramos de Souza'),
  (9, 'teste_claudio_de_oliveira_token', NULL, 'Token de teste para Claudio de Oliveira Silva'),
  (10, 'teste_daiane_do_vale_token', NULL, 'Token de teste para Daiane do Vale Amaral'),
  (11, 'teste_deloes_guinchos_token', NULL, 'Token de teste para Delões Guinchos e Munck'),
  (12, 'teste_fluxo_guinchos_token', NULL, 'Token de teste para Fluxo Guinchos'),
  (15, 'teste_allan_de_souza_vieira_token', NULL, 'Token de teste para Allan de Souza Vieira')
ON CONFLICT (token) DO UPDATE SET
  partner_id = EXCLUDED.partner_id,
  expires_at = EXCLUDED.expires_at,
  description = EXCLUDED.description;

-- Criar função para inserir serviços de teste automaticamente
CREATE OR REPLACE FUNCTION insert_test_services(partner_id INTEGER, num_services INTEGER DEFAULT 3)
RETURNS VOID AS $$
DECLARE
  plates TEXT[] := ARRAY['ABC1234', 'DEF5678', 'GHI9012', 'JKL3456', 'MNO7890'];
  pickup_locations TEXT[] := ARRAY[
    'Av. Paulista, 1000, São Paulo, SP',
    'Rua Augusta, 500, São Paulo, SP',
    'Av. Anhanguera, km 15, Goiânia, GO',
    'Rod. Pres. Dutra, km 230, São José dos Campos, SP',
    'Av. Brasil, 2500, Rio de Janeiro, RJ'
  ];
  delivery_locations TEXT[] := ARRAY[
    'Oficina Central, Rua dos Mecânicos, 123, São Paulo, SP',
    'Concessionária AutoStar, Av. Rebouças, 789, São Paulo, SP',
    'Centro Automotivo Silva, Rua da Industria, 456, Campinas, SP',
    'Estacionamento Shopping Center, Av. Comercial, 1000, Rio de Janeiro, RJ',
    'Base Muricion Logística, Rua Transportadora, 555, Guarulhos, SP'
  ];
  service_types TEXT[] := ARRAY['Reboque', 'Guincho', 'Reboque de veículo quebrado', 'Transporte de veículo', 'Socorro mecânico'];
  statuses TEXT[] := ARRAY['aprovado', 'pendente', 'rejeitado'];
  payment_statuses TEXT[] := ARRAY['pago', 'pendente', 'cancelado'];
  
  random_days INTEGER;
  service_date TIMESTAMP;
  created_at TIMESTAMP;
  plate TEXT;
  pickup TEXT;
  delivery TEXT;
  service_type TEXT;
  status TEXT;
  payment_status TEXT;
  km_distance INTEGER;
  service_cost NUMERIC(10,2);
  approved_at TIMESTAMP;
  i INTEGER;
BEGIN
  -- Verificar se o parceiro existe
  IF NOT EXISTS (SELECT 1 FROM towing_partners WHERE id = partner_id) THEN
    RAISE EXCEPTION 'Parceiro com ID % não encontrado', partner_id;
  END IF;
  
  -- Verificar se já existem serviços para este parceiro
  IF EXISTS (SELECT 1 FROM towing_service_notes WHERE partner_id = partner_id) THEN
    RETURN; -- Não criar novos serviços se já existirem
  END IF;
  
  -- Criar serviços de teste
  FOR i IN 1..num_services LOOP
    random_days := floor(random() * 30) + 1; -- 1 a 30 dias atrás
    service_date := NOW() - (random_days * INTERVAL '1 day');
    created_at := service_date - (random() * INTERVAL '1 day'); -- Criado antes da data do serviço
    
    plate := plates[floor(random() * array_length(plates, 1)) + 1];
    pickup := pickup_locations[floor(random() * array_length(pickup_locations, 1)) + 1];
    delivery := delivery_locations[floor(random() * array_length(delivery_locations, 1)) + 1];
    service_type := service_types[floor(random() * array_length(service_types, 1)) + 1];
    status := statuses[floor(random() * array_length(statuses, 1)) + 1];
    
    -- Se aprovado, só pode ser pago ou pendente
    IF status = 'aprovado' THEN
      payment_status := payment_statuses[floor(random() * 2) + 1];
    ELSE
      payment_status := 'pendente';
    END IF;
    
    km_distance := floor(random() * 50) + 5; -- 5 a 55 km
    service_cost := 150 + (km_distance * 3.5); -- Custo base + km * tarifa
    
    -- Aprovado há algumas horas atrás se o status for aprovado
    IF status = 'aprovado' THEN
      approved_at := service_date + (random() * INTERVAL '12 hours');
    ELSE
      approved_at := NULL;
    END IF;
    
    -- Inserir o serviço
    INSERT INTO towing_service_notes (
      partner_id, plate, pickup_location, delivery_location, 
      service_description, service_date, cost, mileage, 
      notes, contact_name, contact_phone, status, payment_status, 
      approved_at, created_at
    ) VALUES (
      partner_id, plate, pickup, delivery, 
      service_type, service_date, service_cost, km_distance, 
      'Serviço de teste automático', 'Contato Teste', '11987654321', 
      status, payment_status, approved_at, created_at
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Inicializar serviços de teste para todos os parceiros
SELECT insert_test_services(5, 3);
SELECT insert_test_services(6, 3);
SELECT insert_test_services(8, 3);  -- Caio Ramos de Souza
SELECT insert_test_services(9, 3);
SELECT insert_test_services(10, 3);
SELECT insert_test_services(11, 3);
SELECT insert_test_services(12, 3);
SELECT insert_test_services(15, 3);

-- Conceder permissões para o usuário da aplicação (opcional, dependendo da configuração do Supabase)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;