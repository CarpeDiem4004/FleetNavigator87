-- Script completo para criar tabelas de projetos e bases + sistema de bases específicas
-- Execute este script no Supabase se as tabelas projects e project_bases não existirem

-- 1. Criar tabela de projetos se não existir
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de bases dos projetos se não existir
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

-- 3. Inserir projetos principais
INSERT INTO projects (id, name, description, is_active) VALUES
(1, 'GRUPO PEREIRA', 'Grupo Pereira - Operações diversas', true),
(3, 'MERCADO LIVRE', 'Mercado Livre - Logística e-commerce', true),
(5, 'PETLOVE', 'Petlove - Pet supplies logistics', true),
(7, 'LINE HALL', 'Line Hall - Logistics operations', true),
(8, 'COCA-COLA', 'Coca-Cola operations', true),
(9, 'MADEIRA MADEIRA', 'Madeira Madeira - E-commerce de móveis e decoração', true),
(10, 'OXXO', 'OXXO - Rede de conveniência', true),
(11, 'SHOPEE', 'Shopee - E-commerce marketplace', true),
(12, 'XPT (Crossdocking Mercado Livre)', 'XPT - Crossdocking Mercado Livre', true),
(13, 'FULL MELI', 'Full Meli - Operações completas Mercado Livre', true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 4. Inserir bases principais (exemplos principais)
INSERT INTO project_bases (id, project_id, base_name, base_code, is_active) VALUES
-- GRUPO PEREIRA
(1, 1, 'GP01 VARGEM GRANDE (GRUPO PEREIRA)', 'GP01', true),
(2, 1, 'GP02 JACAREI (GRUPO PEREIRA)', 'GP02', true),
(3, 1, 'GP03 HORTOLANDIA (GRUPO PEREIRA)', 'GP03', true),

-- MERCADO LIVRE (algumas bases principais)
(10, 3, 'ESP01 CAJAMAR (SP)', 'ESP01', true),
(11, 3, 'ESP02 LOUVEIRA (SP)', 'ESP02', true),
(12, 3, 'ESP03 CONTAGEM (MG)', 'ESP03', true),

-- PETLOVE
(43, 5, 'PTL01 BELEM (PETLOVE)', 'PTL01', true),
(44, 5, 'PTL02 JUNDIA (PETLOVE)', 'PTL02', true),
(67, 5, 'PTL05 BELEM (SEMANAL)', 'PTL05', true),

-- LINE HALL
(62, 7, 'FMS09 SÃO PAULO (SP)', 'FMS09', true),

-- COCA-COLA (algumas bases principais)
(15, 8, 'COCA COLA (ABC) (CC01)', 'CC01', true),
(16, 8, 'COCA COLA (ALAIR) (CC02)', 'CC02', true),
(17, 8, 'COCA COLA (CAMPINAS) (CC03)', 'CC03', true),

-- MADEIRA MADEIRA
(50, 9, 'MM01 JUNDIAI (MADEIRA MADEIRA)', 'MM01', true),
(51, 9, 'MM02 CONTAGEM (MADEIRA MADEIRA)', 'MM02', true),

-- OXXO
(60, 10, 'OXXO1 (CAJAMAR)', 'OXXO1', true),

-- SHOPEE
(63, 11, 'FMS09 SÃO PAULO (SP)', 'FMS09', true),

-- XPT (algumas bases principais)
(133, 12, 'XPT (ALTA FLORESTA) EMR5/SMR2', 'EMR5/SMR2', true),
(134, 12, 'XPT (AMERICANA/POLIS) ESP12/SSP17', 'ESP12/SSP17', true),
(135, 12, 'XPT (BRASÍLIA) ESP13/SPSP5', 'ESP13/SPSP5', true),

-- FULL MELI (o novo projeto)
(145, 13, 'FULL MELI (FMELI01)', 'FMELI01', true)
ON CONFLICT (id) DO UPDATE SET 
    project_id = EXCLUDED.project_id,
    base_name = EXCLUDED.base_name,
    base_code = EXCLUDED.base_code,
    is_active = EXCLUDED.is_active;

-- 5. Adicionar colunas nas tabelas de abastecimentos
ALTER TABLE abastecimentos_posto_osasco_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_alair_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_campinas_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_abc_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_socorro_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_sorocaba_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

ALTER TABLE abastecimentos_posto_guarulhos_v2 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS base_id INTEGER,
ADD COLUMN IF NOT EXISTS base_name TEXT;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_project_bases_project_id ON project_bases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bases_active ON project_bases(is_active);

CREATE INDEX IF NOT EXISTS idx_osasco_v2_projeto_id ON abastecimentos_posto_osasco_v2(projeto_id);
CREATE INDEX IF NOT EXISTS idx_osasco_v2_base_id ON abastecimentos_posto_osasco_v2(base_id);

-- 7. Atualizar registros existentes com base padrão
UPDATE abastecimentos_posto_osasco_v2 
SET base_name = 'OSASCO'
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_alair_v2 
SET base_name = 'ALAIR'
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_campinas_v2 
SET base_name = 'CAMPINAS'
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_abc_v2 
SET base_name = 'ABC'
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_socorro_v2 
SET base_name = 'SOCORRO'
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_sorocaba_v2 
SET base_name = 'SOROCABA'
WHERE base_name IS NULL OR base_name = '';

UPDATE abastecimentos_posto_guarulhos_v2 
SET base_name = 'GUARULHOS'
WHERE base_name IS NULL OR base_name = '';

-- 8. Teste de funcionalidade
INSERT INTO abastecimentos_posto_osasco_v2 (
    placa, km_atual, tipo_combustivel, litros, valor_litro, valor_total,
    motorista, motorista_rg, operador, projeto, projeto_id, base_id, base_name,
    tipo_veiculo, created_at
) VALUES (
    'TESTE999', 45000, 'Diesel', 20.0, 6.39, 127.80,
    'Teste Final', '111222333', 'Sistema', 'FULL MELI', 13, 145, 'FULL MELI (FMELI01)',
    'frota', NOW()
);

-- 9. Verificar se tudo funcionou
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    (SELECT COUNT(*) FROM projects) as total_projetos,
    (SELECT COUNT(*) FROM project_bases) as total_bases,
    (SELECT COUNT(*) FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TESTE999') as teste_inserido;

-- 10. Mostrar projeto FULL MELI criado
SELECT 
    p.id as projeto_id,
    p.name as projeto_nome,
    b.id as base_id,
    b.base_name,
    b.base_code
FROM projects p
LEFT JOIN project_bases b ON p.id = b.project_id
WHERE p.name = 'FULL MELI';

-- 11. Limpeza do teste
DELETE FROM abastecimentos_posto_osasco_v2 WHERE placa = 'TESTE999';

-- 12. Resultado final
SELECT 'Sistema de bases específicas configurado com sucesso!' as resultado,
       'Projeto FULL MELI (ID: 13) criado com base FMELI01 (ID: 145)' as detalhes,
       'Todas as tabelas de abastecimentos foram atualizadas' as status_tabelas;