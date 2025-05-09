-- Adicionar os novos campos à tabela campinas_tire_requests
ALTER TABLE campinas_tire_requests 
ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(10),
ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;

-- Adicionar também à tabela solicitacoes_pneus (tabela principal) caso ainda não tenha
ALTER TABLE solicitacoes_pneus
ADD COLUMN IF NOT EXISTS placa_veiculo VARCHAR(10),
ADD COLUMN IF NOT EXISTS km_veiculo INTEGER;