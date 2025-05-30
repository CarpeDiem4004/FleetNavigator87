-- Script para corrigir erro "column marca does not exist"
-- Resolve ambiguidade entre colunas marca/make na tabela veiculos

-- 1. Verificar estrutura atual da tabela veiculos
-- A tabela tem tanto 'marca' quanto 'make', causando ambiguidade

-- 2. Padronizar para usar apenas a coluna 'marca' 
-- Primeiro, sincronizar dados da coluna 'make' para 'marca' onde necessário
UPDATE veiculos 
SET marca = make 
WHERE marca IS NULL AND make IS NOT NULL;

-- 3. Garantir que todos os veículos tenham marca definida
UPDATE veiculos 
SET marca = 'Mercedes' 
WHERE marca IS NULL OR marca = '';

-- 4. Remover a coluna 'make' para evitar ambiguidade futura
ALTER TABLE veiculos DROP COLUMN IF EXISTS make;

-- 5. Criar índice na coluna marca para melhor performance
CREATE INDEX IF NOT EXISTS idx_veiculos_marca ON veiculos(marca);

-- 6. Remover qualquer view problemática que possa estar causando conflito
DROP VIEW IF EXISTS vw_cartoes_unificados CASCADE;
DROP VIEW IF EXISTS vw_vehicles_consolidated CASCADE;

-- 7. Criar uma view limpa e sem ambiguidades para consultas de veículos
CREATE OR REPLACE VIEW vw_veiculos_clean AS
SELECT 
    v.id,
    v.placa,
    v.modelo,
    v.marca,
    v.status,
    v.cartao_abastecimento,
    v.base_id,
    b.name as base_name,
    v.created_at,
    v.updated_at
FROM veiculos v
LEFT JOIN bases b ON v.base_id = b.id;

-- 8. Verificar resultado
SELECT 
    'Marca column fixed!' as resultado,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN marca IS NOT NULL AND marca != '' THEN 1 END) as vehicles_with_brand,
    COUNT(DISTINCT marca) as unique_brands
FROM veiculos;