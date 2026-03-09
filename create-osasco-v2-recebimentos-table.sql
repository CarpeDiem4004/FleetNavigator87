-- Script para criar ou atualizar a tabela de recebimentos do posto Osasco V2
-- Este script verifica se a tabela existe e a cria se não existir

-- Verificar se a tabela existe
CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
  id SERIAL PRIMARY KEY,
  nome_fornecedor VARCHAR(255) NOT NULL,
  tipo_produto VARCHAR(100) NOT NULL,
  litros_recebidos NUMERIC(10,2) NOT NULL,
  valor_litro NUMERIC(10,3) NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  numero_nota VARCHAR(100) NOT NULL,
  data_entrega DATE NOT NULL,
  nome_operador VARCHAR(255) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar dados de exemplo se a tabela estiver vazia
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count FROM recebimentos_posto_osasco_v2;
  
  IF record_count = 0 THEN
    INSERT INTO recebimentos_posto_osasco_v2 
      (nome_fornecedor, tipo_produto, litros_recebidos, valor_litro, valor_total, 
       numero_nota, data_entrega, nome_operador, observacoes)
    VALUES 
      ('Petrobras', 'Diesel S-10', 1000.00, 5.69, 5690.00, 'NF-123456', '2025-05-23', 'José Silva', 'Recebimento teste'),
      ('Ipiranga', 'Diesel Comum', 800.00, 5.29, 4232.00, 'NF-654321', '2025-05-22', 'Maria Souza', 'Segundo recebimento teste'),
      ('Shell', 'Arla 32', 500.00, 3.50, 1750.00, 'NF-789123', '2025-05-21', 'Carlos Santos', 'Terceiro recebimento teste');
  END IF;
END $$;