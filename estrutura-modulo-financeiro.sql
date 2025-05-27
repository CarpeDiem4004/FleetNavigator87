-- ESTRUTURA BÁSICA PARA MÓDULO FINANCEIRO DE PARCEIROS DE GUINCHO
-- Execute este script no SQL Editor do seu Supabase

-- 1. CRIAR/ATUALIZAR TABELA DE PARCEIROS
CREATE TABLE IF NOT EXISTS towing_partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    external_access_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar colunas que podem estar faltando
ALTER TABLE towing_partners 
ADD COLUMN IF NOT EXISTS external_access_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. CRIAR TABELA DE SERVIÇOS DE GUINCHO
CREATE TABLE IF NOT EXISTS towing_services (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES towing_partners(id),
    vehicle_plate VARCHAR(20) NOT NULL,
    driver_name VARCHAR(255),
    service_type VARCHAR(100),
    pickup_location TEXT NOT NULL,
    destination TEXT NOT NULL,
    service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pendente',
    description TEXT,
    payment_date TIMESTAMP,
    payment_reference VARCHAR(255),
    payment_processed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_towing_services_status ON towing_services(status);
CREATE INDEX IF NOT EXISTS idx_towing_services_partner_id ON towing_services(partner_id);
CREATE INDEX IF NOT EXISTS idx_towing_services_payment_date ON towing_services(payment_date);
CREATE INDEX IF NOT EXISTS idx_towing_services_status_payment ON towing_services(status, payment_date);

-- 4. VERIFICAÇÃO FINAL
SELECT 'Estrutura do módulo financeiro criada com sucesso!' as resultado;