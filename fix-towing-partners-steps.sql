-- Script em etapas para garantir que a estrutura seja atualizada corretamente

-- Etapa 1: Eliminar a view existente
DROP VIEW IF EXISTS towing_partners_summary;

-- Etapa 2: Verificar se o tipo enum existe e criar se necessário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'towing_partner_status') THEN
        CREATE TYPE towing_partner_status AS ENUM ('ativo', 'inativo', 'pendente', 'suspenso');
    END IF;
END $$;

-- Etapa 3: Atualizar a tabela towing_partners se já existir, adicionando colunas que possam estar faltando
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'towing_partners') THEN
        -- Verificar e adicionar colunas que podem estar faltando
        
        -- Verificar cost_per_km
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'towing_partners' AND column_name = 'cost_per_km'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            ALTER TABLE towing_partners ADD COLUMN cost_per_km NUMERIC(10,2);
            RAISE NOTICE 'Coluna cost_per_km adicionada';
        END IF;
        
        -- Verificar has_insurance
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'towing_partners' AND column_name = 'has_insurance'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            ALTER TABLE towing_partners ADD COLUMN has_insurance BOOLEAN DEFAULT false;
            RAISE NOTICE 'Coluna has_insurance adicionada';
        END IF;
        
        -- Verificar coverage_radius
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'towing_partners' AND column_name = 'coverage_radius'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            ALTER TABLE towing_partners ADD COLUMN coverage_radius INTEGER;
            RAISE NOTICE 'Coluna coverage_radius adicionada';
        END IF;
    ELSE
        -- Criar a tabela se não existir
        CREATE TABLE towing_partners (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          company_name VARCHAR(255),
          cnpj VARCHAR(20),
          phone VARCHAR(20),
          email VARCHAR(255),
          city VARCHAR(100),
          region VARCHAR(100),
          address TEXT,
          contact_person VARCHAR(255),
          rating NUMERIC(3,1),
          service_types TEXT[] DEFAULT '{}',
          price_range VARCHAR(50),
          payment_methods TEXT[] DEFAULT '{}',
          cost_per_km NUMERIC(10,2),
          available_24h BOOLEAN DEFAULT false,
          can_transport_multiple BOOLEAN DEFAULT false,
          has_insurance BOOLEAN DEFAULT false,
          coverage_radius INTEGER,
          notes TEXT,
          status towing_partner_status DEFAULT 'pendente',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          service_count INTEGER DEFAULT 0,
          last_service_date TIMESTAMP,
          bank_name VARCHAR(100),
          bank_account VARCHAR(20),
          bank_agency VARCHAR(10),
          pix_key VARCHAR(255),
          pix_type VARCHAR(20)
        );
        RAISE NOTICE 'Tabela towing_partners criada';
    END IF;
END $$;

-- Etapa 4: Inserir o parceiro Ford com verificação prévia
DO $$
DECLARE
    ford_exists boolean;
BEGIN
    -- Verificar se o parceiro Ford já existe
    SELECT EXISTS (
        SELECT 1 FROM towing_partners WHERE id = 6
    ) INTO ford_exists;
    
    IF ford_exists THEN
        -- Atualizar parceiro existente
        UPDATE towing_partners SET
            name = 'Ford',
            company_name = 'Ford Serviços de Guincho Ltda',
            cnpj = '67.890.123/0001-45',
            phone = '(11) 5544-3322',
            email = 'atendimento@fordguincho.com.br',
            city = 'São Paulo',
            region = 'Zona Oeste',
            address = 'Av. Ford, 1000, Lapa',
            contact_person = 'Pedro Almeida',
            rating = 4.8,
            service_types = ARRAY['leve', 'médio', 'pesado'],
            payment_methods = ARRAY['dinheiro', 'cartão', 'pix'],
            cost_per_km = 7.50,
            available_24h = true,
            can_transport_multiple = true,
            status = 'ativo',
            service_count = 35
        WHERE id = 6;
        RAISE NOTICE 'Parceiro Ford (ID 6) atualizado';
    ELSE
        -- Inserir novo parceiro
        INSERT INTO towing_partners (
            id, name, company_name, cnpj, phone, email, 
            city, region, address, contact_person,
            rating, service_types, payment_methods, 
            cost_per_km, available_24h, can_transport_multiple,
            status, service_count, notes
        ) VALUES (
            6, 'Ford', 'Ford Serviços de Guincho Ltda', '67.890.123/0001-45',
            '(11) 5544-3322', 'atendimento@fordguincho.com.br',
            'São Paulo', 'Zona Oeste', 'Av. Ford, 1000, Lapa', 'Pedro Almeida',
            4.8, ARRAY['leve', 'médio', 'pesado'], ARRAY['dinheiro', 'cartão', 'pix'],
            7.50, true, true,
            'ativo', 35, ''
        );
        RAISE NOTICE 'Parceiro Ford (ID 6) inserido';
    END IF;
END $$;

-- Etapa 5: Criar a nova view de resumo
CREATE VIEW towing_partners_summary AS
SELECT 
  p.id, 
  p.name, 
  p.city, 
  p.region, 
  p.phone,
  p.email,
  p.status, 
  p.rating,
  p.service_count,
  p.last_service_date,
  COUNT(r.id) AS total_requests,
  SUM(CASE WHEN r.status = 'concluido' THEN 1 ELSE 0 END) AS completed_requests
FROM 
  towing_partners p
LEFT JOIN 
  towing_requests r ON p.id = r.partner_id
GROUP BY 
  p.id, p.name, p.city, p.region, p.phone, p.email, p.status, p.rating, p.service_count, p.last_service_date;