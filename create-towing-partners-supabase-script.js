/**
 * Script para criar e verificar estruturas de parceiros de guincho no Supabase,
 * incluindo o parceiro Ford.
 * 
 * Para executar este script:
 * 1. Certifique-se de que as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY estejam definidas
 * 2. Execute com Node.js: node create-towing-partners-supabase-script.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Queries SQL para criar estruturas
const createTowingPartnerStatusType = `
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'towing_partner_status') THEN
        CREATE TYPE towing_partner_status AS ENUM ('ativo', 'inativo', 'pendente', 'suspenso');
    END IF;
END $$;
`;

const createTowingPartnersTable = `
CREATE TABLE IF NOT EXISTS towing_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  cnpj VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  address TEXT,
  contact_person VARCHAR(255),
  rating NUMERIC(3,1),
  service_types TEXT[] DEFAULT '{}',
  price_range VARCHAR(50),
  payment_methods TEXT[] DEFAULT '{}',
  cost_per_km NUMERIC(10,2),
  available_24h BOOLEAN DEFAULT false,
  can_transport_multiple BOOLEAN DEFAULT false,
  has_insurance BOOLEAN DEFAULT false,
  coverage_radius INTEGER,
  notes TEXT,
  status towing_partner_status DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  service_count INTEGER DEFAULT 0,
  last_service_date TIMESTAMP,
  bank_name VARCHAR(100),
  bank_account VARCHAR(20),
  bank_agency VARCHAR(10),
  pix_key VARCHAR(255),
  pix_type VARCHAR(20)
);
`;

const createTowingRequestsTable = `
CREATE TABLE IF NOT EXISTS towing_requests (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES towing_partners(id),
  vehicle_plate VARCHAR(10),
  driver_name VARCHAR(255),
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  service_type VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'media',
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  rating NUMERIC(3,1),
  comments TEXT,
  user_id INTEGER,
  base_id INTEGER,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by INTEGER
);
`;

const createTowingPartnerDocumentsTable = `
CREATE TABLE IF NOT EXISTS towing_partner_documents (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES towing_partners(id),
  document_type VARCHAR(50) NOT NULL,
  document_url TEXT NOT NULL,
  filename VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ativo'
);
`;

const createTowingPartnerPaymentsTable = `
CREATE TABLE IF NOT EXISTS towing_partner_payments (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES towing_partners(id),
  request_id INTEGER REFERENCES towing_requests(id),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  payment_date TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  invoice_url TEXT,
  requested_by INTEGER,
  approved_by INTEGER,
  approved_at TIMESTAMPTZ
);
`;

const insertFordPartner = `
INSERT INTO towing_partners (
  id, name, company_name, cnpj, phone, email, 
  city, region, address, contact_person,
  rating, service_types, payment_methods, 
  cost_per_km, available_24h, can_transport_multiple,
  status, service_count, notes
)
VALUES (
  6, 'Ford', 'Ford Serviços de Guincho Ltda', '67.890.123/0001-45',
  '(11) 5544-3322', 'atendimento@fordguincho.com.br',
  'São Paulo', 'Zona Oeste', 'Av. Ford, 1000, Lapa', 'Pedro Almeida',
  4.8, ARRAY['leve', 'médio', 'pesado'], ARRAY['dinheiro', 'cartão', 'pix'],
  7.50, true, true,
  'ativo', 35, ''
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_name = EXCLUDED.company_name,
  cnpj = EXCLUDED.cnpj,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  address = EXCLUDED.address,
  contact_person = EXCLUDED.contact_person,
  rating = EXCLUDED.rating,
  service_types = EXCLUDED.service_types,
  payment_methods = EXCLUDED.payment_methods,
  cost_per_km = EXCLUDED.cost_per_km,
  available_24h = EXCLUDED.available_24h,
  can_transport_multiple = EXCLUDED.can_transport_multiple,
  status = EXCLUDED.status;
`;

const createUpdateTimestampFunction = `
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

const createTriggers = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_towing_partners_timestamp'
  ) THEN
    CREATE TRIGGER update_towing_partners_timestamp
    BEFORE UPDATE ON towing_partners
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_towing_requests_timestamp'
  ) THEN
    CREATE TRIGGER update_towing_requests_timestamp
    BEFORE UPDATE ON towing_requests
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;
`;

const createTowingPartnersSummaryView = `
CREATE OR REPLACE VIEW towing_partners_summary AS
SELECT 
  p.id, 
  p.name, 
  p.city, 
  p.region, 
  p.status, 
  p.rating,
  p.service_count,
  p.last_service_date,
  COUNT(r.id) AS total_requests,
  SUM(CASE WHEN r.status = 'concluido' THEN 1 ELSE 0 END) AS completed_requests
FROM 
  towing_partners p
LEFT JOIN 
  towing_requests r ON p.id = r.partner_id
GROUP BY 
  p.id, p.name, p.city, p.region, p.status, p.rating, p.service_count, p.last_service_date;
`;

// Função para executar queries SQL
async function executeSql(query, description) {
  try {
    console.log(`Executando: ${description}...`);
    const { error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      console.error(`Erro ao executar ${description}:`, error);
      return false;
    }
    
    console.log(`Concluído: ${description}`);
    return true;
  } catch (err) {
    console.error(`Exceção ao executar ${description}:`, err);
    return false;
  }
}

// Função para verificar se o parceiro existe
async function checkPartnerExists(id) {
  try {
    const { data, error } = await supabase
      .from('towing_partners')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      console.error(`Erro ao verificar parceiro ID ${id}:`, error);
      return false;
    }
    
    if (data) {
      console.log(`Parceiro ID ${id} encontrado: ${data.name}`);
      return true;
    } else {
      console.log(`Parceiro ID ${id} não encontrado`);
      return false;
    }
  } catch (err) {
    console.error(`Exceção ao verificar parceiro ID ${id}:`, err);
    return false;
  }
}

// Função principal
async function main() {
  console.log('Verificando e criando estruturas para parceiros de guincho no Supabase');
  
  // Executando criação das estruturas em ordem
  await executeSql(createTowingPartnerStatusType, 'Criar tipo towing_partner_status');
  await executeSql(createTowingPartnersTable, 'Criar tabela de parceiros');
  await executeSql(createTowingRequestsTable, 'Criar tabela de solicitações');
  await executeSql(createTowingPartnerDocumentsTable, 'Criar tabela de documentos');
  await executeSql(createTowingPartnerPaymentsTable, 'Criar tabela de pagamentos');
  await executeSql(createUpdateTimestampFunction, 'Criar função para atualizar timestamp');
  await executeSql(createTriggers, 'Criar triggers');
  await executeSql(createTowingPartnersSummaryView, 'Criar view de resumo dos parceiros');

  // Verificar se o parceiro Ford existe e inserir/atualizar
  const fordExists = await checkPartnerExists(6);
  if (!fordExists) {
    await executeSql(insertFordPartner, 'Inserir parceiro Ford');
  } else {
    await executeSql(insertFordPartner, 'Atualizar parceiro Ford');
  }

  console.log('Processo concluído!');
}

// Executar o script
main()
  .catch(err => {
    console.error('Erro na execução do script:', err);
    process.exit(1);
  })
  .finally(() => {
    console.log('Script finalizado');
  });