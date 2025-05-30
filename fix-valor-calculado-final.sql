-- Script definitivo para corrigir a coluna valor_calculado
-- Execute este script completo no editor SQL do Supabase

-- ETAPA 1: Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes_fuel_card') THEN
        RAISE EXCEPTION 'Tabela solicitacoes_fuel_card não encontrada';
    END IF;
    RAISE NOTICE 'Tabela solicitacoes_fuel_card confirmada';
END $$;

-- ETAPA 2: Remover completamente a coluna se existir
ALTER TABLE solicitacoes_fuel_card DROP COLUMN IF EXISTS valor_calculado CASCADE;

-- ETAPA 3: Adicionar a coluna novamente com tipo correto
ALTER TABLE solicitacoes_fuel_card ADD COLUMN valor_calculado DECIMAL(10,2) NOT NULL DEFAULT 0;

-- ETAPA 4: Verificar se foi criada corretamente
DO $$
DECLARE
    col_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solicitacoes_fuel_card' 
        AND column_name = 'valor_calculado'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Coluna valor_calculado criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Falha ao criar coluna valor_calculado';
    END IF;
END $$;

-- ETAPA 5: Atualizar valores existentes (opcional)
UPDATE solicitacoes_fuel_card 
SET valor_calculado = COALESCE(valor_solicitado, 0) 
WHERE valor_calculado IS NULL OR valor_calculado = 0;

-- ETAPA 6: Mostrar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_fuel_card' 
ORDER BY ordinal_position;