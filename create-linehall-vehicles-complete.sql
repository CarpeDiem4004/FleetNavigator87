-- Script completo para criar a tabela linehall_vehicles
-- Resolve erro "relation linehall_vehicles does not exist"

-- 1. Criar a tabela linehall_vehicles com estrutura completa
CREATE TABLE IF NOT EXISTS linehall_vehicles (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    plate VARCHAR(20),
    modelo VARCHAR(100),
    model VARCHAR(100),
    make VARCHAR(100),
    tipo VARCHAR(50),
    vehicle_type VARCHAR(50),
    ano INTEGER,
    year INTEGER,
    status VARCHAR(50) DEFAULT 'em_operacao',
    base_id INTEGER,
    fuel_type VARCHAR(50) DEFAULT 'Diesel',
    cartao_combustivel VARCHAR(50),
    km_atual INTEGER DEFAULT 0,
    consumo_medio_km_l NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_linehall_vehicles_placa ON linehall_vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_linehall_vehicles_plate ON linehall_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_linehall_vehicles_status ON linehall_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_linehall_vehicles_base_id ON linehall_vehicles(base_id);

-- 3. Inserir todos os veículos Line Hall Shopee da tabela veiculos
INSERT INTO linehall_vehicles (
    placa, plate, modelo, model, make, tipo, vehicle_type, 
    ano, year, status, base_id, fuel_type, cartao_combustivel,
    km_atual, consumo_medio_km_l, created_at, updated_at
)
SELECT 
    v.placa,
    v.placa as plate,
    COALESCE(v.modelo, 'Mercedes') as modelo,
    COALESCE(v.modelo, 'Mercedes') as model,
    COALESCE(v.marca, 'Mercedes') as make,
    COALESCE(v.tipo, 'cavalo_mecanico') as tipo,
    COALESCE(v.tipo, 'cavalo_mecanico') as vehicle_type,
    v.year as ano,
    v.year,
    COALESCE(v.status, 'em_operacao') as status,
    v.base_id,
    COALESCE(v.fuel_type, 'Diesel') as fuel_type,
    v.cartao_abastecimento as cartao_combustivel,
    0 as km_atual,
    COALESCE(v.media_consumo_combustivel, 0) as consumo_medio_km_l,
    NOW() as created_at,
    NOW() as updated_at
FROM veiculos v
WHERE v.base_id = 3  -- Line Hall Shopee base
ON CONFLICT (placa) DO UPDATE SET
    plate = EXCLUDED.plate,
    modelo = EXCLUDED.modelo,
    model = EXCLUDED.model,
    make = EXCLUDED.make,
    tipo = EXCLUDED.tipo,
    vehicle_type = EXCLUDED.vehicle_type,
    ano = EXCLUDED.ano,
    year = EXCLUDED.year,
    status = EXCLUDED.status,
    base_id = EXCLUDED.base_id,
    fuel_type = EXCLUDED.fuel_type,
    cartao_combustivel = EXCLUDED.cartao_combustivel,
    updated_at = NOW();

-- 4. Verificar resultado final
SELECT 
    'Tabela linehall_vehicles criada e populada com sucesso!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN cartao_combustivel IS NOT NULL THEN 1 END) as vehicles_with_fuel_cards,
    COUNT(CASE WHEN base_id = 3 THEN 1 END) as line_hall_vehicles
FROM linehall_vehicles;

-- 5. Mostrar estrutura da tabela criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'linehall_vehicles' 
ORDER BY ordinal_position;