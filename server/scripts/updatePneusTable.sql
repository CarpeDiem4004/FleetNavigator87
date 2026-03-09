-- Atualização da tabela pneus para incluir campos adicionais
-- Primeiro, verificamos se os campos já existem

DO $$
BEGIN
    -- Verifica e adiciona coluna código/serial
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'codigo') THEN
        ALTER TABLE pneus ADD COLUMN codigo VARCHAR(50);
    END IF;

    -- Verifica e adiciona coluna marca
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'marca') THEN
        ALTER TABLE pneus ADD COLUMN marca VARCHAR(50);
    END IF;

    -- Verifica e adiciona coluna modelo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'modelo') THEN
        ALTER TABLE pneus ADD COLUMN modelo VARCHAR(50);
    END IF;

    -- Verifica e adiciona coluna medida
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'medida') THEN
        ALTER TABLE pneus ADD COLUMN medida VARCHAR(50);
    END IF;

    -- Verifica e adiciona coluna aro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'aro') THEN
        ALTER TABLE pneus ADD COLUMN aro VARCHAR(20);
    END IF;

    -- Verifica e adiciona coluna tipo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'tipo') THEN
        ALTER TABLE pneus ADD COLUMN tipo VARCHAR(50);
    END IF;

    -- Verifica e adiciona coluna origem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'origem') THEN
        ALTER TABLE pneus ADD COLUMN origem VARCHAR(20);
    END IF;

    -- Verifica e adiciona coluna data_aquisicao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'data_aquisicao') THEN
        ALTER TABLE pneus ADD COLUMN data_aquisicao DATE;
    END IF;

    -- Verifica e adiciona coluna veiculo_placa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'veiculo_placa') THEN
        ALTER TABLE pneus ADD COLUMN veiculo_placa VARCHAR(10);
    END IF;

    -- Verifica e adiciona coluna posicao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'posicao') THEN
        ALTER TABLE pneus ADD COLUMN posicao VARCHAR(30);
    END IF;

    -- Verifica e adiciona coluna km_inicial
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'km_inicial') THEN
        ALTER TABLE pneus ADD COLUMN km_inicial INTEGER DEFAULT 0;
    END IF;

    -- Verifica e adiciona coluna km_atual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'km_atual') THEN
        ALTER TABLE pneus ADD COLUMN km_atual INTEGER DEFAULT 0;
    END IF;

    -- Verifica e adiciona coluna profundidade_sulco
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'profundidade_sulco') THEN
        ALTER TABLE pneus ADD COLUMN profundidade_sulco DECIMAL(4,1) DEFAULT 12.0;
    END IF;

    -- Verifica e adiciona coluna localizacao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'localizacao') THEN
        ALTER TABLE pneus ADD COLUMN localizacao VARCHAR(50) DEFAULT 'almoxarifado';
    END IF;

    -- Verifica e adiciona coluna observacao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'observacao') THEN
        ALTER TABLE pneus ADD COLUMN observacao TEXT;
    END IF;

    -- Verifica e adiciona coluna created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'created_at') THEN
        ALTER TABLE pneus ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Verifica e adiciona coluna updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pneus' AND column_name = 'updated_at') THEN
        ALTER TABLE pneus ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Adiciona índice único para código/serial se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'pneus' AND indexname = 'idx_pneus_codigo') THEN
        CREATE UNIQUE INDEX idx_pneus_codigo ON pneus(codigo);
    END IF;

END$$;