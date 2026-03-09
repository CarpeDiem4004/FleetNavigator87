-- Script específico para criar tabelas de movimentações e recebimentos do posto Socorro_V2
-- Autor: Sistema Murici Fleet
-- Data: Maio, 2025

-- 1. Criação da tabela de movimentações de pátio (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'movimentacoes_patio_socorro_v2'
  ) THEN
    CREATE TABLE movimentacoes_patio_socorro_v2 (
      id SERIAL PRIMARY KEY,
      placa CHARACTER VARYING NOT NULL,
      tipo_veiculo CHARACTER VARYING,
      tipo_movimentacao CHARACTER VARYING NOT NULL,
      data_hora TIMESTAMP NOT NULL,
      km NUMERIC,
      motorista CHARACTER VARYING,
      origem CHARACTER VARYING,
      destino CHARACTER VARYING,
      carga CHARACTER VARYING,
      observacoes TEXT,
      usuario_operador CHARACTER VARYING,
      tempo_patio INTERVAL,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
    
    -- Adicionar índices
    CREATE INDEX idx_mov_socorro_v2_placa ON movimentacoes_patio_socorro_v2(placa);
    CREATE INDEX idx_mov_socorro_v2_data_hora ON movimentacoes_patio_socorro_v2(data_hora);
    CREATE INDEX idx_mov_socorro_v2_tipo_movimentacao ON movimentacoes_patio_socorro_v2(tipo_movimentacao);
    
    -- Comentário para documentação
    COMMENT ON TABLE movimentacoes_patio_socorro_v2 IS 'Tabela de movimentações de veículos no pátio do posto Socorro V2';
    
    -- Configuração RLS
    ALTER TABLE movimentacoes_patio_socorro_v2 ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Permissão geral para movimentações Socorro_v2" ON movimentacoes_patio_socorro_v2
      USING (true) WITH CHECK (true);
      
    RAISE NOTICE 'Tabela movimentacoes_patio_socorro_v2 criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela movimentacoes_patio_socorro_v2 já existe';
  END IF;
END
$$;

-- 2. Criação da tabela de recebimentos (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'recebimentos_posto_socorro_v2'
  ) THEN
    CREATE TABLE recebimentos_posto_socorro_v2 (
      id SERIAL PRIMARY KEY,
      tipo_combustivel CHARACTER VARYING,
      quantidade_litros NUMERIC,
      valor_litro NUMERIC,
      valor_total NUMERIC,
      nota_fiscal CHARACTER VARYING,
      fornecedor CHARACTER VARYING,
      data_recebimento TIMESTAMP,
      usuario_operador CHARACTER VARYING,
      observacoes TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
    
    -- Adicionar índices
    CREATE INDEX idx_receb_socorro_v2_data ON recebimentos_posto_socorro_v2(data_recebimento);
    CREATE INDEX idx_receb_socorro_v2_tipo_combustivel ON recebimentos_posto_socorro_v2(tipo_combustivel);
    
    -- Comentário para documentação
    COMMENT ON TABLE recebimentos_posto_socorro_v2 IS 'Tabela de recebimentos de combustível no posto Socorro V2';
    
    -- Configuração RLS
    ALTER TABLE recebimentos_posto_socorro_v2 ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Permissão geral para recebimentos Socorro_v2" ON recebimentos_posto_socorro_v2
      USING (true) WITH CHECK (true);
      
    RAISE NOTICE 'Tabela recebimentos_posto_socorro_v2 criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela recebimentos_posto_socorro_v2 já existe';
  END IF;
END
$$;