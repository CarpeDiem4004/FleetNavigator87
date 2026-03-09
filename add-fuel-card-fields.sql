-- Adiciona os campos base e id_rota à tabela de solicitações de cartão combustível
ALTER TABLE solicitacoes_fuel_card 
ADD COLUMN IF NOT EXISTS base CHARACTER VARYING,
ADD COLUMN IF NOT EXISTS id_rota CHARACTER VARYING;