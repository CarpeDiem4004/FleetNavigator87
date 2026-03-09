-- Script de correção para a tabela vehicles
-- Remove a foreign key problemática e recria com o tipo correto

-- Primeiro, verificar a estrutura da tabela bases
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bases' AND column_name = 'id';

-- Verificar se a tabela vehicles já existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'vehicles'
);

-- Se a tabela vehicles já existe, remover e recriar
DROP TABLE IF EXISTS vehicles CASCADE;

-- Criar enum para tipos de veículo se não existir
DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM (
        'fiorino',
        'van', 
        'vuc',
        'toco',
        'truck',
        'cavalo_mecanico',
        'carreta'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para tipos de combustível se não existir
DO $$ BEGIN
    CREATE TYPE fuel_type AS ENUM (
        'Diesel',
        'Gasolina',
        'Etanol',
        'GNV',
        'Flex'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para status do veículo se não existir
DO $$ BEGIN
    CREATE TYPE vehicle_status AS ENUM (
        'em_operacao',
        'manutencao',
        'parado',
        'vendido',
        'baixado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para propriedade se não existir
DO $$ BEGIN
    CREATE TYPE ownership_type AS ENUM (
        'murici',
        'locado',
        'terceirizado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar a tabela vehicles sem foreign key primeiro
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
    base_id INTEGER, -- Sem foreign key por enquanto
    ownership ownership_type DEFAULT 'murici',
    rental_company VARCHAR(255),
    crlv_url TEXT,
    antt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar o tipo do campo id na tabela bases e ajustar base_id conforme necessário
DO $$
DECLARE
    bases_id_type text;
BEGIN
    SELECT data_type INTO bases_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'bases' AND column_name = 'id';
    
    IF bases_id_type = 'uuid' THEN
        -- Se bases.id é UUID, alterar base_id para UUID
        ALTER TABLE vehicles ALTER COLUMN base_id TYPE UUID USING base_id::text::uuid;
        ALTER TABLE vehicles ADD CONSTRAINT vehicles_base_id_fkey 
            FOREIGN KEY (base_id) REFERENCES bases(id);
    ELSIF bases_id_type = 'integer' THEN
        -- Se bases.id é integer, adicionar foreign key diretamente
        ALTER TABLE vehicles ADD CONSTRAINT vehicles_base_id_fkey 
            FOREIGN KEY (base_id) REFERENCES bases(id);
    END IF;
END $$;

-- Criar índices
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_make ON vehicles(make);
CREATE INDEX idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_base_id ON vehicles(base_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- Verificar a estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;