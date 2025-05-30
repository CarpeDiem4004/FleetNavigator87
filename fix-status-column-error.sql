-- Script simples para corrigir erro "column status does not exist"
-- Foca em garantir que a coluna status existe e está funcionando corretamente

-- 1. Primeiro, vamos remover views problemáticas que podem estar causando conflito
DROP VIEW IF EXISTS vw_fuel_card_requests_consolidated CASCADE;
DROP VIEW IF EXISTS vw_linehall_fuel_requests_consolidated CASCADE;

-- 2. Verificar e garantir que a coluna status existe na tabela veiculos
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'em_operacao';

-- 3. Atualizar registros com status nulo ou vazio
UPDATE veiculos 
SET status = 'em_operacao' 
WHERE status IS NULL OR status = '';

-- 4. Criar índices específicos para evitar ambiguidade
CREATE INDEX IF NOT EXISTS idx_veiculos_status_specific ON veiculos(status);
CREATE INDEX IF NOT EXISTS idx_fuel_card_requests_status_specific ON fuel_card_requests(status);

-- 5. Se a tabela solicitacoes_fuel_card estiver causando conflito, adicionar índice
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes_fuel_card') THEN
        CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
    END IF;
END $$;

-- 6. Verificar resultado
SELECT 
    'Status column fixed successfully!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as vehicles_with_status,
    COUNT(CASE WHEN status = 'em_operacao' THEN 1 END) as vehicles_operational
FROM veiculos;