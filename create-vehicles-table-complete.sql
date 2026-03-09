-- Script para criar a tabela vehicles completa com todos os campos necessários
-- Inclui o campo media_consumo_combustivel para o sistema de consumo automático

-- Primeiro, verificar se a tabela já existe e removê-la se necessário
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

-- Criar a tabela vehicles
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL, -- Marca do veículo
    model VARCHAR(100), -- Modelo do veículo
    year INTEGER,
    vehicle_type vehicle_type NOT NULL,
    fuel_type fuel_type DEFAULT 'Diesel',
    media_consumo_combustivel DECIMAL(5,2), -- Campo para consumo médio (km/l)
    status vehicle_status DEFAULT 'em_operacao',
    base_id UUID REFERENCES bases(id),
    ownership ownership_type DEFAULT 'murici',
    rental_company VARCHAR(255), -- Empresa de locação quando ownership = 'locado'
    crlv_url TEXT, -- URL do documento CRLV
    antt_url TEXT, -- URL do documento ANTT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_make ON vehicles(make);
CREATE INDEX idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_base_id ON vehicles(base_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- Adicionar comentários para documentação
COMMENT ON TABLE vehicles IS 'Tabela de veículos da frota';
COMMENT ON COLUMN vehicles.plate IS 'Placa do veículo (único)';
COMMENT ON COLUMN vehicles.make IS 'Marca do veículo (ex: Volvo, Scania, Mercedes)';
COMMENT ON COLUMN vehicles.model IS 'Modelo do veículo (ex: FH540, R450)';
COMMENT ON COLUMN vehicles.year IS 'Ano de fabricação do veículo';
COMMENT ON COLUMN vehicles.vehicle_type IS 'Tipo de veículo (fiorino, van, vuc, toco, truck, cavalo_mecanico, carreta)';
COMMENT ON COLUMN vehicles.fuel_type IS 'Tipo de combustível usado';
COMMENT ON COLUMN vehicles.media_consumo_combustivel IS 'Consumo médio de combustível em km/l';
COMMENT ON COLUMN vehicles.status IS 'Status atual do veículo';
COMMENT ON COLUMN vehicles.base_id IS 'ID da base onde o veículo está alocado';
COMMENT ON COLUMN vehicles.ownership IS 'Tipo de propriedade (murici, locado, terceirizado)';
COMMENT ON COLUMN vehicles.rental_company IS 'Nome da empresa de locação (quando ownership = locado)';
COMMENT ON COLUMN vehicles.crlv_url IS 'URL do documento CRLV no storage';
COMMENT ON COLUMN vehicles.antt_url IS 'URL do documento ANTT no storage';

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Mostrar contagem de registros (deve ser 0 para tabela nova)
SELECT COUNT(*) as total_vehicles FROM vehicles;