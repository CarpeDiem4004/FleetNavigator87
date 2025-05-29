-- Script para criar tabela de localização dos motoristas do Line Hall Shopee
CREATE TABLE IF NOT EXISTS linehall_driver_locations (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL,
    trip_id INTEGER,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    speed DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    altitude DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para performance
    INDEX idx_motorista_id (motorista_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_motorista_timestamp (motorista_id, timestamp)
);

-- Comentários para documentação
COMMENT ON TABLE linehall_driver_locations IS 'Tabela para armazenar localizações GPS dos motoristas do Line Hall Shopee';
COMMENT ON COLUMN linehall_driver_locations.motorista_id IS 'ID do motorista';
COMMENT ON COLUMN linehall_driver_locations.trip_id IS 'ID da viagem associada (opcional)';
COMMENT ON COLUMN linehall_driver_locations.latitude IS 'Latitude GPS';
COMMENT ON COLUMN linehall_driver_locations.longitude IS 'Longitude GPS';
COMMENT ON COLUMN linehall_driver_locations.accuracy IS 'Precisão da localização em metros';
COMMENT ON COLUMN linehall_driver_locations.speed IS 'Velocidade em km/h';
COMMENT ON COLUMN linehall_driver_locations.heading IS 'Direção em graus (0-360)';
COMMENT ON COLUMN linehall_driver_locations.altitude IS 'Altitude em metros';