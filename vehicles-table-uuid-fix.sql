-- Script final para criar tabela vehicles com base_id como UUID
-- Remove qualquer tabela existente e cria corretamente

-- Remover tabela se existir
DROP TABLE IF EXISTS vehicles CASCADE;

-- Criar enums necessários
DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM (
        'fiorino', 'van', 'vuc', 'toco', 'truck', 'cavalo_mecanico', 'carreta'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE fuel_type AS ENUM (
        'Diesel', 'Gasolina', 'Etanol', 'GNV', 'Flex'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status AS ENUM (
        'em_operacao', 'manutencao', 'parado', 'vendido', 'baixado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ownership_type AS ENUM (
        'murici', 'locado', 'terceirizado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Criar tabela vehicles com base_id como UUID desde o início
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    year INTEGER,
    vehicle_type vehicle_type NOT NULL,
    fuel_type fuel_type DEFAULT 'Diesel',
    media_consumo_combustivel DECIMAL(5,2),
    status vehicle_status DEFAULT 'em_operacao',
    base_id UUID REFERENCES bases(id),
    ownership ownership_type DEFAULT 'murici',
    rental_company VARCHAR(255),
    crlv_url TEXT,
    antt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_make ON vehicles(make);
CREATE INDEX idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_base_id ON vehicles(base_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- Verificar estrutura criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;