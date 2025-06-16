-- Script para criar todas as tabelas do sistema de manutenção veicular
-- Execute este script no Supabase ou PostgreSQL

-- Criar enums
DO $$ BEGIN
    CREATE TYPE status_ordem AS ENUM (
        'pendente',
        'recebido', 
        'em_execucao',
        'aguardando_peca',
        'finalizado',
        'cancelado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_manutencao AS ENUM (
        'preventiva',
        'corretiva',
        'preditiva',
        'emergencial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_maintenance AS ENUM (
        'admin',
        'gestor_frota',
        'oficina'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de oficinas credenciadas
CREATE TABLE IF NOT EXISTS oficinas_credenciadas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    especialidades TEXT, -- JSON string com especialidades
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos_manutencao (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(8) NOT NULL UNIQUE,
    marca VARCHAR(50),
    modelo VARCHAR(100),
    ano INTEGER,
    km_atual INTEGER,
    tipo_veiculo VARCHAR(50),
    base_id INTEGER,
    base_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de usuários do sistema de manutenção
CREATE TABLE IF NOT EXISTS usuarios_manutencao (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role_maintenance NOT NULL,
    oficina_id INTEGER REFERENCES oficinas_credenciadas(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
    id SERIAL PRIMARY KEY,
    numero_os VARCHAR(20) NOT NULL UNIQUE,
    veiculo_id INTEGER NOT NULL REFERENCES veiculos_manutencao(id),
    oficina_id INTEGER NOT NULL REFERENCES oficinas_credenciadas(id),
    tipo_manutencao tipo_manutencao NOT NULL,
    descricao_problema TEXT NOT NULL,
    status status_ordem DEFAULT 'pendente',
    km_veiculo INTEGER,
    data_agendamento TIMESTAMP,
    data_inicio TIMESTAMP,
    data_previsao_entrega TIMESTAMP,
    data_finalizacao TIMESTAMP,
    valor_mao_obra DECIMAL(10,2) DEFAULT 0,
    valor_total_pecas DECIMAL(10,2) DEFAULT 0,
    valor_total DECIMAL(10,2) DEFAULT 0,
    observacoes_oficina TEXT,
    observacoes_internas TEXT,
    created_by INTEGER REFERENCES usuarios_manutencao(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de peças utilizadas na OS
CREATE TABLE IF NOT EXISTS pecas_os (
    id SERIAL PRIMARY KEY,
    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id),
    nome_peca VARCHAR(255) NOT NULL,
    codigo_peca VARCHAR(100),
    quantidade INTEGER NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    fornecedor VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de anexos (notas fiscais, fotos, etc.)
CREATE TABLE IF NOT EXISTS anexos_os (
    id SERIAL PRIMARY KEY,
    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id),
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50),
    tamanho_arquivo INTEGER,
    url_arquivo TEXT NOT NULL,
    uploaded_by INTEGER REFERENCES usuarios_manutencao(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Função para gerar número de OS automaticamente
CREATE OR REPLACE FUNCTION generate_os_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    os_number TEXT;
BEGIN
    -- Pegar o próximo número sequencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_os FROM 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ordens_servico
    WHERE numero_os LIKE 'OS%';
    
    -- Formatar como OS000001, OS000002, etc.
    os_number := 'OS' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN os_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número de OS automaticamente
CREATE OR REPLACE FUNCTION trigger_generate_os_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_os IS NULL OR NEW.numero_os = '' THEN
        NEW.numero_os := generate_os_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_os_number_trigger
    BEFORE INSERT ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_os_number();

-- Trigger para atualizar valor total das peças
CREATE OR REPLACE FUNCTION update_valor_total_pecas()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ordens_servico 
    SET valor_total_pecas = (
        SELECT COALESCE(SUM(valor_total), 0) 
        FROM pecas_os 
        WHERE ordem_servico_id = COALESCE(NEW.ordem_servico_id, OLD.ordem_servico_id)
    ),
    valor_total = COALESCE(valor_mao_obra, 0) + (
        SELECT COALESCE(SUM(valor_total), 0) 
        FROM pecas_os 
        WHERE ordem_servico_id = COALESCE(NEW.ordem_servico_id, OLD.ordem_servico_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.ordem_servico_id, OLD.ordem_servico_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_valor_total_pecas_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pecas_os
    FOR EACH ROW
    EXECUTE FUNCTION update_valor_total_pecas();

-- Trigger para atualizar valor total quando mão de obra é alterada
CREATE OR REPLACE FUNCTION update_valor_total_mao_obra()
RETURNS TRIGGER AS $$
BEGIN
    NEW.valor_total := COALESCE(NEW.valor_mao_obra, 0) + COALESCE(NEW.valor_total_pecas, 0);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_valor_total_mao_obra_trigger
    BEFORE UPDATE ON ordens_servico
    FOR EACH ROW
    WHEN (OLD.valor_mao_obra IS DISTINCT FROM NEW.valor_mao_obra)
    EXECUTE FUNCTION update_valor_total_mao_obra();

-- Inserir dados iniciais
INSERT INTO oficinas_credenciadas (cnpj, razao_social, nome_fantasia, email, telefone, especialidades) VALUES
('12.345.678/0001-90', 'Oficina Mecânica São Paulo LTDA', 'Oficina SP', 'contato@oficina-sp.com', '(11) 99999-9999', '["Motor", "Transmissão", "Freios"]'),
('98.765.432/0001-10', 'Auto Center Rio de Janeiro LTDA', 'Auto Center RJ', 'contato@autocenter-rj.com', '(21) 88888-8888', '["Suspensão", "Direção", "Ar Condicionado"]')
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO usuarios_manutencao (name, email, password, role) VALUES
('Administrador Sistema', 'admin@murici.com', '$2b$10$hash_aqui', 'admin'),
('Gestor de Frota', 'gestor@murici.com', '$2b$10$hash_aqui', 'gestor_frota')
ON CONFLICT (email) DO NOTHING;

-- Inserir usuários das oficinas
INSERT INTO usuarios_manutencao (name, email, password, role, oficina_id) VALUES
('Oficina SP User', 'oficina@oficina-sp.com', '$2b$10$hash_aqui', 'oficina', 1),
('Auto Center RJ User', 'oficina@autocenter-rj.com', '$2b$10$hash_aqui', 'oficina', 2)
ON CONFLICT (email) DO NOTHING;

-- Inserir alguns veículos de exemplo
INSERT INTO veiculos_manutencao (placa, marca, modelo, ano, km_atual, tipo_veiculo, base_name) VALUES
('ABC1234', 'Volkswagen', 'Delivery', 2020, 45000, 'Caminhão', 'São Paulo'),
('DEF5678', 'Mercedes-Benz', 'Sprinter', 2019, 78000, 'Van', 'Rio de Janeiro'),
('GHI9012', 'Ford', 'Transit', 2021, 32000, 'Van', 'Belo Horizonte')
ON CONFLICT (placa) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_oficina_id ON ordens_servico(oficina_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_veiculo_id ON ordens_servico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_created_at ON ordens_servico(created_at);
CREATE INDEX IF NOT EXISTS idx_pecas_os_ordem_servico_id ON pecas_os(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_anexos_os_ordem_servico_id ON anexos_os(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_manutencao_oficina_id ON usuarios_manutencao(oficina_id);
CREATE INDEX IF NOT EXISTS idx_oficinas_credenciadas_cnpj ON oficinas_credenciadas(cnpj);

COMMENT ON TABLE oficinas_credenciadas IS 'Tabela de oficinas parceiras credenciadas';
COMMENT ON TABLE veiculos_manutencao IS 'Tabela de veículos para manutenção';
COMMENT ON TABLE usuarios_manutencao IS 'Usuários do sistema de manutenção';
COMMENT ON TABLE ordens_servico IS 'Ordens de serviço de manutenção';
COMMENT ON TABLE pecas_os IS 'Peças utilizadas nas ordens de serviço';
COMMENT ON TABLE anexos_os IS 'Anexos das ordens de serviço (notas, fotos, etc.)';