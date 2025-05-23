-- Script para criar a tabela de recebimentos para o Posto Osasco V2
-- Esta tabela usa a nomenclatura específica do posto Osasco

-- Verificar se a tabela já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recebimentos_posto_osasco_v2') THEN
        -- Criar a tabela de recebimentos para o posto Osasco V2
        CREATE TABLE recebimentos_posto_osasco_v2 (
            id SERIAL PRIMARY KEY,
            nome_fornecedor VARCHAR(255) NOT NULL,
            tipo_produto VARCHAR(100) NOT NULL,
            litros_recebidos DECIMAL(10, 2) NOT NULL,
            valor_litro DECIMAL(10, 3) NOT NULL,
            valor_total DECIMAL(10, 2) NOT NULL,
            numero_nota VARCHAR(50),
            data_entrega DATE,
            nome_operador VARCHAR(255) NOT NULL,
            observacoes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Inserir alguns dados de exemplo
        INSERT INTO recebimentos_posto_osasco_v2 
            (nome_fornecedor, tipo_produto, litros_recebidos, valor_litro, valor_total, numero_nota, data_entrega, nome_operador, observacoes)
        VALUES
            ('Petrobras Distribuidora', 'Diesel S-10', 5000.00, 5.390, 26950.00, 'NF-5289371', '2025-05-23', 'João Silva', 'Entrega realizada dentro do prazo'),
            ('Ipiranga Distribuidora', 'Diesel Comum', 3000.00, 5.200, 15600.00, 'NF-0983472', '2025-05-22', 'Maria Santos', 'Atraso na entrega compensado com desconto'),
            ('Shell Brasil', 'Arla 32', 800.00, 3.250, 2600.00, 'NF-7653421', '2025-05-21', 'Carlos Oliveira', NULL);
    END IF;
END $$;