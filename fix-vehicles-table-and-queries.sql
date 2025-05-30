-- Script para corrigir problemas críticos do sistema
-- 1. Criar tabela vehicles (padronizada) baseada na tabela veiculos
-- 2. Corrigir consultas com colunas ambíguas

-- ETAPA 1: Criar tabela vehicles padronizada
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100),
    make VARCHAR(100),
    year INTEGER,
    vehicle_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'em_operacao',
    base_id INTEGER,
    fuel_type VARCHAR(50) DEFAULT 'Diesel',
    cartao_abastecimento VARCHAR(50),
    km_atual INTEGER DEFAULT 0,
    consumo_medio_km_l NUMERIC(5,2) DEFAULT 0,
    ownership VARCHAR(50) DEFAULT 'murici',
    crlv_url TEXT,
    antt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ETAPA 2: Sincronizar dados da tabela veiculos para vehicles
INSERT INTO vehicles (
    plate, model, make, year, vehicle_type, status, base_id, 
    fuel_type, cartao_abastecimento, km_atual, consumo_medio_km_l, 
    created_at, updated_at
)
SELECT 
    v.placa as plate,
    COALESCE(v.modelo, 'Mercedes') as model,
    COALESCE(v.marca, 'Mercedes') as make,
    v.year,
    COALESCE(v.tipo, 'cavalo_mecanico') as vehicle_type,
    COALESCE(v.status, 'em_operacao') as status,
    v.base_id,
    COALESCE(v.fuel_type, 'Diesel') as fuel_type,
    v.cartao_abastecimento,
    COALESCE(v.km_atual, 0) as km_atual,
    COALESCE(v.media_consumo_combustivel, 0) as consumo_medio_km_l,
    COALESCE(v.created_at, NOW()) as created_at,
    COALESCE(v.updated_at, NOW()) as updated_at
FROM veiculos v
ON CONFLICT (plate) DO UPDATE SET
    model = EXCLUDED.model,
    make = EXCLUDED.make,
    year = EXCLUDED.year,
    vehicle_type = EXCLUDED.vehicle_type,
    status = EXCLUDED.status,
    base_id = EXCLUDED.base_id,
    fuel_type = EXCLUDED.fuel_type,
    cartao_abastecimento = EXCLUDED.cartao_abastecimento,
    km_atual = EXCLUDED.km_atual,
    consumo_medio_km_l = EXCLUDED.consumo_medio_km_l,
    updated_at = NOW();

-- ETAPA 3: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_base_id ON vehicles(base_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);

-- ETAPA 4: Verificar resultados
SELECT 
    'Tabela vehicles criada e sincronizada!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN base_id = 3 THEN 1 END) as line_hall_vehicles,
    COUNT(CASE WHEN cartao_abastecimento IS NOT NULL THEN 1 END) as vehicles_with_fuel_card
FROM vehicles;

-- ETAPA 5: Mostrar estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position;