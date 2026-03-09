-- Script SQL para criar tabelas específicas do Line Hall Shopee no Supabase
-- Execute este script no Editor SQL do Supabase

-- 1. Criar tabela específica para manutenções do Line Hall
CREATE TABLE IF NOT EXISTS linehall_maintenance (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL,
    motorista_nome VARCHAR(255) NOT NULL,
    vehicle_plate VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    urgency VARCHAR(20) DEFAULT 'normal', -- baixa, normal, alta, emergencial
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, em_andamento, concluida, cancelada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    notes TEXT NULL,
    approved_by VARCHAR(255) NULL
);

-- 2. Criar tabela específica para cartões combustível Line Hall
CREATE TABLE IF NOT EXISTS linehall_fuel_cards (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL,
    motorista_nome VARCHAR(255) NOT NULL,
    numero_cartao VARCHAR(50) NOT NULL,
    valor_solicitado DECIMAL(10,2) NOT NULL,
    justificativa TEXT NOT NULL,
    vehicle_plate VARCHAR(10),
    comprovante_url TEXT,
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, aprovada, rejeitada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by VARCHAR(255) NULL
);

-- 3. Inserir dados de exemplo para manutenções Line Hall
INSERT INTO linehall_maintenance (motorista_id, motorista_nome, vehicle_plate, description, urgency, status) VALUES
(2, 'João Silva', 'ABC1234', 'Revisão preventiva - Line Hall', 'normal', 'pendente'),
(2, 'João Silva', 'DEF5678', 'Problema no freio - Line Hall', 'alta', 'em_andamento'),
(2, 'João Silva', 'GHI9012', 'Troca de óleo - Line Hall', 'normal', 'concluida');

-- 4. Inserir dados de exemplo para cartões combustível
INSERT INTO linehall_fuel_cards (motorista_id, motorista_nome, numero_cartao, valor_solicitado, justificativa, vehicle_plate, status) VALUES
(2, 'João Silva', 'LH001234', 500.00, 'Viagem longa São Paulo - Salvador', 'ABC1234', 'pendente'),
(2, 'João Silva', 'LH001234', 300.00, 'Retorno Salvador - São Paulo', 'ABC1234', 'aprovada');

-- 5. Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('linehall_maintenance', 'linehall_fuel_cards')
ORDER BY table_name;

-- 6. Verificar se os dados foram inseridos
SELECT 'linehall_maintenance' as tabela, COUNT(*) as registros FROM linehall_maintenance
UNION ALL
SELECT 'linehall_fuel_cards' as tabela, COUNT(*) as registros FROM linehall_fuel_cards;