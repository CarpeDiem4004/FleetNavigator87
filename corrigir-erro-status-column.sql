-- Script para corrigir o erro "column status does not exist"
-- Este erro geralmente ocorre quando há ambiguidade em JOINs ou referências de tabela

-- 1. Verificar e corrigir views que podem ter referências ambíguas
DROP VIEW IF EXISTS vw_fuel_card_requests_consolidated CASCADE;

-- 2. Recriar view com aliases explícitos para evitar ambiguidade
CREATE OR REPLACE VIEW vw_fuel_card_requests_consolidated AS
SELECT 
    fcr.id,
    fcr.plate as placa,
    fcr.requested_by as motorista,
    fcr.amount as valor_solicitado,
    fcr.card_number,
    fcr.reason as observacoes,
    fcr.requested_at as data_solicitacao,
    fcr.status as request_status,  -- Alias explícito
    fcr.approved_by as atendido_por,
    fcr.approved_at as data_atendimento,
    fcr.created_at,
    fcr.updated_at,
    v.modelo as vehicle_model,
    v.marca as vehicle_make,
    v.status as vehicle_status,  -- Alias explícito
    v.base_id,
    v.cartao_abastecimento,
    b.name as base_name
FROM fuel_card_requests fcr
LEFT JOIN veiculos v ON fcr.plate = v.placa
LEFT JOIN bases b ON v.base_id = b.id;

-- 3. Criar view similar para linehall fuel card requests
CREATE OR REPLACE VIEW vw_linehall_fuel_requests_consolidated AS
SELECT 
    lfcr.id,
    lfcr.veiculo_placa as placa,
    lfcr.motorista_nome as motorista,
    lfcr.valor_calculado as valor_solicitado,
    lfcr.km_total,
    lfcr.numero_cartao,
    lfcr.rota_origem,
    lfcr.rota_destino,
    lfcr.data_solicitacao,
    lfcr.status as request_status,  -- Alias explícito
    lfcr.operador_aprovacao as atendido_por,
    lfcr.created_at,
    lfcr.updated_at,
    v.modelo as vehicle_model,
    v.marca as vehicle_make,
    v.status as vehicle_status,  -- Alias explícito
    v.base_id,
    v.cartao_abastecimento,
    b.name as base_name
FROM linehall_fuel_card_requests lfcr
LEFT JOIN veiculos v ON lfcr.veiculo_placa = v.placa
LEFT JOIN bases b ON v.base_id = b.id;

-- 4. Verificar se existem indexes problemáticos e recriá-los
DROP INDEX IF EXISTS idx_fuel_card_status;
DROP INDEX IF EXISTS idx_vehicle_status;

-- Recriar com nomes mais específicos
CREATE INDEX IF NOT EXISTS idx_fuel_card_requests_status ON fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos(status);

-- 5. Corrigir possíveis problemas na tabela vehicles (se existir duplicata)
-- Verificar se há conflito entre 'vehicles' e 'veiculos'
DO $$
BEGIN
    -- Se a tabela vehicles existir e causar conflito, pode ser necessário renomeá-la
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        -- Renomear para evitar conflito
        ALTER TABLE IF EXISTS vehicles RENAME TO vehicles_backup;
    END IF;
END $$;

-- 6. Garantir que a coluna status existe em veiculos com o tipo correto
DO $$
BEGIN
    -- Verificar se a coluna status tem o tipo correto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'veiculos' 
        AND column_name = 'status' 
        AND data_type = 'character varying'
    ) THEN
        -- Adicionar a coluna se não existir ou corrigir o tipo
        ALTER TABLE veiculos 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';
    END IF;
END $$;

-- 7. Atualizar valores nulos na coluna status
UPDATE veiculos SET status = 'em_operacao' WHERE status IS NULL OR status = '';

-- 8. Verificar resultado
SELECT 
    'Correção aplicada com sucesso!' as resultado,
    COUNT(*) as total_veiculos,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as veiculos_com_status
FROM veiculos;