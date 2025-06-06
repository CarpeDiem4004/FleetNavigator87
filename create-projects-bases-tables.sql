-- Script para criar tabelas de projetos e bases baseado na imagem fornecida
-- Sistema de Solicitação de Cartão de Combustível

-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de bases
CREATE TABLE IF NOT EXISTS project_bases (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  base_name VARCHAR(255) NOT NULL,
  base_code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados dos projetos conforme a imagem

-- GRUPO PEREIRA
INSERT INTO projects (name, description) VALUES 
('GRUPO PEREIRA', 'Grupo Pereira - Operações diversas');

-- Inserir bases do Grupo Pereira
INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'GRUPO PEREIRA'), 'GP01 VARGEM GRANDE (GRUPO PEREIRA)', 'GP01'),
((SELECT id FROM projects WHERE name = 'GRUPO PEREIRA'), 'GP02 JACAREI (GRUPO PEREIRA)', 'GP02'),
((SELECT id FROM projects WHERE name = 'GRUPO PEREIRA'), 'GP03 HORTOLANDIA (GRUPO PEREIRA)', 'GP03');

-- MARISTELA INDUSTRIA
INSERT INTO projects (name, description) VALUES 
('MARISTELA INDUSTRIA', 'Maristela Indústria - Operações industriais');

INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'MARISTELA INDUSTRIA'), 'MI01 JAGUARIUNA', 'MI01'),
((SELECT id FROM projects WHERE name = 'MARISTELA INDUSTRIA'), 'MI02 ABREU', 'MI02'),
((SELECT id FROM projects WHERE name = 'MARISTELA INDUSTRIA'), 'MI03 ALPHAVILLE', 'MI03'),
((SELECT id FROM projects WHERE name = 'MARISTELA INDUSTRIA'), 'MI04 BARUERI', 'MI04');

-- MERCADO LIVRE
INSERT INTO projects (name, description) VALUES 
('MERCADO LIVRE', 'Mercado Livre - Logística e-commerce');

INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML01 SAO PAULO SP', 'ML01'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML02 JACAREI SP', 'ML02'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML03 SAO PAULO SP01', 'ML03'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML04 SANTANA DE PARNAIBA SP01', 'ML04'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML05 BARUERI SP01', 'ML05'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML06 ITAPEVI SP01', 'ML06'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML07 COTIA SP01', 'ML07'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML08 CARAPICUIBA SP01', 'ML08'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML09 GUARULHOS SP01', 'ML09'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML10 CARAGUATATUBA SP01', 'ML10'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML11 TAUBATE SP01', 'ML11'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML12 SAO JOSE DOS CAMPOS SP01', 'ML12'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML13 SUZANO SP01', 'ML13'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML14 MOGI DAS CRUZES SP01', 'ML14'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML15 RIBEIRAO PIRES SP01', 'ML15'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML16 SANTO ANDRE SP01', 'ML16'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML17 SAO BERNARDO DO CAMPO SP01', 'ML17'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML18 DIADEMA SP01', 'ML18'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML19 GUARUJÁ SP01', 'ML19'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML20 PRAIA GRANDE SP01', 'ML20'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML21 SAO VICENTE SP01', 'ML21'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML22 SANTOS SP01', 'ML22'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML23 CUBATAO SP01', 'ML23'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML24 BERTIOGA SP01', 'ML24'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML25 MONGAGUA SP01', 'ML25'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML26 ITANHAEM SP01', 'ML26'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML27 PERUIBE SP01', 'ML27'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML28 IGUAPE SP01', 'ML28'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML29 REGISTRO SP01', 'ML29'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML30 ELDORADO SP01', 'ML30'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML31 BARRA DO TURVO SP01', 'ML31'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML32 ITARIRI SP01', 'ML32'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML33 PEDRO DE TOLEDO SP01', 'ML33'),
((SELECT id FROM projects WHERE name = 'MERCADO LIVRE'), 'ML34 ITAOCA SP01', 'ML34');

-- FMS09
INSERT INTO projects (name, description) VALUES 
('FMS09', 'FMS09 - São Paulo SP');

INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'FMS09'), 'FMS09 SAO PAULO SP', 'FMS09');

-- PETLOVE
INSERT INTO projects (name, description) VALUES 
('PETLOVE', 'Petlove - Pet supplies logistics');

INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'PETLOVE'), 'PTLV01 BARUERI (PETLOVE)', 'PTLV01'),
((SELECT id FROM projects WHERE name = 'PETLOVE'), 'PTLV02 GUARULHOS (PETLOVE)', 'PTLV02');

-- PRIMO BASILE FABRICA DE (P)
INSERT INTO projects (name, description) VALUES 
('PRIMO BASILE', 'Primo Basile - Fábrica');

INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'PRIMO BASILE'), 'PB01 FABRICA PRIMO BASILE', 'PB01');

-- LINE HALL
INSERT INTO projects (name, description) VALUES 
('LINE HALL', 'Line Hall - Logistics operations');

INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'LINE HALL'), 'LH01 LINE HALL', 'LH01');

-- COCA-COLA
INSERT INTO projects (name, description) VALUES 
('COCA-COLA', 'Coca-Cola operations');

INSERT INTO project_bases (project_id, base_name, base_code) VALUES 
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC01 BASE COCA-COLA ABC', 'CC01'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC02 OPERACAO COCA-COLA', 'CC02'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC03 BASE COCA-COLA IPATINGA', 'CC03'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC04 OPERACAO COCA-COLA', 'CC04'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC05 BASE COCA-COLA VITORIA', 'CC05'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC06 OPERACAO COCA-COLA', 'CC06'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC07 COCA-COLA GUARATINGA', 'CC07'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC08 COCA-COLA ITABUNA', 'CC08'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC09 COCA-COLA MARANHAO', 'CC09'),
((SELECT id FROM projects WHERE name = 'COCA-COLA'), 'CC10 COCA-COLA MONTE NEGRO', 'CC10');

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_project_bases_project_id ON project_bases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bases_name ON project_bases(base_name);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_bases_updated_at BEFORE UPDATE ON project_bases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();