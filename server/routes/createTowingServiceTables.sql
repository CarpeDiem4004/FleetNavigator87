-- Criar tabela para as notas de serviço de guincho
CREATE TABLE IF NOT EXISTS towing_service_notes (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL,
  plate VARCHAR(20) NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  service_description TEXT NOT NULL,
  service_date TIMESTAMP NOT NULL DEFAULT NOW(),
  cost DECIMAL(10, 2) NOT NULL,
  mileage INTEGER,
  notes TEXT,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES towing_partners(id)
);

-- Criar tabela para os tokens de acesso externo
CREATE TABLE IF NOT EXISTS towing_access_tokens (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (partner_id) REFERENCES towing_partners(id)
);

-- Adicionar contador de serviços aos parceiros de guincho
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS service_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMP;