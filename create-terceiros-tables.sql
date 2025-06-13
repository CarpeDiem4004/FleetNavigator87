-- Script para criar as tabelas do sistema de abastecimento de terceiros
-- Execute este script no PostgreSQL para criar a estrutura necessária

-- 1. Tabela de empresas terceirizadas
CREATE TABLE IF NOT EXISTS empresas_terceiros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(255),
    responsavel VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de usuários das empresas terceirizadas
CREATE TABLE IF NOT EXISTS usuarios_terceiros (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas_terceiros(id) ON DELETE CASCADE,
    cnpj VARCHAR(18) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cnpj)
);

-- 3. Tabela de abastecimentos registrados pelos terceiros
CREATE TABLE IF NOT EXISTS abastecimentos_terceiros (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas_terceiros(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios_terceiros(id) ON DELETE SET NULL,
    motorista_nome VARCHAR(255) NOT NULL,
    veiculo_placa VARCHAR(10) NOT NULL,
    veiculo_modelo VARCHAR(100),
    litros DECIMAL(10,3) NOT NULL CHECK (litros > 0),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    preco_litro DECIMAL(5,3) GENERATED ALWAYS AS (valor / litros) STORED,
    data_abastecimento TIMESTAMP NOT NULL,
    posto_nome VARCHAR(255),
    posto_endereco TEXT,
    combustivel_tipo VARCHAR(20) DEFAULT 'diesel' CHECK (combustivel_tipo IN ('diesel', 'gasolina', 'etanol', 'gnv')),
    observacoes TEXT,
    nota_fiscal_numero VARCHAR(50),
    nota_fiscal_url TEXT,
    km_veiculo INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_empresas_terceiros_cnpj ON empresas_terceiros(cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_terceiros_cnpj ON usuarios_terceiros(cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_terceiros_empresa ON usuarios_terceiros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_terceiros_empresa ON abastecimentos_terceiros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_terceiros_data ON abastecimentos_terceiros(data_abastecimento);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_terceiros_placa ON abastecimentos_terceiros(veiculo_placa);

-- Inserir dados de teste
INSERT INTO empresas_terceiros (nome, cnpj, endereco, telefone, email, responsavel) 
VALUES (
    'Transportes Demo LTDA',
    '12.345.678/0001-90',
    'Rua das Empresas, 123 - São Paulo/SP',
    '(11) 99999-9999',
    'contato@transportesdemo.com.br',
    'João Silva'
) ON CONFLICT (cnpj) DO NOTHING;

-- Inserir usuário de teste (senha: 123456)
INSERT INTO usuarios_terceiros (empresa_id, cnpj, senha, nome, email, cargo)
VALUES (
    (SELECT id FROM empresas_terceiros WHERE cnpj = '12.345.678/0001-90'),
    '12.345.678/0001-90',
    '$2b$10$8K1p/a0dqailSekdXsppIeIBtjqJflhWJBhXzsgygfvdg2kRMq/Em',
    'João Silva',
    'joao@transportesdemo.com.br',
    'Gestor de Frota'
) ON CONFLICT (cnpj) DO NOTHING;

-- Inserir alguns registros de abastecimento de exemplo
INSERT INTO abastecimentos_terceiros (
    empresa_id, 
    usuario_id, 
    motorista_nome, 
    veiculo_placa, 
    veiculo_modelo,
    litros, 
    valor, 
    data_abastecimento, 
    posto_nome,
    combustivel_tipo,
    km_veiculo
) VALUES 
(
    (SELECT id FROM empresas_terceiros WHERE cnpj = '12.345.678/0001-90'),
    (SELECT id FROM usuarios_terceiros WHERE cnpj = '12.345.678/0001-90'),
    'Carlos Santos',
    'ABC-1234',
    'Mercedes Sprinter',
    50.000,
    300.00,
    '2025-06-10 08:30:00',
    'Posto Shell Centro',
    'diesel',
    45000
),
(
    (SELECT id FROM empresas_terceiros WHERE cnpj = '12.345.678/0001-90'),
    (SELECT id FROM usuarios_terceiros WHERE cnpj = '12.345.678/0001-90'),
    'Maria Oliveira',
    'DEF-5678',
    'Iveco Daily',
    45.500,
    273.00,
    '2025-06-11 14:15:00',
    'Posto BR Rodovia',
    'diesel',
    38500
),
(
    (SELECT id FROM empresas_terceiros WHERE cnpj = '12.345.678/0001-90'),
    (SELECT id FROM usuarios_terceiros WHERE cnpj = '12.345.678/0001-90'),
    'Pedro Costa',
    'GHI-9012',
    'Ford Cargo',
    80.000,
    480.00,
    '2025-06-12 10:45:00',
    'Posto Ipiranga',
    'diesel',
    52000
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas
CREATE TRIGGER update_empresas_terceiros_updated_at 
    BEFORE UPDATE ON empresas_terceiros 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_terceiros_updated_at 
    BEFORE UPDATE ON usuarios_terceiros 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abastecimentos_terceiros_updated_at 
    BEFORE UPDATE ON abastecimentos_terceiros 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE empresas_terceiros IS 'Tabela de empresas terceirizadas cadastradas no sistema';
COMMENT ON TABLE usuarios_terceiros IS 'Usuários das empresas terceirizadas com acesso ao sistema';
COMMENT ON TABLE abastecimentos_terceiros IS 'Registros de abastecimentos realizados pelas empresas terceirizadas';

-- Verificar se as tabelas foram criadas
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename IN ('empresas_terceiros', 'usuarios_terceiros', 'abastecimentos_terceiros')
ORDER BY tablename;