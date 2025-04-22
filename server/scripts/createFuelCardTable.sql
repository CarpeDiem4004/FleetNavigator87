-- Script para criar a tabela de solicitações de recarga de cartão de combustível

-- Verifica se a tabela já existe antes de criar
CREATE OR REPLACE FUNCTION create_fuel_card_requests_table()
RETURNS VOID AS $$
BEGIN
  -- Verifica se a tabela já existe
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fuel_card_requests') THEN
    -- Cria a tabela se não existir
    CREATE TABLE public.fuel_card_requests (
      id SERIAL PRIMARY KEY,
      plate TEXT NOT NULL,
      card_number TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      reason TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'pendente',
      approved_by TEXT,
      approved_at TIMESTAMP,
      rejected_by TEXT,
      rejected_at TIMESTAMP,
      rejection_reason TEXT,
      base_id INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Adiciona comentários para documentação
    COMMENT ON TABLE public.fuel_card_requests IS 'Armazena solicitações de recarga para cartões de combustível da frota';
    COMMENT ON COLUMN public.fuel_card_requests.id IS 'Identificador único da solicitação';
    COMMENT ON COLUMN public.fuel_card_requests.plate IS 'Placa do veículo relacionado ao cartão';
    COMMENT ON COLUMN public.fuel_card_requests.card_number IS 'Número do cartão de combustível';
    COMMENT ON COLUMN public.fuel_card_requests.amount IS 'Valor da recarga solicitada em reais';
    COMMENT ON COLUMN public.fuel_card_requests.reason IS 'Motivo da solicitação de recarga';
    COMMENT ON COLUMN public.fuel_card_requests.requested_by IS 'Nome da pessoa que solicitou a recarga';
    COMMENT ON COLUMN public.fuel_card_requests.requested_at IS 'Data e hora da solicitação';
    COMMENT ON COLUMN public.fuel_card_requests.status IS 'Status da solicitação: pendente, aprovado ou rejeitado';
    COMMENT ON COLUMN public.fuel_card_requests.approved_by IS 'Nome da pessoa que aprovou a solicitação';
    COMMENT ON COLUMN public.fuel_card_requests.approved_at IS 'Data e hora da aprovação';
    COMMENT ON COLUMN public.fuel_card_requests.rejected_by IS 'Nome da pessoa que rejeitou a solicitação';
    COMMENT ON COLUMN public.fuel_card_requests.rejected_at IS 'Data e hora da rejeição';
    COMMENT ON COLUMN public.fuel_card_requests.rejection_reason IS 'Motivo da rejeição da solicitação';
    COMMENT ON COLUMN public.fuel_card_requests.base_id IS 'ID da base que fez a solicitação';
    COMMENT ON COLUMN public.fuel_card_requests.created_at IS 'Data e hora de criação do registro';
    COMMENT ON COLUMN public.fuel_card_requests.updated_at IS 'Data e hora da última atualização do registro';

    -- Cria índices para melhorar o desempenho das consultas mais comuns
    CREATE INDEX idx_fuel_card_requests_status ON public.fuel_card_requests(status);
    CREATE INDEX idx_fuel_card_requests_plate ON public.fuel_card_requests(plate);
    CREATE INDEX idx_fuel_card_requests_base_id ON public.fuel_card_requests(base_id);
    CREATE INDEX idx_fuel_card_requests_requested_at ON public.fuel_card_requests(requested_at);

    RAISE NOTICE 'Tabela fuel_card_requests criada com sucesso.';
  ELSE
    RAISE NOTICE 'Tabela fuel_card_requests já existe, pulando criação.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Executa a função
SELECT create_fuel_card_requests_table();

-- Remove a função após a execução
DROP FUNCTION IF EXISTS create_fuel_card_requests_table();