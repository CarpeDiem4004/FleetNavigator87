-- Script para criar a tabela linehall_vehicles que está faltando
-- Este script resolve o erro "relation linehall_vehicles does not exist"

-- 1. Criar a tabela linehall_vehicles se não existir
CREATE TABLE IF NOT EXISTS linehall_vehicles (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100),
    make VARCHAR(100),
    year INTEGER,
    vehicle_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'em_operacao',
    base_id INTEGER,
    fuel_type VARCHAR(50) DEFAULT 'Diesel',
    cartao_combustivel VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_linehall_vehicles_plate ON linehall_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_linehall_vehicles_base_id ON linehall_vehicles(base_id);
CREATE INDEX IF NOT EXISTS idx_linehall_vehicles_status ON linehall_vehicles(status);

-- 3. Inserir dados dos veículos Line Hall Shopee da tabela veiculos
INSERT INTO linehall_vehicles (plate, model, make, vehicle_type, status, base_id, fuel_type, cartao_combustivel)
SELECT 
    placa as plate,
    COALESCE(modelo, 'Mercedes') as model,
    COALESCE(marca, 'Mercedes') as make,
    COALESCE(tipo, 'cavalo_mecanico') as vehicle_type,
    COALESCE(status, 'em_operacao') as status,
    base_id,
    COALESCE(fuel_type, 'Diesel') as fuel_type,
    cartao_abastecimento as cartao_combustivel
FROM veiculos 
WHERE base_id = 3  -- Line Hall Shopee base
ON CONFLICT (plate) DO UPDATE SET
    model = EXCLUDED.model,
    make = EXCLUDED.make,
    vehicle_type = EXCLUDED.vehicle_type,
    status = EXCLUDED.status,
    base_id = EXCLUDED.base_id,
    fuel_type = EXCLUDED.fuel_type,
    cartao_combustivel = EXCLUDED.cartao_combustivel,
    updated_at = NOW();

-- 4. Verificar resultado
SELECT 
    'Tabela linehall_vehicles criada com sucesso!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN cartao_combustivel IS NOT NULL THEN 1 END) as vehicles_with_fuel_card
FROM linehall_vehicles;

-- 5. Mostrar alguns registros de exemplo
SELECT plate, model, make, vehicle_type, status, cartao_combustivel 
FROM linehall_vehicles 
LIMIT 5;