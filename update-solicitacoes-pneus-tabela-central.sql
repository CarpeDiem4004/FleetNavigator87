-- Adicionar coluna 'origem' na tabela central de solicitações de pneus
ALTER TABLE solicitacoes_pneus 
ADD COLUMN IF NOT EXISTS origem VARCHAR(50);

-- Atualizar a tabela para adicionar informação de origem nas solicitações existentes
UPDATE solicitacoes_pneus 
SET origem = 'central' 
WHERE origem IS NULL;