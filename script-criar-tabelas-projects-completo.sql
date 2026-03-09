-- SCRIPT COMPLETO PARA RESOLVER PROBLEMAS COM TABELAS PROJECTS
-- Execute seção por seção no Supabase

-- 1. RECRIAR TABELA PROJECTS (se houver problema de acesso)
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. RECRIAR TABELA PROJECT_BASES
DROP TABLE IF EXISTS project_bases CASCADE;
CREATE TABLE project_bases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    base_name VARCHAR(255) NOT NULL,
    base_code VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. INSERIR PROJETOS BÁSICOS
INSERT INTO projects (id, name, description, is_active) VALUES
(1, 'GRUPO PEREIRA', 'Grupo Pereira - Operações diversas', true),
(2, 'MARISTELA INDUSTRIA', 'Maristela Indústria - Operações industriais', false),
(3, 'MERCADO LIVRE', 'Mercado Livre - Logística e-commerce', true),
(4, 'FMS09', 'FMS09 - São Paulo SP', false),
(5, 'PETLOVE', 'Petlove - Pet supplies logistics', true),
(6, 'OXXO', 'OXXO - Conveniência e varejo', true),
(7, 'MADEIRA MADEIRA', 'Madeira Madeira - Móveis e decoração', true),
(8, 'COCA COLA', 'Coca Cola - Bebidas e distribuição', true),
(9, 'AMBEV', 'Ambev - Cervejaria e bebidas', true),
(10, 'LINEHALL', 'Line Hall - Logística especializada', true),
(11, 'SHOPEE', 'Shopee - E-commerce marketplace', true),
(12, 'CORREIOS', 'Correios - Serviços postais', true),
(13, 'FULL MELI', 'Full Meli - Operações completas Mercado Livre', true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 4. INSERIR BASES DOS PROJETOS
INSERT INTO project_bases (id, project_id, base_name, base_code, is_active) VALUES
-- Bases Grupo Pereira
(1, 1, 'VARGEM GRANDE (GP01)', 'GP01', true),
(2, 1, 'JACAREI (GP02)', 'GP02', true),
(3, 1, 'HORTOLANDIA (GP03)', 'GP03', true),

-- Bases Mercado Livre
(11, 3, 'OSASCO', 'OSA01', true),
(12, 3, 'CAMPINAS', 'CAM01', true),
(13, 3, 'ABC', 'ABC01', true),
(14, 3, 'SOCORRO', 'SOC01', true),
(15, 3, 'SOROCABA', 'SOR01', true),
(16, 3, 'GUARULHOS', 'GUA01', true),
(17, 3, 'ALAIR', 'ALR01', true),

-- Bases Petlove
(21, 5, 'PETLOVE SP', 'PET01', true),
(22, 5, 'PETLOVE RJ', 'PET02', true),

-- Bases OXXO
(31, 6, 'OXXO CENTRO', 'OXX01', true),
(32, 6, 'OXXO SUL', 'OXX02', true),

-- Bases Madeira Madeira
(41, 7, 'MM CAJAMAR', 'MM01', true),
(42, 7, 'MM EXTREMA', 'MM02', true),

-- Bases Coca Cola
(51, 8, 'COCA COLA SP', 'CC01', true),
(52, 8, 'COCA COLA RJ', 'CC02', true),

-- Bases Ambev
(61, 9, 'AMBEV GUARULHOS', 'AMB01', true),
(62, 9, 'AMBEV JAGUARIUNA', 'AMB02', true),

-- Bases Line Hall
(71, 10, 'LINE HALL SP', 'LH01', true),
(72, 10, 'LINE HALL SHOPEE', 'LH02', true),

-- Bases Shopee
(81, 11, 'SHOPEE CAJAMAR', 'SH01', true),
(82, 11, 'SHOPEE LOUVEIRA', 'SH02', true),

-- Bases Correios
(91, 12, 'CORREIOS CDD', 'COR01', true),
(92, 12, 'CORREIOS AC', 'COR02', true),

-- Base Full Meli
(145, 13, 'FULL MELI (FMELI01)', 'FMELI01', true)

ON CONFLICT (id) DO UPDATE SET 
    project_id = EXCLUDED.project_id,
    base_name = EXCLUDED.base_name,
    base_code = EXCLUDED.base_code,
    is_active = EXCLUDED.is_active;

-- 5. RESETAR SEQUENCES
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));
SELECT setval('project_bases_id_seq', (SELECT MAX(id) FROM project_bases));

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_project_bases_project_id ON project_bases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bases_active ON project_bases(is_active);
CREATE INDEX IF NOT EXISTS idx_project_bases_code ON project_bases(base_code);

-- 7. GARANTIR QUE TODAS AS TABELAS DE ABASTECIMENTOS TENHAM AS COLUNAS
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_osasco_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_alair_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_campinas_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_abc_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_socorro_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_sorocaba_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto VARCHAR(255);
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS projeto_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_id INTEGER;
ALTER TABLE abastecimentos_posto_guarulhos_v2 ADD COLUMN IF NOT EXISTS base_name VARCHAR(255);

-- 8. ATUALIZAR REGISTROS EXISTENTES
UPDATE abastecimentos_posto_osasco_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_id = 11, base_name = 'OSASCO' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_alair_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_id = 17, base_name = 'ALAIR' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_campinas_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_id = 12, base_name = 'CAMPINAS' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_abc_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_id = 13, base_name = 'ABC' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_socorro_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_id = 14, base_name = 'SOCORRO' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_sorocaba_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_id = 15, base_name = 'SOROCABA' 
WHERE projeto IS NULL;

UPDATE abastecimentos_posto_guarulhos_v2 
SET projeto = 'MERCADO LIVRE', projeto_id = 3, base_id = 16, base_name = 'GUARULHOS' 
WHERE projeto IS NULL;

-- 9. VERIFICAÇÃO FINAL
SELECT 'SISTEMA CONFIGURADO COM SUCESSO' as status;

-- Verificar projetos
SELECT COUNT(*) as total_projetos FROM projects;

-- Verificar bases  
SELECT COUNT(*) as total_bases FROM project_bases;

-- Verificar projeto FULL MELI
SELECT p.id, p.name, b.base_name 
FROM projects p 
LEFT JOIN project_bases b ON p.id = b.project_id 
WHERE p.name = 'FULL MELI';

-- 10. TESTE FINAL
INSERT INTO abastecimentos_posto_osasco_v2 (
    placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total,
    motorista, motorista_rg, operador, projeto, projeto_id, base_id, base_name,
    tipo_veiculo, created_at
) VALUES (
    'TESTE999', 10000, 'Diesel', 10.0, 6.39, 63.90,
    'Teste Final', '999999999', 'Sistema', 'FULL MELI', 13, 145, 'FULL MELI (FMELI01)',
    'frota', NOW()
);

-- Verificar teste
SELECT id, placa, projeto, base_name FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TESTE999';

-- Limpar teste
DELETE FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TESTE999';