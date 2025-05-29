-- Criar tabela para rotas do Line Hall Shopee
CREATE TABLE IF NOT EXISTS line_hall_routes (
    id SERIAL PRIMARY KEY,
    nome_ponto_a VARCHAR(255) NOT NULL,
    nome_ponto_b VARCHAR(255) NOT NULL,
    km_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_line_hall_routes_pontos ON line_hall_routes(nome_ponto_a, nome_ponto_b);

-- Inserir algumas rotas de exemplo
INSERT INTO line_hall_routes (nome_ponto_a, nome_ponto_b, km_total) VALUES
('São Paulo - SP', 'Rio de Janeiro - RJ', 430.5),
('São Paulo - SP', 'Belo Horizonte - MG', 586.2),
('Rio de Janeiro - RJ', 'Brasília - DF', 1148.0),
('São Paulo - SP', 'Curitiba - PR', 408.8),
('Belo Horizonte - MG', 'Salvador - BA', 1372.4)
ON CONFLICT DO NOTHING;