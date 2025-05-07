-- Tabela para gerenciar as despesas mensais das bases
CREATE TABLE IF NOT EXISTS base_expenses (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    agua DECIMAL(10, 2) NOT NULL DEFAULT 0,
    energia DECIMAL(10, 2) NOT NULL DEFAULT 0,
    funcionarios DECIMAL(10, 2) NOT NULL DEFAULT 0,
    pj DECIMAL(10, 2) NOT NULL DEFAULT 0,
    aluguel DECIMAL(10, 2) NOT NULL DEFAULT 0,
    internet DECIMAL(10, 2) NOT NULL DEFAULT 0,
    despesas_extras DECIMAL(10, 2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'atualizado', 'atrasado')),
    
    -- Campos para relatório e análise
    total_despesas DECIMAL(10, 2) GENERATED ALWAYS AS (
        agua + energia + funcionarios + pj + aluguel + internet + despesas_extras
    ) STORED,
    
    -- Restrição única para evitar duplicidades do mesmo mês/ano para a mesma base
    UNIQUE (base_id, month, year)
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_base_expenses_base_id ON base_expenses(base_id);
CREATE INDEX IF NOT EXISTS idx_base_expenses_status ON base_expenses(status);
CREATE INDEX IF NOT EXISTS idx_base_expenses_year_month ON base_expenses(year, month);

-- View para facilitar a visualização das despesas mensais
CREATE OR REPLACE VIEW vw_base_expenses AS
SELECT 
    e.id,
    b.name AS base_name,
    e.base_id,
    e.month,
    e.year,
    TO_CHAR(TO_DATE(e.month::text, 'MM'), 'TMMonth') AS month_name,
    e.agua,
    e.energia,
    e.funcionarios,
    e.pj,
    e.aluguel,
    e.internet,
    e.despesas_extras,
    e.total_despesas,
    e.observacoes,
    e.status,
    e.last_updated,
    u.name AS updated_by_name
FROM base_expenses e
JOIN bases b ON e.base_id = b.id
LEFT JOIN users u ON e.updated_by = u.id;

-- View para relatório de bases com status pendente ou atrasado
CREATE OR REPLACE VIEW vw_base_expenses_pending AS
SELECT 
    b.id AS base_id,
    b.name AS base_name,
    EXTRACT(MONTH FROM CURRENT_DATE) AS current_month,
    EXTRACT(YEAR FROM CURRENT_DATE) AS current_year,
    CASE 
        WHEN e.id IS NULL THEN 'não registrado'
        ELSE e.status
    END AS status,
    CASE 
        WHEN e.id IS NULL THEN 0
        ELSE 1
    END AS has_entry,
    CURRENT_DATE - e.last_updated::date AS days_since_update
FROM bases b
LEFT JOIN base_expenses e ON 
    b.id = e.base_id AND 
    e.month = EXTRACT(MONTH FROM CURRENT_DATE) AND 
    e.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE b.active = TRUE;