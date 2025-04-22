-- Verifica se a tabela montagem_pneus existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'montagem_pneus') THEN
        -- Cria a tabela montagem_pneus
        CREATE TABLE montagem_pneus (
            id SERIAL PRIMARY KEY,
            pneu_id INTEGER NOT NULL REFERENCES pneus(id),
            placa_veiculo TEXT NOT NULL,
            km_instalacao INTEGER NOT NULL,
            km_remocao INTEGER,
            data_instalacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            data_remocao TIMESTAMP WITH TIME ZONE,
            motivo_remocao TEXT,
            posicao TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Adiciona comentário na tabela
        COMMENT ON TABLE montagem_pneus IS 'Tabela para armazenar o histórico de montagem e remoção de pneus nos veículos';
        
        -- Cria índices para melhorar a performance
        CREATE INDEX idx_montagem_pneus_pneu_id ON montagem_pneus(pneu_id);
        CREATE INDEX idx_montagem_pneus_placa_veiculo ON montagem_pneus(placa_veiculo);
        
        RAISE NOTICE 'Tabela montagem_pneus criada com sucesso.';
    ELSE
        RAISE NOTICE 'Tabela montagem_pneus já existe.';
    END IF;
END $$;