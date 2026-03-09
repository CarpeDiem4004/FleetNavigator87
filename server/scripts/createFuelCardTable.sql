-- Criação da tabela fuel_card_requests para gerenciamento de solicitações de recarga de cartão combustível
CREATE TABLE fuel_card_requests (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) NOT NULL,
    card_number VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    base_id INTEGER REFERENCES bases(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    rejected_by VARCHAR(100),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);