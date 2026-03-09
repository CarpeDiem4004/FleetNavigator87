-- Script para garantir integração completa do Line Hall Shopee com solicitações de cartão combustível
-- Execute este script no seu banco de dados para habilitar todas as funcionalidades

-- 1. Verificar se a tabela linehall_fuel_card_requests existe, senão criar
CREATE TABLE IF NOT EXISTS linehall_fuel_card_requests (
  id SERIAL PRIMARY KEY,
  motorista_id INTEGER NOT NULL,
  motorista_nome VARCHAR(255) NOT NULL,
  motorista_cpf VARCHAR(14) NOT NULL,
  veiculo_placa VARCHAR(20) NOT NULL,
  veiculo_modelo VARCHAR(100),
  rota_origem VARCHAR(255),
  rota_destino VARCHAR(255),
  data_solicitacao DATE NOT NULL,
  horario_solicitacao TIME NOT NULL,
  km_total INTEGER,
  horario_abastecimento VARCHAR(20) CHECK (horario_abastecimento IN ('antes_17h', 'apos_18h')),
  telefone_motorista VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'processada')),
  observacoes_operador TEXT,
  operador_aprovacao VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Adicionar campo operador_aprovacao se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'linehall_fuel_card_requests' 
                   AND column_name = 'operador_aprovacao') THEN
        ALTER TABLE linehall_fuel_card_requests 
        ADD COLUMN operador_aprovacao VARCHAR(255);
    END IF;
END $$;

-- 3. Verificar se a tabela solicitacoes_fuel_card existe, senão criar
CREATE TABLE IF NOT EXISTS solicitacoes_fuel_card (
  id SERIAL PRIMARY KEY,
  tipo_cartao VARCHAR(100),
  provedor_cartao VARCHAR(100),
  numero_cartao VARCHAR(50),
  motorista VARCHAR(255),
  placa VARCHAR(20),
  km INTEGER,
  valor_solicitado DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'pendente',
  data_solicitacao TIMESTAMP DEFAULT NOW(),
  atendido_por VARCHAR(255),
  data_atendimento TIMESTAMP,
  base VARCHAR(100),
  id_rota INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_status ON linehall_fuel_card_requests(status);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_motorista ON linehall_fuel_card_requests(motorista_id);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_data ON linehall_fuel_card_requests(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_linehall_fuel_card_requests_created ON linehall_fuel_card_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_linehall_fuel_card_requests_updated_at ON linehall_fuel_card_requests;
CREATE TRIGGER update_linehall_fuel_card_requests_updated_at 
    BEFORE UPDATE ON linehall_fuel_card_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitacoes_fuel_card_updated_at ON solicitacoes_fuel_card;
CREATE TRIGGER update_solicitacoes_fuel_card_updated_at 
    BEFORE UPDATE ON solicitacoes_fuel_card 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir dados de exemplo para teste (opcional - remova se não quiser dados de teste)
INSERT INTO linehall_fuel_card_requests (
  motorista_id, motorista_nome, motorista_cpf, veiculo_placa, veiculo_modelo,
  rota_origem, rota_destino, data_solicitacao, horario_solicitacao,
  km_total, horario_abastecimento, telefone_motorista, status
) VALUES 
(1, 'João Silva', '123.456.789-01', 'ABC-1234', 'Volkswagen Delivery',
 'São Paulo', 'Campinas', CURRENT_DATE, '08:00:00',
 120, 'antes_17h', '(11) 99999-1234', 'pendente'),
(2, 'Maria Santos', '987.654.321-02', 'XYZ-5678', 'Mercedes Sprinter',
 'Guarulhos', 'Santos', CURRENT_DATE, '09:30:00',
 85, 'apos_18h', '(11) 88888-5678', 'aprovada')
ON CONFLICT DO NOTHING;

-- 8. Comentários das tabelas
COMMENT ON TABLE linehall_fuel_card_requests IS 'Solicitações de recarga de cartão combustível específicas do Line Hall Shopee';
COMMENT ON TABLE solicitacoes_fuel_card IS 'Solicitações tradicionais de cartão combustível do sistema principal';

COMMENT ON COLUMN linehall_fuel_card_requests.motorista_id IS 'ID do motorista que fez a solicitação';
COMMENT ON COLUMN linehall_fuel_card_requests.horario_abastecimento IS 'Preferência de horário (antes_17h ou apos_18h)';
COMMENT ON COLUMN linehall_fuel_card_requests.status IS 'Status: pendente, aprovada, rejeitada, processada';
COMMENT ON COLUMN linehall_fuel_card_requests.operador_aprovacao IS 'Nome do operador que aprovou/rejeitou';

-- 9. Verificar integridade dos dados
SELECT 'Tabela linehall_fuel_card_requests criada com ' || COUNT(*) || ' registros' 
FROM linehall_fuel_card_requests;

SELECT 'Tabela solicitacoes_fuel_card tem ' || COUNT(*) || ' registros' 
FROM solicitacoes_fuel_card;

-- Script executado com sucesso!
SELECT 'Integração Line Hall Shopee configurada com sucesso!' as resultado;